import React, { useState, useEffect } from 'react';
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
import apiService from 'services/api';

const DailyReportPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, student: null, comment: '', saving: false });
  const [bulkComment, setBulkComment] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  // Lấy danh sách DailyReport theo lớp và ngày
  useEffect(() => {
    async function fetchReports() {
      if (!selectedClass || !selectedDate) return;
      setLoading(true);
      try {
        const res = await apiService.get(`/teachers/class/students/attendance/${selectedDate}?class_id=${selectedClass}`);
        setStudents(res?.students || []);
      } catch (err) {
        setStudents([]);
      }
      setLoading(false);
    }
    fetchReports();
  }, [selectedClass, selectedDate]);

  // Sửa nhận xét
  const handleEditComment = (student) => {
    setEditDialog({ open: true, student, comment: student.report?.comments || '', saving: false });
  };
  const handleCloseEdit = () => {
    setEditDialog({ open: false, student: null, comment: '', saving: false });
  };
  const handleSaveEdit = async () => {
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
  const handleBulkComment = async () => {
    if (!bulkComment.trim()) return setSnackbar({ open: true, message: 'Vui lòng nhập nội dung!', severity: 'warning' });
    setBulkSaving(true);
    try {
      const studentsToComment = students.filter(st => !st.report || !st.report.comments);
      let okCount = 0, failCount = 0;
      for (const student of studentsToComment) {
        try {
          await apiService.put(`/teachers/daily-reports/${student.report?._id || student._id}/comment`, { comments: bulkComment, report_date: selectedDate });
          okCount++;
        } catch (e) { failCount++; }
      }
      setSnackbar({ open: true, message: `Đã nhận xét ${okCount} học sinh. ${failCount > 0 ? (failCount + ' thất bại.') : ''}`, severity: failCount === 0 ? 'success' : 'warning' });
      // Reload sau bulk
      const res = await apiService.get(`/teachers/class/students/attendance/${selectedDate}?class_id=${selectedClass}`);
      setStudents(res.students || []);
      setBulkComment('');
    } catch (e) {
      setSnackbar({ open: true, message: 'Có lỗi khi thực hiện nhận xét hàng loạt!', severity: 'error' });
    }
    setBulkSaving(false);
  };

  const isToday = (() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return selectedDate === todayStr;
  })();

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
                    disabled={bulkSaving || !isToday}
                    inputProps={{ style: { fontSize: '0.97rem', color: '#38404a' } }}
                    sx={{bgcolor:'#fff', borderRadius:2, '& input::placeholder': {color:'#bbb', fontStyle:'italic', opacity:1}, minWidth:0}}
                  />
                  <ArgonButton color="info" size="small" variant="contained" disableElevation
                    disabled={bulkSaving || !bulkComment.trim() || !isToday}
                    onClick={handleBulkComment} sx={{ minWidth: 120, fontWeight:600, fontSize:'0.98rem', px:2, py:1, boxShadow:'none' }}>
                    {bulkSaving ? 'Đang gửi...' : 'Nhận xét'}
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
                        sx={{ height: '100%', borderRadius: 3, flex: 1, boxShadow: '0 2px 8px #0001', border:'none', transition: '0.2s', cursor: isToday ? 'pointer' : 'default', '&:hover': {boxShadow: isToday ? 6 : 2, transform: isToday ? 'translateY(-2px)' : 'none'} }}
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
                            </Box>
                            <Tooltip title={student.report?.comments ? 'Sửa nhận xét' : 'Thêm nhận xét'}>
                              <span>
                                <IconButton color="info" size="small" onClick={() => isToday && handleEditComment(student)} disabled={!isToday}>
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
              disabled={editDialog.saving || !isToday}
              sx={{bgcolor:'#f4faff'}}
            />
          </DialogContent>
          <DialogActions sx={{px:3,pb:2}}>
            <ArgonButton onClick={handleCloseEdit} disabled={editDialog.saving} color="secondary" variant="outlined" sx={{minWidth:100, fontWeight:600}}>Hủy</ArgonButton>
            <ArgonButton onClick={handleSaveEdit} variant="contained" color="info" disabled={editDialog.saving || !isToday} sx={{minWidth:130, fontWeight:700}}>
              {editDialog.saving ? 'Đang lưu...' : (editDialog.student?.report?.comments ? 'Lưu sửa' : 'Thêm nhận xét')}
            </ArgonButton>
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
