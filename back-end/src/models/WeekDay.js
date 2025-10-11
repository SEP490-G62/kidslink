const mongoose = require('mongoose');

const weekDaySchema = new mongoose.Schema({
  day_of_week: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WeekDay', weekDaySchema);
