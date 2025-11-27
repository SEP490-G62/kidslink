const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getClassCalendars,
  createOrUpdateCalendarEntry,
  bulkUpsertCalendars,
  deleteCalendarEntry,
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getAllTeachers,
  updateAllSlotNames
} = require('../controllers/schoolAdminCalendarController');

const {
  getAllSlots,
  createSlot,
  updateSlot,
  deleteSlot
} = require('../controllers/slotController');

// Áp dụng xác thực và authorization cho tất cả routes
router.use(authenticate);
router.use(authorize(['school_admin', 'admin']));

// Calendar Entry Routes
router.get('/class/:classId', getClassCalendars);
// Đặt route bulk TRƯỚC route có param để tránh bị bắt nhầm :calendarId = 'bulk'
router.post('/calendar/bulk', bulkUpsertCalendars);
router.post('/calendar/:calendarId', createOrUpdateCalendarEntry);
router.delete('/calendar/:calendarId', deleteCalendarEntry);

// Slot (khung giờ chuẩn) Routes
router.get('/slots', getAllSlots);
router.post('/slots', createSlot);
router.put('/slots/:slotId', updateSlot);
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
