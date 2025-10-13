const mongoose = require('mongoose');

const conversationParticipantSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  }
}, {
  timestamps: true
});

// Tạo compound index để đảm bảo unique combination
conversationParticipantSchema.index({ user_id: 1, conversation_id: 1 }, { unique: true });

module.exports = mongoose.model('ConversationParticipant', conversationParticipantSchema);




