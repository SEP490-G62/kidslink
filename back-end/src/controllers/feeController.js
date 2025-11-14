const mongoose = require('mongoose');
const Fee = require('../models/Fee');
const ClassFee = require('../models/ClassFee');
const StudentClass = require('../models/StudentClass');
const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

// GET /fees - Lấy danh sách tất cả phí
exports.getAllFees = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const fees = await Fee.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get ClassFee entries for all fees and populate class info
    const Class = require('../models/Class');
    const feeIds = fees.map(f => f._id);
    const classFees = await ClassFee.find({ 
      fee_id: { $in: feeIds }, 
      status: 1 
    })
      .populate('class_id', 'class_name academic_year')
      .lean();

    // Group classFees by fee_id
    const classFeesByFeeId = {};
    classFees.forEach(cf => {
      if (!classFeesByFeeId[cf.fee_id.toString()]) {
        classFeesByFeeId[cf.fee_id.toString()] = [];
      }
      if (cf.class_id) {
        classFeesByFeeId[cf.fee_id.toString()].push(cf.class_id);
      }
    });

    // Convert Decimal128 to string and add classes info
    const feesWithStringAmount = fees.map(fee => ({
      ...fee,
      amount: fee.amount ? fee.amount.toString() : null,
      classes: classFeesByFeeId[fee._id.toString()] || [],
      class_ids: (classFeesByFeeId[fee._id.toString()] || []).map(c => c._id.toString())
    }));

    const total = await Fee.countDocuments();

    return res.json({
      success: true,
      data: feesWithStringAmount,
      pagination: {
        currentPage: Number(page),
        totalItems: total,
        itemsPerPage: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    console.error('getAllFees error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ', 
      error: err.message 
    });
  }
};

// GET /fees/:id - Lấy thông tin một phí theo ID
exports.getFeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID không hợp lệ' 
      });
    }

    const fee = await Fee.findById(id).lean();

    if (!fee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy phí' 
      });
    }

    // Convert Decimal128 to string
    fee.amount = fee.amount ? fee.amount.toString() : null;

    // Get associated class_ids with due_date and populate class info
    const Class = require('../models/Class');
    const classFees = await ClassFee.find({ fee_id: id, status: 1 })
      .populate('class_id', 'class_name academic_year')
      .lean();
    
    fee.class_ids = classFees.map(cf => cf.class_id ? cf.class_id._id.toString() : null).filter(Boolean);
    fee.classes = classFees.map(cf => ({
      _id: cf.class_id ? cf.class_id._id.toString() : null,
      class_name: cf.class_id ? cf.class_id.class_name : '',
      academic_year: cf.class_id ? cf.class_id.academic_year : '',
      due_date: cf.due_date,
      class_fee_id: cf._id.toString()
    })).filter(c => c._id);

    return res.json({ 
      success: true, 
      data: fee 
    });
  } catch (err) {
    console.error('getFeeById error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ', 
      error: err.message 
    });
  }
};

// POST /fees - Tạo phí mới
exports.createFee = async (req, res) => {
  try {
    const { fee_name, description, amount, class_ids = [] } = req.body;

    // Validate required fields
    if (!fee_name || !fee_name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tên phí là bắt buộc' 
      });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mô tả là bắt buộc' 
      });
    }
    if (!amount || isNaN(amount) || parseFloat(amount) < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Số tiền phải là số hợp lệ và >= 0' 
      });
    }

    // Create fee with Decimal128 amount
    const newFee = await Fee.create({
      fee_name: fee_name.trim(),
      description: description.trim(),
      amount: mongoose.Types.Decimal128.fromString(parseFloat(amount).toFixed(2))
    });

    // Create ClassFee entries if class_ids provided
    if (Array.isArray(class_ids) && class_ids.length > 0) {
      const classFeePromises = class_ids.map(classId => {
        if (mongoose.Types.ObjectId.isValid(classId)) {
          // Set due_date to end of current month, note to empty string
          const now = new Date();
          const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          return ClassFee.create({
            class_id: classId,
            fee_id: newFee._id,
            due_date: dueDate,
            note: '',
            status: 1
          });
        }
        return null;
      }).filter(Boolean);

      await Promise.all(classFeePromises);
    }

    // Convert Decimal128 to string for response
    const feeResponse = {
      ...newFee.toObject(),
      amount: newFee.amount.toString(),
      class_ids: class_ids
    };

    return res.status(201).json({ 
      success: true, 
      message: 'Tạo phí thành công', 
      data: feeResponse 
    });
  } catch (err) {
    console.error('createFee error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi tạo phí: ' + err.message, 
      error: err.message 
    });
  }
};

