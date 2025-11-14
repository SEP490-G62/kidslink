const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,16}$/;
const PASSWORD_POLICY_HINT =
  'Mật khẩu phải từ 8-16 ký tự, gồm chữ, số, ít nhất 1 chữ hoa và 1 ký tự đặc biệt';

const isPasswordValid = (password = '') => PASSWORD_POLICY_REGEX.test(password);

const validatePassword = (password = '') => {
  const pwd = String(password || '').trim();
  
  if (pwd.length < 8 || pwd.length > 16) {
    return { valid: false, message: 'Mật khẩu phải có từ 8-16 ký tự' };
  }
  
  if (!/[A-Z]/.test(pwd)) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 chữ hoa' };
  }
  
  if (!/[a-z]/.test(pwd)) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 chữ thường' };
  }
  
  if (!/[0-9]/.test(pwd)) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 số' };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)' };
  }
  
  return { valid: true, message: '' };
};

module.exports = {
  PASSWORD_POLICY_REGEX,
  PASSWORD_POLICY_HINT,
  isPasswordValid,
  validatePassword,
};

