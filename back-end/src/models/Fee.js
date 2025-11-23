const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  fee_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  late_fee_type: {
    type: String,
    enum: ['none', 'fixed', 'percentage'],
    default: 'none'
  },
  late_fee_value: {
    type: Number,
    default: 0
  },
  late_fee_description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fee', feeSchema);

