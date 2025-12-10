const jwt = require('jsonwebtoken');
const JWT_SECRET = 'dev_secret_change_me';

// Test token generation
const payload = {
  id: '507f1f77bcf86cd799439011',
  role: 'admin',
  username: 'test_admin'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
console.log('Token:', token);

// Try to verify
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Decoded:', decoded);
} catch (err) {
  console.error('Error decoding:', err.message);
}
