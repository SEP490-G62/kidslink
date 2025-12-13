const mongoose = require('mongoose');
const Fee = require('../models/Fee');
const ClassFee = require('../models/ClassFee');
const StudentClass = require('../models/StudentClass');
const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Class = require('../models/Class');
const School = require('../models/School');
const User = require('../models/User');

const allowedLateFeeTypes = new Set(['none', 'fixed', 'percentage']);

const normalizeLateFeePayload = (input = {}, current = {}) => {
  const rawType = input.late_fee_type ?? current.late_fee_type ?? 'none';
  const normalizedType = allowedLateFeeTypes.has((rawType || '').toLowerCase())
    ? (rawType || '').toLowerCase()
    : 'none';

  let value = input.late_fee_value ?? current.late_fee_value ?? 0;
  value = Number(value);
  if (!Number.isFinite(value) || value < 0) {
    value = 0;
  }
  if (normalizedType === 'percentage' && value > 100) {
    value = 100;
  }

  const description = (input.late_fee_description ?? current.late_fee_description ?? '').toString().trim();

  if (normalizedType !== 'none' && value <= 0) {
    return {
      late_fee_type: 'none',
      late_fee_value: 0,
      late_fee_description: description
    };
  }

  return {
    late_fee_type: normalizedType,
    late_fee_value: value,
    late_fee_description: description
  };
};

// Parse date string YYYY-MM-DD to Date object at UTC midnight to avoid timezone issues
const parseDateString = (dateString) => {
  if (!dateString) return null;
  
  // If it's already a Date object, return it
  if (dateString instanceof Date) {
    return dateString;
  }
  
  // Parse YYYY-MM-DD format
  const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
    const day = parseInt(match[3], 10);
    // Create date at UTC midnight to avoid timezone conversion issues
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
  
  // Fallback to regular Date parsing
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
};

async function getSchoolIdForAdmin(userId) {
  const admin = await User.findById(userId).select('school_id');
  if (!admin || !admin.school_id) {
    const error = new Error('School admin chưa được gán trường học');
    error.statusCode = 400;
    throw error;
  }
  return admin.school_id;
}

async function resolveSchoolId(req, providedSchoolId) {
  if (req.user?.role === 'school_admin') {
    return getSchoolIdForAdmin(req.user.id);
  }

  if (providedSchoolId) {
    if (!mongoose.Types.ObjectId.isValid(providedSchoolId)) {
      const error = new Error('school_id không hợp lệ');
      error.statusCode = 400;
      throw error;
    }
    return providedSchoolId;
  }

  const school = await School.findOne().select('_id');
  if (!school) {
    const error = new Error('Không tìm thấy trường học trong hệ thống. Vui lòng tạo trường trước.');
    error.statusCode = 400;
    throw error;
  }
  return school._id;
}

