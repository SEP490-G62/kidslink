const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getClassCalendars,
  createOrUpdateSlot,
  deleteSlot,
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getAllTeachers,
  updateAllSlotNames
} = require('../controllers/schoolAdminCalendarController');

// Áp dụng xác thực và authorization cho tất cả routes
router.use(authenticate);
router.use(authorize(['school_admin', 'admin']));

// Calendar & Slot Routes
router.get('/class/:classId', getClassCalendars);
router.post('/slots/:slotId', createOrUpdateSlot);
router.delete('/slots/:slotId', deleteSlot);
router.post('/slots/update-names', updateAllSlotNames); // Migration route

// Activity Routes
router.get('/activities', getAllActivities);
router.post('/activities', createActivity);
router.put('/activities/:activityId', updateActivity);
router.delete('/activities/:activityId', deleteActivity);

// Teacher Routes
router.get('/teachers', getAllTeachers);

module.exports = router;
