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
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, CardActions, Button, Chip, Box, Typography, Avatar, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Divider, Stack, Tooltip } from '@mui/material';
import { CalendarMonth, School as SchoolIcon, LocationOn, Group as GroupIcon } from '@mui/icons-material';
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
  const navigate = useNavigate();
  const [groupedClasses, setGroupedClasses] = useState([]); // [{ academic_year, classes: [...] }]
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroupedClasses();
  }, []);

  const fetchGroupedClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/teachers/class');
      const groups = response?.data || [];
      setGroupedClasses(groups);

      if (groups.length > 0) {
        // groups are sorted desc by year from backend
        const latestYear = groups[0].academic_year;
        const firstClass = groups[0].classes?.[0] || null;
        setSelectedYear(latestYear);
        setSelectedClass(firstClass);

        if (firstClass) {
          await fetchStudentsForClass(firstClass._id);
        } else {
          setStudents([]);
          setClassInfo(null);
        }
      } else {
        setStudents([]);
        setClassInfo(null);
      }
    } catch (err) {
      console.error('Error fetching grouped classes:', err);
      setError(err.message || 'Không thể tải thông tin lớp học');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForClass = async (classId) => {
    try {
      setLoading(true);
      setError(null);
      const studentsResponse = await api.get(`/teachers/class/students?class_id=${classId}`);
      setStudents(studentsResponse.students || []);
      setClassInfo(studentsResponse.class_info || null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Không thể tải danh sách học sinh');
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = async (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    const group = groupedClasses.find(g => g.academic_year === year);
    const cls = group?.classes?.[0] || null;
    setSelectedClass(cls);
    if (cls?._id) {
      await fetchStudentsForClass(cls._id);
    } else {
      setStudents([]);
      setClassInfo(null);
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
          <ArgonButton onClick={fetchGroupedClasses} color="info">
            Thử lại
          </ArgonButton>
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (!classInfo && !selectedClass) {
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
        {/* Header and Year Filter */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SchoolIcon color="primary" />
                  <ArgonTypography variant="h5" fontWeight="bold" letterSpacing={0.2}>
                    Lớp học của tôi
                  </ArgonTypography>
                </Stack>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  Thông tin chi tiết về lớp học được phân công
                </ArgonTypography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Chip icon={<GroupIcon />} color="primary" variant="outlined" label={`${students.length} học sinh`} />
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CalendarMonth color="action" />
                  <FormControl size="small" variant="outlined" sx={{
                    minWidth: 240,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      borderRadius: 2,
                      transition: 'box-shadow .2s ease',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.light',
                    },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}20`,
                    }
                  }}>
                    <InputLabel id="year-select-label" sx={{ backgroundColor: '#fff', px: 0.5 }}>
                      Năm học
                    </InputLabel>
                    <Select
                      labelId="year-select-label"
                      id="year-select"
                      value={selectedYear}
                      label="Năm học"
                      onChange={handleYearChange}
                      MenuProps={{
                        PaperProps: {
                          sx: { borderRadius: 2 }
                        }
                      }}
                    >
                      {groupedClasses.map(group => (
                        <MenuItem key={group.academic_year} value={group.academic_year}>
                          {group.academic_year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Class Information Card */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <ArgonTypography variant="h5" fontWeight="bold">
                    {classInfo?.class_name || selectedClass?.class_name}
                  </ArgonTypography>
                  <Chip label="Hoạt động" color="success" size="small" variant="outlined" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarMonth color="action" />
                      <ArgonTypography variant="body2" color="text" mb={1}>
                        <strong>Năm học:</strong> {classInfo?.academic_year || selectedYear}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SchoolIcon color="action" />
                      <ArgonTypography variant="body2" color="text" mb={1}>
                        <strong>Độ tuổi:</strong> {classInfo?.class_age?.age_name || 'N/A'}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SchoolIcon color="action" />
                      <ArgonTypography variant="body2" color="text" mb={1}>
                        <strong>Trường:</strong> {classInfo?.school?.school_name || 'N/A'}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationOn color="action" />
                      <ArgonTypography variant="body2" color="text" mb={1}>
                        <strong>Địa chỉ:</strong> {classInfo?.school?.address || 'N/A'}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  {classInfo?.assistant_teacher && (
                    <Grid item xs={12}>
                      <ArgonTypography variant="body2" color="text" mb={1}>
                        <strong>Giáo viên phụ:</strong> {classInfo.assistant_teacher.user_id?.full_name || 'N/A'}
                      </ArgonTypography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
                  Thống kê lớp học
                </ArgonTypography>
                <ArgonBox mb={2}>
                  <ArgonTypography variant="h4" color="primary" fontWeight="bold">
                    {students.length}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text">
                    Tổng số học sinh
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
                    <Card 
                      variant="outlined"
                      onClick={() => navigate(`/teacher/students/${student._id}`, { state: { title: student.full_name } })}
                      role="button"
                      tabIndex={0}
                      sx={{
                        height: '100%',
                        transition: 'all .2s ease',
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }
                      }}
                    >
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
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </ArgonTypography>
                        
                        {student.allergy && student.allergy !== 'Không' && (
                          <Tooltip title="Thông tin dị ứng">
                            <ArgonTypography variant="body2" color="warning" mb={1}>
                              <strong>Dị ứng:</strong> {student.allergy}
                            </ArgonTypography>
                          </Tooltip>
                        )}
                        
                        {student.discount > 0 && (
                          <Tooltip title="Ưu đãi học phí">
                            <ArgonTypography variant="body2" color="success">
                              <strong>Giảm giá:</strong> {student.discount}%
                            </ArgonTypography>
                          </Tooltip>
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



