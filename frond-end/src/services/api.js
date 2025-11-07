const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Kiểm tra token có hết hạn không (tránh circular dependency)
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

  // Xóa token và dữ liệu đăng nhập
  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('selectedChild');
  }

  // Lấy token từ localStorage và kiểm tra hết hạn
  getToken() {
    const token = localStorage.getItem('token');
    
    // Kiểm tra token hết hạn trước khi trả về
    if (token && this.isTokenExpired(token)) {
      console.warn('Token đã hết hạn, xóa token');
      this.clearAuthData();
      return null;
    }
    
    return token;
  }

  // Tạo headers với token nếu có
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        // Token không hợp lệ hoặc đã hết hạn, redirect đến trang đăng nhập
        if (window.location.pathname !== '/authentication/sign-in') {
          console.warn('Token không hợp lệ, chuyển hướng đến trang đăng nhập');
          window.location.href = '/authentication/sign-in';
        }
      }
    }

    return headers;
  }

  // Xử lý response
  async handleResponse(response) {
    // Handle no-content or not-modified responses gracefully
    if (response.status === 204 || response.status === 304) {
      return {};
    }

    // Try to parse JSON only when there is a body
    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Fallback: attempt text and wrap
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { raw: text };
      }
    }
    
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        // Redirect to login if not already there
        if (window.location.pathname !== '/authentication/sign-in') {
          window.location.href = '/authentication/sign-in';
        }
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      throw new Error((data && (data.error || data.details)) || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  // POST request
  async post(endpoint, data, includeAuth = true) {
    try {
      console.log('API POST:', endpoint, 'Data:', data);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse(response);
      console.log('API POST Response:', result);
      return result;
    } catch (error) {
      console.error(`API POST Error (${endpoint}):`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, includeAuth = true) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API GET Error (${endpoint}):`, error);
      throw error;
    }
  }

  // PUT request
  async put(endpoint, data, includeAuth = true) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API PUT Error (${endpoint}):`, error);
      throw error;
    }
  }

  // DELETE request
  async delete(endpoint, includeAuth = true) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(includeAuth),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API DELETE Error (${endpoint}):`, error);
      throw error;
    }
  }
}

// Tạo instance duy nhất
const apiService = new ApiService();

export default apiService;




