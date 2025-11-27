const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const HealthCareStaff = require('../models/HealthCareStaff');
const Parent = require('../models/Parent');
const ParentStudent = require('../models/ParentStudent');
const Student = require('../models/Student');
const StudentClass = require('../models/StudentClass');
const School = require('../models/School');
const { sendMail } = require('../utils/mailer');

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
const PASSWORD_MESSAGE = 'Mật khẩu phải có từ 8-16 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
const MANAGEABLE_ROLES = ['teacher', 'parent', 'health_care_staff', 'nutrition_staff'];
const DEFAULT_AVATAR = 'https://via.placeholder.com/150';

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const isStrongPassword = (password = '') => PASSWORD_REGEX.test(password);
const isManageableRole = (role = '') => MANAGEABLE_ROLES.includes(role);

async function requireSchoolAdminSchoolId(userId) {
  const schoolAdmin = await User.findById(userId).select('school_id');
  if (!schoolAdmin || !schoolAdmin.school_id) {
    throw new HttpError(400, 'Tài khoản school_admin chưa được gán trường');
  }
  return schoolAdmin.school_id;
}

async function ensureSchoolExistsOrThrow(schoolId) {
  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new HttpError(400, 'school_id không hợp lệ');
  }
  const school = await School.findById(schoolId).select('_id');
  if (!school) {
    throw new HttpError(404, 'Không tìm thấy trường học');
  }
  return school;
}

async function ensureStudentBelongsToSchool(studentId, schoolId) {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new HttpError(400, 'student_id không hợp lệ');
  }
  const student = await Student.findById(studentId).lean();
  if (!student) {
    throw new HttpError(404, 'Không tìm thấy học sinh');
  }

  const studentClass = await StudentClass.findOne({ student_id: studentId })
    .populate({ path: 'class_id', select: 'school_id' })
    .lean();

  if (!studentClass || !studentClass.class_id?.school_id) {
    throw new HttpError(400, 'Không xác định được trường của học sinh này');
  }

  if (studentClass.class_id.school_id.toString() !== schoolId.toString()) {
    throw new HttpError(400, 'Học sinh không thuộc trường của bạn');
  }

  return student;
}

async function ensureSchoolAdminCanAccessUser(adminUserId, targetUser) {
  if (!targetUser) {
    throw new HttpError(404, 'Không tìm thấy user');
  }
  if (!isManageableRole(targetUser.role)) {
    throw new HttpError(403, 'School admin không được thao tác với vai trò này');
  }
  const schoolId = await requireSchoolAdminSchoolId(adminUserId);
  if (!targetUser.school_id || targetUser.school_id.toString() !== schoolId.toString()) {
    throw new HttpError(403, 'Người dùng không thuộc trường của bạn');
  }
  return schoolId;
}

function extractTeacherProfile(rawProfile) {
  if (!rawProfile) {
    throw new HttpError(400, 'Vui lòng cung cấp thông tin giáo viên');
  }
  const {
    qualification,
    major,
    experience_years,
    note
  } = rawProfile;

  if (!qualification || !major || experience_years === undefined || note === undefined) {
    throw new HttpError(400, 'Thiếu thông tin hồ sơ giáo viên (qualification, major, experience_years, note)');
  }

  if (Number.isNaN(Number(experience_years))) {
    throw new HttpError(400, 'experience_years phải là số');
  }

  return {
    qualification: String(qualification).trim(),
    major: String(major).trim(),
    experience_years: Number(experience_years),
    note: String(note).trim()
  };
}

function extractHealthCareProfile(rawProfile) {
  if (!rawProfile) {
    throw new HttpError(400, 'Vui lòng cung cấp thông tin nhân viên y tế');
  }
  const {
    qualification,
    major,
    experience_years,
    note
  } = rawProfile;

  if (!qualification || !major || experience_years === undefined || note === undefined) {
    throw new HttpError(400, 'Thiếu thông tin hồ sơ nhân viên y tế (qualification, major, experience_years, note)');
  }

  if (Number.isNaN(Number(experience_years))) {
    throw new HttpError(400, 'experience_years phải là số');
  }

  return {
    qualification: String(qualification).trim(),
    major: String(major).trim(),
    experience_years: Number(experience_years),
    note: String(note).trim()
  };
}

