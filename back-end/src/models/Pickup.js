const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  relationship: {
    type: String,
    required: true,
    trim: true
  },
  id_card_number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  avatar_url: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pickup', pickupSchema);




