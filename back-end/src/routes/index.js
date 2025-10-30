const express = require("express");
const router = express.Router();

// Import các router con
const authRouter = require('./auth');
const userRouter = require('./user');
const teacherRouter = require('./teacherRouter');
const parentRouter = require('./parent');
const healthStaffRouter = require('./healthStaff');
const nutritionStaffRouter = require('./nutritionStaff');


// Định tuyến các API endpoints
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/teachers', teacherRouter);
router.use('/parent', parentRouter);
router.use('/health-staff', healthStaffRouter);
router.use('/nutrition', nutritionStaffRouter);

module.exports = router;