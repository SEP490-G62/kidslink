const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllPosts,
  getPostById,
  updatePostStatus,
  deletePost,
  createPost,
  updatePost
} = require('../controllers/schoolAdminPostController');

const { 
  getComments,
  createComment,
  deleteComment, 
  getLikes,
  toggleLike
} = require('../controllers/schoolAdminCommentController');

// Áp dụng xác thực và authorization cho tất cả routes
router.use(authenticate);
router.use(authorize(['school_admin', 'admin']));

// Post Routes
router.get('/', getAllPosts);
router.get('/:postId', getPostById);
router.post('/', createPost);
router.put('/:postId', updatePost);
router.put('/:postId/status', updatePostStatus);
router.delete('/:postId', deletePost);

// Comment Routes
router.get('/:postId/comments', getComments);
router.post('/:postId/comments', createComment);
router.delete('/comments/:commentId', deleteComment);

// Like Routes
router.get('/:postId/likes', getLikes);
router.post('/:postId/like', toggleLike);

module.exports = router;
