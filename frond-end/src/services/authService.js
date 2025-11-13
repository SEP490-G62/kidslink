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

  // Đăng xuất - xóa token và dữ liệu người dùng
  async logout() {
    try {
      // Gọi API logout nếu backend có endpoint (optional)
      // Nếu backend không có endpoint, vẫn tiếp tục xóa token ở frontend
      try {
        await apiService.post('/auth/logout', {}, true);
      } catch (error) {
        // Nếu endpoint không tồn tại, bỏ qua lỗi và tiếp tục xóa token ở frontend
        console.log('Backend logout endpoint không khả dụng, tiếp tục xóa token ở frontend');
      }

      // Xóa tất cả dữ liệu authentication từ localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('selectedChild');

      return {
        success: true,
        message: 'Đăng xuất thành công'
      };
    } catch (error) {
      // Ngay cả khi có lỗi, vẫn xóa token ở frontend để đảm bảo đăng xuất
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('selectedChild');

      return {
        success: true,
        message: 'Đã xóa token và đăng xuất'
      };
    }
  }
}

// Tạo instance duy nhất
const authService = new AuthService();

export default authService;




