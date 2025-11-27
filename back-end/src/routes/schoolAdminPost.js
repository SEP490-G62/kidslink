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
  updateComment,
  getLikes,
  toggleLike
} = require('../controllers/schoolAdminCommentController');

// Áp dụng xác thực và authorization cho tất cả routes
router.use(authenticate);
router.use(authorize(['school_admin', 'admin']));

// Comment Routes
router.get('/:postId/comments', getComments);
router.post('/:postId/comments', createComment);
router.put('/comments/:commentId', updateComment);
router.delete('/comments/:commentId', deleteComment);

// Like Routes
router.get('/:postId/likes', getLikes);
router.post('/:postId/like', toggleLike);

// Post Routes
router.get('/', getAllPosts);
router.get('/:postId', getPostById);
router.post('/', createPost);
router.put('/:postId/status', updatePostStatus);
router.put('/:postId', updatePost);
router.delete('/:postId', deletePost);

module.exports = router;
