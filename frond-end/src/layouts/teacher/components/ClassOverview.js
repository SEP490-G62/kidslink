import React from 'react';
import { Grid, Card, CardContent, CardActions, Button, Chip, Box } from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

const ClassOverview = () => {
  // Mock data - trong thực tế sẽ lấy từ API
  const classes = [
    {
      id: 1,
      name: 'Lớp Mầm Non A1',
      ageGroup: '3-4 tuổi',
      studentCount: 25,
      status: 'active',
      nextActivity: 'Hoạt động ngoài trời - 9:00 AM'
    },
    {
      id: 2,
      name: 'Lớp Mầm Non A2',
      ageGroup: '4-5 tuổi',
      studentCount: 22,
      status: 'active',
      nextActivity: 'Giờ học vẽ - 10:30 AM'
    },
    {
      id: 3,
      name: 'Lớp Mầm Non B1',
      ageGroup: '5-6 tuổi',
      studentCount: 28,
      status: 'active',
      nextActivity: 'Giờ học toán - 2:00 PM'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      default: return 'info';
    }
  };

  return (
    <ArgonBox>
      <ArgonTypography variant="h5" fontWeight="bold" mb={2}>
        Tổng quan lớp học
      </ArgonTypography>
      <Grid container spacing={2}>
        {classes.map((classItem) => (
          <Grid item xs={12} md={6} lg={4} key={classItem.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <ArgonTypography variant="h6" fontWeight="bold">
                    {classItem.name}
                  </ArgonTypography>
                  <Chip 
                    label={classItem.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                    color={getStatusColor(classItem.status)}
                    size="small"
                  />
                </Box>
                
                <ArgonTypography variant="body2" color="text" mb={1}>
                  <strong>Độ tuổi:</strong> {classItem.ageGroup}
                </ArgonTypography>
                
                <ArgonTypography variant="body2" color="text" mb={1}>
                  <strong>Số học sinh:</strong> {classItem.studentCount}
                </ArgonTypography>
                
                <ArgonTypography variant="body2" color="text">
                  <strong>Hoạt động tiếp theo:</strong>
                </ArgonTypography>
                <ArgonTypography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                  {classItem.nextActivity}
                </ArgonTypography>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <ArgonButton 
                  variant="outlined" 
                  color="info" 
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Xem chi tiết
                </ArgonButton>
                <ArgonButton 
                  variant="contained" 
                  color="info" 
                  size="small"
                >
                  Quản lý lớp
                </ArgonButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </ArgonBox>
  );
};

export default ClassOverview;
