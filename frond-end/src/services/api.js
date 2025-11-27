const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Lấy token từ localStorage
  getToken() {
    return localStorage.getItem('token');
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
      
      // Extract error message from various possible formats
      let errorMessage = `HTTP error! status: ${response.status}`;
      if (data) {
        if (data.message) errorMessage = data.message;
        else if (data.error) errorMessage = data.error;
        else if (data.details) errorMessage = data.details;
      }
      
      throw new Error(errorMessage);
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

  // PATCH request
  async patch(endpoint, data, includeAuth = true) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API PATCH Error (${endpoint}):`, error);
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




