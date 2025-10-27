/**
=========================================================
* KidsLink Teacher Classes Page - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================
*/

import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, CardActions, Button, Chip, Box, Typography, Avatar, CircularProgress, Alert } from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';

// API service
import api from 'services/api';

const TeacherClasses = () => {
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClassData();
  }, []);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/teachers/class');
      setClassData(response.data);
      
      // Lấy danh sách học sinh
      const studentsResponse = await api.get('/teachers/class/students');
      setStudents(studentsResponse.data.students);
      
    } catch (err) {
      console.error('Error fetching class data:', err);
      setError(err.message || 'Không thể tải thông tin lớp học');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getGenderText = (gender) => {
    return gender === 0 ? 'Nam' : 'Nữ';
  };

  const getStatusText = (status) => {
    return status === 1 ? 'Hoạt động' : 'Tạm dừng';
  };

  const getStatusColor = (status) => {
    return status === 1 ? 'success' : 'error';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <TeacherNavbar />
        <ArgonBox py={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <TeacherNavbar />
        <ArgonBox py={3}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <ArgonButton onClick={fetchClassData} color="info">
            Thử lại
          </ArgonButton>
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout>
        <TeacherNavbar />
        <ArgonBox py={3}>
          <Alert severity="info">
            Không tìm thấy thông tin lớp học
          </Alert>
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" mb={1}>
            Lớp học của tôi
          </ArgonTypography>
          <ArgonTypography variant="body1" color="text">
            Thông tin chi tiết về lớp học được phân công
          </ArgonTypography>
        </ArgonBox>

        {/* Class Information Card */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <ArgonTypography variant="h5" fontWeight="bold">
                    {classData.class_info.class_name}
                  </ArgonTypography>
                  <Chip 
                    label="Hoạt động"
                    color="success"
                    size="small"
                  />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <ArgonTypography variant="body2" color="text" mb={1}>
                      <strong>Năm học:</strong> {classData.class_info.academic_year}
                    </ArgonTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ArgonTypography variant="body2" color="text" mb={1}>
                      <strong>Độ tuổi:</strong> {classData.class_info.class_age?.age_name || 'N/A'}
                    </ArgonTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ArgonTypography variant="body2" color="text" mb={1}>
                      <strong>Trường:</strong> {classData.class_info.school?.school_name || 'N/A'}
                    </ArgonTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ArgonTypography variant="body2" color="text" mb={1}>
                      <strong>Địa chỉ:</strong> {classData.class_info.school?.address || 'N/A'}
                    </ArgonTypography>
                  </Grid>
                  {classData.class_info.assistant_teacher && (
                    <Grid item xs={12}>
                      <ArgonTypography variant="body2" color="text" mb={1}>
                        <strong>Giáo viên phụ:</strong> {classData.class_info.assistant_teacher.user_id?.full_name || 'N/A'}
                      </ArgonTypography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
                  Thống kê lớp học
                </ArgonTypography>
                <ArgonBox mb={2}>
                  <ArgonTypography variant="h4" color="primary" fontWeight="bold">
                    {classData.statistics.total_students}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text">
                    Tổng số học sinh
                  </ArgonTypography>
                </ArgonBox>
                <ArgonBox mb={2}>
                  <ArgonTypography variant="h4" color="info" fontWeight="bold">
                    {classData.statistics.average_age}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text">
                    Tuổi trung bình
                  </ArgonTypography>
                </ArgonBox>
                <ArgonBox>
                  <ArgonTypography variant="h4" color="success" fontWeight="bold">
                    {classData.statistics.class_age_range}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text">
                    Nhóm tuổi
                  </ArgonTypography>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Students List */}
        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
              Danh sách học sinh ({students.length} học sinh)
            </ArgonTypography>
            
            {students.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                <ArgonTypography variant="body1" color="text">
                  Chưa có học sinh nào trong lớp
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <Grid container spacing={2}>
                {students.map((student) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={student._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar 
                            src={student.avatar_url} 
                            alt={student.full_name}
                            sx={{ width: 40, height: 40, mr: 2 }}
                          />
                          <Box>
                            <ArgonTypography variant="subtitle2" fontWeight="bold">
                              {student.full_name}
                            </ArgonTypography>
                            <ArgonTypography variant="caption" color="text">
                              {getGenderText(student.gender)} • {calculateAge(student.dob)} tuổi
                            </ArgonTypography>
                          </Box>
                        </Box>
                        
                        <ArgonTypography variant="body2" color="text" mb={1}>
                          <strong>Ngày sinh:</strong> {formatDate(student.dob)}
                        </ArgonTypography>
                        
                        <ArgonTypography variant="body2" color="text" mb={1}>
                          <strong>Trạng thái:</strong> 
                          <Chip 
                            label={getStatusText(student.status)}
                            color={getStatusColor(student.status)}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </ArgonTypography>
                        
                        {student.allergy && student.allergy !== 'Không' && (
                          <ArgonTypography variant="body2" color="warning" mb={1}>
                            <strong>Dị ứng:</strong> {student.allergy}
                          </ArgonTypography>
                        )}
                        
                        {student.discount > 0 && (
                          <ArgonTypography variant="body2" color="success">
                            <strong>Giảm giá:</strong> {student.discount}%
                          </ArgonTypography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default TeacherClasses;



