const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  ten_khoan_thu: { type: String, required: true, trim: true },
  mo_ta: { type: String, required: true, trim: true },
  so_tien: { type: mongoose.Schema.Types.Decimal128, required: true },
  lop_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  han_nop: { type: Date },
  bat_buoc: { type: Boolean, default: false },
  // Hỗ trợ cả giá trị cũ (không dấu) và mới (có dấu, khoảng trắng)
  trang_thai: {
    type: String,
    enum: ['dang_ap_dung', 'tam_ngung', 'ket_thuc', 'đang áp dụng', 'tạm ngừng', 'kết thúc'],
    default: 'đang áp dụng'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fee', feeSchema);




