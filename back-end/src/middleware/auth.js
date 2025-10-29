import jwt from "jsonwebtoken";

// 🧩 Xác thực JWT
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Thiếu token xác thực" });
  }

  try {
    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const payload = jwt.verify(token, secret);
    req.user = payload; // Lưu thông tin user (id, role, username, ...)
    next();
  } catch (err) {
    console.error("❌ Lỗi xác thực JWT:", err.message);
    return res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

// 🧩 Phân quyền theo vai trò
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Chưa xác thực" });
    }

    if (allowedRoles.length === 0) {
      return next(); // Không giới hạn quyền
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Không có quyền truy cập" });
    }

    next();
  };
};
