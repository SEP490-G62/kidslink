import React from 'react';
import { Button } from '@mui/material';
import { useAuth } from 'context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LogoutButton = ({ variant = 'outlined', color = 'primary', ...props }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/authentication/sign-in');
  };

  return (
    <Button
      variant={variant}
      color={color}
      onClick={handleLogout}
      {...props}
    >
      Đăng xuất
    </Button>
  );
};

export default LogoutButton;




