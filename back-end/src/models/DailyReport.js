const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  report_date: {
    type: Date,
    required: true
  },
  checkin_time: {
    type: String,
    required: false
  },
  checkout_time: {
    type: String,
    required: false
  },
  comments: {
    type: String,
    required: false,
    trim: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  teacher_checkin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  teacher_checkout_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyReport', dailyReportSchema);




