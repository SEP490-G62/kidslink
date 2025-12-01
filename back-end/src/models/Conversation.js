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
  },
  // Phân biệt nhóm chat lớp (group) với các conversation khác (ví dụ: 1-1 parent–teacher)
  is_class_group: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Conversation', conversationSchema);

