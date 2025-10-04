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
    required: true
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Slot', slotSchema);
