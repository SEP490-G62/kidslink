/**
=========================================================
* KidsLink Teacher Classes Page - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================
*/

import React from 'react';
import { Grid, Card, CardContent, CardActions, Button, Chip, Box, Typography } from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';

const TeacherClasses = () => {
  // Mock data - trong thực tế sẽ lấy từ API
  const classes = [
    {
      id: 1,
      name: 'Lớp Mầm Non A1',
      ageGroup: '3-4 tuổi',
      studentCount: 25,
      maxStudents: 30,
      status: 'active',
      teacher: 'Nguyễn Thị Lan',
      room: 'Phòng 101',
      schedule: 'Thứ 2-6, 8:00-16:00',
      nextActivity: 'Hoạt động ngoài trời - 9:00 AM'
    },
    {
      id: 2,
      name: 'Lớp Mầm Non A2',
      ageGroup: '4-5 tuổi',
      studentCount: 22,
      maxStudents: 30,
      status: 'active',
      teacher: 'Trần Văn Minh',
      room: 'Phòng 102',
      schedule: 'Thứ 2-6, 8:00-16:00',
      nextActivity: 'Giờ học vẽ - 10:30 AM'
    },
    {
      id: 3,
      name: 'Lớp Mầm Non B1',
      ageGroup: '5-6 tuổi',
      studentCount: 28,
      maxStudents: 30,
      status: 'active',
      teacher: 'Lê Thị Hoa',
      room: 'Phòng 103',
      schedule: 'Thứ 2-6, 8:00-16:00',
      nextActivity: 'Giờ học toán - 2:00 PM'
    },
    {
      id: 4,
      name: 'Lớp Mầm Non C1',
      ageGroup: '2-3 tuổi',
      studentCount: 18,
      maxStudents: 25,
      status: 'inactive',
      teacher: 'Phạm Văn Đức',
      room: 'Phòng 104',
      schedule: 'Thứ 2-6, 8:00-16:00',
      nextActivity: 'Tạm dừng hoạt động'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'maintenance': return 'warning';
      default: return 'info';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Tạm dừng';
      case 'maintenance': return 'Bảo trì';
      default: return 'Không xác định';
    }
  };

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" mb={1}>
            Quản lý lớp học
          </ArgonTypography>
          <ArgonTypography variant="body1" color="text">
            Quản lý và theo dõi các lớp học được phân công
          </ArgonTypography>
        </ArgonBox>

        {/* Statistics */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="primary" fontWeight="bold">
                  {classes.length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Tổng số lớp
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="success" fontWeight="bold">
                  {classes.filter(c => c.status === 'active').length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Lớp hoạt động
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="info" fontWeight="bold">
                  {classes.reduce((sum, c) => sum + c.studentCount, 0)}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Tổng học sinh
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="warning" fontWeight="bold">
                  {classes.filter(c => c.studentCount >= c.maxStudents * 0.9).length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Lớp gần đầy
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Classes List */}
        <Grid container spacing={3}>
          {classes.map((classItem) => (
            <Grid item xs={12} md={6} lg={4} key={classItem.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <ArgonTypography variant="h6" fontWeight="bold">
                      {classItem.name}
                    </ArgonTypography>
                    <Chip 
                      label={getStatusText(classItem.status)}
                      color={getStatusColor(classItem.status)}
                      size="small"
                    />
                  </Box>
                  
                  <ArgonTypography variant="body2" color="text" mb={1}>
                    <strong>Độ tuổi:</strong> {classItem.ageGroup}
                  </ArgonTypography>
                  
                  <ArgonTypography variant="body2" color="text" mb={1}>
                    <strong>Học sinh:</strong> {classItem.studentCount}/{classItem.maxStudents}
                  </ArgonTypography>
                  
                  <ArgonTypography variant="body2" color="text" mb={1}>
                    <strong>Giáo viên:</strong> {classItem.teacher}
                  </ArgonTypography>
                  
                  <ArgonTypography variant="body2" color="text" mb={1}>
                    <strong>Phòng:</strong> {classItem.room}
                  </ArgonTypography>
                  
                  <ArgonTypography variant="body2" color="text" mb={1}>
                    <strong>Lịch học:</strong> {classItem.schedule}
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
                    Chi tiết
                  </ArgonButton>
                  <ArgonButton 
                    variant="contained" 
                    color="info" 
                    size="small"
                  >
                    Quản lý
                  </ArgonButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default TeacherClasses;



