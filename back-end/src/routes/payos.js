const express = require('express');
const router = express.Router();

const { handlePayOSWebhook } = require('../controllers/payosController');

// PayOS gửi webhook không cần authentication
router.post('/webhook', handlePayOSWebhook);

module.exports = router;












