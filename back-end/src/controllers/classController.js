const mongoose = require('mongoose');
const { Class: ClassModel, StudentClass, Student } = require('../models');
const User = require('../models/User');

// Helper function để lấy school_id từ school_admin
async function getSchoolIdForAdmin(userId) {
  const admin = await User.findById(userId).select('school_id');
  if (!admin || !admin.school_id) {
    const error = new Error('School admin chưa được gán trường học');
    error.statusCode = 400;
    throw error;
  }
  return admin.school_id;
}

// GET /classes
async function listClasses(req, res) {
  try {
    const { page = 1, limit = 50, school_id, class_age_id, teacher_id, academic_year } = req.query;
    const filter = {};
    
    // Nếu là school_admin, chỉ lấy classes của school_id của họ
    let adminSchoolId = null;
    if (req.user?.role === 'school_admin') {
      try {
        adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        filter.school_id = adminSchoolId;
        
        // Chỉ lấy các lớp thuộc năm học lớn nhất (nếu không có query academic_year)
        if (!academic_year) {
          const latestAcademicYear = await getLatestAcademicYearForSchool(adminSchoolId);
          if (latestAcademicYear) {
            filter.academic_year = latestAcademicYear;
          }
        }
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    } else if (school_id && mongoose.Types.ObjectId.isValid(school_id)) {
      filter.school_id = school_id;
    }
    
    if (class_age_id && mongoose.Types.ObjectId.isValid(class_age_id)) filter.class_age_id = class_age_id;
    if (teacher_id && mongoose.Types.ObjectId.isValid(teacher_id)) filter.$or = [{ teacher_id }, { teacher_id2: teacher_id }];
    if (academic_year) filter.academic_year = academic_year;

    const skip = (Number(page) - 1) * Number(limit);
    const classes = await ClassModel.find(filter)
      .populate('school_id')
      .populate('class_age_id')
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'full_name email avatar_url' } })
      .populate({ path: 'teacher_id2', populate: { path: 'user_id', select: 'full_name email avatar_url' } })
      .sort({ academic_year: -1, class_name: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ClassModel.countDocuments(filter);

    res.json({ success: true, data: classes, pagination: { currentPage: Number(page), totalItems: total, itemsPerPage: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    console.error('classController.listClasses Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
}

// Helper function to parse academic year and get start year
function parseAcademicYear(academicYear) {
  if (!academicYear || typeof academicYear !== 'string') return -Infinity;
  const parts = academicYear.split('-');
  const startYear = parseInt(parts[0], 10);
  return Number.isFinite(startYear) ? startYear : -Infinity;
}

async function getLatestAcademicYearForSchool(schoolId) {
  const academicYears = await ClassModel.find({ school_id: schoolId }).distinct('academic_year');
  if (!academicYears || academicYears.length === 0) return null;
  
  // Sort by start year (parse academic year to get start year)
  academicYears.sort((a, b) => {
    const yearA = parseAcademicYear(a);
    const yearB = parseAcademicYear(b);
    return yearB - yearA; // Descending order
  });
  
  return academicYears[0];
}

// GET /classes/:id
async function getClassById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const cls = await ClassModel.findById(id)
      .populate('school_id')
      .populate('class_age_id')
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'full_name email avatar_url' } })
      .populate({ path: 'teacher_id2', populate: { path: 'user_id', select: 'full_name email avatar_url' } });

    if (!cls) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp' });
    
    // Nếu là school_admin, kiểm tra quyền truy cập
    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        const classSchoolId = cls?.school_id?._id || cls?.school_id;
        if (!classSchoolId || String(classSchoolId) !== String(adminSchoolId)) {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền xem lớp thuộc trường khác' });
        }
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    }
    
    res.json({ success: true, data: cls });
  } catch (err) {
    console.error('classController.getClassById Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
}

// POST /classes
async function createClass(req, res) {
  try {
    const payload = req.body || {};
    
    // Validate required fields
    if (!payload.class_name) {
      return res.status(400).json({ success: false, message: 'class_name là bắt buộc' });
    }
    if (!payload.class_age_id) {
      return res.status(400).json({ success: false, message: 'class_age_id là bắt buộc' });
    }
    if (!payload.teacher_id) {
      return res.status(400).json({ success: false, message: 'teacher_id là bắt buộc' });
    }
    if (!payload.start_date) {
      return res.status(400).json({ success: false, message: 'start_date là bắt buộc' });
    }
    if (!payload.end_date) {
      return res.status(400).json({ success: false, message: 'end_date là bắt buộc' });
    }
    if (!payload.academic_year) {
      return res.status(400).json({ success: false, message: 'academic_year là bắt buộc' });
    }

    // Validate end_date phải sau start_date
    const startDate = new Date(payload.start_date);
    const endDate = new Date(payload.end_date);
    if (endDate <= startDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ngày kết thúc phải sau ngày bắt đầu' 
      });
    }

    // Validate teacher1 và teacher2 không được trùng nhau
    if (payload.teacher_id2 && String(payload.teacher_id) === String(payload.teacher_id2)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Giáo viên chính và giáo viên phụ không được trùng nhau' 
      });
    }

    // Get school_id - từ user nếu là school_admin, hoặc từ payload
    let schoolId = payload.school_id;
    if (req.user?.role === 'school_admin') {
      try {
        schoolId = await getSchoolIdForAdmin(req.user.id);
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    } else if (!schoolId) {
      const School = require('../models/School');
      const school = await School.findOne();
      if (!school) {
        return res.status(400).json({ 
          success: false, 
          message: 'Không tìm thấy trường học trong hệ thống. Vui lòng tạo trường trước.' 
        });
      }
      schoolId = school._id;
    }

    // Validate teacher có cùng school_id (nếu là school_admin)
    if (req.user?.role === 'school_admin') {
      const Teacher = require('../models/Teacher');
      const User = require('../models/User');
      
      // Kiểm tra teacher_id
      const teacher = await Teacher.findById(payload.teacher_id).populate('user_id', 'school_id');
      if (!teacher || !teacher.user_id) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy giáo viên chính' });
      }
      if (String(teacher.user_id.school_id) !== String(schoolId)) {
        return res.status(403).json({ success: false, message: 'Giáo viên chính không thuộc trường của bạn' });
      }
      
      // Kiểm tra teacher_id2 nếu có
      if (payload.teacher_id2) {
        const teacher2 = await Teacher.findById(payload.teacher_id2).populate('user_id', 'school_id');
        if (!teacher2 || !teacher2.user_id) {
          return res.status(400).json({ success: false, message: 'Không tìm thấy giáo viên phụ' });
        }
        if (String(teacher2.user_id.school_id) !== String(schoolId)) {
          return res.status(403).json({ success: false, message: 'Giáo viên phụ không thuộc trường của bạn' });
        }
      }
    }

    // Kiểm tra lớp cùng tên trong cùng năm học
    const existingClassByName = await ClassModel.findOne({
      class_name: payload.class_name,
      academic_year: payload.academic_year,
      school_id: schoolId
    });
    if (existingClassByName) {
      return res.status(400).json({ 
        success: false, 
        message: `Đã tồn tại lớp "${payload.class_name}" trong năm học ${payload.academic_year}` 
      });
    }

    // Kiểm tra giáo viên chính đã có lớp nào trong năm học đó chưa
    const existingClassByTeacher = await ClassModel.findOne({
      teacher_id: payload.teacher_id,
      academic_year: payload.academic_year,
      school_id: schoolId
    });
    if (existingClassByTeacher) {
      return res.status(400).json({ 
        success: false, 
        message: `Giáo viên chính đã có lớp trong năm học ${payload.academic_year}` 
      });
    }

    const doc = await ClassModel.create({
      class_name: payload.class_name,
      school_id: schoolId,
      class_age_id: payload.class_age_id,
      teacher_id: payload.teacher_id,
      teacher_id2: payload.teacher_id2 || null,
      academic_year: payload.academic_year,
      start_date: payload.start_date,
      end_date: payload.end_date,
    });

    const created = await ClassModel.findById(doc._id)
      .populate('school_id')
      .populate('class_age_id')
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'full_name email avatar_url' } })
      .populate({ path: 'teacher_id2', populate: { path: 'user_id', select: 'full_name email avatar_url' } });
    res.status(201).json({ success: true, message: 'Tạo lớp thành công', data: created });
  } catch (err) {
    console.error('classController.createClass Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi tạo lớp: ' + err.message, error: err.message });
  }
}

