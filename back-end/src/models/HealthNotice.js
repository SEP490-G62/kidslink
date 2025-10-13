const mongoose = require('mongoose');

const healthNoticeSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  symptoms: {
    type: String,
    required: true,
    trim: true
  },
  actions_taken: {
    type: String,
    required: true,
    trim: true
  },
  medications: {
    type: String,
    required: true,
    trim: true
  },
  notice_time: {
    type: String,
    required: true
  },
  note: {
    type: String,
    required: true,
    trim: true
  },
  health_care_staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthCareStaff',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HealthNotice', healthNoticeSchema);




