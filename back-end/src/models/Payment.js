const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_date: {
    type: Date,
    required: true
  },
  payment_method: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4] // 1: cash, 2: bank transfer, 3: credit card, 4: other
  },
  status: {
    type: Number,
    required: true,
    default: 1 // 1: pending, 2: completed, 3: failed, 4: cancelled
  },
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
