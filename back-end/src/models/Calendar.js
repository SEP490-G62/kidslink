const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  weekday_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeekDay',
    required: true
  },
  date: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Calendar', calendarSchema);


