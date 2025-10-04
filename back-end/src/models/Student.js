const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  dob: {
    type: Date,
    required: true
  },
  gender: {
    type: Number,
    required: true,
    enum: [0, 1] // 0: female, 1: male
  },
  avatar_url: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true,
    default: 1 // 1: active, 0: inactive
  },
  allergy: {
    type: String,
    required: true,
    trim: true
  },
  discount: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
