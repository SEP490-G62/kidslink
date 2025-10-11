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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);




