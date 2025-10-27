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
  createCommentValidators
} = require('../controllers/parentController');

// Áp dụng authentication và authorization cho tất cả routes
router.use(authenticate);
router.use(authorize(['parent']));

// Routes cho children
router.get('/children', getChildren);

// Routes cho posts
router.get('/posts', getAllPosts);
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

module.exports = router;
