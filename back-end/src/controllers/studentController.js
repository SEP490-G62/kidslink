// back-end/src/controllers/studentController.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const ParentStudent = require('../models/ParentStudent');
const Parent = require('../models/Parent');
const User = require('../models/User');
const PickupStudent = require('../models/PickupStudent');
const Pickup = require('../models/Pickup');
const StudentClass = require('../models/StudentClass');
const ClassModel = require('../models/Class');
const School = require('../models/School');
const { sendMail } = require('../utils/mailer');
const cloudinary = require('../utils/cloudinary');

const PARENT_RELATIONSHIPS = ['father', 'mother', 'guardian', 'other'];

function sanitizeUsername(base = '') {
  return base
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
}

function generateRandomPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateUniqueParentUsername({ email, phone }) {
  const phoneDigits = (phone || '').replace(/\D/g, '');
  let base = '';
  if (phoneDigits) {
    base = `ph${phoneDigits.slice(-9)}`;
  } else if (email) {
    base = email.split('@')[0];
  } else {
    base = `parent${Date.now()}`;
  }
  base = sanitizeUsername(base) || `parent${Date.now()}`;
  let username = base;
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await User.findOne({ username }).select('_id').lean();
    if (!exists) return username;
    suffix += 1;
    username = `${base}${suffix}`;
  }
}

function buildValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function resolveRequestedUsername(rawUsername) {
  if (!rawUsername) return null;
  const sanitized = sanitizeUsername(rawUsername);
  if (!sanitized) {
    throw buildValidationError('Tên đăng nhập không hợp lệ (chỉ bao gồm chữ, số, ., _, -)');
  }
  if (sanitized.length < 4) {
    throw buildValidationError('Tên đăng nhập phải có ít nhất 4 ký tự');
  }
  const exists = await User.findOne({ username: sanitized }).lean();
  if (exists) {
    throw buildValidationError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác');
  }
  return sanitized;
}

function slugify(value = '') {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    || `student-${Date.now()}`;
}

async function uploadStudentAvatar(source, studentName = 'student') {
  if (!source) return null;
  try {
    const uploadResult = await cloudinary.uploader.upload(source, {
      folder: 'student-avatars',
      public_id: `${slugify(studentName)}-${Date.now()}`,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });
    return uploadResult.secure_url;
  } catch (err) {
    console.error('uploadStudentAvatar error:', err.message);
    return null;
  }
}

async function getSchoolIdForAdmin(userId) {
  const admin = await User.findById(userId).select('school_id');
  if (!admin || !admin.school_id) {
    const error = new Error('School admin chưa được gán trường học');
    error.statusCode = 400;
    throw error;
  }
  return admin.school_id;
}