// PUT /classes/:id
async function updateClass(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const existingClass = await ClassModel.findById(id);
    if (!existingClass) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp' });

    // Nếu là school_admin, kiểm tra quyền truy cập
    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(existingClass.school_id) !== String(adminSchoolId)) {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa lớp thuộc trường khác' });
        }
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    }

    const payload = req.body || {};
    
    // Lấy thông tin để validate
    const class_name = payload.class_name !== undefined ? payload.class_name : existingClass.class_name;
    const academic_year = payload.academic_year !== undefined ? payload.academic_year : existingClass.academic_year;
    const teacher_id = payload.teacher_id !== undefined ? payload.teacher_id : existingClass.teacher_id;
    const teacher_id2 = payload.teacher_id2 !== undefined ? payload.teacher_id2 : existingClass.teacher_id2;
    
    // Validate end_date phải sau start_date (nếu có thay đổi dates)
    if (payload.start_date || payload.end_date) {
      const startDate = new Date(payload.start_date || existingClass.start_date);
      const endDate = new Date(payload.end_date || existingClass.end_date);
      if (endDate <= startDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ngày kết thúc phải sau ngày bắt đầu' 
        });
      }
    }

    // Validate teacher1 và teacher2 không được trùng nhau
    const finalTeacherId = payload.teacher_id !== undefined ? payload.teacher_id : existingClass.teacher_id;
    const finalTeacherId2 = payload.teacher_id2 !== undefined ? payload.teacher_id2 : existingClass.teacher_id2;
    if (finalTeacherId2 && String(finalTeacherId) === String(finalTeacherId2)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Giáo viên chính và giáo viên phụ không được trùng nhau' 
      });
    }
    
    // Nếu là school_admin, không cho phép đổi school_id
    let school_id = existingClass.school_id;
    if (req.user?.role === 'school_admin') {
      try {
        school_id = await getSchoolIdForAdmin(req.user.id);
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    } else {
      school_id = payload.school_id || existingClass.school_id;
    }

    // Validate teacher có cùng school_id (nếu là school_admin và có thay đổi teacher)
    if (req.user?.role === 'school_admin') {
      const Teacher = require('../models/Teacher');
      const User = require('../models/User');
      
      // Kiểm tra teacher_id nếu có thay đổi
      if (payload.teacher_id) {
        const teacher = await Teacher.findById(payload.teacher_id).populate('user_id', 'school_id');
        if (!teacher || !teacher.user_id) {
          return res.status(400).json({ success: false, message: 'Không tìm thấy giáo viên chính' });
        }
        if (String(teacher.user_id.school_id) !== String(school_id)) {
          return res.status(403).json({ success: false, message: 'Giáo viên chính không thuộc trường của bạn' });
        }
      }
      
      // Kiểm tra teacher_id2 nếu có thay đổi
      if (payload.teacher_id2 !== undefined) {
        if (payload.teacher_id2) {
          const teacher2 = await Teacher.findById(payload.teacher_id2).populate('user_id', 'school_id');
          if (!teacher2 || !teacher2.user_id) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy giáo viên phụ' });
          }
          if (String(teacher2.user_id.school_id) !== String(school_id)) {
            return res.status(403).json({ success: false, message: 'Giáo viên phụ không thuộc trường của bạn' });
          }
        }
      }
    }

    // Kiểm tra lớp cùng tên trong cùng năm học (trừ chính lớp này)
    if (payload.class_name || payload.academic_year) {
      const existingClassByName = await ClassModel.findOne({
        class_name: class_name,
        academic_year: academic_year,
        school_id: school_id,
        _id: { $ne: id }
      });
      if (existingClassByName) {
        return res.status(400).json({ 
          success: false, 
          message: `Đã tồn tại lớp "${class_name}" trong năm học ${academic_year}` 
        });
      }
    }

    // Kiểm tra giáo viên chính đã có lớp nào trong năm học đó chưa (trừ chính lớp này)
    if (payload.teacher_id || payload.academic_year) {
      const existingClassByTeacher = await ClassModel.findOne({
        teacher_id: teacher_id,
        academic_year: academic_year,
        school_id: school_id,
        _id: { $ne: id }
      });
      if (existingClassByTeacher) {
        return res.status(400).json({ 
          success: false, 
          message: `Giáo viên chính đã có lớp trong năm học ${academic_year}` 
        });
      }
    }

    const updateData = {
      class_name: payload.class_name,
      school_id: payload.school_id,
      class_age_id: payload.class_age_id,
      teacher_id: payload.teacher_id,
      teacher_id2: payload.teacher_id2,
      academic_year: payload.academic_year,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updated = await ClassModel.findByIdAndUpdate(id, updateData, { new: true })
      .populate('school_id')
      .populate('class_age_id')
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'full_name email avatar_url' } })
      .populate({ path: 'teacher_id2', populate: { path: 'user_id', select: 'full_name email avatar_url' } });

    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp' });
    res.json({ success: true, message: 'Cập nhật thành công', data: updated });
  } catch (err) {
    console.error('classController.updateClass Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
}

// DELETE /classes/:id (hard delete - xóa vĩnh viễn)
async function deleteClass(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const exist = await ClassModel.findById(id);
    if (!exist) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp' });

    // Nếu là school_admin, kiểm tra quyền truy cập
    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(exist.school_id) !== String(adminSchoolId)) {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa lớp thuộc trường khác' });
        }
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    }

    // Xóa tất cả StudentClass liên quan trước
    await StudentClass.deleteMany({ class_id: id });

    // Xóa lớp vĩnh viễn
    await ClassModel.findByIdAndDelete(id);
    res.json({ success: true, message: 'Xóa lớp thành công' });
  } catch (err) {
    console.error('classController.deleteClass Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
}

// POST /classes/:id/promote - Lên lớp: tạo lớp mới và copy học sinh
async function promoteClass(req, res) {
  try {
    const { id } = req.params; // ID lớp cũ
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const oldClass = await ClassModel.findById(id);
    if (!oldClass) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp cũ' });

    // Nếu là school_admin, kiểm tra quyền truy cập
    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(oldClass.school_id) !== String(adminSchoolId)) {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền lên lớp cho lớp thuộc trường khác' });
        }
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    }

    const payload = req.body || {};
    
    // Validate required fields
    if (!payload.class_name) {
      return res.status(400).json({ success: false, message: 'class_name là bắt buộc' });
    }
    if (!payload.class_age_id) {
      return res.status(400).json({ success: false, message: 'class_age_id là bắt buộc' });
    }
    if (!payload.teacher_id) {
      return res.status(400).json({ success: false, message: 'teacher_id là bắt buộc' });
    }
    if (!payload.start_date) {
      return res.status(400).json({ success: false, message: 'start_date là bắt buộc' });
    }
    if (!payload.end_date) {
      return res.status(400).json({ success: false, message: 'end_date là bắt buộc' });
    }
    if (!payload.academic_year) {
      return res.status(400).json({ success: false, message: 'academic_year là bắt buộc' });
    }

    // Validate end_date phải sau start_date
    const startDate = new Date(payload.start_date);
    const endDate = new Date(payload.end_date);
    if (endDate <= startDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ngày kết thúc phải sau ngày bắt đầu' 
      });
    }

    // Validate teacher1 và teacher2 không được trùng nhau
    if (payload.teacher_id2 && String(payload.teacher_id) === String(payload.teacher_id2)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Giáo viên chính và giáo viên phụ không được trùng nhau' 
      });
    }

    // Get school_id - từ user nếu là school_admin, hoặc từ lớp cũ
    let schoolId = payload.school_id || oldClass.school_id;
    if (req.user?.role === 'school_admin') {
      try {
        schoolId = await getSchoolIdForAdmin(req.user.id);
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    } else if (!schoolId) {
      const School = require('../models/School');
      const school = await School.findOne();
      if (!school) {
        return res.status(400).json({ 
          success: false, 
          message: 'Không tìm thấy trường học trong hệ thống. Vui lòng tạo trường trước.' 
        });
      }
      schoolId = school._id;
    }

    // Validate teacher có cùng school_id (nếu là school_admin)
    if (req.user?.role === 'school_admin') {
      const Teacher = require('../models/Teacher');
      const User = require('../models/User');
      
      // Kiểm tra teacher_id
      const teacher = await Teacher.findById(payload.teacher_id).populate('user_id', 'school_id');
      if (!teacher || !teacher.user_id) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy giáo viên chính' });
      }
      if (String(teacher.user_id.school_id) !== String(schoolId)) {
        return res.status(403).json({ success: false, message: 'Giáo viên chính không thuộc trường của bạn' });
      }
      
      // Kiểm tra teacher_id2 nếu có
      if (payload.teacher_id2) {
        const teacher2 = await Teacher.findById(payload.teacher_id2).populate('user_id', 'school_id');
        if (!teacher2 || !teacher2.user_id) {
          return res.status(400).json({ success: false, message: 'Không tìm thấy giáo viên phụ' });
        }
        if (String(teacher2.user_id.school_id) !== String(schoolId)) {
          return res.status(403).json({ success: false, message: 'Giáo viên phụ không thuộc trường của bạn' });
        }
      }
    }

    // Kiểm tra lớp cùng tên trong cùng năm học
    const existingClassByName = await ClassModel.findOne({
      class_name: payload.class_name,
      academic_year: payload.academic_year,
      school_id: schoolId
    });
    if (existingClassByName) {
      return res.status(400).json({ 
        success: false, 
        message: `Đã tồn tại lớp "${payload.class_name}" trong năm học ${payload.academic_year}` 
      });
    }

    // Kiểm tra giáo viên chính đã có lớp nào trong năm học đó chưa
    const existingClassByTeacher = await ClassModel.findOne({
      teacher_id: payload.teacher_id,
      academic_year: payload.academic_year,
      school_id: schoolId
    });
    if (existingClassByTeacher) {
      return res.status(400).json({ 
        success: false, 
        message: `Giáo viên chính đã có lớp trong năm học ${payload.academic_year}` 
      });
    }

    // Tạo lớp mới
    const newClass = await ClassModel.create({
      class_name: payload.class_name,
      school_id: schoolId,
      class_age_id: payload.class_age_id,
      teacher_id: payload.teacher_id,
      teacher_id2: payload.teacher_id2 || null,
      academic_year: payload.academic_year,
      start_date: payload.start_date,
      end_date: payload.end_date,
    });

    // Lấy tất cả học sinh từ lớp cũ
    const oldStudentClasses = await StudentClass.find({ class_id: id });
    
    // Copy học sinh sang lớp mới
    if (oldStudentClasses.length > 0) {
      const studentIds = oldStudentClasses.map(sc => sc.student_id);
      
      // Kiểm tra học sinh nào đã có trong lớp khác trong cùng năm học mới
      const allStudentClasses = await StudentClass.find({ 
        student_id: { $in: studentIds } 
      }).lean();
      
      const existingClassIds = [...new Set(allStudentClasses.map(sc => sc.class_id.toString()))];
      const existingClasses = await ClassModel.find({ 
        _id: { $in: existingClassIds },
        academic_year: payload.academic_year
      }).lean();
      
      // Tạo map để kiểm tra nhanh
      const studentClassMap = new Map();
      allStudentClasses.forEach(sc => {
        const studentId = sc.student_id.toString();
        if (!studentClassMap.has(studentId)) {
          studentClassMap.set(studentId, []);
        }
        studentClassMap.get(studentId).push(sc.class_id.toString());
      });
      
      const classesMap = new Map();
      existingClasses.forEach(cls => {
        classesMap.set(cls._id.toString(), cls);
      });
      
      // Lọc ra học sinh có thể chuyển (không có trong lớp khác cùng năm học)
      const validStudentClasses = [];
      const skippedStudents = [];
      
      for (const sc of oldStudentClasses) {
        const studentId = sc.student_id.toString();
        const classIds = studentClassMap.get(studentId) || [];
        
        // Kiểm tra xem học sinh có trong lớp nào khác cùng năm học không
        const hasConflict = classIds.some(classId => {
          const cls = classesMap.get(classId);
          return cls && cls._id.toString() !== id.toString();
        });
        
        if (hasConflict) {
          skippedStudents.push(studentId);
        } else {
          validStudentClasses.push({
            student_id: sc.student_id,
            class_id: newClass._id,
            discount: sc.discount || 0,
          });
        }
      }
      
      // Thêm học sinh hợp lệ vào lớp mới
      if (validStudentClasses.length > 0) {
        try {
          await StudentClass.insertMany(validStudentClasses, { ordered: false });
        } catch (insertErr) {
          console.warn('Lỗi khi thêm học sinh vào lớp mới:', insertErr.message);
        }
      }
      
      // Cảnh báo nếu có học sinh bị bỏ qua
      if (skippedStudents.length > 0) {
        console.warn(`${skippedStudents.length} học sinh đã có trong lớp khác cùng năm học và không được chuyển`);
      }
    }

    // Populate và trả về lớp mới
    const created = await ClassModel.findById(newClass._id)
      .populate('school_id')
      .populate('class_age_id')
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'full_name email avatar_url' } })
      .populate({ path: 'teacher_id2', populate: { path: 'user_id', select: 'full_name email avatar_url' } });

    res.status(201).json({ 
      success: true, 
      message: `Lên lớp thành công. Đã tạo lớp mới và chuyển ${oldStudentClasses.length} học sinh.`, 
      data: created 
    });
  } catch (err) {
    console.error('classController.promoteClass Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi lên lớp: ' + err.message, error: err.message });
  }
}

