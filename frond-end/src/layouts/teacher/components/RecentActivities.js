import React from 'react';
import { 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar,
  Chip,
  Box,
  Divider
} from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';

const RecentActivities = () => {
  // Mock data - trong thực tế sẽ lấy từ API
  const activities = [
    {
      id: 1,
      type: 'attendance',
      title: 'Điểm danh lớp Mầm Non A1',
      description: '25/25 học sinh có mặt',
      time: '9:00 AM',
      status: 'completed',
      icon: 'ni ni-check-bold'
    },
    {
      id: 2,
      type: 'photo',
      title: 'Chia sẻ ảnh hoạt động',
      description: 'Đã chia sẻ 5 ảnh hoạt động ngoài trời',
      time: '10:30 AM',
      status: 'completed',
      icon: 'ni ni-camera-compact'
    },
    {
      id: 3,
      type: 'report',
      title: 'Báo cáo hàng ngày',
      description: 'Đã gửi báo cáo cho phụ huynh',
      time: '2:00 PM',
      status: 'completed',
      icon: 'ni ni-single-copy-04'
    },
    {
      id: 4,
      type: 'notification',
      title: 'Thông báo mới',
      description: 'Nhắc nhở về chuyến dã ngoại tuần tới',
      time: '3:30 PM',
      status: 'pending',
      icon: 'ni ni-notification-70'
    },
    {
      id: 5,
      type: 'meeting',
      title: 'Họp phụ huynh',
      description: 'Cuộc họp với phụ huynh Nguyễn Minh An',
      time: '4:00 PM',
      status: 'upcoming',
      icon: 'ni ni-calendar-badge'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'upcoming': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Chờ xử lý';
      case 'upcoming': return 'Sắp tới';
      default: return 'Không xác định';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'attendance': return 'info';
      case 'photo': return 'success';
      case 'report': return 'warning';
      case 'notification': return 'error';
      case 'meeting': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
          Hoạt động gần đây
        </ArgonTypography>
        
        <List>
          {activities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${getTypeColor(activity.type)}.main`,
                      width: 40,
                      height: 40
                    }}
                  >
                    <ArgonBox
                      component="i"
                      className={activity.icon}
                      color="white"
                      fontSize="16px"
                    />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <ArgonTypography variant="body2" fontWeight="medium">
                        {activity.title}
                      </ArgonTypography>
                      <Chip 
                        label={getStatusText(activity.status)}
                        color={getStatusColor(activity.status)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <ArgonTypography variant="caption" color="text" display="block">
                        {activity.description}
                      </ArgonTypography>
                      <ArgonTypography variant="caption" color="primary" fontWeight="medium">
                        {activity.time}
                      </ArgonTypography>
                    </Box>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        
        <ArgonBox mt={2} textAlign="center">
          <ArgonTypography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Xem tất cả hoạt động
          </ArgonTypography>
        </ArgonBox>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
