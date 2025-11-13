const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  listFees,
  createFee,
  updateFee,
  deleteFee,
  listFeeClasses,
  listFeeClassStudents,
  batchUpdateInvoices,
} = require('../controllers/feeController');

router.use(authenticate);

// School admin quản lý học phí
router.get('/', authorize(['school_admin','admin']), listFees);
router.post('/', authorize(['school_admin','admin']), createFee);
router.put('/:id', authorize(['school_admin','admin']), updateFee);
router.delete('/:id', authorize(['school_admin','admin']), deleteFee);
router.get('/:id/classes', authorize(['school_admin','admin']), listFeeClasses);
router.get('/:feeId/classes/:classId/students', authorize(['school_admin','admin']), listFeeClassStudents);
router.patch('/:feeId/invoices', authorize(['school_admin','admin']), batchUpdateInvoices);

module.exports = router;