function extractParentProfile(rawProfile) {
  if (!rawProfile) {
    throw new HttpError(400, 'Vui lòng cung cấp thông tin phụ huynh (student_id, relationship)');
  }
  const { student_id, relationship } = rawProfile;
  if (!student_id || !relationship) {
    throw new HttpError(400, 'Phụ huynh phải chọn học sinh và mối quan hệ');
  }
  if (!mongoose.Types.ObjectId.isValid(student_id)) {
    throw new HttpError(400, 'student_id không hợp lệ');
  }
  return {
    student_id,
    relationship: String(relationship).trim()
  };
}

// GET /api/users - Lấy danh sách tất cả users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { role, status } = req.query;
    const requesterRole = req.user?.role;

    const filter = {};
    if (status !== undefined) {
      filter.status = parseInt(status, 10);
    }

    if (role) {
      if (requesterRole === 'school_admin' && !isManageableRole(role)) {
        throw new HttpError(400, 'School admin chỉ được xem các vai trò được cho phép');
      }
      filter.role = role;
    }

    if (requesterRole === 'school_admin') {
      const schoolId = await requireSchoolAdminSchoolId(req.user.id);
      filter.school_id = schoolId;
      if (!role) {
        filter.role = { $in: MANAGEABLE_ROLES };
      }
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password_hash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách users',
      error: error.message
    });
  }
};

// GET /api/users/:id - Lấy thông tin user theo ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password_hash').lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    if (req.user?.role === 'school_admin') {
      await ensureSchoolAdminCanAccessUser(req.user.id, user);
    }

    const response = { ...user };

    if (user.role === 'teacher') {
      const teacherProfile = await Teacher.findOne({ user_id: user._id }).lean();
      if (teacherProfile) {
        response.teacher_profile = {
          teacher_id: teacherProfile._id,
          qualification: teacherProfile.qualification || '',
          major: teacherProfile.major || '',
          experience_years: teacherProfile.experience_years ?? '',
          note: teacherProfile.note || ''
        };
      }
    } else if (user.role === 'health_care_staff') {
      const healthProfile = await HealthCareStaff.findOne({ user_id: user._id }).lean();
      if (healthProfile) {
        response.health_care_profile = {
          staff_id: healthProfile._id,
          qualification: healthProfile.qualification || '',
          major: healthProfile.major || '',
          experience_years: healthProfile.experience_years ?? '',
          note: healthProfile.note || ''
        };
      }
    } else if (user.role === 'parent') {
      const parent = await Parent.findOne({ user_id: user._id }).select('_id').lean();
      if (parent) {
        const link = await ParentStudent.findOne({ parent_id: parent._id })
          .populate({ path: 'student_id', select: 'full_name' })
          .lean();
        if (link) {
          response.parent_profile = {
            parent_id: parent._id,
            student_id: link.student_id?._id,
            student_name: link.student_id?.full_name || '',
            relationship: link.relationship || ''
          };
        }
      }
    }

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user',
      error: error.message
    });
  }
};

