const ClassAge = require('../models/ClassAge');
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

// Lấy danh sách tất cả khối tuổi
exports.getAllClassAges = async (req, res) => {
  try {
    const filter = {};
    
    // Nếu là school_admin, chỉ lấy classAges của school_id của họ
    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        filter.school_id = adminSchoolId;
      } catch (err) {
        return res.status(err.statusCode || 400).json({ message: err.message });
      }
    }
    
    const classAges = await ClassAge.find(filter).sort({ age: 1 }).lean();
    return res.json({ classAges });
  } catch (err) {
    console.error('getAllClassAges error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Tạo khối tuổi mới (admin/school_admin only)
exports.createClassAge = async (req, res) => {
  try {
    const { age, age_name } = req.body;
    
    if (!age || !age_name) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Get school_id - từ user nếu là school_admin, hoặc từ payload
    let schoolId = req.body.school_id;
    if (req.user?.role === 'school_admin') {
      try {
        schoolId = await getSchoolIdForAdmin(req.user.id);
      } catch (err) {
        return res.status(err.statusCode || 400).json({ message: err.message });
      }
    } else if (!schoolId) {
      const School = require('../models/School');
      const school = await School.findOne();
      if (!school) {
        return res.status(400).json({ 
          message: 'Không tìm thấy trường học trong hệ thống. Vui lòng tạo trường trước.' 
        });
      }
      schoolId = school._id;
    }

    // Kiểm tra age đã tồn tại chưa trong cùng school
    const existing = await ClassAge.findOne({ age, school_id: schoolId });
    if (existing) {
      return res.status(400).json({ message: `Khối tuổi với age=${age} đã tồn tại trong trường này` });
    }

    const newClassAge = await ClassAge.create({ age, age_name, school_id: schoolId });
    return res.status(201).json({ message: 'Tạo khối tuổi thành công', classAge: newClassAge });
  } catch (err) {
    console.error('createClassAge error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Cập nhật khối tuổi (admin/school_admin only)
exports.updateClassAge = async (req, res) => {
  try {
    const { id } = req.params;
    const { age, age_name } = req.body;

    if (!age || !age_name) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const existingClassAge = await ClassAge.findById(id);
    if (!existingClassAge) {
      return res.status(404).json({ message: 'Không tìm thấy khối tuổi' });
    }

    // Nếu là school_admin, kiểm tra quyền truy cập
    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(existingClassAge.school_id) !== String(adminSchoolId)) {
          return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa khối tuổi thuộc trường khác' });
        }
      } catch (err) {
        return res.status(err.statusCode || 400).json({ message: err.message });
      }
    }

    // Kiểm tra age đã tồn tại ở khối tuổi khác chưa trong cùng school
    const existing = await ClassAge.findOne({ 
      age, 
      school_id: existingClassAge.school_id,
      _id: { $ne: id } 
    });
    if (existing) {
      return res.status(400).json({ message: `Khối tuổi với age=${age} đã tồn tại trong trường này` });
    }

    const updated = await ClassAge.findByIdAndUpdate(
      id,
      { age, age_name },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy khối tuổi' });
    }

    return res.json({ message: 'Cập nhật khối tuổi thành công', classAge: updated });
  } catch (err) {
    console.error('updateClassAge error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Xóa khối tuổi (admin/school_admin only)
exports.deleteClassAge = async (req, res) => {
  try {
    const { id } = req.params;

    const existingClassAge = await ClassAge.findById(id);
    if (!existingClassAge) {
      return res.status(404).json({ message: 'Không tìm thấy khối tuổi' });
    }

    // Nếu là school_admin, kiểm tra quyền truy cập
    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(existingClassAge.school_id) !== String(adminSchoolId)) {
          return res.status(403).json({ message: 'Bạn không có quyền xóa khối tuổi thuộc trường khác' });
        }
      } catch (err) {
        return res.status(err.statusCode || 400).json({ message: err.message });
      }
    }

    // Kiểm tra xem có lớp nào đang sử dụng khối tuổi này không
    const Class = require('../models/Class');
    const classesUsing = await Class.findOne({ class_age_id: id });
    
    if (classesUsing) {
      return res.status(400).json({ 
        message: 'Không thể xóa khối tuổi này vì đang có lớp học sử dụng' 
      });
    }

    const deleted = await ClassAge.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy khối tuổi' });
    }

    return res.json({ message: 'Xóa khối tuổi thành công' });
  } catch (err) {
    console.error('deleteClassAge error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};
