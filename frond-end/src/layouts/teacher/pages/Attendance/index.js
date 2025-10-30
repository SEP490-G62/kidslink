/**
=========================================================
* KidsLink Teacher Attendance Page - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================
*/

import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardContent,
  Chip, 
  Box, 
  TextField,
  Avatar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Checkbox,
  FormControlLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  AccessTime,
  Login,
  Logout,
  Person,
  Schedule,
  TrendingUp,
  Group,
  CheckCircleOutline,
  CancelOutlined
} from '@mui/icons-material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';

// API service
import api from 'services/api';

const TeacherAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [checkingIn, setCheckingIn] = useState(null);
  const [checkingOut, setCheckingOut] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null, // 'checkin' or 'checkout'
    student: null
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await api.get(`/teachers/class/students/attendance/${selectedDate}`);
      
      setStudents(response.students || []);
      setStatistics(response.statistics || null);
      setClassInfo(response.class_info || null);
      
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err.message || 'Không thể tải thông tin điểm danh');
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (type, student) => {
    setConfirmDialog({
      open: true,
      type,
      student
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      type: null,
      student: null
    });
  };

  const handleCheckin = async (studentId, studentName) => {
    try {
      setCheckingIn(studentId);
      setError(null);
      setSuccessMessage(null);
      
      console.log('Attempting checkin for:', studentName, 'with ID:', studentId);
      
      const response = await api.post('/teachers/daily-reports/checkin', {
        student_id: studentId,
        report_date: selectedDate
      });
      
      console.log('Checkin successful:', response);
      setSuccessMessage(`Check in thành công cho ${studentName}`);
      await fetchAttendanceData();
      
    } catch (err) {
      console.error('Error checking in:', err);
      console.error('Error details:', err.message, err);
      setError(err.message || 'Không thể thực hiện check in');
    } finally {
      setCheckingIn(null);
    }
  };

  const handleCheckout = async (studentId, studentName) => {
    try {
      setCheckingOut(studentId);
      setError(null);
      setSuccessMessage(null);
      
      console.log('Attempting checkout for:', studentName, 'with ID:', studentId, 'on date:', selectedDate);
      
      const response = await api.put('/teachers/daily-reports/checkout', {
        student_id: studentId,
        report_date: selectedDate
      });
      
      console.log('Checkout successful:', response);
      setSuccessMessage(`Check out thành công cho ${studentName}`);
      await fetchAttendanceData();
      
    } catch (err) {
      console.error('Error checking out:', err);
      console.error('Error details:', err.message, err);
      setError(err.message || 'Không thể thực hiện check out');
    } finally {
      setCheckingOut(null);
    }
  };

  const handleConfirmAction = async () => {
    const { type, student } = confirmDialog;
    closeConfirmDialog();
    
    if (type === 'checkin') {
      await handleCheckin(student._id, student.full_name);
    } else if (type === 'checkout') {
      await handleCheckout(student._id, student.full_name);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    // timeString format: HH:MM:SS
    return timeString.substring(0, 5);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dayName = days[date.getDay()];
    return `${dayName}, ${date.toLocaleDateString('vi-VN')}`;
  };

  // Check if selected date is valid for attendance
  const isDateValidForAttendance = () => {
    const today = new Date();
    const selected = new Date(selectedDate);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    // Allow attendance only for today
    return selected.getTime() === today.getTime();
  };

  const getGenderText = (gender) => {
    return gender === 0 ? 'Nam' : 'Nữ';
  };

  const getGenderColor = (gender) => {
    return gender === 0 ? 'primary' : 'secondary';
  };

  if (loading && students.length === 0) {
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

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Schedule color="primary" />
                  <ArgonTypography variant="h5" fontWeight="bold">
                    Điểm danh học sinh
                  </ArgonTypography>
                </Box>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  Quản lý điểm danh đến/đi của học sinh trong lớp
                </ArgonTypography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {/* Date Warning */}
        {!isDateValidForAttendance() && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            icon={<AccessTime />}
          >
            <ArgonTypography variant="body2" fontWeight="bold">
              ⚠️ Chỉ có thể điểm danh cho ngày hôm nay
            </ArgonTypography>
            <ArgonTypography variant="body2" sx={{ mt: 0.5 }}>
              Ngày đã chọn: <strong>{formatDate(selectedDate)}</strong> - Không thể thực hiện checkin/checkout
            </ArgonTypography>
          </Alert>
        )}

        {/* Date Selector and Statistics */}
        <Grid container spacing={2} mb={3}>
          {/* Date Selector */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%'
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Schedule color="primary" sx={{ mr: 1, fontSize: 20 }} />
                  <ArgonTypography variant="h6" fontWeight="bold" color="primary">
                    Chọn ngày điểm danh
                  </ArgonTypography>
                </Box>
                
                <Box 
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}
                >
                  <TextField
                    fullWidth
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(0,0,0,0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputBase-input': {
                        py: 1.5,
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }
                    }}
                  />
                  
                  <Box mt={2} display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          mr: 1
                        }}
                      />
                      <ArgonTypography variant="body2" color="text" fontWeight="500">
                        📅 {formatDate(selectedDate)}
                      </ArgonTypography>
                    </Box>
                    {classInfo && (
                      <Box display="flex" alignItems="center">
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'success.main',
                            mr: 1
                          }}
                        />
                        <ArgonTypography variant="body2" color="text" fontWeight="500">
                          🏫 {classInfo.class_name}
                        </ArgonTypography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} md={8}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%'
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUp color="primary" sx={{ mr: 1, fontSize: 20 }} />
                  <ArgonTypography variant="h6" fontWeight="bold" color="primary">
                    Thống kê điểm danh
                  </ArgonTypography>
                </Box>
                {statistics ? (
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={3}>
                      <Box 
                        display="flex" 
                        flexDirection="column"
                        alignItems="center"
                        p={2}
                        sx={{
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          borderRadius: 2,
                          border: '1px solid rgba(25, 118, 210, 0.2)',
                          textAlign: 'center'
                        }}
                      >
                        <Group color="primary" sx={{ fontSize: 24, mb: 0.5 }} />
                        <ArgonTypography variant="h4" color="primary" fontWeight="bold">
                          {statistics.total_students}
                        </ArgonTypography>
                        <ArgonTypography variant="caption" color="text">
                          Tổng số
                        </ArgonTypography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box 
                        display="flex" 
                        flexDirection="column"
                        alignItems="center"
                        p={2}
                        sx={{
                          backgroundColor: 'rgba(76, 175, 80, 0.08)',
                          borderRadius: 2,
                          border: '1px solid rgba(76, 175, 80, 0.2)',
                          textAlign: 'center'
                        }}
                      >
                        <CheckCircle color="success" sx={{ fontSize: 24, mb: 0.5 }} />
                        <ArgonTypography variant="h4" color="success" fontWeight="bold">
                          {statistics.checked_in}
                        </ArgonTypography>
                        <ArgonTypography variant="caption" color="text">
                          Đã đến
                        </ArgonTypography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box 
                        display="flex" 
                        flexDirection="column"
                        alignItems="center"
                        p={2}
                        sx={{
                          backgroundColor: 'rgba(33, 150, 243, 0.08)',
                          borderRadius: 2,
                          border: '1px solid rgba(33, 150, 243, 0.2)',
                          textAlign: 'center'
                        }}
                      >
                        <CheckCircleOutline color="info" sx={{ fontSize: 24, mb: 0.5 }} />
                        <ArgonTypography variant="h4" color="info" fontWeight="bold">
                          {statistics.checked_out}
                        </ArgonTypography>
                        <ArgonTypography variant="caption" color="text">
                          Đã về
                        </ArgonTypography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box 
                        display="flex" 
                        flexDirection="column"
                        alignItems="center"
                        p={2}
                        sx={{
                          backgroundColor: statistics.attendance_rate >= 80 
                            ? 'rgba(76, 175, 80, 0.08)' 
                            : 'rgba(255, 152, 0, 0.08)',
                          borderRadius: 2,
                          border: `1px solid ${statistics.attendance_rate >= 80 
                            ? 'rgba(76, 175, 80, 0.2)' 
                            : 'rgba(255, 152, 0, 0.2)'}`,
                          textAlign: 'center'
                        }}
                      >
                        <TrendingUp 
                          color={statistics.attendance_rate >= 80 ? 'success' : 'warning'} 
                          sx={{ fontSize: 24, mb: 0.5 }} 
                        />
                        <ArgonTypography 
                          variant="h4" 
                          color={statistics.attendance_rate >= 80 ? 'success' : 'warning'} 
                          fontWeight="bold"
                        >
                          {statistics.attendance_rate}%
                        </ArgonTypography>
                        <ArgonTypography variant="caption" color="text">
                          Tỷ lệ có mặt
                        </ArgonTypography>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <ArgonBox textAlign="center" py={3}>
                    <CircularProgress size={24} />
                    <ArgonTypography variant="body2" color="text" mt={1}>
                      Đang tải thống kê...
                    </ArgonTypography>
                  </ArgonBox>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Students List */}
        <Card 
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box 
              display="flex" 
              alignItems="center" 
              p={2.5} 
              sx={{ 
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                backgroundColor: 'rgba(0,0,0,0.02)'
              }}
            >
              <Person color="primary" sx={{ mr: 1, fontSize: 20 }} />
              <ArgonTypography variant="h6" fontWeight="bold" color="primary">
                Danh sách học sinh ({students.length} học sinh)
              </ArgonTypography>
            </Box>
            
            {students.length === 0 ? (
              <ArgonBox textAlign="center" py={4} px={3}>
                <Person sx={{ fontSize: 48, color: 'rgba(0,0,0,0.3)', mb: 1.5 }} />
                <ArgonTypography variant="h6" color="text" mb={1}>
                  Không có học sinh nào trong lớp
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Vui lòng kiểm tra lại thông tin lớp học
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <TableContainer 
                component={Paper} 
                sx={{ 
                  borderRadius: 0,
                  boxShadow: 'none',
                  border: 'none'
                }}
              >
                <Table>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow 
                        key={student._id}
                        sx={{ 
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.02)'
                          },
                          '&:last-child td, &:last-child th': { border: 0 },
                          '& td': { py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }
                        }}
                      >
                        {/* Học sinh */}
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar 
                              src={student.avatar_url} 
                              alt={student.full_name}
                              sx={{ 
                                width: 40, 
                                height: 40, 
                                mr: 1.5,
                                border: '2px solid',
                                borderColor: student.attendance.has_checkin ? 'success.main' : 'grey.300',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                              }}
                            />
                            <ArgonTypography variant="body1" fontWeight="bold">
                              {student.full_name}
                            </ArgonTypography>
                          </Box>
                        </TableCell>

                        {/* Giới tính */}
                        <TableCell>
                          <Chip 
                            label={getGenderText(student.gender)}
                            color={getGenderColor(student.gender)}
                            size="small"
                            sx={{ 
                              fontWeight: 'bold',
                              borderRadius: 2
                            }}
                          />
                        </TableCell>

                        {/* Trạng thái đến */}
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {student.attendance.has_checkin ? (
                              <>
                                <CheckCircle color="success" sx={{ fontSize: 20, mr: 1 }} />
                                <Box>
                                  <ArgonTypography variant="body2" fontWeight="bold" color="success">
                                    ✅ Đã đến
                                  </ArgonTypography>
                                  <ArgonTypography variant="caption" color="text" display="block">
                                    {formatTime(student.attendance.checkin_time)}
                                  </ArgonTypography>
                                </Box>
                              </>
                            ) : (
                              <>
                                <Cancel color="error" sx={{ fontSize: 20, mr: 1 }} />
                                <ArgonTypography variant="body2" fontWeight="bold" color="error">
                                  ❌ Chưa đến
                                </ArgonTypography>
                              </>
                            )}
                          </Box>
                        </TableCell>

                        {/* Trạng thái về */}
                        <TableCell>
                          {student.attendance.has_checkin ? (
                            <Box display="flex" alignItems="center">
                              {student.attendance.has_checkout ? (
                                <>
                                  <CheckCircle color="info" sx={{ fontSize: 20, mr: 1 }} />
                                  <Box>
                                    <ArgonTypography variant="body2" fontWeight="bold" color="info">
                                      ✅ Đã về
                                    </ArgonTypography>
                                    <ArgonTypography variant="caption" color="text" display="block">
                                      {formatTime(student.attendance.checkout_time)}
                                    </ArgonTypography>
                                  </Box>
                                </>
                              ) : (
                                <>
                                  <AccessTime color="warning" sx={{ fontSize: 20, mr: 1 }} />
                                  <ArgonTypography variant="body2" fontWeight="bold" color="warning">
                                    ⏰ Chưa về
                                  </ArgonTypography>
                                </>
                              )}
                            </Box>
                          ) : (
                            <ArgonTypography variant="body2" color="text">
                              Chưa check in
                            </ArgonTypography>
                          )}
                        </TableCell>

                        {/* Thao tác */}
                        <TableCell align="center">
                          {!student.attendance.has_checkin ? (
                            <ArgonButton
                              variant="contained"
                              color="success"
                              size="small"
                              disabled={checkingIn === student._id || checkingOut === student._id || !isDateValidForAttendance()}
                              onClick={() => openConfirmDialog('checkin', student)}
                              startIcon={<Login />}
                              sx={{
                                borderRadius: 1.5,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                px: 2,
                                py: 0.5,
                                minWidth: 100,
                                fontSize: '0.8rem',
                                boxShadow: isDateValidForAttendance() ? '0 1px 4px rgba(76, 175, 80, 0.3)' : 'none',
                                '&:hover': isDateValidForAttendance() ? {
                                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.4)',
                                  transform: 'translateY(-1px)'
                                } : {},
                                opacity: !isDateValidForAttendance() ? 0.5 : 1
                              }}
                            >
                              {checkingIn === student._id ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                'Check In'
                              )}
                            </ArgonButton>
                          ) : student.attendance.has_checkout ? (
                            <ArgonButton
                              variant="contained"
                              color="success"
                              size="small"
                              disabled
                              sx={{
                                borderRadius: 1.5,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                px: 2,
                                py: 0.5,
                                minWidth: 100,
                                fontSize: '0.8rem',
                                opacity: 0.8
                              }}
                            >
                              ✅ Hoàn thành
                            </ArgonButton>
                          ) : (
                            <ArgonButton
                              variant="contained"
                              color="info"
                              size="small"
                              disabled={checkingIn === student._id || checkingOut === student._id || !isDateValidForAttendance()}
                              onClick={() => openConfirmDialog('checkout', student)}
                              startIcon={<Logout />}
                              sx={{
                                borderRadius: 1.5,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                px: 2,
                                py: 0.5,
                                minWidth: 100,
                                fontSize: '0.8rem',
                                boxShadow: isDateValidForAttendance() ? '0 1px 4px rgba(33, 150, 243, 0.3)' : 'none',
                                '&:hover': isDateValidForAttendance() ? {
                                  boxShadow: '0 2px 8px rgba(33, 150, 243, 0.4)',
                                  transform: 'translateY(-1px)'
                                } : {},
                                opacity: !isDateValidForAttendance() ? 0.5 : 1
                              }}
                            >
                              {checkingOut === student._id ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                'Check Out'
                              )}
                            </ArgonButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Confirm Dialog */}
        <Dialog 
          open={confirmDialog.open} 
          onClose={closeConfirmDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              {confirmDialog.type === 'checkin' ? (
                <>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Login color="success" sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <ArgonTypography variant="h5" fontWeight="bold" color="success">
                      Xác nhận Check In
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="text">
                      Đánh dấu học sinh đã đến lớp
                    </ArgonTypography>
                  </Box>
                </>
              ) : (
                <>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Logout color="info" sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <ArgonTypography variant="h5" fontWeight="bold" color="info">
                      Xác nhận Check Out
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="text">
                      Đánh dấu học sinh đã về nhà
                    </ArgonTypography>
                  </Box>
                </>
              )}
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {confirmDialog.student && (
              <Box>
                <Box 
                  display="flex" 
                  alignItems="center" 
                  mb={3}
                  p={3}
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}
                >
                  <Avatar 
                    src={confirmDialog.student.avatar_url} 
                    alt={confirmDialog.student.full_name}
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mr: 3,
                      border: '4px solid',
                      borderColor: confirmDialog.type === 'checkin' ? 'success.main' : 'info.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                  <Box>
                    <ArgonTypography variant="h5" fontWeight="bold" mb={1}>
                      {confirmDialog.student.full_name}
                    </ArgonTypography>
                    <Chip 
                      label={getGenderText(confirmDialog.student.gender)}
                      color={getGenderColor(confirmDialog.student.gender)}
                      size="medium"
                      sx={{ fontWeight: 'bold', borderRadius: 2 }}
                    />
                  </Box>
                </Box>
                
                <Box 
                  p={3}
                  sx={{
                    backgroundColor: confirmDialog.type === 'checkin' 
                      ? 'rgba(76, 175, 80, 0.05)' 
                      : 'rgba(33, 150, 243, 0.05)',
                    borderRadius: 2,
                    border: `1px solid ${confirmDialog.type === 'checkin' 
                      ? 'rgba(76, 175, 80, 0.2)' 
                      : 'rgba(33, 150, 243, 0.2)'}`
                  }}
                >
                  {confirmDialog.type === 'checkin' ? (
                    <ArgonTypography variant="h6" color="text" textAlign="center">
                      Bạn có chắc chắn muốn <strong style={{ color: '#4caf50' }}>Check In</strong> cho <strong>{confirmDialog.student.full_name}</strong>?
                    </ArgonTypography>
                  ) : (
                    <ArgonTypography variant="h6" color="text" textAlign="center">
                      Bạn có chắc chắn muốn <strong style={{ color: '#2196f3' }}>Check Out</strong> cho <strong>{confirmDialog.student.full_name}</strong>?
                    </ArgonTypography>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={closeConfirmDialog}
              variant="outlined"
              size="large"
              sx={{
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none',
                px: 4,
                py: 1.5,
                borderColor: 'error.main',
                color: 'error.main',
                '&:hover': {
                  borderColor: 'error.dark',
                  backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  color: 'error.dark'
                }
              }}
            >
              Hủy
            </Button>
            <ArgonButton
              onClick={handleConfirmAction}
              variant="contained"
              color={confirmDialog.type === 'checkin' ? 'success' : 'info'}
              disabled={checkingIn !== null || checkingOut !== null}
              size="large"
              sx={{
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none',
                px: 4,
                py: 1.5,
                boxShadow: confirmDialog.type === 'checkin' 
                  ? '0 4px 12px rgba(76, 175, 80, 0.3)' 
                  : '0 4px 12px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  boxShadow: confirmDialog.type === 'checkin' 
                    ? '0 6px 16px rgba(76, 175, 80, 0.4)' 
                    : '0 6px 16px rgba(33, 150, 243, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {checkingIn !== null || checkingOut !== null ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Xác nhận'
              )}
            </ArgonButton>
          </DialogActions>
        </Dialog>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default TeacherAttendance;

