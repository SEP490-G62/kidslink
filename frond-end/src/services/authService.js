import apiService from './api';

class AuthService {
  // Đăng nhập
  async login(username, password) {
    try {
      const data = await apiService.post('/auth/login', { username, password }, false);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Đăng ký
  async register(userData) {
    try {
      const data = await apiService.post('/auth/register', userData, false);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Quên mật khẩu
  async forgotPassword(email) {
    try {
      const data = await apiService.post('/auth/forgot-password', { email }, false);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy thông tin user hiện tại
  async getCurrentUser() {
    try {
      const data = await apiService.get('/users/profile');
      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cập nhật profile
  async updateProfile(userData) {
    try {
      const data = await apiService.put('/users/profile', userData);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Đổi mật khẩu
  async changePassword(currentPassword, newPassword) {
    try {
      const data = await apiService.put('/users/change-password', {
        currentPassword,
        newPassword
      });
      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Tạo instance duy nhất
const authService = new AuthService();

export default authService;




