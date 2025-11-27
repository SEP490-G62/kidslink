const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: false
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
  status: {
    type: Number,
    required: true,
    default: 1 // 1: active, 0: inactive
  },
  email: {
    type: String,
    trim: true
  },
  phone_number: {
    type: String,
    trim: true
   },
   school_id: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'School'
   },
   address: {
     type: String,
     trim: true
   }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

