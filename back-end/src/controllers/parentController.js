// Import controllers from parent subdirectory
const postsController = require('./parent/postsController');
const commentsController = require('./parent/commentsController');
const likesController = require('./parent/likesController');
const personalInfoController = require('./parent/personalInfoController');
const childInfoController = require('./parent/childInfoController');
const calendarController = require('./parent/calendarController');
const feeController = require('./parent/feeController');


module.exports = {
  // Export functions from posts controller
  getAllPosts: postsController.getAllPosts,
  createPost: postsController.createPost,
  updatePost: postsController.updatePost,
  deletePost: postsController.deletePost,
  getChildren: postsController.getChildren,
  
  // Export functions from likes controller
  toggleLike: likesController.toggleLike,
  getLikes: likesController.getLikes,
  
  // Export functions from comments controller
  createComment: commentsController.createComment,
  getComments: commentsController.getComments,
  updateComment: commentsController.updateComment,
  deleteComment: commentsController.deleteComment,
  createCommentValidators: commentsController.createCommentValidators,
  
  // Export functions from personal info controller
  getPersonalInfo: personalInfoController.getPersonalInfo,
  updatePersonalInfo: personalInfoController.updatePersonalInfo,
  
  // Export functions from child info controller
  getChildInfo: childInfoController.getChildInfo,
  
  // Export functions from calendar controller
  getClassCalendarLatest: calendarController.getClassCalendarLatest,
  
  // Export functions from fee controller
  getStudentFees: feeController.getStudentFees,
  createPayOSPaymentRequest: feeController.createPayOSPaymentRequest,
  checkPayOSPaymentStatus: feeController.checkPayOSPaymentStatus
};
