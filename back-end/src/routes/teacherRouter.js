const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  studentValidators,
  checkIn,
  checkOut,
  getStudentWeeklyReports,
} = require('../controllers/dailyReportController');

const {
  getTeacherClasses,
  getClassStudents,
  getStudentsAttendanceByDate,
  getTeacherLatestClassCalendar,
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar
} = require('../controllers/teacherController');
const { getClassTimeSlots } = require('../controllers/parent/calendarController');
const { getStudentDetail } = require('../controllers/studentController');
const { createClassChatGroup } = require('../controllers/messagingController');
const {
  getAllPostsForTeacher,
  createPost,
  updatePost,
  deletePost,
  getMyPosts
} = require('../controllers/teacher/postsController');
const {
  toggleLike,
  getLikes
} = require('../controllers/teacher/likesController');
const {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  createCommentValidators
} = require('../controllers/teacher/commentsController');
const {
  getComplaintTypes,
  createComplaint,
  getMyComplaints,
  getComplaintById
} = require('../controllers/teacher/complaintController');

// Middleware xác thực cho tất cả routes
router.use(authenticate);

// Chỉ cho phép teacher thực hiện check in/out và cập nhật comments
router.post('/daily-reports/checkin', authorize(['teacher']), studentValidators, checkIn);
router.put('/daily-reports/checkout', authorize(['teacher']), studentValidators, checkOut);

// Hồ sơ giáo viên
router.get('/profile', authorize(['teacher']), getMyProfile);
router.put('/profile', authorize(['teacher']), updateMyProfile);
router.post('/profile/avatar', authorize(['teacher']), uploadMyAvatar);

// Đánh giá học sinh - cập nhật comments cuối ngày
router.put('/daily-reports/:id/comment', authorize(['teacher']), require('../controllers/dailyReportController').updateComment);

// Lấy lịch sử daily reports của học sinh theo tuần
router.get('/students/:student_id/daily-reports/weekly', authorize(['teacher']), getStudentWeeklyReports);


// Routes cho thông tin lớp học của teacher
router.get('/class', authorize(['teacher']), getTeacherClasses);
router.get('/class/students', authorize(['teacher']), getClassStudents);
router.get('/class/students/attendance/:date', authorize(['teacher']), getStudentsAttendanceByDate);
router.get('/class-calendar', authorize(['teacher']), getTeacherLatestClassCalendar);
router.get('/class-calendar/slots', authorize(['teacher']), getClassTimeSlots);

// Xem thông tin chi tiết học sinh
router.get('/students/:id', authorize(['teacher']), getStudentDetail);

router.post('/class/chat-group', authorize(['teacher']), createClassChatGroup);

// Routes cho posts
router.get('/posts', authorize(['teacher']), getAllPostsForTeacher);
router.get('/posts/my-posts', authorize(['teacher']), getMyPosts);
router.post('/posts', authorize(['teacher']), createPost);
router.put('/posts/:postId', authorize(['teacher']), updatePost);
router.delete('/posts/:postId', authorize(['teacher']), deletePost);

// Routes cho likes
router.post('/posts/:postId/like', authorize(['teacher']), toggleLike);
router.get('/posts/:postId/likes', authorize(['teacher']), getLikes);

// Routes cho comments
router.post('/posts/:postId/comments', authorize(['teacher']), createCommentValidators, createComment);
router.get('/posts/:postId/comments', authorize(['teacher']), getComments);
router.put('/comments/:commentId', authorize(['teacher']), updateComment);
router.delete('/comments/:commentId', authorize(['teacher']), deleteComment);

// Routes cho complaints
router.get('/complaints/types', authorize(['teacher']), getComplaintTypes);
router.post('/complaints', authorize(['teacher']), createComplaint);
router.get('/complaints', authorize(['teacher']), getMyComplaints);
router.get('/complaints/:complaintId', authorize(['teacher']), getComplaintById);

module.exports = router;