// PUT /fees/:id - Cập nhật phí
exports.updateFee = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID không hợp lệ' 
      });
    }

    const { fee_name, description, amount, class_ids, class_fees } = req.body;
    const updateData = {};

    // Validate and add fields to update
    if (fee_name !== undefined) {
      if (!fee_name || !fee_name.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tên phí không được để trống' 
        });
      }
      updateData.fee_name = fee_name.trim();
    }

    if (description !== undefined) {
      if (!description || !description.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mô tả không được để trống' 
        });
      }
      updateData.description = description.trim();
    }

    if (amount !== undefined) {
      if (isNaN(amount) || parseFloat(amount) < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Số tiền phải là số hợp lệ và >= 0' 
        });
      }
      updateData.amount = mongoose.Types.Decimal128.fromString(parseFloat(amount).toFixed(2));
    }

    // Check if fee exists
    const existingFee = await Fee.findById(id);
    if (!existingFee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy phí' 
      });
    }

    // Update fee
    const updatedFee = await Fee.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).lean();

    // Convert Decimal128 to string
    updatedFee.amount = updatedFee.amount ? updatedFee.amount.toString() : null;

    // Update ClassFee entries if class_fees or class_ids provided
    if (class_fees !== undefined || class_ids !== undefined) {
      // Get current class_fees
      const currentClassFees = await ClassFee.find({ fee_id: id, status: 1 }).lean();
      const currentClassFeeMap = {};
      currentClassFees.forEach(cf => {
        currentClassFeeMap[cf.class_id.toString()] = {
          class_fee_id: cf._id.toString(),
          due_date: cf.due_date
        };
      });

      // Process class_fees array (preferred) or fallback to class_ids
      let newClassFeeData = [];
      if (Array.isArray(class_fees) && class_fees.length > 0) {
        newClassFeeData = class_fees;
      } else if (Array.isArray(class_ids) && class_ids.length > 0) {
        // Fallback: convert class_ids to class_fees format
        const now = new Date();
        const defaultDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        newClassFeeData = class_ids.map(classId => ({
          class_id: classId,
          due_date: currentClassFeeMap[classId.toString()]?.due_date || defaultDueDate
        }));
      }

      const newClassIds = newClassFeeData.map(item => {
        const classId = item.class_id || item;
        return classId.toString();
      });

      // Find classes to add
      const toAdd = newClassFeeData.filter(item => {
        const classId = (item.class_id || item).toString();
        return !currentClassFeeMap[classId];
      });

      // Find classes to update (due_date changed)
      const toUpdate = newClassFeeData.filter(item => {
        const classId = (item.class_id || item).toString();
        const current = currentClassFeeMap[classId];
        if (!current) return false;
        const newDueDate = item.due_date ? new Date(item.due_date).getTime() : null;
        const currentDueDate = current.due_date ? new Date(current.due_date).getTime() : null;
        return newDueDate !== currentDueDate;
      });

      // Find classes to remove (set status to 0)
      const currentClassIds = Object.keys(currentClassFeeMap);
      const toRemove = currentClassIds.filter(id => !newClassIds.includes(id));

      // Add new ClassFee entries
      if (toAdd.length > 0) {
        const classFeePromises = toAdd.map(item => {
          const classId = item.class_id || item;
          if (!mongoose.Types.ObjectId.isValid(classId)) {
            return null;
          }
          
          let dueDate;
          if (item.due_date) {
            dueDate = new Date(item.due_date);
            if (isNaN(dueDate.getTime())) {
              const now = new Date();
              dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            }
          } else {
            const now = new Date();
            dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          }
          
          return ClassFee.create({
            class_id: classId,
            fee_id: id,
            due_date: dueDate,
            note: '',
            status: 1
          });
        }).filter(Boolean);

        await Promise.all(classFeePromises);
      }

      // Update ClassFee entries (due_date changed)
      if (toUpdate.length > 0) {
        const updatePromises = toUpdate.map(item => {
          const classId = (item.class_id || item).toString();
          const current = currentClassFeeMap[classId];
          if (!current) return null;
          
          let dueDate;
          if (item.due_date) {
            dueDate = new Date(item.due_date);
            if (isNaN(dueDate.getTime())) {
              return null;
            }
          } else {
            return null;
          }
          
          return ClassFee.findByIdAndUpdate(
            current.class_fee_id,
            { due_date: dueDate },
            { new: true }
          );
        }).filter(Boolean);

        await Promise.all(updatePromises);
      }

      // Remove ClassFee entries (set status to 0)
      if (toRemove.length > 0) {
        await ClassFee.updateMany(
          { fee_id: id, class_id: { $in: toRemove.map(id => new mongoose.Types.ObjectId(id)) } },
          { status: 0 }
        );
      }
    }

    // Get updated class_ids with due_date
    const Class = require('../models/Class');
    const classFees = await ClassFee.find({ fee_id: id, status: 1 })
      .populate('class_id', 'class_name academic_year')
      .lean();
    updatedFee.class_ids = classFees.map(cf => cf.class_id ? cf.class_id._id.toString() : null).filter(Boolean);
    updatedFee.classes = classFees.map(cf => ({
      _id: cf.class_id ? cf.class_id._id.toString() : null,
      class_name: cf.class_id ? cf.class_id.class_name : '',
      academic_year: cf.class_id ? cf.class_id.academic_year : '',
      due_date: cf.due_date,
      class_fee_id: cf._id.toString()
    })).filter(c => c._id);

    return res.json({ 
      success: true, 
      message: 'Cập nhật phí thành công', 
      data: updatedFee 
    });
  } catch (err) {
    console.error('updateFee error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi cập nhật phí: ' + err.message, 
      error: err.message 
    });
  }
};

