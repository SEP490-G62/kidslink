/**
=========================================================
* KidsLink Teacher Students Page - v1.0.0
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
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Avatar,
  Chip,
  Box,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';

const TeacherStudents = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - trong thực tế sẽ lấy từ API
  const students = [
    {
      id: 1,
      name: 'Nguyễn Minh An',
      class: 'Lớp Mầm Non A1',
      avatar: '/static/images/avatar1.jpg',
      status: 'present',
      lastActivity: '2 giờ trước',
      parentName: 'Nguyễn Văn A',
      parentPhone: '0123456789',
      birthday: '15/03/2020',
      address: '123 Đường ABC, Quận 1, TP.HCM'
    },
    {
      id: 2,
      name: 'Trần Thị Bình',
      class: 'Lớp Mầm Non A1',
      avatar: '/static/images/avatar2.jpg',
      status: 'present',
      lastActivity: '1 giờ trước',
      parentName: 'Trần Thị B',
      parentPhone: '0987654321',
      birthday: '22/07/2020',
      address: '456 Đường DEF, Quận 2, TP.HCM'
    },
    {
      id: 3,
      name: 'Lê Văn Cường',
      class: 'Lớp Mầm Non A2',
      avatar: '/static/images/avatar3.jpg',
      status: 'absent',
      lastActivity: 'Hôm qua',
      parentName: 'Lê Thị C',
      parentPhone: '0369258147',
      birthday: '08/11/2019',
      address: '789 Đường GHI, Quận 3, TP.HCM'
    },
    {
      id: 4,
      name: 'Phạm Thị Dung',
      class: 'Lớp Mầm Non A2',
      avatar: '/static/images/avatar4.jpg',
      status: 'present',
      lastActivity: '30 phút trước',
      parentName: 'Phạm Văn D',
      parentPhone: '0741852963',
      birthday: '03/05/2020',
      address: '321 Đường JKL, Quận 4, TP.HCM'
    },
    {
      id: 5,
      name: 'Hoàng Văn Em',
      class: 'Lớp Mầm Non B1',
      avatar: '/static/images/avatar5.jpg',
      status: 'late',
      lastActivity: '1 giờ trước',
      parentName: 'Hoàng Thị E',
      parentPhone: '0852741963',
      birthday: '12/09/2019',
      address: '654 Đường MNO, Quận 5, TP.HCM'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Có mặt';
      case 'absent': return 'Vắng mặt';
      case 'late': return 'Đi muộn';
      default: return 'Không xác định';
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" mb={1}>
            Quản lý học sinh
          </ArgonTypography>
          <ArgonTypography variant="body1" color="text">
            Quản lý và theo dõi thông tin học sinh trong các lớp
          </ArgonTypography>
        </ArgonBox>

        {/* Statistics */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="primary" fontWeight="bold">
                  {students.length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Tổng số học sinh
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="success" fontWeight="bold">
                  {students.filter(s => s.status === 'present').length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Có mặt hôm nay
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="error" fontWeight="bold">
                  {students.filter(s => s.status === 'absent').length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Vắng mặt
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" color="warning" fontWeight="bold">
                  {students.filter(s => s.status === 'late').length}
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Đi muộn
                </ArgonTypography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Actions */}
        <ArgonBox mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm học sinh, lớp học, phụ huynh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton edge="start">
                        <i className="ni ni-zoom-split-in" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} textAlign="right">
              <ArgonButton variant="contained" color="info" sx={{ mr: 1 }}>
                Điểm danh
              </ArgonButton>
              <ArgonButton variant="outlined" color="info">
                Thêm học sinh
              </ArgonButton>
            </Grid>
          </Grid>
        </ArgonBox>

        {/* Students Table */}
        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
              Danh sách học sinh
            </ArgonTypography>
            
            <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Học sinh</strong></TableCell>
                    <TableCell><strong>Lớp</strong></TableCell>
                    <TableCell><strong>Trạng thái</strong></TableCell>
                    <TableCell><strong>Phụ huynh</strong></TableCell>
                    <TableCell><strong>Hoạt động cuối</strong></TableCell>
                    <TableCell><strong>Thao tác</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar 
                            src={student.avatar} 
                            sx={{ width: 40, height: 40, mr: 2 }}
                          >
                            {student.name.charAt(0)}
                          </Avatar>
                          <ArgonBox>
                            <ArgonTypography variant="body2" fontWeight="medium">
                              {student.name}
                            </ArgonTypography>
                            <ArgonTypography variant="caption" color="text">
                              {student.birthday}
                            </ArgonTypography>
                          </ArgonBox>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2">
                          {student.class}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(student.status)}
                          color={getStatusColor(student.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <ArgonBox>
                          <ArgonTypography variant="body2" fontWeight="medium">
                            {student.parentName}
                          </ArgonTypography>
                          <ArgonTypography variant="caption" color="text">
                            {student.parentPhone}
                          </ArgonTypography>
                        </ArgonBox>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" color="text">
                          {student.lastActivity}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonButton 
                          variant="text" 
                          color="primary" 
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          Xem
                        </ArgonButton>
                        <ArgonButton 
                          variant="text" 
                          color="info" 
                          size="small"
                        >
                          Sửa
                        </ArgonButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default TeacherStudents;



