const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_time: {
    type: String,
    required: true
  },
  payment_method: {
    type: Number,
    required: true,
    enum: [0, 1], // 0: offline, 1: online
    default: 1
  },
  total_amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);




