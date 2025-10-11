const mongoose = require('mongoose');

const postCommentSchema = new mongoose.Schema({
  contents: {
    type: String,
    required: true,
    trim: true
  },
  create_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parent_comment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostComment',
    default: null // null for top-level comments
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PostComment', postCommentSchema);




