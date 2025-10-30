/**
=========================================================
* KidsLink Teacher Schedule Page - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================
*/

import React, { useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Divider,
  Chip,
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';

const TeacherSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('week');

  // Mock data - trong thực tế sẽ lấy từ API
  const schedule = [
    {
      id: 1,
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
      id: 2,
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
      id: 3,
      day: 'Thứ 4',
      date: '27/11',
      activities: [
        { time: '8:00', class: 'Mầm Non A1', activity: 'Điểm danh & Chào buổi sáng', status: 'upcoming' },
        { time: '9:00', class: 'Mầm Non A1', activity: 'Hoạt động thể chất', status: 'upcoming' },
        { time: '10:30', class: 'Mầm Non A2', activity: 'Giờ học tiếng Anh', status: 'upcoming' },
        { time: '14:00', class: 'Mầm Non B1', activity: 'Làm đồ thủ công', status: 'upcoming' }
      ]
    },
    {
      id: 4,
      day: 'Thứ 5',
      date: '28/11',
      activities: [
        { time: '8:00', class: 'Mầm Non A1', activity: 'Điểm danh & Chào buổi sáng', status: 'upcoming' },
        { time: '9:00', class: 'Mầm Non A1', activity: 'Giờ học đọc', status: 'upcoming' },
        { time: '10:30', class: 'Mầm Non A2', activity: 'Hoạt động nhóm', status: 'upcoming' },
        { time: '14:00', class: 'Mầm Non B1', activity: 'Giờ học viết', status: 'upcoming' }
      ]
    },
    {
      id: 5,
      day: 'Thứ 6',
      date: '29/11',
      activities: [
        { time: '8:00', class: 'Mầm Non A1', activity: 'Điểm danh & Chào buổi sáng', status: 'upcoming' },
        { time: '9:00', class: 'Mầm Non A1', activity: 'Tổng kết tuần', status: 'upcoming' },
        { time: '10:30', class: 'Mầm Non A2', activity: 'Hoạt động tự do', status: 'upcoming' },
        { time: '14:00', class: 'Mầm Non B1', activity: 'Họp phụ huynh', status: 'upcoming' }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'upcoming': return 'info';
      case 'cancelled': return 'error';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'upcoming': return 'Sắp tới';
      case 'cancelled': return 'Đã hủy';
      case 'in-progress': return 'Đang diễn ra';
      default: return 'Không xác định';
    }
  };

  const getCurrentDay = () => {
    const today = new Date();
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return dayNames[today.getDay()];
  };

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" mb={1}>
            Lịch học
          </ArgonTypography>
          <ArgonTypography variant="body1" color="text">
            Xem và quản lý lịch học hàng tuần
          </ArgonTypography>
        </ArgonBox>

        {/* Controls */}
        <ArgonBox mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Chọn ngày"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Chế độ xem</InputLabel>
                <Select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  label="Chế độ xem"
                >
                  <MenuItem value="day">Ngày</MenuItem>
                  <MenuItem value="week">Tuần</MenuItem>
                  <MenuItem value="month">Tháng</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} textAlign="right">
              <ArgonButton variant="contained" color="info" sx={{ mr: 1 }}>
                Thêm hoạt động
              </ArgonButton>
              <ArgonButton variant="outlined" color="info">
                In lịch
              </ArgonButton>
            </Grid>
          </Grid>
        </ArgonBox>

        {/* Schedule Display */}
        {viewMode === 'week' ? (
          <Grid container spacing={3}>
            {schedule.map((daySchedule) => (
              <Grid item xs={12} md={6} lg={4} key={daySchedule.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="center" 
                      mb={2}
                      sx={{
                        backgroundColor: daySchedule.day === getCurrentDay() ? 'primary.light' : 'transparent',
                        borderRadius: 1,
                        p: 1
                      }}
                    >
                      <ArgonTypography variant="h6" fontWeight="bold">
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
                            <ListItemIcon>
                              <i className="ni ni-time-alarm" style={{ fontSize: '16px' }} />
                            </ListItemIcon>
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
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <ArgonButton 
                      variant="outlined" 
                      color="info" 
                      size="small"
                      fullWidth
                    >
                      Xem chi tiết
                    </ArgonButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card>
            <CardContent>
              <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
                Lịch học chi tiết
              </ArgonTypography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Thời gian</strong></TableCell>
                      <TableCell><strong>Lớp</strong></TableCell>
                      <TableCell><strong>Hoạt động</strong></TableCell>
                      <TableCell><strong>Trạng thái</strong></TableCell>
                      <TableCell><strong>Thao tác</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {schedule.flatMap(day => 
                      day.activities.map((activity, index) => (
                        <TableRow key={`${day.id}-${index}`} hover>
                          <TableCell>
                            <ArgonTypography variant="body2" fontWeight="medium">
                              {day.day} - {activity.time}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2">
                              {activity.class}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2">
                              {activity.activity}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getStatusText(activity.status)}
                              color={getStatusColor(activity.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <ArgonButton 
                              variant="text" 
                              color="primary" 
                              size="small"
                            >
                              Chỉnh sửa
                            </ArgonButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default TeacherSchedule;



