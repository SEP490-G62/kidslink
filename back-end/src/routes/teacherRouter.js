const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  studentValidators,
  checkIn,
  checkOut,
} = require('../controllers/dailyReportController');

const {
  getTeacherClasses,
  getClassStudents,
  getStudentsAttendanceByDate
} = require('../controllers/teacherController');

// Middleware xác thực cho tất cả routes
router.use(authenticate);

// Chỉ cho phép teacher thực hiện check in/out và cập nhật comments
router.post('/daily-reports/checkin', authorize(['teacher']), studentValidators, checkIn);
router.put('/daily-reports/checkout', authorize(['teacher']), studentValidators, checkOut);



// Routes cho thông tin lớp học của teacher
router.get('/class', authorize(['teacher']), getTeacherClasses);
router.get('/class/students', authorize(['teacher']), getClassStudents);
router.get('/class/students/attendance/:date', authorize(['teacher']), getStudentsAttendanceByDate);

module.exports = router;




