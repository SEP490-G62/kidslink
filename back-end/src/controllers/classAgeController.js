const ClassAge = require('../models/ClassAge');

// Lấy danh sách tất cả khối tuổi
exports.getAllClassAges = async (req, res) => {
  try {
    const classAges = await ClassAge.find().sort({ age: 1 }).lean();
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

    // Kiểm tra age đã tồn tại chưa
    const existing = await ClassAge.findOne({ age });
    if (existing) {
      return res.status(400).json({ message: `Khối tuổi với age=${age} đã tồn tại` });
    }

    const newClassAge = await ClassAge.create({ age, age_name });
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

    // Kiểm tra age đã tồn tại ở khối tuổi khác chưa
    const existing = await ClassAge.findOne({ age, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: `Khối tuổi với age=${age} đã tồn tại` });
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
