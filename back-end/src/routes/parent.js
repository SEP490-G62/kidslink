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

module.exports = router;
