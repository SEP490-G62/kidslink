const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  getChildren,
  toggleLike,
  getLikes,
  createComment,
  getComments,
  updateComment,
  deleteComment,
  createCommentValidators,
  getPersonalInfo,
  updatePersonalInfo,
  getStudentFees,
  createPayOSPaymentRequest,
  checkPayOSPaymentStatus
} = require('../controllers/parentController');

const { getUnpaidFeesCount } = require('../controllers/parent/feeController');

const { getMyPosts } = require('../controllers/parent/postsController');

const {
  getChildInfo,
  addPickup,
  updatePickup,
  deletePickup
} = require('../controllers/parent/childInfoController');

const { getDailyReports } = require('../controllers/parent/dailyReportController');

// Áp dụng authentication và authorization cho tất cả routes
router.use(authenticate);
router.use(authorize(['parent']));

// Routes cho children
router.get('/children', getChildren);

// Routes cho posts
router.get('/posts', getAllPosts);
router.get('/posts/my-posts', getMyPosts); // Lấy posts của user (bao gồm pending và approved)
router.post('/posts', createPost);
router.put('/posts/:postId', updatePost);
router.delete('/posts/:postId', deletePost);

// Routes cho likes
router.post('/posts/:postId/like', toggleLike);
router.get('/posts/:postId/likes', getLikes);

// Routes cho comments
router.post('/posts/:postId/comments', createCommentValidators, createComment);
router.get('/posts/:postId/comments', getComments);
router.put('/comments/:commentId', updateComment);
router.delete('/comments/:commentId', deleteComment);

// Routes cho personal info
router.get('/personal-info', getPersonalInfo);
router.put('/personal-info', updatePersonalInfo);

// Routes cho child info
router.get('/child-info/:studentId', getChildInfo);

// Routes cho pickups
router.post('/pickups/:studentId', addPickup);
router.put('/pickups/:pickupId/:studentId', updatePickup);
router.delete('/pickups/:pickupId/:studentId', deletePickup);

// Routes cho daily reports
router.get('/daily-reports', getDailyReports);

// Routes cho class calendar (năm học mới nhất)
const { getClassCalendarLatest, getClassTimeSlots } = require('../controllers/parent/calendarController');
router.get('/class-calendar', getClassCalendarLatest);
router.get('/class-calendar/slots', getClassTimeSlots);

// Routes cho weekly menu
const { getWeeklyMenuLatest } = require('../controllers/parent/menuController');
router.get('/menu', getWeeklyMenuLatest);

// Routes cho complaints
const {
  getComplaintTypes,
  createComplaint,
  getMyComplaints,
  getComplaintById
} = require('../controllers/parent/complaintController');
router.get('/complaints/types', getComplaintTypes);
router.post('/complaints', createComplaint);
router.get('/complaints', getMyComplaints);
router.get('/complaints/:complaintId', getComplaintById);

router.get('/fees', getStudentFees);
router.get('/fees/unpaid-count', getUnpaidFeesCount);
router.post('/fees/payos', createPayOSPaymentRequest);
router.post('/fees/payos/status', checkPayOSPaymentStatus);

module.exports = router;
