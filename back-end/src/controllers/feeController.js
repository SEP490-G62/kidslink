const mongoose = require('mongoose');
const Fee = require('../models/Fee');

// GET /fees - list all fees
exports.listFees = async (req, res) => {
  try {
    const fees = await Fee.find({})
      .populate('lop_ids', 'class_name')
      .sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) {
    console.error('listFees error:', err);
    res.status(500).json({ error: 'Không thể tải danh sách khoản phí' });
  }
};

// POST /fees - create a fee
exports.createFee = async (req, res) => {
  try {
    const {
      ten_khoan_thu,
      mo_ta = '',
      so_tien,
      lop_ids,
      han_nop,
      bat_buoc,
      trang_thai,
    } = req.body || {};
    if (!ten_khoan_thu || so_tien === undefined || so_tien === null || so_tien === '') {
      return res.status(400).json({ error: 'Thiếu ten_khoan_thu hoặc so_tien' });
    }
    const fee = await Fee.create({
      ten_khoan_thu,
      mo_ta,
      so_tien: mongoose.Types.Decimal128.fromString(String(so_tien)),
      lop_ids: Array.isArray(lop_ids) ? lop_ids : [],
      han_nop,
      bat_buoc: !!bat_buoc,
      trang_thai: trang_thai || 'đang áp dụng',
    });
    const saved = await Fee.findById(fee._id).populate('lop_ids', 'class_name');
    res.status(201).json(saved);
  } catch (err) {
    console.error('createFee error:', err);
    res.status(500).json({ error: 'Không thể tạo khoản phí' });
  }
};

// PUT /fees/:id - update fee
exports.updateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    if (req.body.ten_khoan_thu !== undefined) update.ten_khoan_thu = req.body.ten_khoan_thu;
    if (req.body.mo_ta !== undefined) update.mo_ta = req.body.mo_ta;
    if (req.body.so_tien !== undefined) {
      update.so_tien = mongoose.Types.Decimal128.fromString(String(req.body.so_tien));
    }
    if (Array.isArray(req.body.lop_ids)) update.lop_ids = req.body.lop_ids;
    if (req.body.han_nop !== undefined) update.han_nop = req.body.han_nop;
    if (req.body.bat_buoc !== undefined) update.bat_buoc = !!req.body.bat_buoc;
    if (req.body.trang_thai !== undefined) update.trang_thai = req.body.trang_thai;
    const fee = await Fee.findByIdAndUpdate(id, update, { new: true }).populate('lop_ids', 'class_name');
    if (!fee) return res.status(404).json({ error: 'Không tìm thấy khoản phí' });
    res.json(fee);
  } catch (err) {
    console.error('updateFee error:', err);
    res.status(500).json({ error: 'Không thể cập nhật khoản phí' });
  }
};

// DELETE /fees/:id - delete fee
exports.deleteFee = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await Fee.findByIdAndDelete(id);
    if (!fee) return res.status(404).json({ error: 'Không tìm thấy khoản phí' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteFee error:', err);
    res.status(500).json({ error: 'Không thể xoá khoản phí' });
  }
};


