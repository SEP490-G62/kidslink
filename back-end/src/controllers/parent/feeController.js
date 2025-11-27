const mongoose = require('mongoose');
const crypto = require('crypto');
const axios = require('axios');

const Parent = require('../../models/Parent');
const ParentStudent = require('../../models/ParentStudent');
const Student = require('../../models/Student');
const StudentClass = require('../../models/StudentClass');
const Class = require('../../models/Class');
const ClassFee = require('../../models/ClassFee');
const Fee = require('../../models/Fee');
const Invoice = require('../../models/Invoice');
const School = require('../../models/School');
const User = require('../../models/User');
const { markInvoicesPaid } = require('../payosController');

const PAYOS_BASE_URL = process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn';
const PAYOS_API_VERSION = process.env.PAYOS_API_VERSION || 'v2';
const getFrontendBaseUrl = () => {
  const raw = process.env.PARENT_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};
const buildPayOSUrl = (path) => {
  const trimmedBase = PAYOS_BASE_URL.endsWith('/')
    ? PAYOS_BASE_URL.slice(0, -1)
    : PAYOS_BASE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}/${PAYOS_API_VERSION}${normalizedPath}`;
};

const buildSignature = (payload, checksumKey) => {
  const signingString = Object.keys(payload)
    .filter((key) => payload[key] !== undefined && payload[key] !== null)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join('&');

  return crypto.createHmac('sha256', checksumKey).update(signingString).digest('hex');
};

const generateOrderCode = () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.floor(Math.random() * 900) + 100;
  return Number(`${timestamp}${random}`.slice(-13));
};

const buildPayOSDescription = (studentName, feeName) => {
  const base = `HP ${studentName || 'HS'} - ${feeName || 'Fee'}`.trim();
  return base.length > 25 ? base.slice(0, 25) : base;
};

const buildPayOSBulkDescription = (fees) => {
  if (!fees || fees.length === 0) {
    return buildPayOSDescription();
  }
  if (fees.length === 1) {
    return buildPayOSDescription(
      fees[0].student?.full_name,
      fees[0].classFee?.fee_id?.fee_name
    );
  }
  const firstStudentName = fees[0].student?.full_name || 'HS';
  const base = `HP ${firstStudentName} +${fees.length - 1} phí`;
  return base.length > 25 ? base.slice(0, 25) : base;
};

const normalizeFeeItems = (body = {}) => {
  const { fee_items, student_id, class_fee_id, student_class_id, invoice_id } = body;
  if (Array.isArray(fee_items) && fee_items.length > 0) {
    return fee_items;
  }
  if (student_id && class_fee_id && student_class_id) {
    return [{
      student_id,
      class_fee_id,
      student_class_id,
      invoice_id: invoice_id || null
    }];
  }
  return [];
};

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

/**
 * GET /api/parent/fees - Lấy danh sách các khoản thu của lớp có academic year lớn nhất cho mỗi student
 */
const getStudentFees = async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy thông tin phụ huynh từ user_id
    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }

    // Lấy danh sách học sinh của phụ huynh
    const parentStudents = await ParentStudent.find({ parent_id: parent._id })
      .populate('student_id');

    if (parentStudents.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Phụ huynh chưa có con học tại trường'
      });
    }

    // Lấy thông tin fees cho từng học sinh
    const studentsWithFees = await Promise.all(
      parentStudents.map(async (ps) => {
        const student = ps.student_id;

        // Lấy tất cả lớp học của học sinh
        const studentClasses = await StudentClass.find({ student_id: student._id })
          .populate({
            path: 'class_id',
            select: 'class_name class_age_id academic_year'
          });

        if (studentClasses.length === 0) {
          return {
            student: {
              _id: student._id,
              full_name: student.full_name,
              avatar_url: student.avatar_url
            },
            class: null,
            fees: [],
            message: 'Học sinh chưa được phân lớp'
          };
        }

        // Sắp xếp theo năm học giảm dần và lấy lớp lớn nhất
        const sortedClasses = studentClasses.sort((a, b) => {
          const yearA = a.class_id?.academic_year || '';
          const yearB = b.class_id?.academic_year || '';
          return yearB.localeCompare(yearA); // Sắp xếp năm học giảm dần
        });

        const latestStudentClass = sortedClasses[0];
        const latestClass = latestStudentClass?.class_id;

        if (!latestClass) {
          return {
            student: {
              _id: student._id,
              full_name: student.full_name,
              avatar_url: student.avatar_url
            },
            class: null,
            fees: [],
            message: 'Không tìm thấy lớp học'
          };
        }

        // Lấy các ClassFee của lớp này (chỉ active)
        const classFees = await ClassFee.find({
          class_id: latestClass._id,
          status: 1
        })
          .populate({
            path: 'fee_id',
            select: 'fee_name description amount late_fee_type late_fee_value late_fee_description'
          })
          .lean();

        // Lấy thông tin Invoice cho từng ClassFee (nếu có)
        const feesWithInvoices = await Promise.all(
          classFees.map(async (classFee) => {
            if (!classFee.fee_id) {
              return null;
            }

            // Tìm Invoice cho student_class_id và class_fee_id này
            const invoice = await Invoice.findOne({
              student_class_id: latestStudentClass._id,
              class_fee_id: classFee._id
            }).lean();

            const baseAmountNumber = roundCurrency(parseDecimal128ToNumber(classFee.fee_id.amount));
            const baseAmountStr = baseAmountNumber.toString();
            let invoiceAmount = '0';
            let invoiceStatus = null;
            let invoiceDueDate = null;
            let paymentId = null;

            if (invoice) {
              invoiceAmount = invoice.amount_due
                ? invoice.amount_due.toString()
                : '0';
              invoiceStatus = invoice.status; // 0: pending, 1: paid, 2: overdue
              invoiceDueDate = invoice.due_date;
              paymentId = invoice.payment_id;
              if (invoice.amount_due) {
                invoiceAmount = invoice.amount_due.toString();
              }
            }

            // Tính toán trạng thái
            let status = 'pending'; // pending, paid, overdue
            let statusText = 'Chưa thanh toán';
            let effectiveDueDate = invoice?.due_date || classFee.due_date;

            if (invoice) {
              if (invoice.status === 1) {
                status = 'paid';
                statusText = 'Đã thanh toán';
              } else if (invoice.status === 2) {
                status = 'overdue';
                statusText = 'Quá hạn';
              } else {
                // Kiểm tra xem có quá hạn không
                const now = new Date();
                const dueDate = new Date(invoice.due_date);
                if (now > dueDate) {
                  status = 'overdue';
                  statusText = 'Quá hạn';
                  effectiveDueDate = dueDate;
                } else {
                  status = 'pending';
                  statusText = 'Chưa thanh toán';
                }
              }
            } else {
              // Chưa có invoice, kiểm tra due_date của ClassFee
              const now = new Date();
              const classFeeDueDate = new Date(classFee.due_date);
              if (now > classFeeDueDate) {
                status = 'overdue';
                statusText = 'Quá hạn';
                effectiveDueDate = classFeeDueDate;
              }
            }

            const lateFeePolicy = buildLateFeePolicy(classFee.fee_id);
            const isOverdueFee = status === 'overdue';
            const invoiceLateFeeAmount = invoice?.late_fee_amount
              ? parseDecimal128ToNumber(invoice.late_fee_amount)
              : 0;
            let appliedLateFee = 0;
            if (isOverdueFee && shouldApplyLateFee(lateFeePolicy)) {
              appliedLateFee = invoiceLateFeeAmount > 0
                ? roundCurrency(invoiceLateFeeAmount)
                : calculateLateFeeAmount(lateFeePolicy, baseAmountNumber);
            }
            const totalAmountWithLateFee = baseAmountNumber + appliedLateFee;
            const totalAmountWithLateFeeStr = totalAmountWithLateFee.toString();
            const appliedLateFeeStr = appliedLateFee.toString();

            return {
              _id: classFee.fee_id._id.toString(),
              fee_name: classFee.fee_id.fee_name,
              description: classFee.fee_id.description,
              amount: baseAmountStr,
              amount_with_late_fee: totalAmountWithLateFeeStr,
              base_amount: baseAmountStr,
              late_fee: {
                type: lateFeePolicy.type,
                value: lateFeePolicy.value,
                description: lateFeePolicy.description,
                applied_amount: appliedLateFeeStr,
                is_applicable: shouldApplyLateFee(lateFeePolicy),
                is_applied: appliedLateFee > 0
              },
              due_date: classFee.due_date,
              class_fee_id: classFee._id.toString(),
              student_class_id: latestStudentClass._id.toString(),
              invoice: invoice
                ? {
                    _id: invoice._id.toString(),
                    amount_due: invoiceAmount,
                    due_date: invoiceDueDate,
                    status: invoiceStatus,
                    payment_id: paymentId,
                    discount: invoice.discount || 0,
                    late_fee_amount: invoice.late_fee_amount
                      ? invoice.late_fee_amount.toString()
                      : appliedLateFeeStr,
                    late_fee_applied_at: invoice.late_fee_applied_at
                  }
                : null,
              status: status,
              status_text: statusText,
              total_amount_display: isOverdueFee ? totalAmountWithLateFeeStr : baseAmountStr,
              effective_due_date: effectiveDueDate
            };
          })
        );

        // Filter out null values
        const validFees = feesWithInvoices.filter(fee => fee !== null);

        return {
          student: {
            _id: student._id,
            full_name: student.full_name,
            avatar_url: student.avatar_url
          },
          class: {
            _id: latestClass._id.toString(),
            class_name: latestClass.class_name,
            academic_year: latestClass.academic_year
          },
          student_class_id: latestStudentClass._id.toString(),
          fees: validFees
        };
      })
    );

    return res.json({
      success: true,
      data: studentsWithFees
    });
  } catch (error) {
    console.error('Error getting student fees:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách khoản thu',
      error: error.message
    });
  }
};

/**
 * POST /api/parent/fees/payos - Tạo yêu cầu thanh toán PayOS và trả về QR
 * Hỗ trợ thanh toán nhiều khoản thu trong một yêu cầu.
 */
const createPayOSPaymentRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const feeItemsInput = normalizeFeeItems(req.body);

    if (feeItemsInput.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cần truyền student_id, class_fee_id, student_class_id hoặc fee_items hợp lệ'
      });
    }

    const invalidItem = feeItemsInput.find((item) => {
      return !item.student_id
        || !item.class_fee_id
        || !item.student_class_id
        || !mongoose.Types.ObjectId.isValid(item.student_id)
        || !mongoose.Types.ObjectId.isValid(item.class_fee_id)
        || !mongoose.Types.ObjectId.isValid(item.student_class_id)
        || (item.invoice_id && !mongoose.Types.ObjectId.isValid(item.invoice_id));
    });

    if (invalidItem) {
      return res.status(400).json({
        success: false,
        message: 'fee_items chứa ID không hợp lệ'
      });
    }

    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }

    const processedFees = [];
    let totalAmount = 0;
    const schoolIds = new Set();

    for (const item of feeItemsInput) {
      const { student_id, student_class_id, class_fee_id, invoice_id } = item;

      const parentStudent = await ParentStudent.findOne({
        parent_id: parent._id,
        student_id
      });
      if (!parentStudent) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền thanh toán cho một trong các học sinh đã chọn'
        });
      }

      const student = await Student.findById(student_id).lean();
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy học sinh'
        });
      }

      const studentClass = await StudentClass.findOne({
        _id: student_class_id,
        student_id
      }).populate({
        path: 'class_id',
        select: 'class_name school_id academic_year'
      });

      if (!studentClass || !studentClass.class_id) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin lớp học'
        });
      }

      const classFee = await ClassFee.findOne({
        _id: class_fee_id,
        class_id: studentClass.class_id._id,
        status: 1
      }).populate({
        path: 'fee_id',
        select: 'fee_name description amount'
      });

      if (!classFee || !classFee.fee_id) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin khoản phí'
        });
      }

      let invoice = null;
      if (invoice_id) {
        invoice = await Invoice.findOne({
          _id: invoice_id,
          student_class_id: studentClass._id,
          class_fee_id: classFee._id
        });
      }

      if (!invoice) {
        invoice = await Invoice.findOne({
          student_class_id: studentClass._id,
          class_fee_id: classFee._id
        });
      }

      if (!invoice) {
        invoice = new Invoice({
          student_class_id: studentClass._id,
          class_fee_id: classFee._id,
          amount_due: mongoose.Types.Decimal128.fromString('0'),
          due_date: classFee.due_date,
          discount: studentClass.discount || 0,
          status: 0
        });
      }

      if (invoice.status === 1) {
        return res.status(400).json({
          success: false,
          message: 'Một trong các khoản phí đã được thanh toán'
        });
      }

      const feeAmount = classFee.fee_id.amount
        ? parseFloat(classFee.fee_id.amount.toString())
        : 0;
      const discountPercent = Number(studentClass.discount || 0);
      const amountAfterDiscount = feeAmount - (feeAmount * (discountPercent / 100));
      const baseAmount = Math.max(0, Math.round(amountAfterDiscount));

      if (baseAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Số tiền thanh toán phải lớn hơn 0'
        });
      }

      const lateFeePolicy = buildLateFeePolicy(classFee.fee_id);
      const isFeeOverdue = isInvoiceOverdue(invoice, classFee.due_date);
      const persistedLateFee = invoice?.late_fee_amount
        ? parseDecimal128ToNumber(invoice.late_fee_amount)
        : 0;
      let lateFeeAmount = 0;
      if (isFeeOverdue && shouldApplyLateFee(lateFeePolicy)) {
        lateFeeAmount = persistedLateFee > 0
          ? roundCurrency(persistedLateFee)
          : calculateLateFeeAmount(lateFeePolicy, baseAmount);
      }
      const finalAmount = baseAmount + lateFeeAmount;

      if (finalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Số tiền thanh toán phải lớn hơn 0'
        });
      }

      processedFees.push({
        student,
        studentClass,
        classFee,
        invoice,
        amount: finalAmount,
        baseAmount,
        lateFeeAmount,
        isLateFeeApplied: lateFeeAmount > 0,
        discountPercent,
        student_id,
        student_class_id,
        class_fee_id
      });

      totalAmount += finalAmount;
      const schoolId = studentClass.class_id.school_id?.toString();
      if (schoolId) {
        schoolIds.add(schoolId);
      }
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có khoản phí hợp lệ để thanh toán'
      });
    }

    if (schoolIds.size !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Không thể thanh toán nhiều khoản thuộc các trường khác nhau trong một yêu cầu'
      });
    }

    const schoolId = [...schoolIds][0];
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin trường'
      });
    }

    const payosConfig = school.payos_config || {};
    if (!payosConfig.active) {
      return res.status(400).json({
        success: false,
        message: 'Trường chưa kích hoạt cổng thanh toán PayOS'
      });
    }

    const { client_id, api_key, checksum_key } = payosConfig;
    if (!client_id || !api_key || !checksum_key) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cấu hình PayOS (client_id, api_key hoặc checksum_key)'
      });
    }

    const userProfile = await User.findById(userId).select('full_name email phone_number');
    const frontendBase = getFrontendBaseUrl();
    const returnUrl = process.env.PAYOS_RETURN_URL || `${frontendBase}/payments/success`;
    const cancelUrl = process.env.PAYOS_CANCEL_URL || `${frontendBase}/payments/cancel`;
    const expireMinutes = Math.max(Number(process.env.PAYOS_EXPIRE_MINUTES) || 15, 5);
    const expiredAt = Math.floor((Date.now() + expireMinutes * 60 * 1000) / 1000);
    const orderCode = generateOrderCode();

    const description = buildPayOSBulkDescription(processedFees);
    const signaturePayload = {
      amount: totalAmount,
      cancelUrl,
      description,
      orderCode,
      returnUrl
    };
    const signature = buildSignature(signaturePayload, checksum_key);

    const payosItems = processedFees.map((fee) => ({
      name: `${fee.student?.full_name || 'HS'} - ${fee.classFee.fee_id.fee_name}`.slice(0, 50),
      quantity: 1,
      price: fee.amount
    }));

    const payosBody = {
      ...signaturePayload,
      expiredAt,
      items: payosItems,
      buyerName: userProfile?.full_name || 'Phụ huynh KidsLink',
      signature
    };

    if (userProfile?.email) {
      payosBody.buyerEmail = userProfile.email;
    }
    if (userProfile?.phone_number) {
      payosBody.buyerPhone = userProfile.phone_number;
    }

    let payosResponseData;
    try {
      const payosResponse = await axios.post(
        buildPayOSUrl('/payment-requests'),
        payosBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': client_id,
            'x-api-key': api_key
          },
          timeout: 15000
        }
      );

      payosResponseData = payosResponse.data || {};
    } catch (error) {
      console.error('createPayOSPaymentRequest axios error:', error?.response?.data || error.message);
      const errorMessage = error?.response?.data?.desc
        || error?.response?.data?.message
        || 'Không thể tạo yêu cầu thanh toán PayOS';
      return res.status(502).json({
        success: false,
        message: errorMessage,
        error: error?.response?.data || null
      });
    }

    if (payosResponseData.code && payosResponseData.code !== '00') {
      return res.status(400).json({
        success: false,
        message: payosResponseData.desc || payosResponseData.message || 'PayOS trả về lỗi',
        error: payosResponseData
      });
    }

    const paymentData = payosResponseData.data || payosResponseData;

    await Promise.all(processedFees.map(async (fee) => {
      fee.invoice.amount_due = mongoose.Types.Decimal128.fromString(fee.amount.toFixed(2));
      fee.invoice.discount = fee.discountPercent;
      fee.invoice.due_date = fee.classFee.due_date || fee.invoice.due_date;
      if (fee.lateFeeAmount > 0) {
        fee.invoice.late_fee_amount = mongoose.Types.Decimal128.fromString(fee.lateFeeAmount.toFixed(2));
        fee.invoice.late_fee_applied_at = new Date();
        if (fee.invoice.status !== 2) {
          fee.invoice.status = 2;
        }
      }
      fee.invoice.payos_order_code = orderCode;
      fee.invoice.payos_checkout_url = paymentData.checkoutUrl || paymentData.checkout_url || paymentData.shortLink || null;
      fee.invoice.payos_qr_code = paymentData.qrCode || paymentData.qrContent || paymentData.qrData || null;
      fee.invoice.payos_qr_url = paymentData.qrCodeURL || paymentData.qrCodeUrl || paymentData.qrCode || null;
      fee.invoice.payos_expired_at = paymentData.expiredAt
        ? (typeof paymentData.expiredAt === 'number'
          ? new Date(paymentData.expiredAt * 1000)
          : new Date(paymentData.expiredAt))
        : new Date(expiredAt * 1000);
      await fee.invoice.save();
    }));

    return res.json({
      success: true,
      message: 'Tạo yêu cầu thanh toán thành công',
      data: {
        invoice_ids: processedFees.map(fee => fee.invoice._id),
        order_code: orderCode,
        amount: totalAmount,
        currency: 'VND',
        description,
        checkout_url: paymentData.checkoutUrl || paymentData.checkout_url || paymentData.shortLink || null,
        qr_code: paymentData.qrCode || paymentData.qrContent || paymentData.qrData || null,
        qr_url: paymentData.qrCodeURL || paymentData.qrCodeUrl || paymentData.qrCode || null,
        expired_at: paymentData.expiredAt
          ? (typeof paymentData.expiredAt === 'number'
            ? new Date(paymentData.expiredAt * 1000)
            : new Date(paymentData.expiredAt))
          : new Date(expiredAt * 1000),
        payos: paymentData,
        items: processedFees.map(fee => ({
          invoice_id: fee.invoice._id,
          student_id: fee.student_id,
          student_name: fee.student?.full_name,
          class_fee_id: fee.class_fee_id,
          fee_id: fee.classFee.fee_id._id,
          fee_name: fee.classFee.fee_id.fee_name,
          amount: fee.amount,
          base_amount: fee.baseAmount,
          late_fee_amount: fee.lateFeeAmount
        }))
      }
    });
  } catch (error) {
    console.error('createPayOSPaymentRequest error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo yêu cầu thanh toán',
      error: error.message
    });
  }
};

/**
 * POST /api/parent/fees/payos/status - Kiểm tra trạng thái thanh toán PayOS cho order_code
 */
const checkPayOSPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_code } = req.body || {};

    if (!order_code || isNaN(order_code)) {
      return res.status(400).json({
        success: false,
        message: 'order_code không hợp lệ'
      });
    }

    const orderCode = Number(order_code);

    const invoices = await Invoice.find({ payos_order_code: orderCode })
      .populate({
        path: 'student_class_id',
        select: 'student_id class_id',
        populate: { path: 'class_id', select: 'school_id' }
      })
      .populate({
        path: 'class_fee_id',
        select: 'class_id',
        populate: { path: 'class_id', select: 'school_id' }
      });

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hóa đơn cho order_code này'
      });
    }

    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }

    const parentStudents = await ParentStudent.find({ parent_id: parent._id }).select('student_id');
    const parentStudentIds = new Set(parentStudents.map(ps => ps.student_id.toString()));

    const invalidInvoice = invoices.find(inv => {
      const studentId = inv.student_class_id?.student_id?.toString();
      return !studentId || !parentStudentIds.has(studentId);
    });

    if (invalidInvoice) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền kiểm tra các hóa đơn này'
      });
    }

    const schoolIds = new Set(
      invoices
        .map(inv => inv.class_fee_id?.class_id?.school_id?.toString())
        .filter(Boolean)
    );

    if (schoolIds.size !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Không thể kiểm tra trạng thái cho các hóa đơn thuộc nhiều trường'
      });
    }

    const schoolId = [...schoolIds][0];
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin trường'
      });
    }

    const payosConfig = school.payos_config || {};
    if (!payosConfig.active) {
      return res.status(400).json({
        success: false,
        message: 'Trường chưa kích hoạt PayOS'
      });
    }

    const { client_id, api_key } = payosConfig;
    if (!client_id || !api_key) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cấu hình PayOS (client_id hoặc api_key)'
      });
    }

    let payosResponseData;
    try {
      const payosResponse = await axios.get(
        buildPayOSUrl(`/payment-requests/${orderCode}`),
        {
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': client_id,
            'x-api-key': api_key
          },
          timeout: 12000
        }
      );
      payosResponseData = payosResponse.data || {};
    } catch (error) {
      console.error('checkPayOSPaymentStatus axios error:', error?.response?.data || error.message);
      const errorMessage = error?.response?.data?.desc
        || error?.response?.data?.message
        || 'Không thể kiểm tra trạng thái thanh toán PayOS';
      return res.status(502).json({
        success: false,
        message: errorMessage,
        error: error?.response?.data || null
      });
    }

    const paymentData = payosResponseData.data || payosResponseData || {};
    const status = (paymentData.status || paymentData.state || '').toString().toUpperCase();
    const isPaid =
      status === 'PAID' ||
      status === 'COMPLETED' ||
      status === 'SUCCEEDED' ||
      status === 'SUCCESS' ||
      status === 'PAYMENT_SUCCESS';

    let updatedInvoiceIds = [];
    if (isPaid) {
      updatedInvoiceIds = await markInvoicesPaid(invoices, paymentData);
    }

    const invoiceSummaries = invoices.map(inv => ({
      invoice_id: inv._id,
      status: inv.status,
      student_id: inv.student_class_id?.student_id,
      class_fee_id: inv.class_fee_id?._id
    }));

    return res.json({
      success: true,
      data: {
        order_code: orderCode,
        status,
        is_paid: isPaid,
        updated_invoices: updatedInvoiceIds,
        invoices: invoiceSummaries,
        payos: paymentData
      }
    });
  } catch (error) {
    console.error('checkPayOSPaymentStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra trạng thái thanh toán',
      error: error.message
    });
  }
};

module.exports = {
  getStudentFees,
  createPayOSPaymentRequest,
  checkPayOSPaymentStatus
};

