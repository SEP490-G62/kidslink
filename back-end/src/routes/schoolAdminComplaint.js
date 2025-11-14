const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllComplaints,
  getComplaintById,
  approveComplaint,
  rejectComplaint,
  getComplaintStats,
  getAllComplaintTypes,
  createComplaintType,
  updateComplaintType,
  deleteComplaintType
} = require('../controllers/schoolAdminComplaintController');

// Áp dụng xác thực và authorization cho tất cả routes
router.use(authenticate);
router.use(authorize(['school_admin', 'admin']));

// Routes cho complaints
router.get('/stats', getComplaintStats);
router.get('/', getAllComplaints);
router.get('/:complaintId', getComplaintById);
router.put('/:complaintId/approve', approveComplaint);
router.put('/:complaintId/reject', rejectComplaint);

// Routes cho complaint types
router.get('/types/list', getAllComplaintTypes);
router.post('/types', createComplaintType);
router.put('/types/:typeId', updateComplaintType);
router.delete('/types/:typeId', deleteComplaintType);

module.exports = router;