async function validateClassesBelongToSchool(classIds = [], schoolId) {
  if (!Array.isArray(classIds) || classIds.length === 0) {
    return;
  }

  const validIds = classIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length !== classIds.length) {
    const error = new Error('Danh sách lớp chứa ID không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const classes = await Class.find({ _id: { $in: validIds } }).select('school_id');
  if (classes.length !== validIds.length) {
    const error = new Error('Một số lớp áp dụng phí không tồn tại');
    error.statusCode = 400;
    throw error;
  }

  const invalidClass = classes.find(cls => !cls.school_id || String(cls.school_id) !== String(schoolId));
  if (invalidClass) {
    const error = new Error('Không thể áp dụng phí cho lớp thuộc trường khác');
    error.statusCode = 403;
    throw error;
  }
}

// GET /fees - Lấy danh sách tất cả phí
exports.getAllFees = async (req, res) => {
  try {
    const { page = 1, limit = 50, school_id } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};

    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        filter.school_id = adminSchoolId;
      } catch (error) {
        return res.status(error.statusCode || 400).json({ 
          success: false, 
          message: error.message 
        });
      }
    } else if (school_id) {
      if (!mongoose.Types.ObjectId.isValid(school_id)) {
        return res.status(400).json({
          success: false,
          message: 'school_id không hợp lệ'
        });
      }
      filter.school_id = school_id;
    }

    const fees = await Fee.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const feeIds = fees.map(f => f._id);
    const classFees = feeIds.length > 0
      ? await ClassFee.find({ 
          fee_id: { $in: feeIds }, 
          status: 1 
        })
        .populate('class_id', 'class_name academic_year')
        .lean()
      : [];

    const classFeesByFeeId = {};
    classFees.forEach(cf => {
      if (!classFeesByFeeId[cf.fee_id.toString()]) {
        classFeesByFeeId[cf.fee_id.toString()] = [];
      }
      if (cf.class_id) {
        classFeesByFeeId[cf.fee_id.toString()].push(cf.class_id);
      }
    });

    const feesWithStringAmount = fees.map(fee => ({
      ...fee,
      school_id: fee.school_id ? fee.school_id.toString() : null,
      amount: fee.amount ? fee.amount.toString() : null,
      late_fee_type: fee.late_fee_type || 'none',
      late_fee_value: typeof fee.late_fee_value === 'number' ? fee.late_fee_value : 0,
      late_fee_description: fee.late_fee_description || '',
      classes: classFeesByFeeId[fee._id.toString()] || [],
      class_ids: (classFeesByFeeId[fee._id.toString()] || []).map(c => c._id.toString())
    }));

    const total = await Fee.countDocuments(filter);

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

    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (!fee.school_id || fee.school_id.toString() !== adminSchoolId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập phí thuộc trường khác'
          });
        }
      } catch (error) {
        return res.status(error.statusCode || 400).json({
          success: false,
          message: error.message
        });
      }
    }

    // Convert Decimal128 to string
    fee.amount = fee.amount ? fee.amount.toString() : null;
    fee.late_fee_type = fee.late_fee_type || 'none';
    fee.late_fee_value = typeof fee.late_fee_value === 'number' ? fee.late_fee_value : 0;
    fee.late_fee_description = fee.late_fee_description || '';
    fee.school_id = fee.school_id ? fee.school_id.toString() : null;

    // Get associated class_ids with due_date and populate class info
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
    const {
      fee_name,
      description,
      amount,
      class_ids = [],
      due_date,
      late_fee_type,
      late_fee_value,
      late_fee_description,
      school_id: payloadSchoolId
    } = req.body;

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

    let schoolId;
    try {
      schoolId = await resolveSchoolId(req, payloadSchoolId);
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message
      });
    }

    try {
      await validateClassesBelongToSchool(class_ids, schoolId);
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message
      });
    }

    // Create fee with Decimal128 amount
    const lateFeePayload = normalizeLateFeePayload(
      { late_fee_type, late_fee_value, late_fee_description },
      {}
    );

    const newFee = await Fee.create({
      fee_name: fee_name.trim(),
      description: description.trim(),
      amount: mongoose.Types.Decimal128.fromString(parseFloat(amount).toFixed(2)),
      school_id: schoolId,
      ...lateFeePayload
    });

    // Create ClassFee entries if class_ids provided
    if (Array.isArray(class_ids) && class_ids.length > 0) {
      // Parse due_date from request or use default (end of current month)
      let dueDate;
      if (due_date) {
        dueDate = parseDateString(due_date);
        if (!dueDate) {
          // If parsing fails, use default
          const now = new Date();
          dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
      } else {
        // Default: end of current month
        const now = new Date();
        dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      
      const classFeePromises = class_ids.map(classId => {
        if (mongoose.Types.ObjectId.isValid(classId)) {
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
      school_id: newFee.school_id ? newFee.school_id.toString() : null,
      class_ids: class_ids,
      late_fee_type: newFee.late_fee_type,
      late_fee_value: newFee.late_fee_value,
      late_fee_description: newFee.late_fee_description || ''
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

    const {
      fee_name,
      description,
      amount,
      class_ids,
      class_fees,
      late_fee_type,
      late_fee_value,
      late_fee_description
    } = req.body;
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

    let adminSchoolId = null;
    if (req.user?.role === 'school_admin') {
      try {
        adminSchoolId = await getSchoolIdForAdmin(req.user.id);
      } catch (error) {
        return res.status(error.statusCode || 400).json({
          success: false,
          message: error.message
        });
      }

      if (!existingFee.school_id || existingFee.school_id.toString() !== adminSchoolId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền chỉnh sửa phí thuộc trường khác'
        });
      }
    }

    let targetSchoolId = existingFee.school_id;
    if (req.body.school_id !== undefined) {
      if (req.user?.role === 'school_admin') {
        return res.status(403).json({
          success: false,
          message: 'School admin không được phép thay đổi school_id của phí'
        });
      }
      if (!mongoose.Types.ObjectId.isValid(req.body.school_id)) {
        return res.status(400).json({
          success: false,
          message: 'school_id không hợp lệ'
        });
      }
      targetSchoolId = req.body.school_id;
      updateData.school_id = targetSchoolId;
    }

    if (!targetSchoolId) {
      if (adminSchoolId) {
        targetSchoolId = adminSchoolId;
        updateData.school_id = adminSchoolId;
      } else {
        try {
          targetSchoolId = await resolveSchoolId(req, req.body.school_id);
          if (!existingFee.school_id) {
            updateData.school_id = targetSchoolId;
          }
        } catch (error) {
          return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
          });
        }
      }
    }

    if (!targetSchoolId) {
      return res.status(400).json({
        success: false,
        message: 'Không xác định được trường áp dụng phí'
      });
    }

    // Late fee update
    const lateFeeFieldsProvided = (
      late_fee_type !== undefined ||
      late_fee_value !== undefined ||
      late_fee_description !== undefined
    );

    if (lateFeeFieldsProvided) {
      const lateFeePayload = normalizeLateFeePayload(
        {
          late_fee_type: late_fee_type !== undefined ? late_fee_type : existingFee.late_fee_type,
          late_fee_value: late_fee_value !== undefined ? late_fee_value : existingFee.late_fee_value,
          late_fee_description: late_fee_description !== undefined ? late_fee_description : existingFee.late_fee_description
        },
        existingFee
      );
      Object.assign(updateData, lateFeePayload);
    }

    // Update fee
    const updatedFee = await Fee.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).lean();

    // Convert Decimal128 to string
    updatedFee.amount = updatedFee.amount ? updatedFee.amount.toString() : null;
    updatedFee.late_fee_type = updatedFee.late_fee_type || 'none';
    updatedFee.late_fee_value = typeof updatedFee.late_fee_value === 'number' ? updatedFee.late_fee_value : 0;
    updatedFee.late_fee_description = updatedFee.late_fee_description || '';
    updatedFee.school_id = updatedFee.school_id ? updatedFee.school_id.toString() : null;

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

      try {
        await validateClassesBelongToSchool(newClassIds, targetSchoolId);
      } catch (error) {
        return res.status(error.statusCode || 400).json({
          success: false,
          message: error.message
        });
      }

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
            dueDate = parseDateString(item.due_date);
            if (!dueDate) {
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
            dueDate = parseDateString(item.due_date);
            if (!dueDate) {
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

    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (!existingFee.school_id || existingFee.school_id.toString() !== adminSchoolId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xóa phí thuộc trường khác'
          });
        }
      } catch (error) {
        return res.status(error.statusCode || 400).json({
          success: false,
          message: error.message
        });
      }
    }

    // Check if fee is being used in ClassFee (only active ones)
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

    const feeDoc = await Fee.findById(id).select('school_id');
    if (!feeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phí'
      });
    }

    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (!feeDoc.school_id || feeDoc.school_id.toString() !== adminSchoolId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập phí thuộc trường khác'
          });
        }
      } catch (error) {
        return res.status(error.statusCode || 400).json({
          success: false,
          message: error.message
        });
      }
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

      // Calculate late fee info
      const lateFeeAmount = invoice?.late_fee_amount 
        ? parseFloat(invoice.late_fee_amount.toString())
        : 0;
      const baseAmountAfterDiscount = calculatedAmount;
      const isLateFeeApplied = lateFeeAmount > 0;

      const amountDueStr = Number.isFinite(amountDueNumber) ? amountDueNumber.toFixed(0) : '0';
      totalAmount += Number.isFinite(amountDueNumber) ? amountDueNumber : 0;

      let status = 'pending';
      let statusText = 'Chưa thanh toán';
      // All students in the same class should have the same due_date from ClassFee
      let dueDate = classFee.due_date;

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
        late_fee_info: {
          is_applied: isLateFeeApplied,
          amount: lateFeeAmount.toFixed(2),
          base_amount: baseAmountAfterDiscount.toFixed(2),
        },
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

