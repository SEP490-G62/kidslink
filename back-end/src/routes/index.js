const express = require("express");
const router = express.Router();

// Import các router con
const authRouter = require('./auth');
const userRouter = require('./user');
const teacherRouter = require('./teacherRouter');
const parentRouter = require('./parent');

// Định tuyến các API endpoints
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/teachers', teacherRouter);
router.use('/parents', parentRouter);

module.exports = router;