import React from 'react';
import { Card, CardContent, List, ListItem, ListItemText, Chip, Box, Divider } from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';

const WeeklySchedule = () => {
  // Mock data - trong thực tế sẽ lấy từ API
  const schedule = [
    {
      day: 'Thứ 2',
      date: '25/11',
      activities: [
        { time: '8:00', class: 'Mầm Non A1', activity: 'Điểm danh & Chào buổi sáng', status: 'completed' },
        { time: '9:00', class: 'Mầm Non A1', activity: 'Hoạt động ngoài trời', status: 'completed' },
        { time: '10:30', class: 'Mầm Non A2', activity: 'Giờ học vẽ', status: 'completed' },
        { time: '14:00', class: 'Mầm Non B1', activity: 'Giờ học toán', status: 'upcoming' },
        { time: '15:30', class: 'Mầm Non A1', activity: 'Kể chuyện', status: 'upcoming' }
      ]
    },
    {
      day: 'Thứ 3',
      date: '26/11',
      activities: [
        { time: '8:00', class: 'Mầm Non A1', activity: 'Điểm danh & Chào buổi sáng', status: 'upcoming' },
        { time: '9:00', class: 'Mầm Non A1', activity: 'Dã ngoại công viên', status: 'upcoming' },
        { time: '10:30', class: 'Mầm Non A2', activity: 'Giờ học hát', status: 'upcoming' },
        { time: '14:00', class: 'Mầm Non B1', activity: 'Thí nghiệm khoa học', status: 'upcoming' }
      ]
    },
    {
      day: 'Thứ 4',
      date: '27/11',
      activities: [
        { time: '8:00', class: 'Mầm Non A1', activity: 'Điểm danh & Chào buổi sáng', status: 'upcoming' },
        { time: '9:00', class: 'Mầm Non A1', activity: 'Hoạt động thể chất', status: 'upcoming' },
        { time: '10:30', class: 'Mầm Non A2', activity: 'Giờ học tiếng Anh', status: 'upcoming' },
        { time: '14:00', class: 'Mầm Non B1', activity: 'Làm đồ thủ công', status: 'upcoming' }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'upcoming': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'upcoming': return 'Sắp tới';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const getCurrentDay = () => {
    const today = new Date();
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return dayNames[today.getDay()];
  };

  return (
    <Card>
      <CardContent>
        <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
          Lịch học tuần này
        </ArgonTypography>
        
        {schedule.map((daySchedule, dayIndex) => (
          <Box key={dayIndex}>
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={1}
              sx={{
                backgroundColor: daySchedule.day === getCurrentDay() ? 'primary.light' : 'transparent',
                borderRadius: 1,
                p: 1
              }}
            >
              <ArgonTypography variant="subtitle1" fontWeight="bold">
                {daySchedule.day} - {daySchedule.date}
              </ArgonTypography>
              {daySchedule.day === getCurrentDay() && (
                <Chip label="Hôm nay" color="primary" size="small" />
              )}
            </Box>
            
            <List dense>
              {daySchedule.activities.map((activity, activityIndex) => (
                <React.Fragment key={activityIndex}>
                  <ListItem sx={{ py: 0.5, px: 0 }}>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <ArgonTypography variant="body2" fontWeight="medium">
                            {activity.time} - {activity.class}
                          </ArgonTypography>
                          <Chip 
                            label={getStatusText(activity.status)}
                            color={getStatusColor(activity.status)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <ArgonTypography variant="body2" color="text">
                          {activity.activity}
                        </ArgonTypography>
                      }
                    />
                  </ListItem>
                  {activityIndex < daySchedule.activities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            
            {dayIndex < schedule.length - 1 && (
              <Box my={2}>
                <Divider />
              </Box>
            )}
          </Box>
        ))}
        
        <Box mt={2} textAlign="center">
          <ArgonTypography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Xem lịch đầy đủ
          </ArgonTypography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeeklySchedule;
