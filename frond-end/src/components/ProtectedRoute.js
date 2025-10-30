import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, hasAnyRole, loading } = useAuth();
  const location = useLocation();

  // Hiển thị loading khi đang kiểm tra authentication
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Nếu chưa đăng nhập, redirect về trang đăng nhập
  if (!isAuthenticated()) {
    return <Navigate to="/authentication/sign-in" state={{ from: location }} replace />;
  }

  // Nếu có yêu cầu role cụ thể và user không có quyền
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Nếu đã đăng nhập và có quyền, render children
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.arrayOf(PropTypes.string)
};

export default ProtectedRoute;
