const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  school_name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    trim: true
  },
  logo_url: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true,
    default: 1 // 1: active, 0: inactive
  },
  qr_data: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('School', schoolSchema);

