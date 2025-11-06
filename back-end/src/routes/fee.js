const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { listFees, createFee, updateFee, deleteFee } = require('../controllers/feeController');

router.use(authenticate);

// School admin quản lý học phí
router.get('/', authorize(['school_admin','admin']), listFees);
router.post('/', authorize(['school_admin','admin']), createFee);
router.put('/:id', authorize(['school_admin','admin']), updateFee);
router.delete('/:id', authorize(['school_admin','admin']), deleteFee);

module.exports = router;


