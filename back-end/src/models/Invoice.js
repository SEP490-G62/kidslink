const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  class_fee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassFee',
    required: true
  },
  amount_due: {
    type: Number,
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);

