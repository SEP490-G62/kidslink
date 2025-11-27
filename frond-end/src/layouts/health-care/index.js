import { useState, useEffect } from "react";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";

import healthService from "services/healthService";
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';

export default function HealthCareStaffDashboard() {
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Health tab state
  const [healthTab, setHealthTab] = useState(0);
  const [healthRecords, setHealthRecords] = useState([]);
  const [healthNotices, setHealthNotices] = useState([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  // Create record/notice dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("record");
  const [dialogPayload, setDialogPayload] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
  // Bổ sung editDialog state
  const [editDialog, setEditDialog] = useState({ open: false, type: null, record: null });
  const [editPayload, setEditPayload] = useState({});
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch classes on mount
  useEffect(() => {
    const fetch = async () => {
      setLoadingClasses(true);
      const res = await healthService.getClasses();
      setClasses(res.success ? res.data : []);
      setLoadingClasses(false);
    };
    fetch();
  }, []);

  // Fetch students by class
  const handleSelectClass = async (cls) => {
    setSelectedClass(cls);
    setLoadingStudents(true);
    setStudents([]);
    setSelectedStudent(null);
    const res = await healthService.getStudentsByClass(cls._id);
    setStudents(res.success ? res.data : []);
    setLoadingStudents(false);
  };

  // Khi chọn một học sinh, show modal và load dữ liệu health
  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setHealthTab(0);
    setLoadingHealth(true);
    // Load health records
    const recordsRaw = await healthService.getHealthRecords(student._id);
    setHealthRecords(recordsRaw.success ? recordsRaw.data : []);
    // Load health notices
    const noticesRaw = await healthService.getHealthNotices(student._id);
    setHealthNotices(noticesRaw.success ? noticesRaw.data : []);
    setLoadingHealth(false);
    setModalOpen(true);
  };

  // Tabs logic in modal
  const handleTabChange = (_, newValue) => setHealthTab(newValue);

  // Đóng create dialog
  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogPayload({});
  };

  // Hiển thị dialog tạo mới health record hoặc notice
  const handleCreate = (type) => {
    setDialogType(type);
    setDialogPayload({});
    setDialogOpen(true);
  };

  // Validate trước khi thêm record/notice
  const validateAddPayload = () => {
    if (dialogType === 'record') {
      const { checkup_date, height_cm, weight_kg, note } = dialogPayload;
      if (!checkup_date || !height_cm || !weight_kg || !note) {
        setSnackbar({ open: true, message: 'Không được để trống bất kỳ ô nào của sổ sức khỏe!', severity: 'error' });
        return false;
      }
    } else {
      const { notice_time, symptoms, actions_taken, medications, note } = dialogPayload;
      if (!notice_time || !symptoms || !actions_taken || !medications || !note) {
        setSnackbar({ open: true, message: 'Không được để trống bất kỳ ô nào của thông báo y tế!', severity: 'error' });
        return false;
      }
    }
    return true;
  };

  // Gửi dữ liệu thêm mới
  const handleDialogSubmit = async () => {
    // Validate required fields trước khi gọi API
    if (!validateAddPayload()) return;
    if (!selectedStudent) return;
    const { _id } = selectedStudent;
    if (dialogType === "record") {
      const payload = {
        ...dialogPayload,
        student_id: _id,
      };
      await healthService.createHealthRecord(payload);
      handleStudentClick(selectedStudent); // reload data
    } else {
      const payload = {
        ...dialogPayload,
        student_id: _id,
      };
      await healthService.createHealthNotice(payload);
      handleStudentClick(selectedStudent); // reload data
    }
    setDialogOpen(false);
  };

  // --- Mở xác nhận trước khi submit thêm mới health record/notice ---
  // Thay vì gọi thẳng handleDialogSubmit -> mở dialog confirm trước
  const handleDialogConfirm = (type) => setConfirmDialog({ open: true, type });
  const handleDialogConfirmYes = async () => {
    setConfirmDialog({ open: false, type: null });
    await handleDialogSubmit();
  };
  const handleDialogConfirmNo = () => setConfirmDialog({ open: false, type: null });

  // Đảm bảo chuyển Decimal128 sang string nếu cần
  const parseDecimal = (val) => (val && typeof val === 'object' && val.$numberDecimal) ? val.$numberDecimal : val ? val.toString() : '';

  // override handleEditClick với robust prefill
  const handleEditClick = (type, record) => {
    setEditDialog({ open: true, type, record });
    if (type === 'record') {
      setEditPayload({
        checkup_date: record.checkup_date ? record.checkup_date.slice(0,10) : '',
        height_cm: parseDecimal(record.height_cm),
        weight_kg: parseDecimal(record.weight_kg),
        note: record.note || '',
      });
    } else {
      // notice
      // Nếu notice_time có định dạng ISO (2024-10-28T10:15:00Z), chuyển thành "2024-10-28T10:15" cho datetime-local
      const dt = record.notice_time ? record.notice_time.replace('Z','').slice(0,16) : '';
      setEditPayload({
        notice_time: dt,
        symptoms: record.symptoms || '',
        actions_taken: record.actions_taken || '',
        medications: record.medications || '',
        note: record.note || '',
      });
    }
  };
  // On change field (edit)
  const handleEditChange = e => setEditPayload(p => ({ ...p, [e.target.name]: e.target.value }));
  // Khi click Lưu: hiện confirm trước
  const handleEditDialogSave = () => setEditConfirmOpen(true);
  // Khi agree tại confirm dialog mới gọi API update
  const handleEditDialogConfirm = async () => {
    setEditConfirmOpen(false);
    if (editDialog.type === 'record') {
      const res = await healthService.updateHealthRecord(editDialog.record._id, editPayload);
      if (res.success) {
        setSnackbar({ open: true, message: 'Cập nhật thành công', severity: 'success' });
        setEditDialog({ open: false, type: null, record: null });
        if (selectedStudent) await handleStudentClick(selectedStudent);
      } else {
        setSnackbar({ open: true, message: res.error || 'Lỗi update', severity: 'error' });
      }
    } else {
      const res = await healthService.updateHealthNotice(editDialog.record._id, editPayload);
      if (res.success) {
        setSnackbar({ open: true, message: 'Cập nhật thông báo thành công', severity: 'success' });
        setEditDialog({ open: false, type: null, record: null });
        if (selectedStudent) await handleStudentClick(selectedStudent);
      } else {
        setSnackbar({ open: true, message: res.error || 'Lỗi update', severity: 'error' });
      }
    }
  };
  // Hủy dialog
  const handleEditDialogClose = () => {
    setEditDialog({ open: false, type: null, record: null });
    setEditPayload({});
    setEditConfirmOpen(false);
  };

  // --- Xác nhận xóa ---
  const handleDeleteClick = (type, id) => setDeleteDialog({ open: true, type, id });
  const handleConfirmDelete = async () => {
    try {
      let res;
      if (deleteDialog.type === 'record') {
        res = await healthService.deleteHealthRecord(deleteDialog.id);
      } else {
        res = await healthService.deleteHealthNotice(deleteDialog.id);
      }
      if (res.success) {
        setSnackbar({ open: true, message: 'Xóa thành công!', severity: 'success' });
        setDeleteDialog({ open: false, type: null, id: null });
        if (selectedStudent) await handleStudentClick(selectedStudent);
      } else {
        setSnackbar({ open: true, message: res.error || 'Xóa thất bại', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Lỗi kết nối', severity: 'error' });
    }
  };

  // Helper để lấy số từ Decimal128 hoặc number string
  const getDecimal = (val) =>
    (val && typeof val === 'object' && val.$numberDecimal)
      ? Number(val.$numberDecimal)
      : Number(val);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <ArgonTypography variant="h4" fontWeight="bold" mb={3}>
          Quản lý sức khoẻ - Health Care Staff
        </ArgonTypography>
        <Grid container spacing={3}>
          {/* Sidebar: Danh sách lớp */}
          <Grid item xs={12} md={4} lg={3}>
            <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
              <CardHeader title="Danh sách lớp" sx={{ textAlign: "center", fontWeight: 'bold', color: 'primary.dark' }} />
              <CardContent>
                {loadingClasses ? (
                  <Box display="flex" justifyContent="center"><CircularProgress /></Box>
                ) : (
                  <List>
                    {classes.map((cls) => (
                      <ListItem
                        button
                        key={cls._id}
                        selected={selectedClass && selectedClass._id === cls._id}
                        onClick={() => handleSelectClass(cls)}
                        sx={{ borderRadius: 3, mb: 1, boxShadow: selectedClass && selectedClass._id === cls._id ? 3 : 1, bgcolor: selectedClass && selectedClass._id === cls._id ? 'info.light' : '#fff' }}
                      >
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main', color: 'white' }}>{cls.class_name[0]}</Avatar>
                        <ListItemText
                          primary={<ArgonTypography fontWeight="bold">Lớp {cls.class_name} <Chip size="small" label={cls.class_age_id?.age_name || ""} color="secondary" /></ArgonTypography>}
                          secondary={<ArgonTypography variant="caption" color="text">{cls.school_id?.school_name}</ArgonTypography>}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
          {/* Main: Danh sách học sinh */}
          <Grid item xs={12} md={8} lg={9}>
            {selectedClass ? (
              <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
                <CardHeader
                  title={<ArgonTypography fontWeight="bold" color="info.dark">Học sinh - Lớp {selectedClass.class_name}</ArgonTypography>}
                  subheader={students.length > 0 ? `Tổng: ${students.length} học sinh` : ""}
                />
                <Divider />
                <CardContent>
                  {loadingStudents ? (
                    <Box display="flex" justifyContent="center"><CircularProgress /></Box>
                  ) : (
                    <Grid container spacing={2}>
                      {students.length === 0 && (
                        <Grid item xs={12}>
                          <ArgonTypography align="center">Không có học sinh nào trong lớp này.</ArgonTypography>
                        </Grid>
                      )}
                      {students.map((student) => (
                        <Grid item xs={12} sm={6} md={4} key={student._id}>
                          <Card
                            variant="outlined"
                            sx={{ cursor: "pointer", borderRadius: 3, boxShadow: 1, '&:hover': { boxShadow: 4, borderColor: 'primary.main' } }}
                            onClick={() => handleStudentClick(student)}
                          >
                            <CardContent sx={{ textAlign: "center" }}>
                              <Avatar
                                src={student.avatar_url}
                                alt={student.full_name}
                                sx={{ width: 64, height: 64, mx: "auto", mb: 1 }}
                              />
                              <ArgonTypography fontWeight="bold">{student.full_name}</ArgonTypography>
                              <Divider sx={{ my: 1 }} />
                              <Chip label={`Dị ứng: ${student.allergy || "Không"}`} color={student.allergy && student.allergy !== "Không" ? "warning" : "success"} variant="outlined" size="small" />
                              <ArgonTypography variant="caption" display="block" color="text" mt={1}>
                                Ngày sinh: {new Date(student.dob).toLocaleDateString()}
                              </ArgonTypography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ mt: 7 }}><ArgonTypography color="text" align="center">Vui lòng chọn một lớp để xem danh sách học sinh</ArgonTypography></Box>
            )}
          </Grid>
        </Grid>
        {/* Student Health Modal */}
        <Modal open={modalOpen && !!selectedStudent} onClose={() => setModalOpen(false)}>
          <Box sx={{ p: 0, position: 'absolute', top: '15%', left: '50%', transform: 'translate(-50%, 0)', minWidth: 370, maxWidth: 640, width: '100%', borderRadius: 4 }}>
            <Card>
              <CardHeader title={selectedStudent?.full_name || ''} sx={{ textAlign: 'center', bgcolor: 'info.main', color: 'white' }} />
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                  <Avatar src={selectedStudent?.avatar_url} alt={selectedStudent?.full_name} sx={{ width: 72, height: 72, mb: 1.5 }}/>
                  <ArgonTypography fontWeight="medium">Ngày sinh: {selectedStudent && new Date(selectedStudent.dob).toLocaleDateString()}</ArgonTypography>
                  <Chip label={selectedStudent?.allergy} color={selectedStudent?.allergy && selectedStudent?.allergy !== 'Không' ?  "warning" : "success"} size="small" sx={{ my: 1 }} />
                </Box>
                <Tabs value={healthTab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
                  <Tab label="Sổ sức khoẻ" />
                  <Tab label="Thông báo y tế" />
                </Tabs>
                {loadingHealth ? (
                  <Box display="flex" justifyContent="center"><CircularProgress /></Box>
                ) : (
                  <>
                  {healthTab === 0 && (
                    <>
                      <ArgonTypography fontWeight="bold" mb={2}>Sổ sức khoẻ</ArgonTypography>
                      <Button variant="contained" color="info" sx={{ mb: 2 }} onClick={() => handleCreate('record')}>Thêm sổ sức khoẻ</Button>
                      {healthRecords.length === 0 && <ArgonTypography>Chưa có sổ sức khoẻ nào.</ArgonTypography>}
                      <List>
                        {healthRecords.map((r) => {
                          const height = getDecimal(r.height_cm);
                          const weight = getDecimal(r.weight_kg);
                          return (
                            <ListItem key={r._id} divider>
                              <ListItemText
                                primary={<ArgonTypography fontWeight="bold">Ngày khám: {new Date(r.checkup_date).toLocaleDateString()}</ArgonTypography>}
                                secondary={
                                  <>
                                    <ArgonTypography fontSize={14}>
                                      Chiều cao: {height !== null && !isNaN(height) ? height.toFixed(1) : '—'}cm •
                                      Cân nặng: {weight !== null && !isNaN(weight) ? weight.toFixed(1) : '—'}kg
                                    </ArgonTypography>
                                    <ArgonTypography fontSize={13} color="secondary">Ghi chú: {r.note}</ArgonTypography>
                                  </>
                                }
                              />
                              <Box display="flex" gap={1} mt={1}>
                                <Tooltip title="Sửa">
                                  <IconButton size="small" onClick={()=>handleEditClick('record', r)}>
                                    <EditOutlinedIcon sx={{ color: '#1976d2', fontSize: 22 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Xóa">
                                  <IconButton size="small" onClick={() => handleDeleteClick('record', r._id)}>
                                    <DeleteForeverOutlinedIcon sx={{ color: '#e53935', fontSize: 22 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </ListItem>
                          );
                        })}
                      </List>
                    </>
                  )}
                  {healthTab === 1 && (
                    <>
                      <ArgonTypography fontWeight="bold" mb={2}>Thông báo y tế</ArgonTypography>
                      <Button variant="contained" color="error" sx={{ mb: 2 }} onClick={() => handleCreate('notice')}>Thêm thông báo y tế</Button>
                      {healthNotices.length === 0 && <ArgonTypography>Chưa có thông báo y tế nào.</ArgonTypography>}
                      <List>
                        {healthNotices.map((n) => (
                          <ListItem key={n._id} divider>
                            <ListItemText
                              primary={<ArgonTypography fontWeight="bold">{n.symptoms}</ArgonTypography>}
                              secondary={<>
                                <ArgonTypography fontSize={14}>Thời gian: {n.notice_time ? new Date(n.notice_time).toLocaleString('vi-VN') : ''}</ArgonTypography>
                                <ArgonTypography fontSize={13} color="secondary">Hành động: {n.actions_taken} | Thuốc: {n.medications}</ArgonTypography>
                                <ArgonTypography fontSize={12}>Ghi chú: {n.note}</ArgonTypography>
                              </>}
                            />
                            <Box display="flex" gap={1} mt={1}>
                              <Tooltip title="Sửa">
                                <IconButton size="small" onClick={()=>handleEditClick('notice',n)}>
                                  <EditOutlinedIcon sx={{ color: '#1976d2', fontSize: 22 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa">
                                <IconButton size="small" onClick={() => handleDeleteClick('notice', n._id)}>
                                  <DeleteForeverOutlinedIcon sx={{ color: '#e53935', fontSize: 22 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                  </>
                )}
              </CardContent>
            </Card>
            {/* Tạo Health Record/Notice */}
            <Dialog open={dialogOpen} onClose={handleDialogClose}>
              <DialogTitle>{dialogType === 'record' ? "Thêm sổ sức khoẻ" : "Thêm thông báo y tế"}</DialogTitle>
              <DialogContent>
                {dialogType === 'record' ? (
                  <>
                    <TextField label="Ngày khám" type="date" fullWidth sx={{ mb: 2 }} InputLabelProps={{shrink: true}} value={dialogPayload.checkup_date || ''} onChange={e => setDialogPayload(p => ({ ...p, checkup_date: e.target.value }))} />
                    <TextField label="Chiều cao (cm)" type="number" fullWidth sx={{ mb: 2 }} value={dialogPayload.height_cm || ''} onChange={e => setDialogPayload(p => ({ ...p, height_cm: e.target.value }))} />
                    <TextField label="Cân nặng (kg)" type="number" fullWidth sx={{ mb: 2 }} value={dialogPayload.weight_kg || ''} onChange={e => setDialogPayload(p => ({ ...p, weight_kg: e.target.value }))} />
                    <TextField label="Ghi chú" fullWidth multiline rows={2} value={dialogPayload.note || ''} onChange={e => setDialogPayload(p => ({ ...p, note: e.target.value }))} />
                  </>
                ) : (
                  <>
                    <TextField label="Thời gian thông báo" type="datetime-local" fullWidth sx={{ mb: 2 }} InputLabelProps={{shrink: true}} value={dialogPayload.notice_time || ''} onChange={e => setDialogPayload(p => ({ ...p, notice_time: e.target.value }))} />
                    <TextField label="Triệu chứng" fullWidth sx={{ mb: 2 }} value={dialogPayload.symptoms || ''} onChange={e => setDialogPayload(p => ({ ...p, symptoms: e.target.value }))} />
                    <TextField label="Hành động đã thực hiện" fullWidth sx={{ mb: 2 }} value={dialogPayload.actions_taken || ''} onChange={e => setDialogPayload(p => ({ ...p, actions_taken: e.target.value }))} />
                    <TextField label="Thuốc đã dùng" fullWidth sx={{ mb: 2 }} value={dialogPayload.medications || ''} onChange={e => setDialogPayload(p => ({ ...p, medications: e.target.value }))} />
                    <TextField label="Ghi chú" fullWidth multiline rows={2} value={dialogPayload.note || ''} onChange={e => setDialogPayload(p => ({ ...p, note: e.target.value }))} />
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleDialogClose}>Hủy</Button>
                <Button variant="contained" onClick={handleDialogSubmit}>Lưu</Button>
              </DialogActions>
            </Dialog>
            {/* Edit Dialog */}
            <Dialog open={editDialog.open} onClose={handleEditDialogClose}>
              <DialogTitle>
                {editDialog.type === 'record' ? 'Sửa sổ sức khoẻ' : 'Sửa thông báo y tế'}
              </DialogTitle>
              <DialogContent>
                {editDialog.type === 'record' ? (
                  <>
                    <TextField label="Ngày khám" type="date" name="checkup_date" fullWidth sx={{ mb: 2 }} InputLabelProps={{shrink: true}} value={editPayload.checkup_date || ''} onChange={handleEditChange}/>
                    <TextField label="Chiều cao (cm)" type="number" name="height_cm" fullWidth sx={{ mb: 2 }} value={editPayload.height_cm || ''} onChange={handleEditChange}/>
                    <TextField label="Cân nặng (kg)" type="number" name="weight_kg" fullWidth sx={{ mb: 2 }} value={editPayload.weight_kg || ''} onChange={handleEditChange}/>
                    <TextField label="Ghi chú" name="note" fullWidth multiline rows={2} value={editPayload.note || ''} onChange={handleEditChange}/>
                  </>
                ) : (
                  <>
                    <TextField label="Thời gian thông báo" type="datetime-local" name="notice_time" fullWidth sx={{ mb: 2 }} InputLabelProps={{shrink: true}} value={editPayload.notice_time || ''} onChange={handleEditChange}/>
                    <TextField label="Triệu chứng" name="symptoms" fullWidth sx={{ mb: 2 }} value={editPayload.symptoms || ''} onChange={handleEditChange}/>
                    <TextField label="Hành động đã thực hiện" name="actions_taken" fullWidth sx={{ mb: 2 }} value={editPayload.actions_taken || ''} onChange={handleEditChange}/>
                    <TextField label="Thuốc đã dùng" name="medications" fullWidth sx={{ mb: 2 }} value={editPayload.medications || ''} onChange={handleEditChange}/>
                    <TextField label="Ghi chú" name="note" fullWidth multiline rows={2} value={editPayload.note || ''} onChange={handleEditChange}/>
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleEditDialogClose}>Huỷ</Button>
                <Button variant="contained" color="info" onClick={handleEditDialogSave}>Lưu</Button>
              </DialogActions>
            </Dialog>
            {/* Dialog confirm lưu */}
            <Dialog open={editConfirmOpen} onClose={()=>setEditConfirmOpen(false)}>
              <DialogTitle>Xác nhận cập nhật</DialogTitle>
              <DialogContent>Bạn có chắc chắn muốn cập nhật thông tin này không?</DialogContent>
              <DialogActions>
                <Button onClick={()=>setEditConfirmOpen(false)}>Hủy</Button>
                <Button variant="contained" color="info" onClick={handleEditDialogConfirm}>Đồng ý</Button>
              </DialogActions>
            </Dialog>
            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false, type: null, id: null })}>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Bạn có chắc chắn muốn xóa bản ghi này không?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false, type: null, id: null })}>Hủy</Button>
                <Button variant="contained" color="error" onClick={handleConfirmDelete}>Xóa</Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Modal>
        {/* Dialog xác nhận thao tác submit (gắn ở cuối return) */}
        <Dialog open={confirmDialog.open} onClose={handleDialogConfirmNo}>
          <DialogTitle>Xác nhận thao tác</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {confirmDialog.type === 'record' && 'Bạn có chắc chắn muốn thêm mới sổ sức khỏe này không?'}
              {confirmDialog.type === 'notice' && 'Bạn có chắc chắn muốn thêm mới thông báo y tế này không?'}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogConfirmNo}>Hủy</Button>
            <Button onClick={handleDialogConfirmYes} variant="contained" color="info">Đồng ý</Button>
          </DialogActions>
        </Dialog>
        {/* Snackbar báo kết quả */}
        <ArgonBox sx={{ position: 'fixed', bottom: 20, left: 20, zIndex: 9999 }}>
          <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </ArgonBox>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}