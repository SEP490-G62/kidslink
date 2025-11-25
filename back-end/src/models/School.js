const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  school_name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    trim: true
  },
  logo_url: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true,
    default: 1 // 1: active, 0: inactive
  },
  qr_data: {
    type: String,
  },
  payos_config: {
    client_id: {
      type: String,
      trim: true
    },
    api_key: {
      type: String,
      trim: true
    },
    checksum_key: {
      type: String,
      trim: true
    },
    account_number: {
      type: String,
      trim: true
    },
    account_name: {
      type: String,
      trim: true
    },
    bank_code: {
      type: String,
      trim: true
    },
    active: {
      type: Boolean,
      default: false
    },
    webhook_url: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('School', schoolSchema);

