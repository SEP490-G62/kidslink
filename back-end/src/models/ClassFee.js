const mongoose = require('mongoose');

const classFeeSchema = new mongoose.Schema({
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  fee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fee',
    required: true
  },
  due_date: {
    type: Date,
    required: true
  },
  note: {
    type: String,
    required: false,
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

module.exports = mongoose.model('ClassFee', classFeeSchema);




