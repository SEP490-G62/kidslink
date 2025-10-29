import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { sendMail } from "../utils/mailer.js";

const allowedRoles = [
  "school_admin",
  "teacher",
  "parent",
  "health_care_staff",
  "nutrition_staff",
  "admin",
];

// 🧩 Tạo JWT
function signToken(user) {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      username: user.username,
      full_name: user.full_name,
    },
    secret,
    { expiresIn }
  );
}

// 🧩 Validators
export const registerValidators = [
  body("full_name").isString().trim().notEmpty().withMessage("full_name là bắt buộc"),
  body("username").isString().trim().notEmpty().withMessage("username là bắt buộc"),
  body("password").isString().isLength({ min: 6 }).withMessage("password tối thiểu 6 ký tự"),
  body("role").isIn(allowedRoles).withMessage("role không hợp lệ"),
  body("email").isEmail().withMessage("email không hợp lệ"),
  body("phone_number")
    .matches(/^(\+84|0)(3|5|7|8|9)\d{8}$/)
    .withMessage("phone_number không hợp lệ (số di động Việt Nam)"),
  body("avatar_url").optional().isURL().withMessage("avatar_url phải là URL hợp lệ"),
];

export const loginValidators = [
  body("username").isString().trim().notEmpty().withMessage("username là bắt buộc"),
  body("password").isString().notEmpty().withMessage("password là bắt buộc"),
];

export const forgotPasswordValidators = [
  body("email").isEmail().withMessage("email không hợp lệ"),
];

// 🧩 Hàm random mật khẩu
function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

// 🧩 Quên mật khẩu
export async function forgotPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng với email này" });

    const newPassword = generateRandomPassword(10);
    const password_hash = await bcrypt.hash(newPassword, 10);

    user.password_hash = password_hash;
    await user.save();

    await sendMail({
      to: email,
      subject: "KidsLink - Mật khẩu mới của bạn",
      text: `Xin chào ${user.full_name}, mật khẩu mới của bạn là: ${newPassword}`,
      html: `<p>Xin chào <b>${user.full_name}</b>,</p><p>Mật khẩu mới của bạn: <b>${newPassword}</b></p>`,
    });

    res.json({ message: "Đã gửi mật khẩu mới tới email của bạn" });
  } catch (err) {
    res.status(500).json({ error: "Không thể xử lý yêu cầu", message: err.message });
  }
}

// 🧩 Đăng ký
export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { full_name, username, password, role, avatar_url, email, phone_number } = req.body;
  try {
    const [u, e, p] = await Promise.all([
      User.findOne({ username }),
      User.findOne({ email }),
      User.findOne({ phone_number }),
    ]);
    if (u) return res.status(409).json({ error: "Username đã tồn tại" });
    if (e) return res.status(409).json({ error: "Email đã tồn tại" });
    if (p) return res.status(409).json({ error: "Số điện thoại đã tồn tại" });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name,
      username,
      password_hash,
      role,
      avatar_url: avatar_url || "",
      email,
      phone_number,
    });

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Không thể đăng ký", message: err.message });
  }
}

// 🧩 Đăng nhập
export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password } = req.body;
  try {
    // Đăng nhập admin từ ENV
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    const adminBcrypt = process.env.ADMIN_PASSWORD_BCRYPT;

    if (username === adminUser) {
      let ok = false;
      if (adminPass && password === adminPass) ok = true;
      else if (adminBcrypt) ok = await bcrypt.compare(password, adminBcrypt);
      if (ok) {
        const token = signToken({
          _id: "admin",
          role: "admin",
          username,
          full_name: "System Admin",
        });
        return res.json({
          token,
          user: {
            id: "admin",
            username,
            role: "admin",
            full_name: "System Admin",
          },
        });
      }
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Sai thông tin đăng nhập" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Sai thông tin đăng nhập" });
    if (user.status !== 1) return res.status(403).json({ error: "Tài khoản đang bị khóa" });

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Không thể đăng nhập", message: err.message });
  }
}
