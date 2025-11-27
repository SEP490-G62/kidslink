const express = require('express');
const router = express.Router();
const classAgeController = require('../controllers/classAgeController');
const { authenticate, authorize } = require('../middleware/auth');

// Lấy danh sách khối tuổi
router.get('/', authenticate, classAgeController.getAllClassAges);

// Tạo khối tuổi mới (admin/school_admin only)
router.post('/', authenticate, authorize(['admin', 'school_admin']), classAgeController.createClassAge);

// Cập nhật khối tuổi (admin/school_admin only)
router.put('/:id', authenticate, authorize(['admin', 'school_admin']), classAgeController.updateClassAge);

// Xóa khối tuổi (admin/school_admin only)
router.delete('/:id', authenticate, authorize(['admin', 'school_admin']), classAgeController.deleteClassAge);

module.exports = router;
