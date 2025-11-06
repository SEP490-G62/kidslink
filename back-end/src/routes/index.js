const express = require("express");
const router = express.Router();
const messagingRouter = require('./messaging');

// Import các router con
const authRouter = require('./auth');
const userRouter = require('./user');
const teacherRouter = require('./teacherRouter');
const parentRouter = require('./parent');
const parentCRUDRouter = require('./parentCRUD');
const healthStaffRouter = require('./healthStaff');
const classRouter = require('./class');
const classAgeRouter = require('./classAge');
const studentRouter = require('./student');
const schoolAdminPostRouter = require('./schoolAdminPost');

// Định tuyến các API endpoints
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/teachers', teacherRouter);
router.use('/parent', parentRouter);
router.use('/parentcrud', parentCRUDRouter);
router.use('/health-staff', healthStaffRouter);
router.use('/classes', classRouter);
router.use('/class-ages', classAgeRouter);
router.use('/student', studentRouter);
router.use('/school-admin/posts', schoolAdminPostRouter);

router.use('/api/messaging', messagingRouter);

module.exports = router;
