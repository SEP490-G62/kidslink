const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { authenticate, authorize } = require('../middleware/auth');

// Lấy danh sách tất cả phí
router.get('/', authenticate, feeController.getAllFees);

// Lấy thông tin thanh toán của lớp trong một khoản phí
router.get('/:id/classes/:classFeeId/payments', authenticate, feeController.getClassFeePayments);

// Thanh toán offline cho học sinh (school_admin only)
router.post('/:id/classes/:classFeeId/payments/:invoiceId/offline', authenticate, authorize(['school_admin']), feeController.markInvoicePaidOffline);

// Tạo hoặc lấy invoice và tính phụ phí tự động (school_admin only)
router.post('/:id/classes/:classFeeId/students/:studentClassId/invoice', authenticate, authorize(['school_admin']), feeController.createOrGetInvoice);

// Lấy thông tin một phí theo ID
router.get('/:id', authenticate, feeController.getFeeById);

// Tạo phí mới (school_admin only)
router.post('/', authenticate, authorize(['school_admin']), feeController.createFee);

// Cập nhật phí (school_admin only)
router.put('/:id', authenticate, authorize(['school_admin']), feeController.updateFee);

// Xóa phí (school_admin only)
router.delete('/:id', authenticate, authorize(['school_admin']), feeController.deleteFee);

module.exports = router;
