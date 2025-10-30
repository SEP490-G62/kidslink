import React from 'react';
import { Card, CardContent, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

const QuickActions = () => {
  const actions = [
    {
      icon: 'ni ni-calendar-grid-58',
      title: 'Điểm danh',
      description: 'Điểm danh học sinh hôm nay',
      color: 'info'
    },
    {
      icon: 'ni ni-single-copy-04',
      title: 'Tạo báo cáo',
      description: 'Viết báo cáo hoạt động',
      color: 'success'
    },
    {
      icon: 'ni ni-notification-70',
      title: 'Gửi thông báo',
      description: 'Thông báo đến phụ huynh',
      color: 'warning'
    },
    {
      icon: 'ni ni-camera-compact',
      title: 'Chia sẻ ảnh',
      description: 'Chia sẻ ảnh hoạt động',
      color: 'error'
    },
    {
      icon: 'ni ni-calendar-badge',
      title: 'Lịch học',
      description: 'Xem lịch học tuần',
      color: 'dark'
    },
    {
      icon: 'ni ni-settings-gear-65',
      title: 'Cài đặt lớp',
      description: 'Quản lý cài đặt lớp học',
      color: 'secondary'
    }
  ];

  return (
    <Card>
      <CardContent>
        <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
          Thao tác nhanh
        </ArgonTypography>
        
        <List>
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              <ListItem 
                sx={{ 
                  cursor: 'pointer',
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon>
                  <ArgonBox
                    component="i"
                    className={action.icon}
                    color={action.color}
                    fontSize="20px"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <ArgonTypography variant="body2" fontWeight="medium">
                      {action.title}
                    </ArgonTypography>
                  }
                  secondary={
                    <ArgonTypography variant="caption" color="text">
                      {action.description}
                    </ArgonTypography>
                  }
                />
              </ListItem>
              {index < actions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        
        <ArgonBox mt={2}>
          <ArgonButton 
            variant="contained" 
            color="info" 
            fullWidth
            size="small"
          >
            Xem tất cả thao tác
          </ArgonButton>
        </ArgonBox>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
