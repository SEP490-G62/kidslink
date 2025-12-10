// Validation rules extracted from controllers for all 56 methods
const methodValidations = {
  // Authentication Module
  login: {
    module: 'Authentication',
    params: [
      { 
        name: 'username', 
        validations: [
          { type: 'required', test: null, message: 'username là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'notEmpty', test: '', message: 'username là bắt buộc' },
          { type: 'trim', test: '  test  ', expected: 'test' }
        ]
      },
      { 
        name: 'password', 
        validations: [
          { type: 'required', test: null, message: 'password là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'notEmpty', test: '', message: 'password là bắt buộc' }
        ]
      }
    ],
    businessValidations: [
      { check: 'user_exists', code: 401, message: 'Sai thông tin đăng nhập' },
      { check: 'password_match', code: 401, message: 'Sai thông tin đăng nhập' },
      { check: 'user_active', code: 403, message: 'Tài khoản đang bị khóa' },
      { check: 'school_active', code: 403, message: 'Trường học đang bị vô hiệu hóa' }
    ],
    errorCodes: [400, 401, 403, 500]
  },

  register: {
    module: 'Authentication',
    params: [
      { 
        name: 'full_name', 
        validations: [
          { type: 'required', test: null, message: 'full_name là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'notEmpty', test: '', message: 'full_name là bắt buộc' }
        ]
      },
      { 
        name: 'username', 
        validations: [
          { type: 'required', test: null, message: 'username là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'notEmpty', test: '', message: 'username là bắt buộc' },
          { type: 'unique', test: 'existing_user', code: 409, message: 'Username đã tồn tại' }
        ]
      },
      { 
        name: 'password', 
        validations: [
          { type: 'required', test: null, message: 'password là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'notEmpty', test: '', message: 'password là bắt buộc' },
          { type: 'matches', regex: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/, test: 'weak', message: 'Mật khẩu phải có từ 8-16 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt' }
        ]
      },
      { 
        name: 'role', 
        validations: [
          { type: 'required', test: null, message: 'role là bắt buộc' },
          { type: 'isIn', values: ['school_admin', 'teacher', 'parent', 'health_care_staff', 'nutrition_staff', 'admin'], test: 'invalid_role', message: 'role không hợp lệ' }
        ]
      },
      { 
        name: 'email', 
        validations: [
          { type: 'required', test: null, message: 'email là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'notEmpty', test: '', message: 'email là bắt buộc' },
          { type: 'isEmail', test: 'invalid@', message: 'email không hợp lệ' },
          { type: 'unique', test: 'existing@email.com', code: 409, message: 'Email đã tồn tại' }
        ]
      },
      { 
        name: 'phone_number', 
        validations: [
          { type: 'required', test: null, message: 'phone_number là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'notEmpty', test: '', message: 'phone_number là bắt buộc' },
          { type: 'matches', regex: /^(\+84|0)(3|5|7|8|9)\d{8}$/, test: '123456', message: 'phone_number không hợp lệ (số di động Việt Nam)' },
          { type: 'unique', test: '0123456789', code: 409, message: 'Số điện thoại đã tồn tại' }
        ]
      },
      { 
        name: 'avatar_url', 
        validations: [
          { type: 'optional', test: undefined },
          { type: 'isURL', test: 'not-a-url', message: 'avatar_url phải là URL hợp lệ' }
        ]
      }
    ],
    errorCodes: [400, 409, 500]
  },

  forgotPassword: {
    module: 'Authentication',
    params: [
      { 
        name: 'email', 
        validations: [
          { type: 'required', test: null, message: 'email là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'notEmpty', test: '', message: 'email là bắt buộc' },
          { type: 'isEmail', test: 'invalid@', message: 'email không hợp lệ' }
        ]
      }
    ],
    businessValidations: [
      { check: 'email_exists', code: 404, message: 'Không tìm thấy người dùng với email này' }
    ],
    errorCodes: [400, 404, 500]
  },

  // User Management Module
  getProfile: {
    module: 'User Management',
    params: [],
    businessValidations: [
      { check: 'authenticated', code: 401, message: 'Unauthorized' },
      { check: 'user_exists', code: 404, message: 'Không tìm thấy người dùng' }
    ],
    errorCodes: [401, 404, 500]
  },

  updateProfile: {
    module: 'User Management',
    params: [
      { 
        name: 'full_name', 
        validations: [
          { type: 'optional' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'notEmpty', test: '', message: 'full_name không được rỗng' }
        ]
      },
      { 
        name: 'phone_number', 
        validations: [
          { type: 'optional' },
          { type: 'matches', regex: /^(\+84|0)(3|5|7|8|9)\d{8}$/, test: '123', message: 'phone_number không hợp lệ' }
        ]
      },
      { 
        name: 'avatar_url', 
        validations: [
          { type: 'optional' },
          { type: 'isURL', test: 'not-url', message: 'avatar_url phải là URL hợp lệ' }
        ]
      }
    ],
    businessValidations: [
      { check: 'authenticated', code: 401, message: 'Unauthorized' },
      { check: 'user_exists', code: 404, message: 'Không tìm thấy người dùng' }
    ],
    errorCodes: [400, 401, 404, 500]
  },

  changePassword: {
    module: 'User Management',
    params: [
      { 
        name: 'old_password', 
        validations: [
          { type: 'required', test: null, message: 'old_password là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' }
        ]
      },
      { 
        name: 'new_password', 
        validations: [
          { type: 'required', test: null, message: 'new_password là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'matches', regex: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/, test: 'weak', message: 'Mật khẩu phải có từ 8-16 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt' }
        ]
      }
    ],
    businessValidations: [
      { check: 'authenticated', code: 401, message: 'Unauthorized' },
      { check: 'old_password_match', code: 400, message: 'Mật khẩu cũ không đúng' }
    ],
    errorCodes: [400, 401, 500]
  },

  // Student Management Module
  createStudent: {
    module: 'Student Management',
    params: [
      { 
        name: 'full_name', 
        validations: [
          { type: 'required', test: null, message: 'full_name là bắt buộc' },
          { type: 'string', test: 123, message: 'must be string' },
          { type: 'notEmpty', test: '', message: 'full_name là bắt buộc' }
        ]
      },
      { 
        name: 'date_of_birth', 
        validations: [
          { type: 'required', test: null, message: 'date_of_birth là bắt buộc' },
          { type: 'isDate', test: 'invalid-date', message: 'date_of_birth phải là ngày hợp lệ' }
        ]
      },
      { 
        name: 'gender', 
        validations: [
          { type: 'required', test: null, message: 'gender là bắt buộc' },
          { type: 'isIn', values: ['male', 'female', 'other'], test: 'invalid', message: 'gender không hợp lệ' }
        ]
      },
      { 
        name: 'address', 
        validations: [
          { type: 'optional' },
          { type: 'string', test: 123, message: 'must be string' }
        ]
      },
      { 
        name: 'avatar_url', 
        validations: [
          { type: 'optional' },
          { type: 'isURL', test: 'not-url', message: 'avatar_url phải là URL hợp lệ' }
        ]
      }
    ],
    businessValidations: [
      { check: 'authenticated', code: 401, message: 'Unauthorized' },
      { check: 'authorization', code: 403, message: 'Forbidden' },
      { check: 'school_exists', code: 404, message: 'Không tìm thấy trường' }
    ],
    errorCodes: [400, 401, 403, 404, 500]
  }

  // Note: Add remaining 51 methods following the same pattern
  // This is a sample structure. Full implementation would include all 56 methods.
};

module.exports = methodValidations;
