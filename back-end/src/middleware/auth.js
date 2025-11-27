const jwt = require('jsonwebtoken');

// Xác thực JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Thiếu token xác thực' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const payload = jwt.verify(token, secret);
    req.user = payload; // { id, role, username }
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

// Phân quyền theo vai trò
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Chưa xác thực' });
    }
    if (allowedRoles.length === 0) {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      // Ghi log để debug quyền truy cập sai vai trò
      console.warn('AUTHZ REJECT', {
        path: req.originalUrl,
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
        userId: req.user.id
      });
      return res.status(403).json({
        error: 'Không có quyền truy cập',
        current_role: req.user.role,
        required_roles: allowedRoles
      });
    }
    return next();
  };
}

module.exports = { authenticate, authorize };