// POST /fees/:id/classes/:classFeeId/payments/:invoiceId/offline - Thanh toán offline cho học sinh
exports.markInvoicePaidOffline = async (req, res) => {
  try {
    const { id, classFeeId, invoiceId } = req.params;
    const { amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || 
        !mongoose.Types.ObjectId.isValid(classFeeId) || 
        !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ',
      });
    }

    const feeDoc = await Fee.findById(id).select('school_id');
    if (!feeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phí'
      });
    }

    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (!feeDoc.school_id || feeDoc.school_id.toString() !== adminSchoolId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền thao tác trên phí thuộc trường khác'
          });
        }
      } catch (error) {
        return res.status(error.statusCode || 400).json({
          success: false,
          message: error.message
        });
      }
    }

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền phải là số hợp lệ và > 0',
      });
    }

    // Find invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      class_fee_id: classFeeId,
    }).lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hóa đơn',
      });
    }

    // Check if already paid
    if (invoice.status === 1) {
      return res.status(400).json({
        success: false,
        message: 'Hóa đơn đã được thanh toán',
      });
    }

    // Verify class_fee_id matches
    const classFee = await ClassFee.findOne({
      _id: classFeeId,
      fee_id: id,
      status: 1,
    }).lean();

    if (!classFee) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin lớp áp dụng phí',
      });
    }

    // Create payment
    const amountNumber = parseFloat(amount);
    const payment = await Payment.create({
      payment_time: new Date().toISOString(),
      payment_method: 0, // 0: offline (thanh toán trực tiếp)
      total_amount: mongoose.Types.Decimal128.fromString(amountNumber.toFixed(2))
    });

    // Update invoice
    await Invoice.findByIdAndUpdate(invoiceId, {
      status: 1, // paid
      payment_id: payment._id,
      updatedAt: new Date()
    });

    return res.json({
      success: true,
      message: 'Thanh toán thành công',
      data: {
        invoice_id: invoiceId,
        payment_id: payment._id.toString(),
        amount: amountNumber.toFixed(2),
        payment_method: 0,
      },
    });
  } catch (err) {
    console.error('markInvoicePaidOffline error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: err.message,
    });
  }
};

