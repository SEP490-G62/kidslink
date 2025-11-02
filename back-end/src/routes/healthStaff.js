const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createHealthRecord,
  updateHealthRecord,
  listHealthRecordsByStudent,
  createHealthNotice,
  listHealthNoticesByStudent,
  listClasses,
  listStudentsByClass,
  getStaffProfile,
  updateStaffProfile
} = require('../controllers/healthCareController');

router.use(authenticate, authorize(['health_care_staff']));

// 1. Quản Lý Lớp
router.get('/classes', listClasses);
// 2. Quản Lý học sinh theo Lớp
router.get('/classes/:class_id/students', listStudentsByClass);
// 3. Sổ sức khỏe học sinh
router.get('/health/records', listHealthRecordsByStudent); // ?student_id=...
router.post('/health/records', createHealthRecord);
router.put('/health/records/:record_id', updateHealthRecord);
// 4. Thông báo y tế
router.get('/health/notices', listHealthNoticesByStudent); // ?student_id=...
router.post('/health/notices', createHealthNotice);
// 5. Staff profile
router.get('/profile', getStaffProfile);
router.put('/profile', updateStaffProfile);

module.exports = router;