// POST /api/users - Tạo user mới
const createUser = async (req, res) => {
  const session = await mongoose.startSession();
  let sessionEnded = false;
  const endSessionIfNeeded = async () => {
    if (!sessionEnded) {
      sessionEnded = true;
      await session.endSession();
    }
  };

  const isStandaloneTransactionError = (error) => (
    error?.code === 20 ||
    error?.codeName === 'IllegalOperation' ||
    /Transaction numbers are only allowed/i.test(error?.message || '')
  );

  try {
    const {
      full_name,
      username,
      password,
      role,
      email,
      phone_number,
      avatar_url,
      address,
      school_id: payloadSchoolId,
      teacher_profile,
      health_care_profile,
      parent_profile
    } = req.body;

    if (!full_name) {
      throw new HttpError(400, 'Vui lòng nhập họ tên');
    }
    if (!username) {
      throw new HttpError(400, 'Vui lòng nhập username');
    }
    if (!role) {
      throw new HttpError(400, 'Vui lòng chọn role');
    }
    if (!isManageableRole(role)) {
      throw new HttpError(400, 'Chỉ được tạo các vai trò teacher, parent, health_care_staff, nutrition_staff');
    }

    const requesterRole = req.user?.role;
    let assignedSchoolId = payloadSchoolId;

    if (requesterRole === 'school_admin') {
      assignedSchoolId = await requireSchoolAdminSchoolId(req.user.id);
    } else {
      if (!assignedSchoolId) {
        throw new HttpError(400, 'Vui lòng chọn trường cho tài khoản');
      }
      await ensureSchoolExistsOrThrow(assignedSchoolId);
    }

    // Kiểm tra trùng username/email/phone
    const duplicateChecks = await Promise.all([
      User.findOne({ username }),
      email ? User.findOne({ email }) : null,
      phone_number ? User.findOne({ phone_number }) : null
    ]);
    if (duplicateChecks[0]) {
      throw new HttpError(400, 'Username đã tồn tại');
    }
    if (duplicateChecks[1]) {
      throw new HttpError(400, 'Email đã tồn tại');
    }
    if (duplicateChecks[2]) {
      throw new HttpError(400, 'Số điện thoại đã tồn tại');
    }

    if (!password) {
      throw new HttpError(400, 'Vui lòng nhập mật khẩu');
    }
    if (!isStrongPassword(password)) {
      throw new HttpError(400, PASSWORD_MESSAGE);
    }

    let teacherProfileData = null;
    let healthProfileData = null;
    let parentProfileData = null;
    let studentInfo = null;

    if (role === 'teacher') {
      teacherProfileData = extractTeacherProfile(teacher_profile);
    } else if (role === 'health_care_staff') {
      healthProfileData = extractHealthCareProfile(health_care_profile);
    } else if (role === 'parent') {
      parentProfileData = extractParentProfile(parent_profile);
      if (!email) {
        throw new HttpError(400, 'Phụ huynh phải có email để nhận thông tin tài khoản');
      }
      studentInfo = await ensureStudentBelongsToSchool(parentProfileData.student_id, assignedSchoolId);
    }

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    let savedUser;
    const rollbackCreatedDocs = async (tracker = {}) => {
      const ops = [];
      if (tracker.parentStudentId) {
        ops.push(ParentStudent.findByIdAndDelete(tracker.parentStudentId));
      }
      if (tracker.parentId) {
        ops.push(Parent.findByIdAndDelete(tracker.parentId));
      }
      if (tracker.teacherId) {
        ops.push(Teacher.findByIdAndDelete(tracker.teacherId));
      }
      if (tracker.healthCareStaffId) {
        ops.push(HealthCareStaff.findByIdAndDelete(tracker.healthCareStaffId));
      }
      if (tracker.userId) {
        ops.push(User.findByIdAndDelete(tracker.userId));
      }
      await Promise.all(ops);
    };

    const createUserRecords = async (sessionArg, tracker) => {
      const createOptions = sessionArg ? { session: sessionArg } : undefined;
      const createdUsers = await User.create([{
        full_name,
        username,
        password_hash,
        role,
        email,
        phone_number,
        avatar_url: avatar_url || DEFAULT_AVATAR,
        status: 1,
        school_id: assignedSchoolId,
        address
      }], createOptions);
      savedUser = createdUsers[0];
      if (tracker) {
        tracker.userId = savedUser._id;
      }

      if (role === 'teacher') {
        const teacherDocs = await Teacher.create([{ ...teacherProfileData, user_id: savedUser._id }], createOptions);
        if (tracker) {
          tracker.teacherId = teacherDocs[0]._id;
        }
      } else if (role === 'health_care_staff') {
        const healthDocs = await HealthCareStaff.create([{ ...healthProfileData, user_id: savedUser._id }], createOptions);
        if (tracker) {
          tracker.healthCareStaffId = healthDocs[0]._id;
        }
      } else if (role === 'parent') {
        const parentDocs = await Parent.create([{ user_id: savedUser._id }], createOptions);
        const parentStudentDocs = await ParentStudent.create([{
          parent_id: parentDocs[0]._id,
          student_id: parentProfileData.student_id,
          relationship: parentProfileData.relationship
        }], createOptions);

        if (tracker) {
          tracker.parentId = parentDocs[0]._id;
          tracker.parentStudentId = parentStudentDocs[0]._id;
        }
      }
    };

    try {
      await session.withTransaction(async () => {
        await createUserRecords(session);
      });
    } catch (transactionError) {
      if (isStandaloneTransactionError(transactionError)) {
        console.warn('MongoDB standalone detected, retrying user creation without transaction.');
        await endSessionIfNeeded();
        const tracker = {};
        try {
          await createUserRecords(null, tracker);
        } catch (fallbackError) {
          await rollbackCreatedDocs(tracker);
          throw fallbackError;
        }
      } else {
        throw transactionError;
      }
    }

    const userResponse = savedUser.toObject();
    delete userResponse.password_hash;

    if (role === 'parent' && email) {
      const mailSubject = 'KidsLink - Thông tin tài khoản phụ huynh mới';
      const studentName = studentInfo?.full_name || 'học sinh';
      const parentHtml = `
        <p>Xin chào ${full_name},</p>
        <p>Tài khoản phụ huynh của bạn đã được tạo trên KidsLink.</p>
        <ul>
          <li><strong>Username:</strong> ${username}</li>
          <li><strong>Password:</strong> ${password}</li>
          <li><strong>Học sinh:</strong> ${studentName} (${parentProfileData.relationship})</li>
        </ul>
        <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau lần đăng nhập đầu tiên.</p>
      `;

      try {
        await sendMail({
          to: email,
          subject: mailSubject,
          html: parentHtml
        });
      } catch (mailError) {
        console.error('Không thể gửi mail cho phụ huynh mới:', mailError);
      }

      try {
        const schoolAdmins = await User.find({
          role: 'school_admin',
          school_id: assignedSchoolId,
          email: { $ne: null }
        }).select('email full_name');

        await Promise.all(
          schoolAdmins
            .filter((admin) => admin.email)
            .map((admin) => sendMail({
              to: admin.email,
              subject: 'KidsLink - Có phụ huynh mới được tạo',
              html: `
                <p>Xin chào ${admin.full_name || 'School Admin'},</p>
                <p>Phụ huynh ${full_name} vừa được tạo tài khoản.</p>
                <ul>
                  <li><strong>Username:</strong> ${username}</li>
                  <li><strong>Học sinh:</strong> ${studentName} (${parentProfileData.relationship})</li>
                </ul>
              `
            }))
        );
      } catch (mailError) {
        console.error('Không thể gửi mail cho school admin về phụ huynh mới:', mailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Tạo user thành công',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo user',
      error: error.message
    });
  } finally {
    await endSessionIfNeeded();
  }
};

// PUT /api/users/:id - Cập nhật user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      username,
      password,
      email,
      phone_number,
      avatar_url,
      status,
      address,
      teacher_profile,
      health_care_profile,
      parent_profile
    } = req.body;
    
    const existingUser = await User.findById(id);
    if (!existingUser) {
      throw new HttpError(404, 'Không tìm thấy user');
    }

    if (req.user?.role === 'school_admin') {
      await ensureSchoolAdminCanAccessUser(req.user.id, existingUser);
    }

    // Không cho phép đổi role
    if (req.body.role && req.body.role !== existingUser.role) {
      throw new HttpError(400, 'Không thể thay đổi role của tài khoản');
    }

    if (username && username !== existingUser.username) {
      const duplicateUsername = await User.findOne({ username, _id: { $ne: id } });
      if (duplicateUsername) {
        throw new HttpError(400, 'Username đã tồn tại');
      }
    }

    if (email && email !== existingUser.email) {
      const duplicateEmail = await User.findOne({ email, _id: { $ne: id } });
      if (duplicateEmail) {
        throw new HttpError(400, 'Email đã tồn tại');
      }
    }

    if (phone_number && phone_number !== existingUser.phone_number) {
      const duplicatePhone = await User.findOne({ phone_number, _id: { $ne: id } });
      if (duplicatePhone) {
        throw new HttpError(400, 'Số điện thoại đã tồn tại');
      }
    }

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (address !== undefined) updateData.address = address;
    if (status !== undefined) updateData.status = parseInt(status, 10);

    if (password) {
      if (!isStrongPassword(password)) {
        throw new HttpError(400, PASSWORD_MESSAGE);
      }
      const saltRounds = 12;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password_hash');

    if (existingUser.role === 'teacher' && teacher_profile) {
      const profile = extractTeacherProfile(teacher_profile);
      await Teacher.findOneAndUpdate(
        { user_id: existingUser._id },
        { ...profile, user_id: existingUser._id },
        { new: true, upsert: true }
      );
    }

    if (existingUser.role === 'health_care_staff' && health_care_profile) {
      const profile = extractHealthCareProfile(health_care_profile);
      await HealthCareStaff.findOneAndUpdate(
        { user_id: existingUser._id },
        { ...profile, user_id: existingUser._id },
        { new: true, upsert: true }
      );
    }

    if (existingUser.role === 'parent' && parent_profile) {
      const parentProfileData = extractParentProfile(parent_profile);
      if (!existingUser.school_id) {
        throw new HttpError(400, 'Tài khoản phụ huynh chưa được gán trường');
      }
      await ensureStudentBelongsToSchool(parentProfileData.student_id, existingUser.school_id);

      const parentDoc = await Parent.findOneAndUpdate(
        { user_id: existingUser._id },
        { user_id: existingUser._id },
        { new: true, upsert: true }
      );

      await ParentStudent.deleteMany({ parent_id: parentDoc._id });
      await ParentStudent.create({
        parent_id: parentDoc._id,
        student_id: parentProfileData.student_id,
        relationship: parentProfileData.relationship
      });
    }
    
    res.json({
      success: true,
      message: 'Cập nhật user thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật user',
      error: error.message
    });
  }
};

