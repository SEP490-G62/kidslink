const mongoose = require('mongoose');
const Fee = require('../models/Fee');
const ClassFee = require('../models/ClassFee');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const StudentClass = require('../models/StudentClass');

// GET /fees - list all fees
exports.listFees = async (req, res) => {
  try {
    const { nam_hoc, school_year, schoolYear } = req.query || {};
    const filter = {};
    const year = nam_hoc || school_year || schoolYear;
    if (year) {
      filter.nam_hoc = year;
    }
    const fees = await Fee.find(filter)
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
      nam_hoc,
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
      nam_hoc,
    });

    // Auto-create ClassFee records so detail view can show classes
    try {
      const classIds = Array.isArray(lop_ids) ? lop_ids.filter((id) => mongoose.Types.ObjectId.isValid(id)) : [];
      if (classIds.length > 0) {
        const nowDue = han_nop || new Date();
        const toCreate = [];
        const existing = await ClassFee.find({ fee_id: fee._id, class_id: { $in: classIds } }).select('class_id');
        const existingSet = new Set(existing.map((x) => String(x.class_id)));
        classIds.forEach((cid) => {
          if (!existingSet.has(String(cid))) {
            toCreate.push({
              fee_id: fee._id,
              class_id: cid,
              due_date: nowDue,
              note: mo_ta || '',
              status: 1,
            });
          }
        });
        if (toCreate.length > 0) {
          await ClassFee.insertMany(toCreate, { ordered: false });
        }
      }
    } catch (e) {
      // best effort, don't fail fee creation
      console.warn('createFee: cannot create ClassFee records', e?.message || e);
    }

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
    if (req.body.nam_hoc !== undefined) update.nam_hoc = req.body.nam_hoc;
    const fee = await Fee.findByIdAndUpdate(id, update, { new: true }).populate('lop_ids', 'class_name');
    if (!fee) return res.status(404).json({ error: 'Không tìm thấy khoản phí' });

    // Best-effort: ensure ClassFee exists for any provided lop_ids
    try {
      const classIds = Array.isArray(req.body.lop_ids) ? req.body.lop_ids.filter((cid) => mongoose.Types.ObjectId.isValid(cid)) : [];
      if (classIds.length > 0) {
        const existing = await ClassFee.find({ fee_id: fee._id, class_id: { $in: classIds } }).select('class_id');
        const existingSet = new Set(existing.map((x) => String(x.class_id)));
        const toCreate = [];
        classIds.forEach((cid) => {
          if (!existingSet.has(String(cid))) {
            toCreate.push({
              fee_id: fee._id,
              class_id: cid,
              due_date: update.han_nop || fee.han_nop || new Date(),
              note: update.mo_ta ?? fee.mo_ta ?? '',
              status: 1,
            });
          }
        });
        if (toCreate.length > 0) {
          await ClassFee.insertMany(toCreate, { ordered: false });
        }
      }
    } catch (e) {
      console.warn('updateFee: cannot upsert ClassFee records', e?.message || e);
    }

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

const toDecimalFromFee = (feeDoc) => {
  if (!feeDoc) return mongoose.Types.Decimal128.fromString('0');
  if (feeDoc.so_tien instanceof mongoose.Types.Decimal128) {
    return feeDoc.so_tien;
  }
  const raw =
    typeof feeDoc.so_tien === 'number'
      ? feeDoc.so_tien
      : feeDoc.so_tien?.$numberDecimal
      ? Number(feeDoc.so_tien.$numberDecimal)
      : Number(feeDoc.so_tien || 0);
  return mongoose.Types.Decimal128.fromString(String(raw || 0));
};

