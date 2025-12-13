import React, { useState, useEffect, useRef } from 'react';
import { Grid, Card, CardContent, Box, Select, MenuItem, InputLabel, FormControl, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton, Snackbar, Alert, Chip, Stack, Tooltip, Avatar } from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonButton from 'components/ArgonButton';
import ArgonTypography from 'components/ArgonTypography';
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';
import EditIcon from '@mui/icons-material/Edit';
import AddCommentIcon from '@mui/icons-material/AddComment';
import GroupIcon from '@mui/icons-material/Group';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import CommentIcon from '@mui/icons-material/Comment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import apiService from 'services/api';

const DailyReportPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, student: null, comment: '', saving: false });
  const [bulkComment, setBulkComment] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [bulkDialog, setBulkDialog] = useState({ open: false, saving: false, items: [] });
  const [historyDialog, setHistoryDialog] = useState({ open: false, student: null, reports: [], loading: false, weekStart: null });
  const [hasSchedule, setHasSchedule] = useState(true);
  const wasTodayRef = useRef(false); // Lưu lại xem lần trước có đang ở ngày hôm nay không

  // Lấy danh sách lớp, mặc định chọn lớp có academic_year lớn nhất
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await apiService.get('/teachers/class');
        let allClasses = res?.data?.flatMap(y => y.classes) || [];
        setClasses(allClasses);
        if (allClasses.length > 0 && !selectedClass) {
          // Lớp academic_year lớn nhất
          const sorted = allClasses.sort((a, b) => b.academic_year.localeCompare(a.academic_year));
          setSelectedClass(sorted[0]._id);
        }
      } catch (e) {
        setClasses([]); 
      }
    }
    fetchClasses();
    // eslint-disable-next-line
  }, []);

  // Tự động cập nhật ngày khi sang ngày mới (sau 00:00) - chỉ khi đang ở ngày hôm nay
  useEffect(() => {
    const getTodayString = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Kiểm tra xem đang ở ngày hôm nay không
    const todayStr = getTodayString();
    const isCurrentlyToday = selectedDate === todayStr;
    
    // QUAN TRỌNG: Reset trạng thái theo dõi dựa trên selectedDate hiện tại
    // Nếu đang ở ngày hôm nay, đánh dấu để theo dõi
    // Nếu đang ở ngày khác, TẮT theo dõi ngay lập tức
    if (isCurrentlyToday) {
      wasTodayRef.current = true;
    } else {
      // Đang xem ngày khác, TẮT theo dõi ngay lập tức để tránh tự động reset
      wasTodayRef.current = false;
    }

    // Kiểm tra mỗi giây để phát hiện ngay khi sang ngày mới (00:00:00)
    // Chỉ tự động cập nhật khi đang ở ngày hôm nay và sang ngày mới
    const interval = setInterval(() => {
      const currentTodayStr = getTodayString();
      const currentSelectedDate = selectedDate; // Capture giá trị hiện tại
      
      // Chỉ tự động cập nhật khi:
      // 1. Lần trước đang ở ngày hôm nay (wasTodayRef.current === true)
      // 2. Và đã sang ngày mới (currentSelectedDate !== currentTodayStr)
      // 3. Và vẫn đang ở ngày hôm nay trước đó (currentSelectedDate === todayStr ở lần kiểm tra trước)
      if (wasTodayRef.current && currentSelectedDate !== currentTodayStr) {
        // Kiểm tra lại: chỉ cập nhật nếu selectedDate hiện tại là ngày hôm qua (1 ngày trước)
        const selectedDateObj = new Date(currentSelectedDate + 'T00:00:00');
        const todayDateObj = new Date(currentTodayStr + 'T00:00:00');
        const diffDays = Math.round((todayDateObj - selectedDateObj) / (1000 * 60 * 60 * 24));
        
        // Chỉ tự động cập nhật nếu chênh lệch đúng 1 ngày (hôm qua -> hôm nay)
        if (diffDays === 1) {
          // Đã sang ngày mới từ hôm qua, tự động cập nhật
          setSelectedDate(currentTodayStr);
          wasTodayRef.current = true; // Tiếp tục theo dõi
        }
      } else if (currentSelectedDate === currentTodayStr) {
        // Đang ở ngày hôm nay, tiếp tục theo dõi
        wasTodayRef.current = true;
      } else {
        // Đang xem ngày khác, không tự động reset
        wasTodayRef.current = false;
      }
    }, 1000); // 1000ms = 1 giây

    return () => clearInterval(interval);
  }, [selectedDate]);

  // Lấy danh sách DailyReport theo lớp và ngày
  useEffect(() => {
    async function fetchReports() {
      if (!selectedClass || !selectedDate) return;
      setLoading(true);
      try {
        const res = await apiService.get(`/teachers/class/students/attendance/${selectedDate}?class_id=${selectedClass}`);
        setStudents(res?.students || []);
        setHasSchedule(res?.has_schedule === undefined ? true : !!res.has_schedule);
      } catch (err) {
        setStudents([]);
        setHasSchedule(true);
      }
      setLoading(false);
    }
    fetchReports();
  }, [selectedClass, selectedDate]);

  // Sửa nhận xét
  const handleEditComment = (student) => {
    if (!canReportToday) {
      setSnackbar({ open: true, message: 'Chỉ có thể nhận xét trong ngày có lịch học và là hôm nay.', severity: 'warning' });
      return;
    }
    if (!isStudentActive(student)) {
      setSnackbar({ open: true, message: 'Học sinh đang ở trạng thái ngưng hoạt động, không thể nhận xét.', severity: 'warning' });
      return;
    }
    setEditDialog({ open: true, student, comment: student.report?.comments || '', saving: false });
  };
  const handleCloseEdit = () => {
    setEditDialog({ open: false, student: null, comment: '', saving: false });
  };
  const handleSaveEdit = async () => {
    if (!canReportToday) {
      setSnackbar({ open: true, message: 'Chỉ có thể nhận xét trong ngày có lịch học và là hôm nay.', severity: 'warning' });
      setEditDialog({ open: false, student: null, comment: '', saving: false });
      return;
    }
    if (!isStudentActive(editDialog.student)) {
      setSnackbar({ open: true, message: 'Không thể nhận xét cho học sinh đã ngưng hoạt động.', severity: 'warning' });
      setEditDialog({ open: false, student: null, comment: '', saving: false });
      return;
    }
    setEditDialog(dialog => ({ ...dialog, saving: true }));
    try {
      await apiService.put(`/teachers/daily-reports/${editDialog.student.report?._id || editDialog.student._id}/comment`, { comments: editDialog.comment, report_date: selectedDate });
      setEditDialog({ open: false, student: null, comment: '', saving: false });
      // Reload sau edit
      const res = await apiService.get(`/teachers/class/students/attendance/${selectedDate}?class_id=${selectedClass}`);
      setStudents(res.students || []);
    } catch (e) {
      setEditDialog(dialog => ({ ...dialog, saving: false }));
      alert('Lỗi khi cập nhật nhận xét!');
    }
  };

  // Hàm nhận xét tất cả học sinh chưa có nhận xét
  const openBulkDialog = () => {
    if (!canReportToday) {
      setSnackbar({ open: true, message: 'Chỉ có thể nhận xét trong ngày có lịch học và là hôm nay.', severity: 'info' });
      return;
    }
    const studentsToComment = students.filter(st => isStudentActive(st) && (!st.report || !st.report.comments));
    if (studentsToComment.length === 0) {
      const hasActive = students.some(isStudentActive);
      setSnackbar({ 
        open: true, 
        message: hasActive ? 'Tất cả học sinh đang hoạt động đã có nhận xét.' : 'Không có học sinh hoạt động để nhận xét.', 
        severity: 'info' 
      });
      return;
    }
    const initialItems = studentsToComment.map(st => ({
      id: st.report?._id || st._id,
      studentId: st._id,
      name: st.full_name,
      comment: bulkComment || '',
      status: st.status
    }));
    setBulkDialog({ open: true, saving: false, items: initialItems });
  };

  const handleChangeBulkItem = (idx, value) => {
    setBulkDialog(prev => {
      const nextItems = [...prev.items];
      nextItems[idx] = { ...nextItems[idx], comment: value };
      return { ...prev, items: nextItems };
    });
  };

  const handleCloseBulkDialog = () => {
    setBulkDialog({ open: false, saving: false, items: [] });
  };

  const handleSaveBulkDialog = async () => {
    if (!canReportToday) {
      setSnackbar({ open: true, message: 'Chỉ có thể nhận xét trong ngày có lịch học và là hôm nay.', severity: 'warning' });
      return;
    }
    const payloads = bulkDialog.items.filter(it => it.status === 1 && (it.comment || '').trim().length > 0);
    if (payloads.length === 0) {
      setSnackbar({ open: true, message: 'Vui lòng nhập nhận xét cho ít nhất một học sinh.', severity: 'warning' });
      return;
    }
    setBulkDialog(prev => ({ ...prev, saving: true }));
    let okCount = 0, failCount = 0;
    try {
      for (const it of payloads) {
        try {
          await apiService.put(`/teachers/daily-reports/${it.id}/comment`, { comments: it.comment, report_date: selectedDate });
          okCount++;
        } catch (e) {
          failCount++;
        }
      }
      setSnackbar({ open: true, message: `Đã nhận xét ${okCount} học sinh. ${failCount > 0 ? (failCount + ' thất bại.') : ''}`, severity: failCount === 0 ? 'success' : 'warning' });
      const res = await apiService.get(`/teachers/class/students/attendance/${selectedDate}?class_id=${selectedClass}`);
      setStudents(res.students || []);
      setBulkDialog({ open: false, saving: false, items: [] });
      setBulkComment('');
    } catch (e) {
      setSnackbar({ open: true, message: 'Có lỗi khi thực hiện nhận xét hàng loạt!', severity: 'error' });
      setBulkDialog(prev => ({ ...prev, saving: false }));
    }
  };

  const isToday = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return selectedDate === todayStr;
  })();

  const isStudentActive = (student) => student?.status === 1;
  const hasActiveStudents = students.some(isStudentActive);
  const canReportToday = isToday && hasSchedule;

  // Tính toán tuần hiện tại (thứ 2 đến chủ nhật)
  const getCurrentWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Đưa về thứ 2
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  // Mở dialog lịch sử daily report
  const handleOpenHistory = async (student, weekStartDate = null) => {
    const weekStart = weekStartDate || getCurrentWeekStart();
    setHistoryDialog({ open: true, student, reports: [], loading: true, weekStart });
    try {
      const res = await apiService.get(`/teachers/students/${student._id}/daily-reports/weekly?week_start=${weekStart}`);
      setHistoryDialog({ open: true, student, reports: res?.data || [], loading: false, weekStart });
    } catch (err) {
      setHistoryDialog({ open: true, student, reports: [], loading: false, weekStart });
      setSnackbar({ open: true, message: 'Không thể tải lịch sử báo cáo', severity: 'error' });
    }
  };

  const handleCloseHistory = () => {
    setHistoryDialog({ open: false, student: null, reports: [], loading: false, weekStart: null });
  };

  // Chuyển tuần
  const handleChangeWeek = (direction) => {
    const currentWeekStart = new Date(historyDialog.weekStart + 'T00:00:00.000Z');
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
    handleOpenHistory(historyDialog.student, newWeekStart.toISOString().split('T')[0]);
  };

  // Format ngày tháng
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Format ngày ngắn gọn
  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // Lấy tên thứ trong tuần
  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return dayNames[date.getDay()];
  };

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* HEADER - Modern Card */}
        <Card sx={{ mb: 3, borderRadius: 3, background:'#f4faff', boxShadow:'0 2px 10px #0001' }} elevation={0}>
          <CardContent sx={{pb:2}}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CalendarMonth color="primary" fontSize="large" />
                <ArgonTypography variant="h4" fontWeight={700} color="primary" sx={{letterSpacing:0.1}}>Báo cáo hàng ngày</ArgonTypography>
              </Stack>
              <Chip icon={<GroupIcon />} color="info" variant="soft" label={`${students.length} học sinh`} sx={{fontWeight:500, fontSize:'1rem', height:32}}/>
            </Box>
          </CardContent>
        </Card>

        {!hasSchedule && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Lớp không có lịch học trong ngày {formatDate(selectedDate)} nên không thể nhận xét hoặc điểm danh.
          </Alert>
        )}

        {/* FILTER & BULK COMMENT card - gọn tối giản */}
        <Card sx={{ mb: 4, borderRadius: 3, px: 2, py: 1, background: '#f8fafc', boxShadow:'0 1px 4px #0001' }} elevation={0}>
          <CardContent sx={{ pb: '12px !important', pt: '8px' }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small" variant="outlined">
                  <Select
                    displayEmpty
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    inputProps={{ 'aria-label': 'Chọn lớp học' }}
                    sx={{bgcolor:'#fff', borderRadius:2}}
                    renderValue={val =>
                      val
                        ? classes.find(c => c._id === val)?.class_name
                        : <span style={{ color: '#bbb' }}>Chọn lớp học</span>
                    }
                  >
                    <MenuItem disabled value=""><span style={{color:'#bbb'}}>Chọn lớp học</span></MenuItem>
                    {classes.map(cls => (
                      <MenuItem key={cls._id} value={cls._id}>{cls.class_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  variant="outlined"
                  placeholder="Chọn ngày"
                  InputLabelProps={{ shrink: false }}
                  value={selectedDate}
                  inputProps={{style:{color:'#263136'}}}
                  onChange={e => setSelectedDate(e.target.value)}
                  sx={{bgcolor:'#fff', borderRadius:2, '& input::placeholder':{color:'#bbb', opacity:1, fontStyle:'italic'}}}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    size="small"
                    fullWidth
                    variant="outlined"
                    placeholder="Nhập nhận xét ..."
                    value={bulkComment}
                    onChange={e => setBulkComment(e.target.value)}
                    disabled={bulkSaving || !canReportToday || !hasActiveStudents}
                    inputProps={{ style: { fontSize: '0.97rem', color: '#38404a' } }}
                    sx={{bgcolor:'#fff', borderRadius:2, '& input::placeholder': {color:'#bbb', fontStyle:'italic', opacity:1}, minWidth:0}}
                  />
                  <ArgonButton color="info" size="small" variant="contained" disableElevation
                    disabled={!canReportToday || !hasActiveStudents}
                    onClick={openBulkDialog} sx={{ minWidth: 120, fontWeight:600, fontSize:'0.98rem', px:2, py:1, boxShadow:'none' }}>
                    Nhận xét
                  </ArgonButton>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* DANH SÁCH BÁO CÁO - Modern Card Grid */}
        <Card sx={{ mb: 4, borderRadius: 3, background:'#fff', boxShadow:'0 1px 6px #0001' }}>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" mb={3} color="text.primary" sx={{letterSpacing:0.1}}>
              Báo cáo từng học sinh
            </ArgonTypography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
            ) : (
              students.length === 0 ? (
                <ArgonBox textAlign="center" py={4}>
                  <ArgonTypography variant="body1" color="text">
                    Không có học sinh nào trong lớp hoặc chưa có báo cáo ngày này.
                  </ArgonTypography>
                </ArgonBox>
              ) : (
                <Grid container spacing={2}>
                  {students.map(student => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={student._id}>
                      <Card
                        variant="soft"
                        onClick={() => handleOpenHistory(student)}
                        sx={{ height: '100%', borderRadius: 3, flex: 1, boxShadow: '0 2px 8px #0001', border:'none', transition: '0.2s', cursor: 'pointer', '&:hover': {boxShadow: 6, transform: 'translateY(-2px)'} }}
                      >
                        <CardContent sx={{pb: '16px !important', pt:'14px'}}>
                          <Box display="flex" alignItems="center" mb={1.5} gap={1.5}>
                            <Avatar sx={{width:38,height:38, bgcolor:'#e9f6fd', color:'#1976d2', fontWeight:600, fontSize:20}} src={student.avatar_url}>
                              {!student.avatar_url && <PersonIcon fontSize="medium" />}
                            </Avatar>
                            <Box flex={1} minWidth={0}>
                              <ArgonTypography variant="subtitle1" fontWeight={700} color="primary.main" sx={{lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                                {student.full_name}
                              </ArgonTypography>
                              <Typography variant="caption" color="text.secondary">
                                Ngày sinh: {student.dob?.slice(0,10)}
                              </Typography>
                            {!isStudentActive(student) && (
                              <Chip 
                                label="Ngưng hoạt động"
                                size="small"
                                color="default"
                                sx={{mt:0.5, fontWeight:600, borderRadius:1}}
                              />
                            )}
                            </Box>
                            <Tooltip title={!hasSchedule ? 'Lớp không có lịch học' : (!isStudentActive(student) ? 'Học sinh ngưng hoạt động' : (student.report?.comments ? 'Sửa nhận xét' : 'Thêm nhận xét'))}>
                              <span>
                                <IconButton 
                                  color="info" 
                                  size="small" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!canReportToday || !isStudentActive(student)) return; 
                                    handleEditComment(student); 
                                  }} 
                                  disabled={!canReportToday || !isStudentActive(student)}
                                >
                                  {student.report?.comments ? <EditIcon /> : <AddCommentIcon />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                          <Box display="flex" alignItems="flex-start" mt={1} mb={1}>
                            <CommentIcon color={student.report?.comments ? 'info' : 'disabled'} fontSize="small" style={{marginRight: 6, marginTop: 3}} />
                            <Typography variant="body2" color={student.report?.comments ? 'text.primary' : 'text.disabled'} sx={{ flex: 1, fontWeight: student.report?.comments ? 500 : 400, fontStyle: student.report?.comments ? 'normal' : 'italic' }}>
                              {student.report?.comments || 'Chưa có nhận xét'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )
            )}
          </CardContent>
        </Card>

        {/* Dialog chỉnh sửa nhận xét - hiện đại, dễ thao tác */}
        <Dialog open={editDialog.open} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
          <DialogTitle sx={{fontWeight:700,fontSize:22, color:'primary.main', pb:0}}>{editDialog.student?.report?.comments ? 'Sửa nhận xét' : 'Thêm nhận xét'} DailyReport</DialogTitle>
          <DialogContent sx={{pt:2}}>
            <TextField
              fullWidth
              multiline
              minRows={5}
              variant="outlined"
              placeholder="Nhập nhận xét chi tiết về học sinh..."
              value={editDialog.comment}
              onChange={e => setEditDialog(d => ({ ...d, comment: e.target.value }))}
              disabled={editDialog.saving || !canReportToday || !isStudentActive(editDialog.student)}
              sx={{bgcolor:'#f4faff'}}
            />
          </DialogContent>
          <DialogActions sx={{px:3,pb:2}}>
            <ArgonButton onClick={handleCloseEdit} disabled={editDialog.saving} color="secondary" variant="outlined" sx={{minWidth:100, fontWeight:600}}>Hủy</ArgonButton>
            <ArgonButton onClick={handleSaveEdit} variant="contained" color="info" disabled={editDialog.saving || !canReportToday || !isStudentActive(editDialog.student)} sx={{minWidth:130, fontWeight:700}}>
              {editDialog.saving ? 'Đang lưu...' : (editDialog.student?.report?.comments ? 'Lưu sửa' : 'Thêm nhận xét')}
            </ArgonButton>
          </DialogActions>
        </Dialog>

        {/* Dialog nhận xét hàng loạt */}
        <Dialog open={!!bulkDialog.open} onClose={bulkDialog.saving ? undefined : handleCloseBulkDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{fontWeight:700,fontSize:22, color:'primary.main', pb:1}}>Nhận xét hàng loạt</DialogTitle>
          <DialogContent sx={{pt:1}}>
            {bulkDialog.items.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Không có học sinh cần nhận xét.</Typography>
            ) : (
              <Grid container spacing={2}>
                {bulkDialog.items.map((it, idx) => (
                  <Grid item xs={12} key={it.id}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Box minWidth={220} mt={0.5}>
                        <Typography variant="subtitle2" color="text.primary" sx={{fontWeight:700}}>{it.name}</Typography>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Nhập nhận xét..."
                        value={it.comment}
                        onChange={e => handleChangeBulkItem(idx, e.target.value)}
                        disabled={bulkDialog.saving || !canReportToday || it.status !== 1}
                        sx={{bgcolor:'#fff'}}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{px:3,pb:2}}>
            <ArgonButton onClick={handleCloseBulkDialog} disabled={bulkDialog.saving} color="secondary" variant="outlined" sx={{minWidth:100, fontWeight:600}}>Hủy</ArgonButton>
            <ArgonButton onClick={handleSaveBulkDialog} variant="contained" color="info" disabled={bulkDialog.saving || !canReportToday || bulkDialog.items.length===0} sx={{minWidth:130, fontWeight:700}}>
              {bulkDialog.saving ? 'Đang lưu...' : 'Lưu tất cả'}
            </ArgonButton>
          </DialogActions>
        </Dialog>

        {/* Dialog lịch sử daily report */}
        <Dialog open={historyDialog.open} onClose={handleCloseHistory} maxWidth="md" fullWidth>
          <DialogTitle sx={{fontWeight:700,fontSize:22, color:'primary.main', pb:1}}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar sx={{width:40,height:40, bgcolor:'#e9f6fd', color:'#1976d2'}} src={historyDialog.student?.avatar_url}>
                  {!historyDialog.student?.avatar_url && <PersonIcon />}
                </Avatar>
                <Box>
                  <ArgonTypography variant="h6" fontWeight={700} color="primary.main">
                    Lịch sử báo cáo - {historyDialog.student?.full_name}
                  </ArgonTypography>
                  <Typography variant="caption" color="text.secondary">
                    {historyDialog.reports.length} báo cáo
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton size="small" onClick={() => handleChangeWeek(-1)} disabled={historyDialog.loading}>
                  <ArrowBackIosIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" color="text.primary" sx={{minWidth:200, textAlign:'center', fontWeight:600}}>
                  {historyDialog.weekStart && (() => {
                    const start = new Date(historyDialog.weekStart + 'T00:00:00.000Z');
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    return `${formatDateShort(start.toISOString().split('T')[0])} - ${formatDateShort(end.toISOString().split('T')[0])}`;
                  })()}
                </Typography>
                <IconButton size="small" onClick={() => handleChangeWeek(1)} disabled={historyDialog.loading}>
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{pt:2, maxHeight: '70vh', overflowY: 'auto'}}>
            {historyDialog.loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                <CircularProgress />
              </Box>
            ) : historyDialog.reports.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có báo cáo nào cho học sinh này trong tuần này.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {historyDialog.reports.map((report, idx) => (
                  <Card key={report._id || idx} sx={{ borderRadius: 2, boxShadow: '0 1px 4px #0001', border: '1px solid #e0e0e0' }}>
                    <CardContent sx={{pb: '12px !important', pt:'14px'}}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarMonth color="primary" fontSize="small" />
                          <ArgonTypography variant="subtitle2" fontWeight={700} color="primary.main">
                            {getDayName(report.report_date)} - {formatDateShort(report.report_date)}
                          </ArgonTypography>
                        </Box>
                        <Chip 
                          label={report.comments === 'Nghỉ' ? 'Nghỉ' : (report.checkin_time && report.checkout_time ? 'Hoàn thành' : report.checkin_time ? 'Chưa check out' : 'Chưa checkin')} 
                          color={report.comments === 'Nghỉ' ? 'error' : (report.checkin_time && report.checkout_time ? 'success' : report.checkin_time ? 'info' : 'default')}
                          size="small"
                          sx={{fontWeight:600}}
                        />
                      </Box>
                      
                      <Grid container spacing={1.5} sx={{mt:0.5}}>
                        {report.checkin_time && (
                          <Grid item xs={12} sm={6}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CheckCircleIcon color="success" fontSize="small" />
                              <Typography variant="body2" color="text.secondary">
                                Check-in: <strong>{report.checkin_time}</strong>
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {report.checkout_time && (
                          <Grid item xs={12} sm={6}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <AccessTimeIcon color="info" fontSize="small" />
                              <Typography variant="body2" color="text.secondary">
                                Check-out: <strong>{report.checkout_time}</strong>
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      {report.comments && report.comments !== 'Nghỉ' && (
                        <Box mt={1.5} p={1.5} sx={{bgcolor:'#f4faff', borderRadius:1.5, borderLeft:'3px solid #1976d2'}}>
                          <Box display="flex" alignItems="flex-start" gap={1}>
                            <CommentIcon color="info" fontSize="small" sx={{mt:0.3}} />
                            <Typography variant="body2" color="text.primary" sx={{flex:1, fontWeight:500}}>
                              {report.comments}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{px:3,pb:2}}>
            <ArgonButton onClick={handleCloseHistory} color="secondary" variant="outlined" sx={{minWidth:100, fontWeight:600}}>Đóng</ArgonButton>
          </DialogActions>
        </Dialog>
        {/* Snackbar báo trạng thái */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({...s,open:false}))} anchorOrigin={{vertical:'top',horizontal:'center'}}>
          <Alert onClose={() => setSnackbar(s => ({...s,open:false}))} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default DailyReportPage;