// DELETE /api/users/:id - Xóa user (soft delete)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      throw new HttpError(404, 'Không tìm thấy user');
    }

    if (req.user?.role === 'school_admin') {
      await ensureSchoolAdminCanAccessUser(req.user.id, user);
    }
    
    // Soft delete - chỉ thay đổi status thành 0
    await User.findByIdAndUpdate(id, { status: 0 });
    
    res.json({
      success: true,
      message: 'Xóa user thành công'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa user',
      error: error.message
    });
  }
};

// DELETE /api/users/:id/hard - Xóa user vĩnh viễn
const hardDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      throw new HttpError(404, 'Không tìm thấy user');
    }

    if (req.user?.role === 'school_admin') {
      await ensureSchoolAdminCanAccessUser(req.user.id, user);
    }
    
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Xóa user vĩnh viễn thành công'
    });
  } catch (error) {
    console.error('Error hard deleting user:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa user vĩnh viễn',
      error: error.message
    });
  }
};

// PUT /api/users/:id/restore - Khôi phục user đã bị xóa
const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      throw new HttpError(404, 'Không tìm thấy user');
    }

    if (req.user?.role === 'school_admin') {
      await ensureSchoolAdminCanAccessUser(req.user.id, user);
    }
    
    await User.findByIdAndUpdate(id, { status: 1 });
    
    res.json({
      success: true,
      message: 'Khôi phục user thành công'
    });
  } catch (error) {
    console.error('Error restoring user:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi khôi phục user',
      error: error.message
    });
  }
};

