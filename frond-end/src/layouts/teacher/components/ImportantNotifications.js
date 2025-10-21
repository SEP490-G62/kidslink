import React from 'react';
import { Card, CardContent, List, ListItem, ListItemIcon, ListItemText, Chip, Box } from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';

const ImportantNotifications = () => {
  // Mock data - trong thực tế sẽ lấy từ API
  const notifications = [
    {
      id: 1,
      title: 'Họp phụ huynh tuần tới',
      message: 'Cuộc họp phụ huynh định kỳ sẽ diễn ra vào thứ 6 tuần tới lúc 2:00 PM',
      type: 'meeting',
      priority: 'high',
      time: '2 ngày trước'
    },
    {
      id: 2,
      title: 'Chuyến dã ngoại sắp tới',
      message: 'Chuẩn bị cho chuyến dã ngoại đến công viên vào thứ 3 tuần sau',
      type: 'trip',
      priority: 'medium',
      time: '1 ngày trước'
    },
    {
      id: 3,
      title: 'Cập nhật quy định mới',
      message: 'Nhà trường đã cập nhật một số quy định về an toàn cho trẻ em',
      type: 'policy',
      priority: 'high',
      time: '3 ngày trước'
    },
    {
      id: 4,
      title: 'Lớp học bổ sung',
      message: 'Bạn sẽ phụ trách thêm lớp Mầm Non C1 từ tuần tới',
      type: 'schedule',
      priority: 'medium',
      time: '4 ngày trước'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Quan trọng';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Không xác định';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'meeting': return 'ni ni-calendar-badge';
      case 'trip': return 'ni ni-world';
      case 'policy': return 'ni ni-single-copy-04';
      case 'schedule': return 'ni ni-calendar-grid-58';
      default: return 'ni ni-notification-70';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'meeting': return 'info';
      case 'trip': return 'success';
      case 'policy': return 'warning';
      case 'schedule': return 'secondary';
      default: return 'primary';
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <ArgonTypography variant="h6" fontWeight="bold">
            Thông báo quan trọng
          </ArgonTypography>
          <Chip 
            label={`${notifications.length} thông báo`}
            color="primary"
            size="small"
          />
        </Box>
        
        <List>
          {notifications.map((notification, index) => (
            <ListItem 
              key={notification.id}
              sx={{ 
                flexDirection: 'column',
                alignItems: 'flex-start',
                px: 0,
                py: 1.5,
                borderBottom: index < notifications.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider'
              }}
            >
              <Box display="flex" alignItems="center" width="100%" mb={1}>
                <ArgonBox
                  component="i"
                  className={getTypeIcon(notification.type)}
                  color={`${getTypeColor(notification.type)}.main`}
                  fontSize="18px"
                  mr={1}
                />
                <ArgonTypography variant="body2" fontWeight="bold" flexGrow={1}>
                  {notification.title}
                </ArgonTypography>
                <Chip 
                  label={getPriorityText(notification.priority)}
                  color={getPriorityColor(notification.priority)}
                  size="small"
                />
              </Box>
              
              <ArgonTypography variant="body2" color="text" mb={1} sx={{ pl: 3 }}>
                {notification.message}
              </ArgonTypography>
              
              <ArgonTypography 
                variant="caption" 
                color="primary" 
                sx={{ pl: 3, fontStyle: 'italic' }}
              >
                {notification.time}
              </ArgonTypography>
            </ListItem>
          ))}
        </List>
        
        <Box mt={2} textAlign="center">
          <ArgonTypography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Xem tất cả thông báo
          </ArgonTypography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ImportantNotifications;
