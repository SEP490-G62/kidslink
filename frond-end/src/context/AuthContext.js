import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Khởi tạo auth state từ localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        // Kiểm tra token có hết hạn không
        if (authService.isTokenExpired(storedToken)) {
          console.log('Token đã hết hạn khi khởi tạo, xóa dữ liệu đăng nhập');
          authService.checkAndClearExpiredToken();
          setToken(null);
          setUser(null);
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Thiết lập timer để kiểm tra token định kỳ (mỗi phút)
          const checkTokenInterval = setInterval(() => {
            const currentToken = localStorage.getItem('token');
            if (currentToken && authService.isTokenExpired(currentToken)) {
              console.log('Token đã hết hạn, đăng xuất tự động');
              authService.checkAndClearExpiredToken();
              setToken(null);
              setUser(null);
              if (window.location.pathname !== '/authentication/sign-in') {
                window.location.href = '/authentication/sign-in';
              }
              clearInterval(checkTokenInterval);
            }
          }, 60000); // Kiểm tra mỗi 60 giây
          
          // Cleanup interval khi component unmount
          return () => clearInterval(checkTokenInterval);
        }
      } catch (error) {
        console.error('Lỗi khi parse user data từ localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const url = `${API_BASE}/auth/login`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Ensure we got JSON, not an HTML fallback
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Unexpected response from server: ${text.slice(0, 120)}...`);
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }

      // Lưu token và user info vào localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      // Enhance network error message for clarity
      const isNetworkErr = error && error.message && /Failed to fetch|NetworkError|TypeError/i.test(error.message);
      if (isNetworkErr) {
        return {
          success: false,
          error: `Không thể kết nối tới API (${API_BASE}). Hãy kiểm tra backend đang chạy, CORS và REACT_APP_API_URL. Gốc gọi: ${API_BASE}`
        };
      }
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setSelectedChild(null); // Clear selected child on logout
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  const value = {
    user,
    token,
    loading,
    selectedChild,
    setSelectedChild,
    login,
    logout,
    isAuthenticated,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
