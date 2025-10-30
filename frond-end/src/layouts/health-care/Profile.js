import { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";
import healthService from "services/healthService";
import DialogContentText from '@mui/material/DialogContentText';

export default function HealthCareProfile() {
  const [profile, setProfile] = useState({ user: {}, staff: {} });
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editPassword, setEditPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const res = await healthService.getStaffProfile();
      if (res.success) {
        setProfile(res.data);
        setForm({
          full_name: res.data.user.full_name || '',
          avatar_url: res.data.user.avatar_url || '',
          email: res.data.user.email || '',
          phone_number: res.data.user.phone_number || '',
          qualification: res.data.staff.qualification || '',
          major: res.data.staff.major || '',
          experience_years: res.data.staff.experience_years || '',
          note: res.data.staff.note || ''
        });
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  // Avatar uploading/preview
  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm((prev) => ({ ...prev, avatar_url: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  // Change form field
  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  // Change password form
  const handlePasswordChange = (e) => setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Save profile changes
  const handleSave = async () => {
    setSaving(true);
    const res = await healthService.updateStaffProfile({ ...form });
    if (res.success) {
      setSnackbar({ open: true, message: 'Cập nhật thành công!', severity: 'success' });
      setEditOpen(false);
      setProfile(res.data);
    } else {
      setSnackbar({ open: true, message: res.error || 'Cập nhật thất bại', severity: 'error' });
    }
    setSaving(false);
  };

  // Save password
  const savePassword = async () => {
    if (!passwordForm.password || passwordForm.password.length < 6) {
      setSnackbar({ open: true, message: 'Mật khẩu phải từ 6 ký tự', severity: 'error' });
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      setSnackbar({ open: true, message: 'Xác nhận mật khẩu không khớp', severity: 'error' });
      return;
    }
    setSaving(true);
    const res = await healthService.updateStaffProfile({ password: passwordForm.password });
    if (res.success) {
      setSnackbar({ open: true, message: 'Đổi mật khẩu thành công!', severity: 'success' });
      setEditPassword(false);
      setPasswordForm({ password: '', confirm: '' });
    } else {
      setSnackbar({ open: true, message: res.error || 'Thất bại', severity: 'error' });
    }
    setSaving(false);
  };

  // Khi bấm nút Lưu ở dialog profile
  const handleConfirmUpdate = () => setConfirmDialog({ open: true, action: "update" });
  // Khi bấm nút Lưu ở dialog password
  const handleConfirmPassword = () => setConfirmDialog({ open: true, action: "password" });

  const handleConfirmYes = async () => {
    setConfirmDialog({ open: false, action: null });
    if (confirmDialog.action === 'update') await handleSave();
    if (confirmDialog.action === 'password') await savePassword();
  };

  const handleConfirmNo = () => setConfirmDialog({ open: false, action: null });

  if (loading) return <ArgonBox textAlign="center" py={8}><CircularProgress /></ArgonBox>;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} minHeight="80vh" >
        <ArgonBox mb={4} textAlign="center">
          <ArgonTypography variant="h4" fontWeight="bold" color="primary" mb={1}>
            Thông tin cá nhân
          </ArgonTypography>
          <ArgonTypography color="text">Quản lý hồ sơ và cài đặt tài khoản nhân viên y tế</ArgonTypography>
        </ArgonBox>
        <Card sx={{ maxWidth: 620, mx: 'auto', borderRadius: 5, boxShadow: 4 }}>
          <CardContent>
            <Grid container spacing={0}>
              <Grid item xs={12} textAlign="center" pb={3}>
                <ArgonBox position="relative" display="inline-block">
                  <Avatar src={profile.user.avatar_url} sx={{ width: 106, height: 106, mx: 'auto', mb: 2, boxShadow: 2, border: '3px solid #1976d2' }}/>
                  <label htmlFor="avatar-upload-2" style={{ cursor: 'pointer', position: 'absolute', bottom: 12, right: 16, background: '#fff', padding: 4, borderRadius: 16, border: '1px solid #e0e0e0', boxShadow: '0 2px 8px #0001' }} title="Đổi avatar">
                    <input type="file" id="avatar-upload-2" hidden accept="image/*" onChange={handleAvatarUpload} />
                    <i className="ni ni-camera-compact" style={{ color: '#1976d2', fontSize: 20 }} />
                  </label>
                </ArgonBox>
                <ArgonTypography mt={1} variant="h5" fontWeight="bold">{profile.user.full_name}</ArgonTypography>
                <ArgonTypography variant="caption" color="text">Health Care Staff</ArgonTypography>
              </Grid>
              <Grid item xs={12} sm={6} pb={1} pl={{ sm: 3 }} ><ArgonBox display="flex" alignItems="center" gap={1}><i className="ni ni-single-02" style={{ color: '#1976d2' }} /><ArgonTypography fontWeight="medium">Username:</ArgonTypography></ArgonBox><ArgonTypography color="text">{profile.user.username}</ArgonTypography></Grid>
              <Grid item xs={12} sm={6} pb={1}><ArgonBox display="flex" alignItems="center" gap={1}><i className="ni ni-email-83" style={{ color: '#1976d2' }}/><ArgonTypography fontWeight="medium">Email:</ArgonTypography></ArgonBox><ArgonTypography color="text">{profile.user.email || '—'}</ArgonTypography></Grid>
              <Grid item xs={12} sm={6} pb={1} pl={{ sm: 3 }}><ArgonBox display="flex" alignItems="center" gap={1}><i className="ni ni-mobile-button" style={{ color: '#1976d2' }}/><ArgonTypography fontWeight="medium">SĐT:</ArgonTypography></ArgonBox><ArgonTypography color="text">{profile.user.phone_number || '—'}</ArgonTypography></Grid>
              {/* Staff detail */}
              <Grid item xs={12} sm={6} pb={1}><ArgonBox display="flex" alignItems="center" gap={1}><i className="ni ni-hat-3" style={{ color: '#1976d2' }}/><ArgonTypography fontWeight="medium">Chuyên môn:</ArgonTypography></ArgonBox><ArgonTypography color="text">{profile.staff.qualification || '—'}</ArgonTypography></Grid>
              <Grid item xs={12} sm={6} pb={1} pl={{ sm: 3 }}><ArgonBox display="flex" alignItems="center" gap={1}><i className="ni ni-bulb-61" style={{ color: '#1976d2' }}/><ArgonTypography fontWeight="medium">Ngành nghề:</ArgonTypography></ArgonBox><ArgonTypography color="text">{profile.staff.major || '—'}</ArgonTypography></Grid>
              <Grid item xs={12} sm={6} pb={1}><ArgonBox display="flex" alignItems="center" gap={1}><i className="ni ni-chart-bar-32" style={{ color: '#1976d2' }}/><ArgonTypography fontWeight="medium">Năm KN:</ArgonTypography></ArgonBox><ArgonTypography color="text">{profile.staff.experience_years || '—'}</ArgonTypography></Grid>
              <Grid item xs={12} pb={1} pl={{ sm: 3 }}><ArgonBox display="flex" alignItems="center" gap={1}><i className="ni ni-notification-70" style={{ color: '#1976d2' }}/><ArgonTypography fontWeight="medium">Ghi chú:</ArgonTypography></ArgonBox><ArgonTypography color="text">{profile.staff.note || '—'}</ArgonTypography></Grid>
            </Grid>
            <ArgonBox display="flex" gap={2} mt={4} justifyContent="center">
              <Button variant="outlined" color="warning" startIcon={<i className="ni ni-lock-circle-open" />} sx={btn2} onClick={() => setEditPassword(true)}>Đổi mật khẩu</Button>
              <Button variant="contained" color="primary" startIcon={<i className="ni ni-curved-next" />} sx={btn1} onClick={() => setEditOpen(true)}>Chỉnh sửa</Button>
            </ArgonBox>
          </CardContent>
        </Card>
        {/* Edit INFO Dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={dialogTitle}>Cập nhật thông tin cá nhân</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} mt={1}>
              <Grid item xs={12}>
                <TextField name="full_name" label="Họ tên" value={form.full_name} onChange={handleChange} fullWidth sx={field} />
              </Grid>
              <Grid item xs={12}><TextField name="email" label="Email" value={form.email} onChange={handleChange} fullWidth sx={field} /></Grid>
              <Grid item xs={12}><TextField name="phone_number" label="Số điện thoại" value={form.phone_number} onChange={handleChange} fullWidth sx={field} /></Grid>
              <Grid item xs={12}><TextField name="qualification" label="Chuyên môn" value={form.qualification} onChange={handleChange} fullWidth sx={field} /></Grid>
              <Grid item xs={12}><TextField name="major" label="Ngành nghề" value={form.major} onChange={handleChange} fullWidth sx={field} /></Grid>
              <Grid item xs={12}><TextField name="experience_years" type="number" label="Năm kinh nghiệm" value={form.experience_years} onChange={handleChange} fullWidth sx={field} /></Grid>
              <Grid item xs={12}><TextField name="note" label="Ghi chú" value={form.note} onChange={handleChange} fullWidth sx={field} /></Grid>
              <Grid item xs={12}>
                <TextField name="avatar_url" label="Link ảnh đại diện (avatar)" value={form.avatar_url} onChange={handleChange} fullWidth sx={field} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditOpen(false)} variant="text">Huỷ</Button>
            <Button onClick={handleConfirmUpdate} variant="contained" disabled={saving}>Lưu lại</Button>
          </DialogActions>
        </Dialog>
        {/* Đổi mật khẩu dialog */}
        <Dialog open={editPassword} onClose={() => setEditPassword(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={dialogTitle}>Đổi mật khẩu</DialogTitle>
          <DialogContent>
            <TextField name="password" label="Mật khẩu mới" type="password" value={passwordForm.password} onChange={handlePasswordChange} fullWidth sx={field} margin="normal" />
            <TextField name="confirm" label="Xác nhận mật khẩu" type="password" value={passwordForm.confirm} onChange={handlePasswordChange} fullWidth sx={field} margin="normal" />
            <ArgonTypography variant="caption" color="text.secondary">Tối thiểu 6 ký tự và trùng khớp xác nhận.</ArgonTypography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditPassword(false)} variant="text">Huỷ</Button>
            <Button onClick={handleConfirmPassword} variant="contained" disabled={saving}>Lưu</Button>
          </DialogActions>
        </Dialog>
        {/* Xác nhận thay đổi Dialog */}
        <Dialog open={confirmDialog.open} onClose={handleConfirmNo}>
          <DialogTitle>Xác nhận thao tác</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {confirmDialog.action === "update" && "Bạn có chắc chắn muốn lưu thay đổi này không?"}
              {confirmDialog.action === "password" && "Bạn có chắc chắn muốn đổi mật khẩu không?"}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleConfirmNo}>Hủy</Button>
            <Button onClick={handleConfirmYes} variant="contained" color="info">Đồng ý</Button>
          </DialogActions>
        </Dialog>
        {/* SNACKBAR */}
        <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ fontSize: 16 }}>{snackbar.message}</Alert>
        </Snackbar>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

// --- Style helpers ---
const field = { mt: 1, mb: 0.5 };
const btn1 = {
  fontWeight: 700,
  minWidth: 160,
  px: 3,
  py: 1.5,
  fontSize: 15,
  boxShadow: 3,
  borderRadius: 3
};
const btn2 = {
  fontWeight: 700,
  minWidth: 160,
  px: 3,
  py: 1.5,
  fontSize: 15,
  borderRadius: 3,
  color: '#ff9800',
  borderColor: '#ff9800',
  '&:hover': {
    backgroundColor: 'rgba(255, 152, 0, 0.07)',
    color: '#ef6c00',
    borderColor: '#ef6c00'
  }
};
const dialogTitle = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  fontWeight: 700,
  fontSize: 19,
  py: 2
};
