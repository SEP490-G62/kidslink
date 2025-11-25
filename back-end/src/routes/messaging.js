const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const { authenticate } = require('../middleware/auth');

// Tất cả routes đều cần xác thực
router.use(authenticate);

// Tạo cuộc trò chuyện mới
router.post('/conversations', messagingController.createConversation);

// Lấy danh sách conversations của user
router.get('/conversations', messagingController.getConversations);

// Lấy thông tin chi tiết conversation
router.get('/conversations/:conversation_id', messagingController.getConversation);

// Thêm người tham gia vào conversation
router.post('/conversations/:conversation_id/participants', messagingController.addParticipant);

// Lấy danh sách messages trong conversation
router.get('/conversations/:conversation_id/messages', messagingController.getMessages);

// Gửi message (REST API fallback)
router.post('/messages', messagingController.sendMessage);

// Đánh dấu tin nhắn đã đọc
router.put('/conversations/:conversation_id/read', messagingController.markAsRead);

// Lấy số lượng tin nhắn chưa đọc
router.get('/unread-count', messagingController.getUnreadCount);

// Tạo trò chuyện riêng parent-teacher
router.post('/conversations/direct', messagingController.createDirectConversationWithTeacher);

// Lấy giáo viên theo học sinh (lớp mới nhất)
router.get('/teachers-by-student/:student_id', messagingController.getTeachersByStudent);

// Lấy danh sách phụ huynh theo lớp của giáo viên (lớp có academic_year mới nhất)
router.get('/parents-by-teacher-class', messagingController.getParentsByTeacherClass);

module.exports = router;

