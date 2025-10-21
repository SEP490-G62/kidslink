import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Typography, Box } from '@mui/material';
import { useAuth } from 'context/AuthContext';

function Unauthorized() {
  const { user, logout } = useAuth();

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
      >
        <Typography variant="h1" color="error" sx={{ fontSize: '6rem', mb: 2 }}>
          403
        </Typography>
        <Typography variant="h4" gutterBottom>
          Không có quyền truy cập
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Xin lỗi, bạn không có quyền truy cập vào trang này.
          {user && (
            <span>
              <br />
              Vai trò hiện tại của bạn: <strong>{user.role}</strong>
            </span>
          )}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/"
          >
            Về trang chủ
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={logout}
          >
            Đăng xuất
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Unauthorized;