// Helper functions for late fee calculation
const parseDecimal128ToNumber = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (value && typeof value.toString === 'function') {
    const parsed = Number(value.toString());
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const buildLateFeePolicy = (feeDoc = {}) => ({
  type: feeDoc.late_fee_type || 'none',
  value: Number(feeDoc.late_fee_value || 0),
  description: feeDoc.late_fee_description || ''
});

const shouldApplyLateFee = (policy = {}) =>
  policy &&
  policy.type &&
  policy.type !== 'none' &&
  Number(policy.value) > 0;

const roundCurrency = (value = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num);
};

const calculateLateFeeAmount = (policy = {}, baseAmount = 0) => {
  if (!shouldApplyLateFee(policy)) return 0;
  const value = Number(policy.value || 0);
  if (policy.type === 'fixed') {
    return roundCurrency(value);
  }
  if (policy.type === 'percentage') {
    return roundCurrency(Math.max(0, baseAmount * (value / 100)));
  }
  return 0;
};

const isInvoiceOverdue = (invoice = null, dueDate) => {
  if (invoice && invoice.status === 2) {
    return true;
  }
  const targetDate = invoice?.due_date || dueDate;
  if (!targetDate) return false;
  const due = new Date(targetDate);
  if (Number.isNaN(due.getTime())) return false;
  return new Date() > due;
};

