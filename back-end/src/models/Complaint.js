const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaint_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplaintType',
    required: true
  },
  complaintTypeName: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approve', 'reject'],
    default: 'pending'
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  response: {
    type: String,
    trim: true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);