const ensureClassFeeAndInvoices = async (feeDoc, classId) => {
  if (!feeDoc) return null;
  if (!mongoose.Types.ObjectId.isValid(classId)) return null;
  const classObjectId = new mongoose.Types.ObjectId(classId);

  let classFee = await ClassFee.findOne({ fee_id: feeDoc._id, class_id: classObjectId });

  if (!classFee) {
    classFee = await ClassFee.create({
      fee_id: feeDoc._id,
      class_id: classObjectId,
      due_date: feeDoc.han_nop || new Date(),
      note: feeDoc.mo_ta || '',
      status: 1,
    });
  }

  const studentClasses = await StudentClass.find({ class_id: classObjectId }).select('_id discount');
  if (studentClasses.length > 0) {
    const existingInvoices = await Invoice.find({ class_fee_id: classFee._id }).select('student_class_id');
    const existingSet = new Set(existingInvoices.map((item) => String(item.student_class_id)));
    const toInsert = [];

    studentClasses.forEach((studentClass) => {
      if (!existingSet.has(String(studentClass._id))) {
        toInsert.push({
          class_fee_id: classFee._id,
          amount_due: toDecimalFromFee(feeDoc),
          due_date: feeDoc.han_nop || new Date(),
          student_class_id: studentClass._id,
          discount: studentClass.discount || 0,
          status: 0,
        });
      }
    });

    if (toInsert.length > 0) {
      await Invoice.insertMany(toInsert, { ordered: false });
    }
  }

  return classFee;
};

// GET /fees/:id/classes - list classes applied for a fee with stats
exports.listFeeClasses = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID khoản phí không hợp lệ' });
    }

    const fee = await Fee.findById(id).populate('lop_ids', 'class_name academic_year');
    if (!fee) {
      return res.status(404).json({ error: 'Không tìm thấy khoản phí' });
    }

    const classIds = (fee.lop_ids || []).map((c) => (typeof c === 'object' ? c._id || c.id : c)).filter(Boolean);
    for (const classId of classIds) {
      await ensureClassFeeAndInvoices(fee, classId);
    }

    let classFees = await ClassFee.find({ fee_id: id })
      .populate('class_id', 'class_name academic_year')
      .sort({ createdAt: -1 });

    const classFeeIds = classFees.map((cf) => cf._id);
    const statsMap = {};

    if (classFeeIds.length > 0) {
      const stats = await Invoice.aggregate([
        { $match: { class_fee_id: { $in: classFeeIds } } },
        {
          $group: {
            _id: '$class_fee_id',
            total: { $sum: 1 },
            paid: {
              $sum: {
                $cond: [{ $eq: ['$status', 1] }, 1, 0],
              },
            },
            overdue: {
              $sum: {
                $cond: [{ $eq: ['$status', 2] }, 1, 0],
              },
            },
          },
        },
      ]);

      stats.forEach((item) => {
        const pending = Math.max(
          0,
          (item.total || 0) - (item.paid || 0) - (item.overdue || 0)
        );
        statsMap[item._id.toString()] = {
          total: item.total || 0,
          paid: item.paid || 0,
          overdue: item.overdue || 0,
          pending,
        };
      });
    }

    const data = classFees.map((cf) => ({
      _id: cf._id,
      class: cf.class_id
        ? {
            _id: cf.class_id._id,
            class_name: cf.class_id.class_name,
            academic_year: cf.class_id.academic_year,
          }
        : null,
      due_date: cf.due_date,
      note: cf.note,
      status: cf.status,
      stats: statsMap[cf._id.toString()] || {
        total: 0,
        paid: 0,
        overdue: 0,
        pending: 0,
      },
    }));

    res.json({ classes: data });
  } catch (err) {
    console.error('listFeeClasses error:', err);
    res.status(500).json({ error: 'Không thể tải danh sách lớp áp dụng' });
  }
};

// GET /fees/:feeId/classes/:classId/students - list students invoices by class
exports.listFeeClassStudents = async (req, res) => {
  try {
    const { feeId, classId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(feeId) || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ error: 'Không tìm thấy khoản phí' });
    }

    await ensureClassFeeAndInvoices(fee, classId);
    const classFee = await ClassFee.findOne({ fee_id: feeId, class_id: classId }).populate('class_id', 'class_name academic_year');

    if (!classFee) {
      return res.status(404).json({ error: 'Không tìm thấy lớp áp dụng khoản phí' });
    }

    const invoices = await Invoice.find({ class_fee_id: classFee._id })
      .populate({
        path: 'student_class_id',
        select: 'student_id discount',
        populate: { path: 'student_id', select: 'full_name avatar_url' },
      })
      .populate('payment_id', 'payment_time payment_method total_amount')
      .sort({ createdAt: -1 });

    const mappedInvoices = invoices.map((invoice) => {
      const studentClass = invoice.student_class_id;
      const student = studentClass?.student_id;
      const payment = invoice.payment_id;
      const amountDue = invoice.amount_due ? Number(invoice.amount_due.toString()) : 0;
      const paidAmount = payment?.total_amount ? Number(payment.total_amount.toString()) : null;

      return {
        _id: invoice._id,
        status: invoice.status,
        due_date: invoice.due_date,
        amount_due: amountDue,
        discount: invoice.discount || studentClass?.discount || 0,
        student: student
          ? {
              _id: student._id,
              full_name: student.full_name,
              avatar_url: student.avatar_url || student.avatar || '',
              code: student.student_code || student.code || '',
            }
          : null,
        payment: payment
          ? {
              _id: payment._id,
              payment_time: payment.payment_time,
              payment_method: payment.payment_method,
              total_amount: paidAmount,
            }
          : null,
      };
    });

    res.json({
      classFee: {
        _id: classFee._id,
        due_date: classFee.due_date,
        note: classFee.note,
        status: classFee.status,
        class: classFee.class_id
          ? {
              _id: classFee.class_id._id,
              class_name: classFee.class_id.class_name,
              academic_year: classFee.class_id.academic_year,
            }
          : null,
      },
      invoices: mappedInvoices,
    });
  } catch (err) {
    console.error('listFeeClassStudents error:', err);
    res.status(500).json({ error: 'Không thể tải danh sách học sinh' });
  }
};

