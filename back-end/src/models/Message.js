const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: false,
    trim: true
  },
  image_url: {
    type: String,
    required: false
  },
  image_public_id: {
    type: String,
    required: false
  },
  send_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  read_status: {
    type: Number,
    required: true,
    default: 0 // 0: unread, 1: read
  },
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Đảm bảo ít nhất một trong hai: content hoặc image_url phải có
messageSchema.pre('validate', function(next) {
  if (!this.content && !this.image_url) {
    this.invalidate('content', 'Yêu cầu có nội dung hoặc ảnh');
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);




