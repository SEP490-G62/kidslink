import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';

const ForgotPasswordDemo = () => {
  const [showDemo, setShowDemo] = useState(false);

  const demoSteps = [
    {
      step: 1,
      title: "Truy cập trang quên mật khẩu",
      description: "Click vào link 'Quên mật khẩu?' ở trang đăng nhập",
      action: "Đi đến trang forgot-password"
    },
    {
      step: 2,
      title: "Nhập email",
      description: "Nhập email đã đăng ký trong hệ thống",
      action: "Nhập email hợp lệ"
    },
    {
      step: 3,
      title: "Gửi yêu cầu",
      description: "Click 'Gửi mật khẩu mới' và chờ xử lý",
      action: "Gửi yêu cầu reset"
    },
    {
      step: 4,
      title: "Kiểm tra email",
      description: "Mở hộp thư và tìm email chứa mật khẩu mới",
      action: "Kiểm tra email (bao gồm spam)"
    },
    {
      step: 5,
      title: "Đăng nhập lại",
      description: "Sử dụng mật khẩu mới để đăng nhập",
      action: "Đăng nhập với mật khẩu mới"
    }
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        🔐 Demo Chức Năng Quên Mật Khẩu
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Lưu ý:</strong> Để test chức năng này, bạn cần:
          <br />• Backend đang chạy trên port 5000
          <br />• Email service đã được cấu hình
          <br />• Có tài khoản đã đăng ký trong hệ thống
        </Typography>
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🚀 Bắt đầu Demo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click vào nút bên dưới để truy cập trang quên mật khẩu và test chức năng.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/authentication/forgot-password"
            size="large"
          >
            Test Quên Mật Khẩu
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Hướng dẫn từng bước
          </Typography>
          
          {demoSteps.map((step, index) => (
            <Box key={step.step} sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    fontWeight: 'bold'
                  }}
                >
                  {step.step}
                </Box>
                <Typography variant="h6">
                  {step.title}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ ml: 5, mb: 1 }}>
                {step.description}
              </Typography>
              
              <Typography variant="caption" color="primary" sx={{ ml: 5, fontStyle: 'italic' }}>
                → {step.action}
              </Typography>
              
              {index < demoSteps.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>💡 Mẹo:</strong> Nếu không nhận được email, hãy kiểm tra thư mục spam hoặc 
          liên hệ admin để kiểm tra cấu hình email service.
        </Typography>
      </Box>
    </Box>
  );
};

export default ForgotPasswordDemo;




