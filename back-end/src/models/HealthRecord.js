const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  checkup_date: {
    type: Date,
    required: true
  },
  height_cm: {
    type: Number,
    required: true
  },
  weight_kg: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    required: true,
    trim: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  health_care_staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthCareStaff',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
