const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const School = require('../models/School');

const allowedRoles = ['school_admin', 'teacher', 'parent', 'health_care_staff', 'nutrition_staff', 'admin'];
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
const PASSWORD_MESSAGE = 'Mật khẩu phải có từ 8-16 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt';

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  // Thời hạn token: mặc định 24 giờ, có thể cấu hình qua JWT_EXPIRES_IN trong .env
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  const payload = {
    id: user._id,
    role: user.role,
    username: user.username,
    full_name: user.full_name
  };

  if (user.school_id) {
    payload.school_id = user.school_id.toString();
  }

  return jwt.sign(payload, secret, { expiresIn });
}

// Validators
const registerValidators = [
  body('full_name').isString().trim().notEmpty().withMessage('full_name là bắt buộc'),
  body('username').isString().trim().notEmpty().withMessage('username là bắt buộc'),
  body('password')
    .isString()
    .notEmpty()
    .withMessage('password là bắt buộc')
    .bail()
    .matches(PASSWORD_REGEX)
    .withMessage(PASSWORD_MESSAGE),
  body('role').isIn(allowedRoles).withMessage('role không hợp lệ'),
  body('email').isString().trim().notEmpty().withMessage('email là bắt buộc').bail().isEmail().withMessage('email không hợp lệ'),
  body('phone_number')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('phone_number là bắt buộc')
    .bail()
    .matches(/^(\+84|0)(3|5|7|8|9)\d{8}$/)
    .withMessage('phone_number không hợp lệ (số di động Việt Nam)'),
  body('avatar_url').optional().isURL().withMessage('avatar_url phải là URL hợp lệ')
];

const loginValidators = [
  body('username').isString().trim().notEmpty().withMessage('username là bắt buộc'),
  body('password').isString().notEmpty().withMessage('password là bắt buộc')
];

// Forgot password validator
const forgotPasswordValidators = [
  body('email').isString().trim().notEmpty().withMessage('email là bắt buộc').bail().isEmail().withMessage('email không hợp lệ')
];

function generateRandomPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function forgotPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng với email này' });
    }

    const newPassword = generateRandomPassword(10);
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    user.password_hash = password_hash;
    await user.save();

    const { sendMail } = require('../utils/mailer');
    await sendMail({
      to: email,
      subject: 'KidsLink - Mật khẩu mới của bạn',
      text: `Xin chào ${user.full_name},\n\nMật khẩu mới: ${newPassword}\nVui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập.`,
      html: `<p>Xin chào <strong>${user.full_name}</strong>,</p><p>Mật khẩu mới: <strong>${newPassword}</strong></p><p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập.</p>`
    });

    return res.json({ message: 'Đã gửi mật khẩu mới tới email của bạn' });
  } catch (err) {
    return res.status(500).json({ error: 'Không thể xử lý yêu cầu', message: err.message });
  }
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { full_name, username, password, role, avatar_url, email, phone_number } = req.body;
  try {
    // Kiểm tra trùng username/email/phone_number
    const [existingUsername, existingEmail, existingPhone] = await Promise.all([
      User.findOne({ username }),
      User.findOne({ email }),
      User.findOne({ phone_number })
    ]);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username đã tồn tại' });
    }
    if (existingEmail) {
      return res.status(409).json({ error: 'Email đã tồn tại' });
    }
    if (existingPhone) {
      return res.status(409).json({ error: 'Số điện thoại đã tồn tại' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      full_name,
      username,
      password_hash,
      role,
      avatar_url: avatar_url || '',
      email,
      phone_number
    });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url,
        email: user.email,
        phone_number: user.phone_number,
        status: user.status,
        school_id: user.school_id ? user.school_id.toString() : null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Không thể đăng ký', message: err.message });
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  try {
    // Đăng nhập admin qua .env (bỏ qua DB)
    const inputUsername = typeof username === 'string' ? username.trim() : username;
    const adminUsername = (process.env.ADMIN_USERNAME || '').trim();
    const adminPassword = process.env.ADMIN_PASSWORD; // plaintext
    const adminPasswordBcrypt = process.env.ADMIN_PASSWORD_BCRYPT; // hashed (tùy chọn)

    let isAdminMatch = false;
    if (adminUsername && inputUsername === adminUsername) {
      if (adminPassword && password === adminPassword) {
        isAdminMatch = true;
      } else if (adminPasswordBcrypt) {
        // cho phép mật khẩu admin dạng bcrypt trong .env
        isAdminMatch = await bcrypt.compare(password, adminPasswordBcrypt);
      }
    }

    if (isAdminMatch) {
      const adminUser = {
        _id: 'admin',
        full_name: 'System Admin',
        username: adminUsername,
        role: 'admin',
        avatar_url: 'https://www.vecteezy.com/vector-art/290610-administration-vector-icon'
      };
      const token = signToken(adminUser);
      return res.json({
        token,
        user: {
          id: adminUser._id,
          full_name: adminUser.full_name,
          username: adminUser.username,
          role: adminUser.role,
          avatar_url: adminUser.avatar_url,
          email: '',
          phone_number: '',
          status: 1,
          school_id: null
        }
      });
    }

    const user = await User.findOne({ username: inputUsername });
    if (!user) {
      return res.status(401).json({ error: 'Sai thông tin đăng nhập' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Sai thông tin đăng nhập' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ error: 'Tài khoản đang bị khóa' });
    }

    // Check if user's school is active (if user has school_id)
    if (user.school_id) {
      const school = await School.findById(user.school_id);
      if (!school || school.status !== 1) {
        return res.status(403).json({ 
          error: 'Trường học của bạn đang bị vô hiệu hóa. Vui lòng liên hệ quản trị viên hệ thống.' 
        });
      }
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url,
        email: user.email,
        phone_number: user.phone_number,
        status: user.status,
        school_id: user.school_id ? user.school_id.toString() : null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Không thể đăng nhập', message: err.message });
  }
}


module.exports = {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  register,
  login,
  forgotPassword,
};


