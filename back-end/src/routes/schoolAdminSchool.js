const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getSchoolInfo,
  updateSchoolInfo
} = require('../controllers/schoolAdminSchoolController');

router.use(authenticate);
router.use(authorize(['school_admin', 'admin']));

router.get('/:schoolId?', getSchoolInfo);
router.put('/:schoolId?', updateSchoolInfo);

module.exports = router;



