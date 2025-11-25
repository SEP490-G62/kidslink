// back-end/src/controllers/studentController.js
const mongoose = require('mongoose');
const Student = require('../models/Student');
const ParentStudent = require('../models/ParentStudent');
const Parent = require('../models/Parent');
const User = require('../models/User');
const PickupStudent = require('../models/PickupStudent');
const Pickup = require('../models/Pickup');
// Nếu có StudentClass và Class, bạn có thể mở comment và dùng thêm
const StudentClass = require('../models/StudentClass');
const ClassModel = require('../models/Class');

// --- Lấy chi tiết 1 học sinh (giữ nguyên) ---
exports.getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'student_id không hợp lệ' });
    }

    const student = await Student.findById(id).lean();
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
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
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
      parents,
      pickups,
      classes,
    });
  } catch (err) {
    console.error('getStudentDetail error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Lấy tất cả học sinh ---
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().lean();

    // Populate parents and class for each student
    const studentsWithDetails = await Promise.all(
      students.map(async (student) => {
        const parentLinks = await ParentStudent.find({ student_id: student._id }).lean();
        const parentIds = parentLinks.map((p) => p.parent_id);
        const parents = await Parent.find({ _id: { $in: parentIds } })
          .populate('user_id', 'full_name email phone_number address')
          .lean();
        
        const parentsWithRelationship = parents.map((parent) => {
          const link = parentLinks.find((l) => String(l.parent_id) === String(parent._id));
          return {
            ...parent,
            relationship: link?.relationship || null,
          };
        });

        // Get class info
        const studentClass = await StudentClass.findOne({ student_id: student._id }).lean();
        const classInfo = studentClass ? await ClassModel.findById(studentClass.class_id).lean() : null;

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

    const studentLinks = await StudentClass.find({ class_id: classId }).lean();
    const studentIds = studentLinks.map((s) => s.student_id);

    const students = await Student.find({ _id: { $in: studentIds } }).lean();

    // Populate parents for each student
    const studentsWithParents = await Promise.all(
      students.map(async (student) => {
        const parentLinks = await ParentStudent.find({ student_id: student._id }).lean();
        const parentIds = parentLinks.map((p) => p.parent_id);
        const parents = await Parent.find({ _id: { $in: parentIds } })
          .populate('user_id', 'full_name email phone_number address')
          .lean();
        
        const parentsWithRelationship = parents.map((parent) => {
          const link = parentLinks.find((l) => String(l.parent_id) === String(parent._id));
          return {
            ...parent,
            relationship: link?.relationship || null,
          };
        });

        const classInfo = await ClassModel.findById(classId).lean();

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
    } = req.body;

    if (!full_name || !date_of_birth || !class_id) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Convert gender string to number (0: male, 1: female)
    let genderValue = 0; // default male
    if (gender === 'female' || gender === 1) {
      genderValue = 1;
    }

    // Kiểm tra lớp tồn tại và lấy năm học
    const targetClass = await ClassModel.findById(class_id);
    if (!targetClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    const newStudent = await Student.create({
      full_name,
      dob: date_of_birth,
      gender: genderValue,
      avatar_url: avatar || 'https://via.placeholder.com/150',
      allergy: medical_condition || '',
      status: 1,
    });

    // Kiểm tra học sinh đã có trong lớp nào khác trong cùng năm học chưa
    // (Trường hợp này ít xảy ra vì đang tạo học sinh mới, nhưng để an toàn)
    const existingStudentClasses = await StudentClass.find({ student_id: newStudent._id }).lean();
    if (existingStudentClasses.length > 0) {
      const existingClassIds = existingStudentClasses.map(sc => sc.class_id);
      const existingClasses = await ClassModel.find({ 
        _id: { $in: existingClassIds },
        academic_year: targetClass.academic_year
      }).lean();
      
      if (existingClasses.length > 0) {
        // Xóa học sinh vừa tạo vì không thể thêm vào lớp
        await Student.findByIdAndDelete(newStudent._id);
        const classNames = existingClasses.map(c => c.class_name).join(', ');
        return res.status(400).json({ 
          message: `Học sinh đã có trong lớp khác trong năm học ${targetClass.academic_year}: ${classNames}` 
        });
      }
    }

    // Thêm vào StudentClass
    await StudentClass.create({
      student_id: newStudent._id,
      class_id: class_id,
    });

    return res.status(201).json({ message: 'Tạo học sinh thành công', student: newStudent });
  } catch (err) {
    console.error('createStudent error:', err);
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
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'student_id không hợp lệ' });
    }

    // Convert gender string to number
    let genderValue = gender;
    if (typeof gender === 'string') {
      genderValue = gender === 'female' ? 1 : 0;
    }

    const updateData = {
      full_name,
      dob: date_of_birth,
      gender: genderValue,
      avatar_url: avatar,
      allergy: medical_condition,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const student = await Student.findByIdAndUpdate(id, updateData, { new: true });

    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    // Cập nhật lớp học nếu có thay đổi
    if (class_id) {
      // Kiểm tra lớp tồn tại và lấy năm học
      const targetClass = await ClassModel.findById(class_id);
      if (!targetClass) {
        return res.status(404).json({ message: 'Không tìm thấy lớp học' });
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

    // Kiểm tra lớp mới tồn tại
    const newClass = await ClassModel.findById(new_class_id);
    if (!newClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp mới' });
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

    // Soft delete
    const student = await Student.findByIdAndUpdate(id, { status: 0 }, { new: true });

    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    return res.json({ message: 'Xóa học sinh thành công' });
  } catch (err) {
    console.error('deleteStudent error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};
