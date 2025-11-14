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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fee', feeSchema);

