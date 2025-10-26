// Import controllers from parent subdirectory
const postsController = require('./parent/postsController');
const commentsController = require('./parent/commentsController');
const likesController = require('./parent/likesController');


module.exports = {
  // Export functions from posts controller
  getAllPosts: postsController.getAllPosts,
  
  // Export functions from likes controller
  toggleLike: likesController.toggleLike,
  getLikes: likesController.getLikes,
  
  // Export functions from comments controller
  createComment: commentsController.createComment,
  getComments: commentsController.getComments,
  updateComment: commentsController.updateComment,
  deleteComment: commentsController.deleteComment,
  createCommentValidators: commentsController.createCommentValidators
};
