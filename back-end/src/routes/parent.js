const express = require('express');
const router = express.Router();

// const { authenticate } = require('../middleware/auth');
const {
  getAllPosts,
  toggleLike,
  getLikes,
  createComment,
  getComments,
  updateComment,
  deleteComment,
  createCommentValidators
} = require('../controllers/parentController');

// TẠM THỜI: Bỏ qua authentication để test với hardcoded parent ID
// TODO: Thêm lại authentication khi có token thực tế
// router.use(authenticate);

// Routes cho posts
router.get('/posts', getAllPosts);

// Routes cho likes
router.post('/posts/:postId/like', toggleLike);
router.get('/posts/:postId/likes', getLikes);

// Routes cho comments
router.post('/posts/:postId/comments', createCommentValidators, createComment);
router.get('/posts/:postId/comments', getComments);
router.put('/comments/:commentId', updateComment);
router.delete('/comments/:commentId', deleteComment);

module.exports = router;
