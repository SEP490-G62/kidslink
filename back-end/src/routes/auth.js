const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const {
  registerValidators,
  loginValidators,
  register,
  login,
  forgotPassword,
  forgotPasswordValidators
} = require('../controllers/authController');

router.post('/register', registerValidators, register);
router.post('/login', loginValidators, login);
router.post('/forgot-password', forgotPasswordValidators, forgotPassword);


module.exports = router;


