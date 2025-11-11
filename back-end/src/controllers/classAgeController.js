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

// Tạo khối tuổi mới (admin only)
exports.createClassAge = async (req, res) => {
  try {
    const { age, age_name } = req.body;
    
    if (!age || !age_name) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const newClassAge = await ClassAge.create({ age, age_name });
    return res.status(201).json({ message: 'Tạo khối tuổi thành công', classAge: newClassAge });
  } catch (err) {
    console.error('createClassAge error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};