// POST /fees/:id/classes/:classFeeId/students/:studentClassId/invoice - Tạo hoặc lấy invoice và tính phụ phí tự động
exports.createOrGetInvoice = async (req, res) => {
  try {
    const { id, classFeeId, studentClassId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || 
        !mongoose.Types.ObjectId.isValid(classFeeId) || 
        !mongoose.Types.ObjectId.isValid(studentClassId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ',
      });
    }

    const feeDoc = await Fee.findById(id).select('school_id');
    if (!feeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phí'
      });
    }

    if (req.user?.role === 'school_admin') {
      try {
        const adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        if (!feeDoc.school_id || feeDoc.school_id.toString() !== adminSchoolId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền thao tác trên phí thuộc trường khác'
          });
        }
      } catch (error) {
        return res.status(error.statusCode || 400).json({
          success: false,
          message: error.message
        });
      }
    }

    // Find classFee
    const classFee = await ClassFee.findOne({
      _id: classFeeId,
      fee_id: id,
      status: 1,
    })
      .populate('fee_id')
      .lean();

    if (!classFee) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin lớp áp dụng phí',
      });
    }

    // Find studentClass
    const studentClass = await StudentClass.findOne({
      _id: studentClassId,
      class_id: classFee.class_id,
    })
      .populate('student_id', 'full_name')
      .lean();

    if (!studentClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin học sinh trong lớp',
      });
    }

    // Find or create invoice
    let invoice = await Invoice.findOne({
      student_class_id: studentClassId,
      class_fee_id: classFeeId,
    });

    const feeAmount = parseDecimal128ToNumber(classFee.fee_id?.amount || 0);
    const discountPercent = Number(studentClass.discount || 0);
    const amountAfterDiscount = feeAmount - (feeAmount * (discountPercent / 100));
    const baseAmount = Math.max(0, Math.round(amountAfterDiscount));

    let lateFeeAmount = 0;
    let isLateFeeApplied = false;

    if (!invoice) {
      // Create new invoice
      const lateFeePolicy = buildLateFeePolicy(classFee.fee_id);
      const isOverdue = isInvoiceOverdue(null, classFee.due_date);
      
      if (isOverdue && shouldApplyLateFee(lateFeePolicy)) {
        lateFeeAmount = calculateLateFeeAmount(lateFeePolicy, baseAmount);
        isLateFeeApplied = lateFeeAmount > 0;
      }

      const finalAmount = baseAmount + lateFeeAmount;

      invoice = await Invoice.create({
        student_class_id: studentClassId,
        class_fee_id: classFeeId,
        amount_due: mongoose.Types.Decimal128.fromString(finalAmount.toFixed(2)),
        due_date: classFee.due_date,
        discount: discountPercent,
        status: isOverdue ? 2 : 0, // 2: overdue, 0: pending
        late_fee_amount: isLateFeeApplied ? mongoose.Types.Decimal128.fromString(lateFeeAmount.toFixed(2)) : null,
        late_fee_applied_at: isLateFeeApplied ? new Date() : null,
      });
    } else {
      // Update existing invoice if overdue and late fee not yet applied
      if (invoice.status !== 1) { // Not paid
        const lateFeePolicy = buildLateFeePolicy(classFee.fee_id);
        const isOverdue = isInvoiceOverdue(invoice, classFee.due_date);
        const existingLateFee = parseDecimal128ToNumber(invoice.late_fee_amount || 0);

        if (isOverdue && shouldApplyLateFee(lateFeePolicy) && existingLateFee === 0) {
          lateFeeAmount = calculateLateFeeAmount(lateFeePolicy, baseAmount);
          isLateFeeApplied = lateFeeAmount > 0;

          if (isLateFeeApplied) {
            const finalAmount = baseAmount + lateFeeAmount;
            invoice.amount_due = mongoose.Types.Decimal128.fromString(finalAmount.toFixed(2));
            invoice.late_fee_amount = mongoose.Types.Decimal128.fromString(lateFeeAmount.toFixed(2));
            invoice.late_fee_applied_at = new Date();
            invoice.status = 2; // overdue
            await invoice.save();
          }
        } else if (existingLateFee > 0) {
          lateFeeAmount = existingLateFee;
          isLateFeeApplied = true;
        }
      }
    }

    const invoiceAmount = parseDecimal128ToNumber(invoice.amount_due || 0);

    return res.json({
      success: true,
      message: 'Invoice đã được tạo/cập nhật',
      data: {
        invoice_id: invoice._id.toString(),
        student_class_id: studentClassId,
        class_fee_id: classFeeId,
        base_amount: baseAmount.toFixed(2),
        late_fee_amount: lateFeeAmount.toFixed(2),
        total_amount: invoiceAmount.toFixed(2),
        is_late_fee_applied: isLateFeeApplied,
        due_date: invoice.due_date,
        status: invoice.status,
        discount: discountPercent,
      },
    });
  } catch (err) {
    console.error('createOrGetInvoice error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: err.message,
    });
  }
};