async function ensureParentAccount(parentPayload, studentId, studentName) {
  if (!parentPayload || !parentPayload.relationship) {
    throw new Error('Thiếu thông tin relationship của phụ huynh');
  }
  const relationship = parentPayload.relationship;
  if (!PARENT_RELATIONSHIPS.includes(relationship)) {
    throw new Error(`relationship không hợp lệ. Hỗ trợ: ${PARENT_RELATIONSHIPS.join(', ')}`);
  }

  const email = parentPayload.email?.trim().toLowerCase() || null;
  const phone = parentPayload.phone_number || parentPayload.phone || null;
  const requestedUsername = parentPayload.username ? parentPayload.username.toString().trim() : '';

  let userDoc = null;
  if (email) {
    userDoc = await User.findOne({ email, role: 'parent' });
  }
  if (!userDoc && phone) {
    userDoc = await User.findOne({ phone_number: phone, role: 'parent' });
  }

  let createdCredentials = null;

  if (!userDoc) {
    let finalUsername = null;
    if (requestedUsername) {
      finalUsername = await resolveRequestedUsername(requestedUsername);
    } else {
      finalUsername = await generateUniqueParentUsername({ email, phone });
    }
    const rawPassword = generateRandomPassword(10);
    const password_hash = await bcrypt.hash(rawPassword, 10);
    const avatar_url =
      parentPayload.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(parentPayload.full_name || 'Parent')}&background=random`;

    userDoc = await User.create({
      full_name: parentPayload.full_name,
      username: finalUsername,
      password_hash,
      role: 'parent',
      avatar_url,
      status: 1,
      email,
      phone_number: phone,
      address: parentPayload.address || '',
      school_id: parentPayload.school_id || null,
    });

    createdCredentials = { username: finalUsername, password: rawPassword, email };
  } else {
    const updateFields = {};
    if (parentPayload.full_name) updateFields.full_name = parentPayload.full_name;
    if (parentPayload.address !== undefined) updateFields.address = parentPayload.address;
    if (phone && !userDoc.phone_number) updateFields.phone_number = phone;
    if (email && !userDoc.email) updateFields.email = email;
    if (Object.keys(updateFields).length > 0) {
      await User.findByIdAndUpdate(userDoc._id, updateFields);
    }
  }

  let parentDoc = await Parent.findOne({ user_id: userDoc._id });
  if (!parentDoc) {
    parentDoc = await Parent.create({ user_id: userDoc._id });
  }

  const existingLink = await ParentStudent.findOne({ parent_id: parentDoc._id, student_id: studentId });
  if (existingLink) {
    existingLink.relationship = relationship;
    await existingLink.save();
  } else {
    await ParentStudent.create({
      parent_id: parentDoc._id,
      student_id: studentId,
      relationship,
    });
  }

  if (createdCredentials && createdCredentials.email) {
    try {
      await sendMail({
        to: createdCredentials.email,
        subject: 'KidsLink - Tài khoản phụ huynh vừa được tạo',
        text: `Xin chào ${parentPayload.full_name || ''},
Tài khoản của bạn đã được tạo để theo dõi bé ${studentName}.
Tên đăng nhập: ${createdCredentials.username}
Mật khẩu: ${createdCredentials.password}
Vui lòng đăng nhập và đổi mật khẩu sau khi sử dụng.`,
        html: `<p>Xin chào <strong>${parentPayload.full_name || ''}</strong>,</p>
<p>Tài khoản phụ huynh của bạn đã được tạo để theo dõi bé <strong>${studentName}</strong> trên hệ thống KidsLink.</p>
<p><strong>Tên đăng nhập:</strong> ${createdCredentials.username}<br/>
<strong>Mật khẩu:</strong> ${createdCredentials.password}</p>
<p>Vui lòng đăng nhập và đổi mật khẩu ngay sau lần sử dụng đầu tiên.</p>`,
      });
    } catch (mailErr) {
      console.error('Gửi email phụ huynh thất bại:', mailErr);
    }
  }

  return { parent: parentDoc, user: userDoc };
}

function normalizeParentsInput(parentsPayload) {
  if (!parentsPayload) return [];
  if (Array.isArray(parentsPayload)) return parentsPayload.filter(Boolean);
  if (typeof parentsPayload === 'object') return [parentsPayload];
  return [];
}

// --- Lấy chi tiết 1 học sinh (giữ nguyên) ---
exports.getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'student_id không hợp lệ' });
    }

    const adminSchoolId = req.user?.role === 'school_admin' ? await getSchoolIdForAdmin(req.user.id) : null;

    const student = await Student.findById(id).lean();
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    if (adminSchoolId && String(student.school_id) !== String(adminSchoolId)) {
      return res.status(403).json({ message: 'Bạn không có quyền xem học sinh thuộc trường khác' });
    }

    // Lấy danh sách phụ huynh
    const parentLinks = await ParentStudent.find({ student_id: id }).lean();
    const parentIds = parentLinks.map((p) => p.parent_id);

    let parents = [];
    if (parentIds.length > 0) {
      const parentDocs = await Parent.find({ _id: { $in: parentIds } }).lean();
      const userIds = parentDocs.map((p) => p.user_id);
      const userMap = new Map(
        (await User.find({ _id: { $in: userIds } }).lean()).map((u) => [String(u._id), u])
      );

      parents = parentDocs.map((p) => {
        const u = userMap.get(String(p.user_id)) || null;
        const link = parentLinks.find((l) => String(l.parent_id) === String(p._id));
        return {
          parent_id: p._id,
          relationship: link?.relationship || null,
          user: u
            ? {
                user_id: u._id,
                full_name: u.full_name,
                username: u.username,
                email: u.email,
                phone_number: u.phone_number,
                avatar_url: u.avatar_url,
                status: u.status,
              }
            : null,
        };
      });
    }

    // Lấy danh sách người đón
    const pickupLinks = await PickupStudent.find({ student_id: id }).lean();
    const pickupIds = pickupLinks.map((l) => l.pickup_id);

    let pickups = [];
    if (pickupIds.length > 0) {
      const pickupDocs = await Pickup.find({ _id: { $in: pickupIds } }).lean();
      pickups = pickupDocs.map((p) => ({
        pickup_id: p._id,
        full_name: p.full_name,
        relationship: p.relationship,
        id_card_number: p.id_card_number,
        avatar_url: p.avatar_url,
        phone: p.phone,
      }));
    }

    // Nếu muốn trả cả lớp đang theo học (mở comment nếu có model)
    const studentClasses = await StudentClass.find({ student_id: id }).lean();
    const classIds = studentClasses.map((sc) => sc.class_id);
    let classes = [];
    if (classIds.length > 0) {
      classes = await ClassModel.find({ _id: { $in: classIds } }).lean();
    }

    return res.json({
      student: {
        _id: student._id,
        full_name: student.full_name,
        dob: student.dob,
        gender: student.gender,
        avatar_url: student.avatar_url,
        status: student.status,
        allergy: student.allergy,
        school_id: student.school_id,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
      parents,
      pickups,
      classes,
    });
  } catch (err) {
    console.error('getStudentDetail error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Lấy tất cả học sinh ---
exports.getAllStudents = async (req, res) => {
  try {
    const query = {};
    if (req.user?.role === 'school_admin') {
      const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
      query.school_id = adminSchoolId;
    } else if (req.query?.school_id) {
      if (!mongoose.isValidObjectId(req.query.school_id)) {
        return res.status(400).json({ message: 'school_id không hợp lệ' });
      }
      query.school_id = req.query.school_id;
    }

    const students = await Student.find(query).lean();

    // Populate parents and class for each student
    const studentsWithDetails = await Promise.all(
      students.map(async (student) => {
        const parentLinks = await ParentStudent.find({ student_id: student._id }).lean();
        const parentIds = parentLinks.map((p) => p.parent_id);
        const parents = await Parent.find({ _id: { $in: parentIds } })
          .populate('user_id', 'full_name username email phone_number address')
          .lean();
        
        const parentsWithRelationship = parents.map((parent) => {
          const link = parentLinks.find((l) => String(l.parent_id) === String(parent._id));
          return {
            ...parent,
            relationship: link?.relationship || null,
          };
        });

        // Get class info - lấy lớp có academic_year lớn nhất
        const studentClasses = await StudentClass.find({ student_id: student._id }).lean();
        let classInfo = null;
        
        if (studentClasses.length > 0) {
          // Helper function to parse academic year and get start year
          const parseAcademicYear = (academicYear) => {
            if (!academicYear || typeof academicYear !== 'string') return -Infinity;
            const parts = academicYear.split('-');
            const startYear = parseInt(parts[0], 10);
            return Number.isFinite(startYear) ? startYear : -Infinity;
          };
          
          // Lấy tất cả các lớp của học sinh
          const classIds = studentClasses.map(sc => sc.class_id);
          const classes = await ClassModel.find({ _id: { $in: classIds } }).lean();
          
          if (classes.length > 0) {
            // Sắp xếp theo academic_year (parse để lấy start year) giảm dần
            classes.sort((a, b) => {
              const yearA = parseAcademicYear(a.academic_year);
              const yearB = parseAcademicYear(b.academic_year);
              return yearB - yearA; // Descending order (newest first)
            });
            
            // Lấy lớp có academic_year lớn nhất (đã được sort ở trên)
            classInfo = classes[0];
          }
        }

        // Convert gender number to string for frontend
        const genderString = student.gender === 1 ? 'female' : 'male';

        return {
          ...student,
          gender: genderString,
          parents: parentsWithRelationship,
          class_id: classInfo,
        };
      })
    );

    return res.json({ students: studentsWithDetails });
  } catch (err) {
    console.error('getAllStudents error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Lấy danh sách học sinh theo lớp ---
exports.getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ message: 'class_id không hợp lệ' });
    }

    const classInfo = await ClassModel.findById(classId).lean();
    if (!classInfo) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    if (req.user?.role === 'school_admin') {
      const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
      if (String(classInfo.school_id) !== String(adminSchoolId)) {
        return res.status(403).json({ message: 'Bạn không có quyền xem lớp thuộc trường khác' });
      }
    }

    const studentLinks = await StudentClass.find({ class_id: classId }).lean();
    const studentIds = studentLinks.map((s) => s.student_id);

    const students = await Student.find({ _id: { $in: studentIds } }).lean();

    // Populate parents for each student
    const studentsWithParents = await Promise.all(
      students.map(async (student) => {
        const parentLinks = await ParentStudent.find({ student_id: student._id }).lean();
        const parentIds = parentLinks.map((p) => p.parent_id);
        const parents = await Parent.find({ _id: { $in: parentIds } })
          .populate('user_id', 'full_name username email phone_number address')
          .lean();
        
        const parentsWithRelationship = parents.map((parent) => {
          const link = parentLinks.find((l) => String(l.parent_id) === String(parent._id));
          return {
            ...parent,
            relationship: link?.relationship || null,
          };
        });

        // Convert gender number to string for frontend
        const genderString = student.gender === 1 ? 'female' : 'male';

        return {
          ...student,
          gender: genderString,
          parents: parentsWithRelationship,
          class_id: classInfo,
        };
      })
    );

    return res.json({ students: studentsWithParents });
  } catch (err) {
    console.error('getStudentsByClass error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Tạo mới học sinh ---
exports.createStudent = async (req, res) => {
  try {
    const {
      full_name,
      date_of_birth,
      gender,
      address,
      avatar,
      medical_condition,
      class_id,
      school_id: bodySchoolId,
      parents,
      parent,
    } = req.body;

    if (!full_name || !date_of_birth || !class_id) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    let schoolId = null;
    if (req.user?.role === 'school_admin') {
      schoolId = await getSchoolIdForAdmin(req.user.id);
    } else {
      if (!bodySchoolId || !mongoose.isValidObjectId(bodySchoolId)) {
        return res.status(400).json({ message: 'school_id không hợp lệ' });
      }
      schoolId = bodySchoolId;
    }

    const schoolDoc = await School.findById(schoolId).select('_id status school_name');
    if (!schoolDoc) {
      return res.status(404).json({ message: 'Không tìm thấy trường học' });
    }
    if (schoolDoc.status === 0) {
      return res.status(400).json({ message: 'Trường học đang bị vô hiệu hóa, không thể thêm học sinh' });
    }

    // Kiểm tra lớp tồn tại và thuộc trường
    const targetClass = await ClassModel.findById(class_id);
    if (!targetClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }
    if (String(targetClass.school_id) !== String(schoolId)) {
      return res.status(400).json({ message: 'Lớp học không thuộc trường của bạn' });
    }

    // Convert gender string to number (0: male, 1: female)
    let genderValue = 0;
    if (gender === 'female' || gender === 1 || gender === '1') {
      genderValue = 1;
    }

    let createdStudentId = null;
    let avatarUrl = 'https://via.placeholder.com/150';
    if (avatar) {
      const uploadedAvatar = await uploadStudentAvatar(avatar, full_name);
      if (uploadedAvatar) {
        avatarUrl = uploadedAvatar;
      } else {
        avatarUrl = avatar;
      }
    }

    try {
      const newStudent = await Student.create({
        full_name,
        dob: date_of_birth,
        gender: genderValue,
        avatar_url: avatarUrl,
        allergy: medical_condition || '',
        status: 1,
        school_id: schoolId,
      });
      createdStudentId = newStudent._id;

      // Kiểm tra học sinh đã có trong lớp nào khác trong cùng năm học chưa
      const existingStudentClasses = await StudentClass.find({ student_id: newStudent._id }).lean();
      if (existingStudentClasses.length > 0) {
        const existingClassIds = existingStudentClasses.map((sc) => sc.class_id);
        const existingClasses = await ClassModel.find({
          _id: { $in: existingClassIds },
          academic_year: targetClass.academic_year,
          school_id: schoolId,
        }).lean();

        if (existingClasses.length > 0) {
          await Student.findByIdAndDelete(newStudent._id);
          const classNames = existingClasses.map((c) => c.class_name).join(', ');
          return res.status(400).json({
            message: `Học sinh đã có trong lớp khác trong năm học ${targetClass.academic_year}: ${classNames}`,
          });
        }
      }

      await StudentClass.create({
        student_id: newStudent._id,
        class_id,
      });

      const parentsPayload = normalizeParentsInput(parents || parent);
      const attachedParents = [];
      // Thêm thông tin phụ huynh (nếu có)
      for (const parentPayload of parentsPayload) {
        const result = await ensureParentAccount(
          { ...parentPayload, school_id: schoolId },
          newStudent._id,
          full_name
        );
        attachedParents.push({
          parent_id: result.parent._id,
          user_id: result.user._id,
          full_name: result.user.full_name,
          email: result.user.email,
          phone_number: result.user.phone_number,
          relationship: parentPayload.relationship,
        });
      }

      return res.status(201).json({
        message: 'Tạo học sinh thành công',
        student: newStudent,
        parents: attachedParents,
      });
    } catch (err) {
      if (createdStudentId) {
        await Promise.all([
          Student.findByIdAndDelete(createdStudentId),
          StudentClass.deleteMany({ student_id: createdStudentId }),
          ParentStudent.deleteMany({ student_id: createdStudentId }),
        ]);
      }
      throw err;
    }
  } catch (err) {
    console.error('createStudent error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Cập nhật học sinh ---
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      date_of_birth,
      gender,
      address,
      avatar,
      medical_condition,
      class_id,
      status,
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'student_id không hợp lệ' });
    }

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    if (req.user?.role === 'school_admin') {
      const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
      if (String(existingStudent.school_id) !== String(adminSchoolId)) {
        return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa học sinh thuộc trường khác' });
      }
    }

    // Convert gender string to number
    let genderValue = gender;
    if (typeof gender === 'string') {
      genderValue = gender === 'female' ? 1 : 0;
    }

    let avatarUrl = null;
    if (avatar) {
      avatarUrl = await uploadStudentAvatar(avatar, full_name || existingStudent.full_name);
      if (!avatarUrl) {
        avatarUrl = avatar;
      }
    }

    const updateData = {
      full_name,
      dob: date_of_birth,
      gender: genderValue,
      allergy: medical_condition,
    };
    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }
    if (status === 0 || status === 1) {
      updateData.status = status;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const student = await Student.findByIdAndUpdate(id, updateData, { new: true });

    // Cập nhật lớp học nếu có thay đổi
    if (class_id) {
      // Kiểm tra lớp tồn tại và lấy năm học
      const targetClass = await ClassModel.findById(class_id);
      if (!targetClass) {
        return res.status(404).json({ message: 'Không tìm thấy lớp học' });
      }
      if (String(targetClass.school_id) !== String(existingStudent.school_id)) {
        return res.status(400).json({ message: 'Không thể chuyển học sinh sang lớp thuộc trường khác' });
      }

      // Kiểm tra học sinh đã có trong lớp nào khác trong cùng năm học chưa
      const existingStudentClasses = await StudentClass.find({ 
        student_id: id,
        class_id: { $ne: class_id } // Loại trừ lớp đang cập nhật
      }).lean();
      
      if (existingStudentClasses.length > 0) {
        const existingClassIds = existingStudentClasses.map(sc => sc.class_id);
        const existingClasses = await ClassModel.find({ 
          _id: { $in: existingClassIds },
          academic_year: targetClass.academic_year
        }).lean();
        
        if (existingClasses.length > 0) {
          const classNames = existingClasses.map(c => c.class_name).join(', ');
          return res.status(400).json({ 
            message: `Học sinh đã có trong lớp khác trong năm học ${targetClass.academic_year}: ${classNames}` 
          });
        }
      }

      // Cập nhật hoặc tạo StudentClass
      await StudentClass.findOneAndUpdate(
        { student_id: id },
        { class_id: class_id },
        { upsert: true }
      );
    }

    return res.json({ message: 'Cập nhật thành công', student });
  } catch (err) {
    console.error('updateStudent error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Chuyển lớp cho học sinh ---
exports.transferStudent = async (req, res) => {
  try {
    const { id } = req.params; // student_id
    const { new_class_id, old_class_id } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'student_id không hợp lệ' });
    }
    if (!mongoose.isValidObjectId(new_class_id)) {
      return res.status(400).json({ message: 'new_class_id không hợp lệ' });
    }
    if (!mongoose.isValidObjectId(old_class_id)) {
      return res.status(400).json({ message: 'old_class_id không hợp lệ' });
    }

    // Kiểm tra học sinh tồn tại
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    let adminSchoolId = null;
    if (req.user?.role === 'school_admin') {
      adminSchoolId = await getSchoolIdForAdmin(req.user.id);
      if (String(student.school_id) !== String(adminSchoolId)) {
        return res.status(403).json({ message: 'Bạn không có quyền chuyển học sinh thuộc trường khác' });
      }
    }

    // Kiểm tra lớp mới tồn tại
    const newClass = await ClassModel.findById(new_class_id);
    if (!newClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp mới' });
    }
    if (adminSchoolId && String(newClass.school_id) !== String(adminSchoolId)) {
      return res.status(403).json({ message: 'Lớp mới không thuộc trường của bạn' });
    }

    const oldClass = await ClassModel.findById(old_class_id);
    if (!oldClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp cũ' });
    }
    if (adminSchoolId && String(oldClass.school_id) !== String(adminSchoolId)) {
      return res.status(403).json({ message: 'Lớp cũ không thuộc trường của bạn' });
    }

    // Kiểm tra học sinh đã có trong lớp nào khác trong cùng năm học chưa
    const allStudentClasses = await StudentClass.find({ student_id: id }).lean();
    const classIds = allStudentClasses.map(sc => sc.class_id);
    
    if (classIds.length > 0) {
      const existingClasses = await ClassModel.find({ 
        _id: { $in: classIds },
        academic_year: newClass.academic_year
      }).lean();
      
      // Loại bỏ lớp cũ khỏi danh sách kiểm tra
      const otherClassesInSameYear = existingClasses.filter(
        cls => cls._id.toString() !== old_class_id.toString()
      );
      
      if (otherClassesInSameYear.length > 0) {
        const classNames = otherClassesInSameYear.map(c => c.class_name).join(', ');
        return res.status(400).json({ 
          message: `Học sinh đã có trong lớp khác trong năm học ${newClass.academic_year}: ${classNames}` 
        });
      }
    }

    // Xóa StudentClass cũ
    await StudentClass.findOneAndDelete({
      student_id: id,
      class_id: old_class_id
    });

    // Kiểm tra xem học sinh đã có trong lớp mới chưa (double check)
    const existingStudentClass = await StudentClass.findOne({
      student_id: id,
      class_id: new_class_id
    });

    if (existingStudentClass) {
      return res.status(400).json({ message: 'Học sinh đã có trong lớp này' });
    }

    // Tạo StudentClass mới
    await StudentClass.create({
      student_id: id,
      class_id: new_class_id,
      discount: 0
    });

    return res.json({ 
      message: 'Chuyển lớp thành công', 
      student_id: id,
      old_class_id,
      new_class_id
    });
  } catch (err) {
    console.error('transferStudent error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Xóa học sinh ---
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'student_id không hợp lệ' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    if (req.user?.role === 'school_admin') {
      const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
      if (String(student.school_id) !== String(adminSchoolId)) {
        return res.status(403).json({ message: 'Bạn không có quyền thao tác với học sinh thuộc trường khác' });
      }
    }

    // Soft delete
    student.status = 0;
    await student.save();

    return res.json({ message: 'Vô hiệu hóa học sinh thành công' });
  } catch (err) {
    console.error('deleteStudent error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Thêm phụ huynh cho học sinh ---
exports.addParentForStudent = async (req, res) => {
  try {
    const { id } = req.params; // student_id

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'student_id không hợp lệ' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    if (req.user?.role === 'school_admin') {
      const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
      if (String(student.school_id) !== String(adminSchoolId)) {
        return res.status(403).json({ message: 'Bạn không có quyền thêm phụ huynh cho học sinh này' });
      }
    }

    const parentPayload = req.body;
    if (!parentPayload || !parentPayload.full_name || !parentPayload.relationship) {
      return res.status(400).json({ message: 'Thiếu thông tin phụ huynh bắt buộc' });
    }

    const result = await ensureParentAccount(
      { ...parentPayload, school_id: student.school_id },
      student._id,
      student.full_name
    );

    return res.status(201).json({
      message: 'Thêm phụ huynh thành công',
      parent: {
        parent_id: result.parent._id,
        user_id: result.user._id,
        full_name: result.user.full_name,
        email: result.user.email,
        phone_number: result.user.phone_number,
        relationship: parentPayload.relationship,
      },
    });
  } catch (err) {
    console.error('addParentForStudent error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Xóa phụ huynh khỏi học sinh ---
exports.removeParentFromStudent = async (req, res) => {
  try {
    const { id, parentId } = req.params;

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(parentId)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    if (req.user?.role === 'school_admin') {
      const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
      if (String(student.school_id) !== String(adminSchoolId)) {
        return res.status(403).json({ message: 'Bạn không có quyền thao tác với học sinh này' });
      }
    }

    const deleteResult = await ParentStudent.deleteOne({ parent_id: parentId, student_id: id });
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: 'Phụ huynh không được gán cho học sinh này' });
    }

    // Nếu phụ huynh không còn liên kết với học sinh nào khác thì xóa luôn user & parent
    const remaining = await ParentStudent.countDocuments({ parent_id: parentId });
    if (remaining === 0) {
      const parent = await Parent.findById(parentId);
      if (parent) {
        await User.findByIdAndDelete(parent.user_id);
        await Parent.findByIdAndDelete(parentId);
      }
    }

    return res.json({ message: 'Đã xóa phụ huynh khỏi học sinh' });
  } catch (err) {
    console.error('removeParentFromStudent error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Kích hoạt/Vô hiệu hóa học sinh ---
exports.toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'student_id không hợp lệ' });
    }
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'status phải là 0 hoặc 1' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    if (req.user?.role === 'school_admin') {
      const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
      if (String(student.school_id) !== String(adminSchoolId)) {
        return res.status(403).json({ message: 'Bạn không có quyền thay đổi trạng thái học sinh này' });
      }
    }

    student.status = status;
    await student.save();

    return res.json({ message: 'Cập nhật trạng thái học sinh thành công', student });
  } catch (err) {
    console.error('toggleStudentStatus error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};
