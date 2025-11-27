const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slot_name: {
    type: String,
    required: true,
    trim: true
  },
  start_time: {
    type: String,
    required: true
  },
  end_time: {
    type: String,
    required: true
  },
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  }
  // Slot giờ chỉ là khung giờ chuẩn, không gắn calendar/activity/teacher
  // Calendar sẽ reference đến Slot
}, {
  timestamps: true
});

module.exports = mongoose.model('Slot', slotSchema);




