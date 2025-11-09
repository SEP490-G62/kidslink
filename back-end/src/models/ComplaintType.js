const mongoose = require('mongoose');

const complaintTypeSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ComplaintType', complaintTypeSchema);

