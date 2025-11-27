// back-end/src/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

// --- Lấy tất cả học sinh ---
router.get('/all', authenticate, studentController.getAllStudents);

// --- Lấy danh sách học sinh theo lớp ---
router.get('/class/:classId', authenticate, studentController.getStudentsByClass);

// --- Lấy chi tiết 1 học sinh ---
router.get('/:id', authenticate, studentController.getStudentDetail);

// --- CRUD (school_admin/admin only) ---
router.post('/', authenticate, authorize(['school_admin', 'admin']), studentController.createStudent);
router.put('/:id', authenticate, authorize(['school_admin', 'admin']), studentController.updateStudent);
router.post('/:id/transfer', authenticate, authorize(['school_admin', 'admin']), studentController.transferStudent);
router.patch('/:id/status', authenticate, authorize(['school_admin', 'admin']), studentController.toggleStudentStatus);
router.post('/:id/parents', authenticate, authorize(['school_admin', 'admin']), studentController.addParentForStudent);
router.delete('/:id/parents/:parentId', authenticate, authorize(['school_admin', 'admin']), studentController.removeParentFromStudent);
router.delete('/:id', authenticate, authorize(['school_admin', 'admin']), studentController.deleteStudent);

module.exports = router;
