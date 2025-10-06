const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const {
  registerValidators,
  loginValidators,
  register,
  login,
  me
} = require('../controllers/authController');

router.post('/register', registerValidators, register);
router.post('/login', loginValidators, login);


module.exports = router;


