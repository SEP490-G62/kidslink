/**
=========================================================
* KidsLink Teacher Reports Page - v1.0.0
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
  InputLabel
} from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';

const TeacherReports = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [reportType, setReportType] = useState('daily');

  // Mock data - trong thực tế sẽ lấy từ API
  const classes = [
    { id: 1, name: 'Lớp Mầm Non A1' },
    { id: 2, name: 'Lớp Mầm Non A2' },
    { id: 3, name: 'Lớp Mầm Non B1' },
  ];

  const reports = [
    {
      id: 1,
      title: 'Báo cáo hàng ngày - Lớp A1',
      type: 'daily',
      class: 'Lớp Mầm Non A1',
      date: '25/11/2024',
      status: 'completed',
      summary: 'Tất cả học sinh đều có mặt, hoạt động diễn ra bình thường',
      activities: [
        'Điểm danh: 25/25 học sinh có mặt',
        'Hoạt động ngoài trời: Vui chơi tại sân trường',
        'Giờ học vẽ: Vẽ tranh chủ đề gia đình',
        'Giờ ăn: Tất cả học sinh ăn hết suất',
        'Ngủ trưa: 25/25 học sinh ngủ đúng giờ'
      ]
    },
    {
      id: 2,
      title: 'Báo cáo tuần - Lớp A1',
      type: 'weekly',
      class: 'Lớp Mầm Non A1',
      date: '18-22/11/2024',
      status: 'completed',
      summary: 'Tuần học diễn ra tốt, học sinh tiến bộ rõ rệt',
      activities: [
        'Tỷ lệ có mặt: 98%',
        'Hoạt động nổi bật: Dã ngoại công viên',
        'Học sinh tiến bộ: 5 em',
        'Cần chú ý: 2 em cần hỗ trợ thêm'
      ]
    },
    {
      id: 3,
      title: 'Báo cáo sức khỏe - Lớp A2',
      type: 'health',
      class: 'Lớp Mầm Non A2',
      date: '24/11/2024',
      status: 'pending',
      summary: 'Cần theo dõi sức khỏe của 1 học sinh',
      activities: [
        'Học sinh Nguyễn Minh An: Sốt nhẹ, đã gọi phụ huynh',
        'Các học sinh khác: Sức khỏe bình thường',
        'Đã thông báo cho y tế trường'
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'draft': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Chờ duyệt';
      case 'draft': return 'Bản nháp';
      default: return 'Không xác định';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'daily': return 'Hàng ngày';
      case 'weekly': return 'Hàng tuần';
      case 'monthly': return 'Hàng tháng';
      case 'health': return 'Sức khỏe';
      case 'activity': return 'Hoạt động';
      default: return 'Khác';
    }
  };

  const filteredReports = reports.filter(report => {
    if (selectedClass && report.class !== selectedClass) return false;
    if (reportType && report.type !== reportType) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" mb={1}>
            Báo cáo
          </ArgonTypography>
          <ArgonTypography variant="body1" color="text">
            Tạo và quản lý các báo cáo về lớp học và học sinh
          </ArgonTypography>
        </ArgonBox>

        {/* Statistics */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="primary" fontWeight="bold">
                  {reports.length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Tổng số báo cáo
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="success" fontWeight="bold">
                  {reports.filter(r => r.status === 'completed').length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Đã hoàn thành
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="warning" fontWeight="bold">
                  {reports.filter(r => r.status === 'pending').length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Chờ duyệt
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="info" fontWeight="bold">
                  {reports.filter(r => r.status === 'draft').length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Bản nháp
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <ArgonBox mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Lớp học</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  label="Lớp học"
                >
                  <MenuItem value="">Tất cả lớp</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Loại báo cáo</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Loại báo cáo"
                >
                  <MenuItem value="">Tất cả loại</MenuItem>
                  <MenuItem value="daily">Hàng ngày</MenuItem>
                  <MenuItem value="weekly">Hàng tuần</MenuItem>
                  <MenuItem value="monthly">Hàng tháng</MenuItem>
                  <MenuItem value="health">Sức khỏe</MenuItem>
                  <MenuItem value="activity">Hoạt động</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} textAlign="right">
              <ArgonButton variant="contained" color="info" sx={{ mr: 1 }}>
                Tạo báo cáo mới
              </ArgonButton>
              <ArgonButton variant="outlined" color="info">
                Xuất Excel
              </ArgonButton>
            </Grid>
          </Grid>
        </ArgonBox>

        {/* Reports List */}
        <Grid container spacing={3}>
          {filteredReports.map((report) => (
            <Grid item xs={12} md={6} lg={4} key={report.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <ArgonTypography variant="h6" fontWeight="bold">
                      {report.title}
                    </ArgonTypography>
                    <Chip 
                      label={getStatusText(report.status)}
                      color={getStatusColor(report.status)}
                      size="small"
                    />
                  </Box>
                  
                  <ArgonTypography variant="body2" color="text" mb={1}>
                    <strong>Lớp:</strong> {report.class}
                  </ArgonTypography>
                  
                  <ArgonTypography variant="body2" color="text" mb={1}>
                    <strong>Ngày:</strong> {report.date}
                  </ArgonTypography>
                  
                  <ArgonTypography variant="body2" color="text" mb={1}>
                    <strong>Loại:</strong> {getTypeText(report.type)}
                  </ArgonTypography>
                  
                  <ArgonTypography variant="body2" color="text" mb={2}>
                    <strong>Tóm tắt:</strong> {report.summary}
                  </ArgonTypography>
                  
                  <ArgonTypography variant="body2" color="text" mb={1}>
                    <strong>Hoạt động chính:</strong>
                  </ArgonTypography>
                  <List dense>
                    {report.activities.slice(0, 3).map((activity, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon>
                          <i className="ni ni-check-bold" style={{ fontSize: '12px' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <ArgonTypography variant="caption" color="text">
                              {activity}
                            </ArgonTypography>
                          }
                        />
                      </ListItem>
                    ))}
                    {report.activities.length > 3 && (
                      <ListItem sx={{ py: 0.5, px: 0 }}>
                        <ListItemText 
                          primary={
                            <ArgonTypography variant="caption" color="primary">
                              +{report.activities.length - 3} hoạt động khác
                            </ArgonTypography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
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
                    Chỉnh sửa
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

export default TeacherReports;



