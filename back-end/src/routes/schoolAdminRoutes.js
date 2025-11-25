const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Import các router con của school admin
const schoolAdminPostRouter = require('./schoolAdminPost');
const schoolAdminCalendarRouter = require('./schoolAdminCalendar');
const feeRouter = require('./fee');
const schoolAdminSchoolRouter = require('./schoolAdminSchool');
const schoolAdminComplaintRouter = require('./schoolAdminComplaint');

// Áp dụng xác thực và authorization cho tất cả routes


// Định tuyến các API endpoints
router.use('/posts', schoolAdminPostRouter);
router.use('/calendar', schoolAdminCalendarRouter);
router.use('/fees', feeRouter);
router.use('/school', schoolAdminSchoolRouter);
router.use('/complaints', schoolAdminComplaintRouter);
module.exports = router;



