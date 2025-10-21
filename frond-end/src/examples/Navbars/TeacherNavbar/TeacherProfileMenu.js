import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, Avatar, Divider, Icon } from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import { useAuth } from 'context/AuthContext';

const TeacherProfileMenu = ({ 
  open, 
  anchorEl, 
  onClose, 
  user 
}) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleProfileClick = () => {
    // TODO: Navigate to profile page
    console.log('Navigate to profile page');
    onClose();
  };

  const handleSettingsClick = () => {
    // TODO: Navigate to settings page
    console.log('Navigate to settings page');
    onClose();
  };

  const handleHelpClick = () => {
    // TODO: Navigate to help page
    console.log('Navigate to help page');
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      sx={{ 
        mt: 1,
        '& .MuiPaper-root': {
          minWidth: 200,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      {/* User Info Header */}
      <ArgonBox px={2} py={1.5}>
        <ArgonBox display="flex" alignItems="center" mb={1}>
          <Avatar 
            src={user?.avatar} 
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 1,
              border: '2px solid',
              borderColor: 'success.main'
            }}
          >
            {user?.name?.charAt(0) || 'T'}
          </Avatar>
          <ArgonBox>
            <ArgonTypography variant="subtitle1" fontWeight="bold">
              {user?.name || 'Giáo viên'}
            </ArgonTypography>
            <ArgonTypography variant="body2" color="text">
              {user?.email || 'teacher@kidslink.com'}
            </ArgonTypography>
          </ArgonBox>
        </ArgonBox>
        <ArgonTypography variant="caption" color="success.main" fontWeight="medium">
          🎓 Giáo viên mầm non
        </ArgonTypography>
      </ArgonBox>
      
      <Divider />
      
      {/* Menu Items */}
      <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
        <Icon sx={{ mr: 1.5, color: 'info.main' }}>person</Icon>
        <ArgonTypography variant="body2">Hồ sơ cá nhân</ArgonTypography>
      </MenuItem>
      
      <MenuItem onClick={handleSettingsClick} sx={{ py: 1.5 }}>
        <Icon sx={{ mr: 1.5, color: 'warning.main' }}>settings</Icon>
        <ArgonTypography variant="body2">Cài đặt</ArgonTypography>
      </MenuItem>
      
      <MenuItem onClick={handleHelpClick} sx={{ py: 1.5 }}>
        <Icon sx={{ mr: 1.5, color: 'info.main' }}>help</Icon>
        <ArgonTypography variant="body2">Trợ giúp</ArgonTypography>
      </MenuItem>
      
      <Divider />
      
      <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
        <Icon sx={{ mr: 1.5, color: 'error.main' }}>logout</Icon>
        <ArgonTypography variant="body2" color="error.main" fontWeight="medium">
          Đăng xuất
        </ArgonTypography>
      </MenuItem>
    </Menu>
  );
};

// PropTypes validation
TeacherProfileMenu.propTypes = {
  open: PropTypes.bool.isRequired,
  anchorEl: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string,
  }),
};

export default TeacherProfileMenu;