// GET /api/users/me - Lấy thông tin tài khoản hiện tại
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thông tin tài khoản', error: error.message });
  }
};

// PUT /api/users/me - Cập nhật thông tin tài khoản hiện tại
const updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, username, email, phone_number, avatar_url } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (username && username !== user.username) {
      const duplicateUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (duplicateUsername) {
        return res.status(400).json({ success: false, message: 'Username đã tồn tại' });
      }
    }

    if (email && email !== user.email) {
      const duplicateEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (duplicateEmail) {
        return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
      }
    }

    if (phone_number && phone_number !== user.phone_number) {
      const duplicatePhone = await User.findOne({ phone_number, _id: { $ne: userId } });
      if (duplicatePhone) {
        return res.status(400).json({ success: false, message: 'Số điện thoại đã tồn tại' });
      }
    }

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password_hash');
    return res.json({ success: true, message: 'Cập nhật thông tin thành công', data: updatedUser });
  } catch (error) {
    console.error('Error updating current user:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật thông tin', error: error.message });
  }
};

// PUT /api/users/change-password - Đổi mật khẩu tài khoản hiện tại
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại' });
    }

    if (!newPassword || !isStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, message: PASSWORD_MESSAGE });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (!user.password_hash) {
      return res.status(400).json({ success: false, message: 'Tài khoản chưa thiết lập mật khẩu' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }

    const saltRounds = 12;
    user.password_hash = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    return res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ success: false, message: 'Không thể đổi mật khẩu', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  restoreUser,
  getCurrentUser,
  updateCurrentUser,
  changePassword
};
