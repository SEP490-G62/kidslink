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
  calendar_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar',
    required: true
  },
  activity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: false // Không bắt buộc - tiết học chỉ cần thời gian
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: false // Không bắt buộc
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Slot', slotSchema);




