import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Alert, 
  Snackbar, 
  CircularProgress, 
  Box,
  Typography,
  Container,
  Paper
} from '@mui/material';

// Argon Dashboard 2 MUI components
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonInput from 'components/ArgonInput';
import ArgonButton from 'components/ArgonButton';

// Authentication layout components
import IllustrationLayout from 'layouts/authentication/components/IllustrationLayout';

// Components
import SuccessMessage from 'components/SuccessMessage';

// Services
import authService from 'services/authService';

// Image
const bgImage =
  "https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/signin-ill.jpg";

function ForgotPassword() {
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Xử lý thay đổi input
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  // Validation email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Xử lý gửi email reset password
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await authService.forgotPassword(email);
      
      if (result.success) {
        setSuccess(true);
        setSnackbar({
          open: true,
          message: 'Đã gửi mật khẩu mới tới email của bạn. Vui lòng kiểm tra hộp thư.',
          severity: 'success'
        });
        
        // Redirect về trang đăng nhập sau 3 giây
        setTimeout(() => {
          navigate('/authentication/sign-in');
        }, 3000);
      } else {
        setError(result.error || 'Có lỗi xảy ra, vui lòng thử lại');
        setSnackbar({
          open: true,
          message: result.error || 'Có lỗi xảy ra, vui lòng thử lại',
          severity: 'error'
        });
      }
    } catch (error) {
      setError('Có lỗi xảy ra, vui lòng thử lại');
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

  // Nếu đã gửi thành công
  if (success) {
    return (
      <IllustrationLayout
        title="Email đã được gửi"
        description="Vui lòng kiểm tra hộp thư của bạn"
        illustration={{
          image: bgImage,
          title: '"Kiểm tra email của bạn"',
          description: "Chúng tôi đã gửi mật khẩu mới tới email của bạn. Vui lòng kiểm tra hộp thư và đăng nhập lại.",
        }}
      >
        <SuccessMessage
          title="Email đã được gửi thành công!"
          message={`Mật khẩu mới đã được gửi tới: ${email}. Vui lòng kiểm tra hộp thư và đăng nhập lại với mật khẩu mới.`}
          actionText="Quay lại đăng nhập"
          onAction={() => navigate('/authentication/sign-in')}
          secondaryText="Thử lại"
          onSecondaryAction={() => setSuccess(false)}
        />
      </IllustrationLayout>
    );
  }

  return (
    <>
      <IllustrationLayout
        title="Quên mật khẩu"
        description="Nhập email để nhận mật khẩu mới"
        illustration={{
          image: bgImage,
          title: '"Quên mật khẩu?"',
          description: "Đừng lo lắng! Chúng tôi sẽ gửi mật khẩu mới tới email của bạn.",
        }}
      >
        <ArgonBox component="form" role="form" onSubmit={handleSubmit}>
          <ArgonBox mb={2}>
            <ArgonInput 
              type="email" 
              placeholder="Nhập email của bạn" 
              size="large"
              value={email}
              onChange={handleEmailChange}
              error={!!error}
            />
            {error && (
              <ArgonTypography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {error}
              </ArgonTypography>
            )}
          </ArgonBox>

          <ArgonBox mb={4}>
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
                'Gửi mật khẩu mới'
              )}
            </ArgonButton>
          </ArgonBox>

          <ArgonBox textAlign="center">
            <ArgonTypography variant="button" color="text" fontWeight="regular">
              Nhớ mật khẩu?{' '}
              <ArgonTypography
                component={Link}
                to="/authentication/sign-in"
                variant="button"
                color="info"
                fontWeight="medium"
              >
                Đăng nhập
              </ArgonTypography>
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

export default ForgotPassword;
