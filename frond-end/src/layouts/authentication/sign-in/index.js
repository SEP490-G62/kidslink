/**
=========================================================
* Argon Dashboard 2 MUI - v3.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-material-ui
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState } from "react";

// react-router-dom components
import { Link, useNavigate } from "react-router-dom";

// @mui material components
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonInput from "components/ArgonInput";
import ArgonButton from "components/ArgonButton";

// Authentication layout components
import IllustrationLayout from "layouts/authentication/components/IllustrationLayout";

// Context và Services
import { useAuth } from "context/AuthContext";
import authService from "services/authService";

// Image
const bgImage =
  "https://www.mountainview.gov/home/showpublishedimage/5817/638501772334370000";

function Illustration() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa lỗi khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validation form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Đăng nhập thành công!',
          severity: 'success'
        });
        
        // Redirect dựa trên role
        setTimeout(() => {
          const userRole = result.user.role;
          switch (userRole) {
            case 'admin':
              navigate('/admin');
              break;
            case 'school_admin':
              navigate('/school-admin/dashboard');
              break;
            case 'teacher':
              navigate('/teacher');
              break;
            case 'parent':
              navigate('/parent');
              break;
            case 'health_care_staff':
              navigate('/health-care');
              break;
            case 'nutrition_staff':
              navigate('/nutrition');
              break;
            default:
              navigate('/');
          }
        }, 1000);
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Đăng nhập thất bại',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra, vui lòng thử lại',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Đóng snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <>
      <IllustrationLayout
        title="Đăng Nhập"
        description="Nhập tên đăng nhập và mật khẩu để đăng nhập"
        illustration={{
          image: bgImage,
          title: '"KidsLink - Kết nối gia đình và trường học"',
          description:
            "Nền tảng quản lý trường mầm non hiện đại, giúp kết nối phụ huynh, giáo viên và nhà trường một cách hiệu quả.",
        }}
      >
        <ArgonBox component="form" role="form" onSubmit={handleLogin}>
          <ArgonBox mb={2}>
            <ArgonInput 
              type="text" 
              name="username"
              placeholder="Tên đăng nhập" 
              size="large"
              value={formData.username}
              onChange={handleInputChange}
              error={!!errors.username}
            />
            {errors.username && (
              <ArgonTypography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {errors.username}
              </ArgonTypography>
            )}
          </ArgonBox>
          <ArgonBox mb={2}>
            <ArgonInput 
              type="password" 
              name="password"
              placeholder="Mật khẩu" 
              size="large"
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
            />
            {errors.password && (
              <ArgonTypography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {errors.password}
              </ArgonTypography>
            )}
          </ArgonBox>
          <ArgonBox display="flex" alignItems="center">
            <Switch checked={rememberMe} onChange={handleSetRememberMe} />
            <ArgonTypography
              variant="button"
              fontWeight="regular"
              onClick={handleSetRememberMe}
              sx={{ cursor: "pointer", userSelect: "none" }}
            >
              &nbsp;&nbsp;Ghi nhớ đăng nhập
            </ArgonTypography>
          </ArgonBox>
          <ArgonBox mt={4} mb={1}>
            <ArgonButton 
              color="info" 
              size="large" 
              fullWidth 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Đăng Nhập'
              )}
            </ArgonButton>
          </ArgonBox>

          <ArgonBox mt={2} textAlign="center">
            <ArgonTypography
              component={Link}
              to="/authentication/forgot-password"
              variant="button"
              color="text"
              fontWeight="regular"
              sx={{ textDecoration: 'underline' }}
            >
              Quên mật khẩu?
            </ArgonTypography>
          </ArgonBox>
        </ArgonBox>
      </IllustrationLayout>

      {/* Snackbar cho thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Illustration;