// DELETE /classes/:classId/students/:studentId - remove a student from class
async function removeStudentFromClass(req, res) {
  try {
    const { classId, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp' });

    // Ensure school_admin only manages their own school
    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(cls.school_id) !== String(adminSchoolId)) {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác với lớp thuộc trường khác' });
        }
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });

    if (String(student.school_id) !== String(cls.school_id)) {
      return res.status(400).json({ success: false, message: 'Học sinh không thuộc cùng trường với lớp' });
    }

    const studentClassLink = await StudentClass.findOne({ class_id: classId, student_id: studentId });
    if (!studentClassLink) {
      return res.status(404).json({ success: false, message: 'Học sinh không thuộc lớp này' });
    }

    await StudentClass.deleteOne({ _id: studentClassLink._id });

    res.json({ success: true, message: 'Đã xóa học sinh khỏi lớp' });
  } catch (err) {
    console.error('classController.removeStudentFromClass Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
}

// GET /classes/:classId/eligible-students
async function getEligibleStudents(req, res) {
  try {
    const { classId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'classId không hợp lệ' });
    }

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp' });

    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(cls.school_id) !== String(adminSchoolId)) {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập lớp thuộc trường khác' });
        }
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    }

    const latestAcademicYear = await getLatestAcademicYearForSchool(cls.school_id);
    if (!latestAcademicYear) {
      return res.json({ success: true, data: [] });
    }

    const latestYearClasses = await ClassModel.find({
      school_id: cls.school_id,
      academic_year: latestAcademicYear,
    }).select('_id');

    const classIds = latestYearClasses.map(c => c._id);
    let studentsInLatest = [];
    if (classIds.length > 0) {
      const studentLinks = await StudentClass.find({ class_id: { $in: classIds } }).select('student_id');
      studentsInLatest = studentLinks.map(link => link.student_id.toString());
    }

    const eligibleStudents = await Student.find({
      school_id: cls.school_id,
      status: 1,
      _id: { $nin: studentsInLatest },
    }).select('full_name dob gender avatar_url');

    res.json({
      success: true,
      data: eligibleStudents,
      metadata: {
        latestAcademicYear,
        total: eligibleStudents.length,
      },
    });
  } catch (err) {
    console.error('classController.getEligibleStudents Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
}

// POST /classes/:classId/students
async function addStudentToClass(req, res) {
  try {
    const { classId } = req.params;
    const { student_id } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp' });

    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(cls.school_id) !== String(adminSchoolId)) {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác với lớp thuộc trường khác' });
        }
      } catch (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
    }

    const student = await Student.findById(student_id);
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
    if (String(student.school_id) !== String(cls.school_id)) {
      return res.status(400).json({ success: false, message: 'Học sinh không thuộc trường này' });
    }

    const latestAcademicYear = await getLatestAcademicYearForSchool(cls.school_id);
    if (latestAcademicYear && cls.academic_year !== latestAcademicYear) {
      return res.status(400).json({ success: false, message: `Chỉ có thể thêm học sinh vào lớp thuộc năm học mới nhất (${latestAcademicYear})` });
    }

    // Ensure student has no class in latest academic year
    if (latestAcademicYear) {
      const latestYearClasses = await ClassModel.find({
        school_id: cls.school_id,
        academic_year: latestAcademicYear,
      }).select('_id');
      const classIds = latestYearClasses.map(c => c._id);

      if (classIds.length > 0) {
        const existingLink = await StudentClass.findOne({
          student_id,
          class_id: { $in: classIds },
        });
        if (existingLink) {
          return res.status(400).json({ success: false, message: 'Học sinh đã thuộc một lớp trong năm học mới nhất' });
        }
      }
    }

    const existingInClass = await StudentClass.findOne({ class_id: classId, student_id });
    if (existingInClass) {
      return res.status(400).json({ success: false, message: 'Học sinh đã thuộc lớp này' });
    }

    await StudentClass.create({
      class_id: classId,
      student_id,
      discount: 0,
    });

    res.status(201).json({ success: true, message: 'Thêm học sinh vào lớp thành công' });
  } catch (err) {
    console.error('classController.addStudentToClass Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
}

module.exports = {
  listClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  promoteClass,
  removeStudentFromClass,
  getEligibleStudents,
  addStudentToClass,
  getAllClasses: listClasses,
};
