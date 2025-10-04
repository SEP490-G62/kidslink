const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  report_date: {
    type: Date,
    required: true
  },
  checkin_time: {
    type: String,
    required: true
  },
  checkout_time: {
    type: String,
    required: true
  },
  comments: {
    type: String,
    required: true,
    trim: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyReport', dailyReportSchema);
