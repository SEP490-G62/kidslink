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
const { getStudentDetail } = require('../controllers/studentController');
const { createClassChatGroup } = require('../controllers/messagingController');

// Middleware xác thực cho tất cả routes
router.use(authenticate);

// Chỉ cho phép teacher thực hiện check in/out và cập nhật comments
router.post('/daily-reports/checkin', authorize(['teacher']), studentValidators, checkIn);
router.put('/daily-reports/checkout', authorize(['teacher']), studentValidators, checkOut);

// Đánh giá học sinh - cập nhật comments cuối ngày
router.put('/daily-reports/:id/comment', authorize(['teacher']), require('../controllers/dailyReportController').updateComment);


// Routes cho thông tin lớp học của teacher
router.get('/class', authorize(['teacher']), getTeacherClasses);
router.get('/class/students', authorize(['teacher']), getClassStudents);
router.get('/class/students/attendance/:date', authorize(['teacher']), getStudentsAttendanceByDate);

// Xem thông tin chi tiết học sinh
router.get('/students/:id', authorize(['teacher']), getStudentDetail);

router.post('/class/chat-group', authorize(['teacher']), createClassChatGroup);

module.exports = router;




