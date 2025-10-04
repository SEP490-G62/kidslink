const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  day_of_week: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Calendar', calendarSchema);