// PATCH /fees/:feeId/invoices - batch update invoice status/payment
exports.batchUpdateInvoices = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { invoice_ids: invoiceIds, status, payment } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(feeId)) {
      return res.status(400).json({ error: 'ID khoản phí không hợp lệ' });
    }

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({ error: 'Danh sách invoice_ids không hợp lệ' });
    }

    const validInvoiceIds = invoiceIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validInvoiceIds.length === 0) {
      return res.status(400).json({ error: 'Không có invoice hợp lệ để cập nhật' });
    }

    const invoiceDocs = await Invoice.find({ _id: { $in: validInvoiceIds } })
      .select('_id class_fee_id')
      .populate('class_fee_id', 'fee_id');
    if (!invoiceDocs.length) {
      return res.status(404).json({ error: 'Không tìm thấy hoá đơn cần cập nhật' });
    }

    let filteredIds = invoiceDocs
      .filter((doc) => {
        if (!doc.class_fee_id) {
          return true;
        }
        return String(doc.class_fee_id.fee_id) === String(feeId);
      })
      .map((doc) => doc._id);

    if (!filteredIds.length) {
      // Dữ liệu cũ có thể thiếu class_fee_id chính xác - fallback cập nhật tất cả invoice hợp lệ
      filteredIds = validInvoiceIds.map((id) => new mongoose.Types.ObjectId(id));
    }

    const filter = {
      _id: { $in: filteredIds },
    };

    const updatePayload = {};
    const unsetPayload = {};

    if (status !== undefined) {
      if (![0, 1, 2].includes(Number(status))) {
        return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
      }
      updatePayload.status = Number(status);
      if (Number(status) !== 1) {
        unsetPayload.payment_id = '';
      }
    }

    let paymentDoc = null;
    if (payment) {
      const { payment_time, payment_method, total_amount } = payment;
      if (!payment_time || payment_method === undefined || total_amount === undefined) {
        return res.status(400).json({ error: 'Thiếu thông tin thanh toán' });
      }
      if (![1, 2, 3, 4].includes(Number(payment_method))) {
        return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
      }
      paymentDoc = await Payment.create({
        payment_time,
        payment_method: Number(payment_method),
        total_amount: mongoose.Types.Decimal128.fromString(String(total_amount)),
      });
      updatePayload.payment_id = paymentDoc._id;
    }

    const updateOps = {};
    if (Object.keys(updatePayload).length) updateOps.$set = updatePayload;
    if (Object.keys(unsetPayload).length) updateOps.$unset = unsetPayload;

    if (!Object.keys(updateOps).length) {
      return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });
    }

    const updateResult = await Invoice.updateMany(filter, updateOps);

    res.json({
      modifiedCount: updateResult.modifiedCount,
      payment: paymentDoc
        ? {
            _id: paymentDoc._id,
            payment_time: paymentDoc.payment_time,
            payment_method: paymentDoc.payment_method,
            total_amount: Number(paymentDoc.total_amount.toString()),
          }
        : null,
    });
  } catch (err) {
    console.error('batchUpdateInvoices error:', err);
    res.status(500).json({ error: 'Không thể cập nhật trạng thái hóa đơn' });
  }
};


