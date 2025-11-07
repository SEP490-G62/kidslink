import apiService from './api';

class AuthService {
  // Kiểm tra token có hết hạn không
  isTokenExpired(token) {
    if (!token) {
      return true;
    }

    try {
      // Decode JWT token (không cần verify, chỉ lấy payload)
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        return true;
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      const currentTime = Math.floor(Date.now() / 1000);

      // Kiểm tra nếu token không có exp hoặc đã hết hạn
      if (!payload.exp) {
        return true; // Token không có thời gian hết hạn, coi như đã hết hạn
      }

      // Kiểm tra với buffer 60 giây (token hết hạn trong 60 giây tới cũng coi như hết hạn)
      return payload.exp < currentTime + 60;
    } catch (error) {
      console.error('Lỗi khi kiểm tra token:', error);
      return true; // Nếu có lỗi, coi như token đã hết hạn
    }
  }

  // Lấy thời gian hết hạn của token (milliseconds)
  getTokenExpirationTime(token) {
    if (!token) {
      return null;
    }

    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        return null;
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      if (payload.exp) {
        return payload.exp * 1000; // Convert từ seconds sang milliseconds
      }
      return null;
    } catch (error) {
      console.error('Lỗi khi lấy thời gian hết hạn token:', error);
      return null;
    }
  }

  // Kiểm tra và xóa token nếu hết hạn
  checkAndClearExpiredToken() {
    const token = localStorage.getItem('token');
    if (token && this.isTokenExpired(token)) {
      console.log('Token đã hết hạn, xóa token và đăng xuất');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('selectedChild');
      return true; // Token đã hết hạn và đã xóa
    }
    return false; // Token còn hợp lệ
  }

  // Đăng nhập
  async login(username, password) {
    try {
      const data = await apiService.post('/auth/login', { username, password }, false);
      
      // Lưu token và kiểm tra thời gian hết hạn
      if (data.token) {
        localStorage.setItem('token', data.token);
        const expirationTime = this.getTokenExpirationTime(data.token);
        if (expirationTime) {
          console.log('Token sẽ hết hạn vào:', new Date(expirationTime).toLocaleString('vi-VN'));
        }
      }
      
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




