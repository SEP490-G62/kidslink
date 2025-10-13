const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  create_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  last_message_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Conversation', conversationSchema);

