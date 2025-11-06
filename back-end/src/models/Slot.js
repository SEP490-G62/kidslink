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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Slot', slotSchema);




