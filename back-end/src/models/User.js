const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'teacher', 'parent', 'health_care_staff']
  },
  avatar_url: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true,
    default: 1 // 1: active, 0: inactive
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
