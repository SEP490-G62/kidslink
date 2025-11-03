const express = require('express');
const router = express.Router();
const classAgeController = require('../controllers/classAgeController');
const { authenticate, authorize } = require('../middleware/auth');

// Lấy danh sách khối tuổi
router.get('/', authenticate, classAgeController.getAllClassAges);

// Tạo khối tuổi mới (admin only)
router.post('/', authenticate, authorize(['admin']), classAgeController.createClassAge);

module.exports = router;
