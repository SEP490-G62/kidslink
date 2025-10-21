import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, Divider, Chip, Box } from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import NotificationItem from 'examples/Items/NotificationItem';

const TeacherNotificationMenu = ({ 
  open, 
  anchorEl, 
  onClose, 
  notifications = [] 
}) => {
  const unreadCount = notifications.filter(n => n.unread).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'meeting': return 'ni ni-calendar-badge';
      case 'trip': return 'ni ni-world';
      case 'policy': return 'ni ni-single-copy-04';
      case 'attendance': return 'ni ni-check-bold';
      case 'photo': return 'ni ni-camera-compact';
      default: return 'ni ni-notification-70';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'meeting': return 'info';
      case 'trip': return 'success';
      case 'policy': return 'warning';
      case 'attendance': return 'success';
      case 'photo': return 'primary';
      default: return 'info';
    }
  };

  const handleViewAll = () => {
    // TODO: Navigate to all notifications page
    console.log('Navigate to all notifications page');
    onClose();
  };

  const handleNotificationClick = (notification) => {
    // TODO: Handle notification click
    console.log('Notification clicked:', notification);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      sx={{ 
        mt: 2, 
        maxHeight: 400, 
        width: 350,
        '& .MuiPaper-root': {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      {/* Header */}
      <ArgonBox px={2} py={1.5}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h6" fontWeight="bold">
            Thông báo
          </ArgonTypography>
          {unreadCount > 0 && (
            <Chip 
              label={`${unreadCount} mới`} 
              color="error" 
              size="small"
            />
          )}
        </Box>
      </ArgonBox>
      
      <Divider />
      
      {/* Notifications List */}
      {notifications.length > 0 ? (
        <>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              image={
                <ArgonBox
                  component="i"
                  className={getNotificationIcon(notification.type)}
                  color={`${getNotificationColor(notification.type)}.main`}
                  fontSize="20px"
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: `${getNotificationColor(notification.type)}.light`,
                  }}
                />
              }
              title={[notification.title]}
              date={notification.time}
              onClick={() => handleNotificationClick(notification)}
              unread={notification.unread}
            />
          ))}
          
          <Divider />
          
          <MenuItem onClick={handleViewAll}>
            <ArgonTypography 
              variant="body2" 
              color="primary" 
              textAlign="center" 
              width="100%"
              fontWeight="medium"
            >
              Xem tất cả thông báo
            </ArgonTypography>
          </MenuItem>
        </>
      ) : (
        <ArgonBox px={2} py={3} textAlign="center">
          <ArgonTypography variant="body2" color="text">
            Không có thông báo mới
          </ArgonTypography>
        </ArgonBox>
      )}
    </Menu>
  );
};

// PropTypes validation
TeacherNotificationMenu.propTypes = {
  open: PropTypes.bool.isRequired,
  anchorEl: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  onClose: PropTypes.func.isRequired,
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string,
      time: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      unread: PropTypes.bool.isRequired,
    })
  ),
};

export default TeacherNotificationMenu;
