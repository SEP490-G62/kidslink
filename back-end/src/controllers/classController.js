const mongoose = require('mongoose');
const { Class: ClassModel, StudentClass } = require('../models');

// GET /classes
async function listClasses(req, res) {
  try {
    const { page = 1, limit = 50, school_id, class_age_id, teacher_id, academic_year } = req.query;
    const filter = {};
    if (school_id && mongoose.Types.ObjectId.isValid(school_id)) filter.school_id = school_id;
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

    // Get school_id - since system has only one school, get the first one
    let schoolId = payload.school_id;
    if (!schoolId) {
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

    const payload = req.body || {};
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

    // Get school_id từ lớp cũ hoặc tìm trường đầu tiên
    let schoolId = payload.school_id || oldClass.school_id;
    if (!schoolId) {
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
      const newStudentClasses = oldStudentClasses.map(sc => ({
        student_id: sc.student_id,
        class_id: newClass._id,
        discount: sc.discount || 0,
      }));
      
      // Sử dụng insertMany với ordered: false để bỏ qua lỗi duplicate
      try {
        await StudentClass.insertMany(newStudentClasses, { ordered: false });
      } catch (insertErr) {
        // Nếu có lỗi duplicate, vẫn tiếp tục (một số học sinh có thể đã được thêm)
        console.warn('Một số học sinh có thể đã tồn tại trong lớp mới:', insertErr.message);
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

module.exports = {
  listClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  promoteClass,
  getAllClasses: listClasses,
};
