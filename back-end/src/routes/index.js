const express = require("express");
const router = express.Router();
const messagingRouter = require('./messaging');

// Import các router con
const authRouter = require('./auth');
const userRouter = require('./user');
const teacherRouter = require('./teacherRouter');
const parentRouter = require('./parent');
const healthStaffRouter = require('./healthStaff');

// Định tuyến các API endpoints
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/teachers', teacherRouter);
router.use('/parent', parentRouter);
router.use('/health-staff', healthStaffRouter);

router.use('/api/messaging', messagingRouter);

module.exports = router;