// DELETE /fees/:id - Xóa phí
exports.deleteFee = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID không hợp lệ' 
      });
    }

    // Check if fee exists
    const existingFee = await Fee.findById(id);
    if (!existingFee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy phí' 
      });
    }

    // Check if fee is being used in ClassFee (only active ones)
    const ClassFee = require('../models/ClassFee');
    const activeClassFeeCount = await ClassFee.countDocuments({ fee_id: id, status: 1 });
    
    if (activeClassFeeCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Không thể xóa phí này vì đang được sử dụng trong ${activeClassFeeCount} lớp học. Vui lòng gỡ phí khỏi các lớp học trước khi xóa.` 
      });
    }

    // Set status to 0 for all ClassFee entries (soft delete)
    await ClassFee.updateMany(
      { fee_id: id },
      { status: 0 }
    );

    // Delete fee
    await Fee.findByIdAndDelete(id);

    return res.json({ 
      success: true, 
      message: 'Xóa phí thành công' 
    });
  } catch (err) {
    console.error('deleteFee error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi xóa phí: ' + err.message, 
      error: err.message 
    });
  }
};

// GET /fees/:id/classes/:classFeeId/payments - Lấy thông tin thanh toán học sinh của lớp
exports.getClassFeePayments = async (req, res) => {
  try {
    const { id, classFeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(classFeeId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ',
      });
    }

    const classFee = await ClassFee.findOne({
      _id: classFeeId,
      fee_id: id,
      status: 1,
    })
      .populate('class_id', 'class_name academic_year')
      .populate('fee_id', 'fee_name description amount')
      .lean();

    if (!classFee) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin lớp áp dụng phí',
      });
    }

    const studentClasses = await StudentClass.find({ class_id: classFee.class_id?._id })
      .populate('student_id', 'full_name avatar_url gender dob status')
      .lean();

    if (studentClasses.length === 0) {
      return res.json({
        success: true,
        data: {
          fee: {
            _id: classFee.fee_id?._id?.toString() || null,
            fee_name: classFee.fee_id?.fee_name || '',
            description: classFee.fee_id?.description || '',
            amount: classFee.fee_id?.amount ? classFee.fee_id.amount.toString() : '0',
          },
          class: {
            _id: classFee.class_id?._id?.toString() || null,
            class_name: classFee.class_id?.class_name || '',
            academic_year: classFee.class_id?.academic_year || '',
          },
          summary: {
            totalStudents: 0,
            paid: 0,
            pending: 0,
            overdue: 0,
            totalAmount: '0',
            totalPaidAmount: '0',
            totalPendingAmount: '0',
          },
          students: [],
        },
      });
    }

    const studentClassIds = studentClasses.map((sc) => sc._id);
    const invoices = await Invoice.find({
      class_fee_id: classFeeId,
      student_class_id: { $in: studentClassIds },
    })
      .populate('payment_id', 'payment_method payment_time total_amount')
      .lean();

    const invoiceMap = {};
    invoices.forEach((invoice) => {
      invoiceMap[invoice.student_class_id.toString()] = invoice;
    });

    const baseAmountNumber = classFee.fee_id?.amount
      ? parseFloat(classFee.fee_id.amount.toString())
      : 0;

    let paidCount = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    let totalAmount = 0;
    let totalPaidAmount = 0;

    const students = studentClasses.map((sc) => {
      const invoice = invoiceMap[sc._id.toString()] || null;
      const discount = sc.discount || 0;

      const invoiceAmountNumber = invoice?.amount_due
        ? parseFloat(invoice.amount_due.toString())
        : null;
      const calculatedAmount = baseAmountNumber * (1 - discount / 100);
      const amountDueNumber = invoiceAmountNumber !== null ? invoiceAmountNumber : calculatedAmount;

      const amountDueStr = Number.isFinite(amountDueNumber) ? amountDueNumber.toFixed(0) : '0';
      totalAmount += Number.isFinite(amountDueNumber) ? amountDueNumber : 0;

      let status = 'pending';
      let statusText = 'Chưa thanh toán';
      let dueDate = invoice?.due_date || classFee.due_date;

      if (invoice) {
        if (invoice.status === 1) {
          status = 'paid';
          statusText = 'Đã thanh toán';
          paidCount += 1;
          totalPaidAmount += Number.isFinite(amountDueNumber) ? amountDueNumber : 0;
        } else {
          const now = new Date();
          const invoiceDueDate = invoice.due_date ? new Date(invoice.due_date) : null;
          if (invoice.status === 2 || (invoiceDueDate && now > invoiceDueDate)) {
            status = 'overdue';
            statusText = 'Quá hạn';
            overdueCount += 1;
          } else {
            pendingCount += 1;
          }
        }
      } else {
        const now = new Date();
        const classDueDate = classFee.due_date ? new Date(classFee.due_date) : null;
        if (classDueDate && now > classDueDate) {
          status = 'overdue';
          statusText = 'Quá hạn';
          overdueCount += 1;
        } else {
          pendingCount += 1;
        }
      }

      return {
        student_class_id: sc._id.toString(),
        discount,
        student: sc.student_id
          ? {
              _id: sc.student_id._id.toString(),
              full_name: sc.student_id.full_name,
              avatar_url: sc.student_id.avatar_url,
              gender: sc.student_id.gender,
              status: sc.student_id.status,
            }
          : null,
        invoice: invoice
          ? {
              _id: invoice._id.toString(),
              amount_due: invoice.amount_due ? invoice.amount_due.toString() : amountDueStr,
              due_date: invoice.due_date,
              status: invoice.status,
              discount: invoice.discount || 0,
              payment: invoice.payment_id
                ? {
                    _id: invoice.payment_id._id.toString(),
                    payment_method: invoice.payment_id.payment_method,
                    payment_time: invoice.payment_id.payment_time,
                    total_amount: invoice.payment_id.total_amount
                      ? invoice.payment_id.total_amount.toString()
                      : null,
                  }
                : null,
            }
          : null,
        amount_due: amountDueStr,
        due_date: dueDate,
        status,
        status_text: statusText,
      };
    });

    const pendingAmount = Math.max(totalAmount - totalPaidAmount, 0);

    return res.json({
      success: true,
      data: {
        fee: {
          _id: classFee.fee_id?._id?.toString() || null,
          fee_name: classFee.fee_id?.fee_name || '',
          description: classFee.fee_id?.description || '',
          amount: classFee.fee_id?.amount ? classFee.fee_id.amount.toString() : '0',
        },
        class: {
          _id: classFee.class_id?._id?.toString() || null,
          class_name: classFee.class_id?.class_name || '',
          academic_year: classFee.class_id?.academic_year || '',
        },
        summary: {
          totalStudents: studentClasses.length,
          paid: paidCount,
          pending: pendingCount,
          overdue: overdueCount,
          totalAmount: Number.isFinite(totalAmount) ? totalAmount.toFixed(0) : '0',
          totalPaidAmount: Number.isFinite(totalPaidAmount) ? totalPaidAmount.toFixed(0) : '0',
          totalPendingAmount: Number.isFinite(pendingAmount) ? pendingAmount.toFixed(0) : '0',
        },
        students,
      },
    });
  } catch (err) {
    console.error('getClassFeePayments error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: err.message,
    });
  }
};
