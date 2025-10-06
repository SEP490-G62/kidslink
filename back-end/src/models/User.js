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
    enum: ['school_admin', 'teacher', 'parent', 'health_care_staff', 'nutrition_staff', 'admin']
  },
  avatar_url: {
    type: String,
    required: true
  },
  phone_number: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
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

