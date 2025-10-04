const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  phone_number: {
    type: String,
    required: true,
    trim: true
  },
  relationship: {
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

module.exports = mongoose.model('Parent', parentSchema);
