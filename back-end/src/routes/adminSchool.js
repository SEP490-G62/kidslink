const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  updateSchoolStatus
} = require('../controllers/adminSchoolController');

// Áp dụng xác thực và authorization cho tất cả routes (chỉ admin)
router.use(authenticate);
router.use(authorize(['admin']));

// Routes
router.get('/', getAllSchools);
router.get('/:schoolId', getSchoolById);
router.post('/', createSchool);
router.put('/:schoolId', updateSchool);
router.delete('/:schoolId', deleteSchool);
router.put('/:schoolId/status', updateSchoolStatus);

module.exports = router;




