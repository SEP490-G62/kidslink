const express = require('express');
const router = express.Router();

// const { authenticate } = require('../middleware/auth');
const {
  getAllPosts,
  getPostById,
  getPostComments,
  togglePostLike,
  addPostComment,
  getClasses,
  getPostStats
} = require('../controllers/parentController');

// Middleware xác thực cho tất cả routes
// router.use(authenticate);

// Routes cho posts
router.get('/posts', getAllPosts);
router.get('/posts/stats', getPostStats);
router.get('/posts/:id', getPostById);
router.get('/posts/:id/comments', getPostComments);
router.post('/posts/:id/like', togglePostLike);
router.post('/posts/:id/comments', addPostComment);

// Routes cho classes
router.get('/classes', getClasses);

module.exports = router;
