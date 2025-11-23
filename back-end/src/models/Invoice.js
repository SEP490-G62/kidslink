const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  class_fee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassFee',
    required: true
  },
  amount_due: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  due_date: {
    type: Date,
    required: true
  },
  student_class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentClass',
    required: true
  },
  discount: {
    type: Number,
    required: true,
    default: 0
  },
  payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  status: {
    type: Number,
    required: true,
    default: 0 // 0: pending, 1: paid, 2: overdue
  },
  payos_order_code: {
    type: Number
  },
  payos_checkout_url: {
    type: String,
    trim: true
  },
  payos_qr_code: {
    type: String
  },
  payos_qr_url: {
    type: String,
    trim: true
  },
  payos_expired_at: {
    type: Date
  },
  payos_transaction_id: {
    type: String,
    trim: true
  },
  late_fee_amount: {
    type: mongoose.Schema.Types.Decimal128
  },
  late_fee_applied_at: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);




