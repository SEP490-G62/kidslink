const mongoose = require('mongoose');

const complaintTypeSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['teacher', 'parent'],
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ComplaintType', complaintTypeSchema);

