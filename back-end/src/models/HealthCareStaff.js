const mongoose = require('mongoose');

const healthCareStaffSchema = new mongoose.Schema({
  qualification: {
    type: String,
    required: true,
    trim: true
  },
  major: {
    type: String,
    required: true,
    trim: true
  },
  experience_years: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    required: true,
    trim: true
  },

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HealthCareStaff', healthCareStaffSchema);




