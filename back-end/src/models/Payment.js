const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_time: {
    type: String,
    required: true
  },
  payment_method: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4] // 1: cash, 2: bank transfer, 3: credit card, 4: other
  },
  total_amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);




