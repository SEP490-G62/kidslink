import { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import healthService from "services/healthService";

export default function HealthCareProfile() {
  const [profile, setProfile] = useState({ user: {}, staff: {} });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setSnackbar({ open: false });
    // Reset form về ban đầu
    setForm({
      full_name: profile.user.full_name,
      avatar_url: profile.user.avatar_url,
      email: profile.user.email,
      phone_number: profile.user.phone_number,
      qualification: profile.staff.qualification,
      major: profile.staff.major,
      experience_years: profile.staff.experience_years,
      note: profile.staff.note,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await healthService.updateStaffProfile(form);
    if (res.success) {
      setSnackbar({ open: true, message: 'Cập nhật hồ sơ thành công!', severity: 'success' });
      setEditMode(false);
      setProfile(res.data);
    } else {
      setSnackbar({ open: true, message: res.error || 'Cập nhật thất bại', severity: 'error' });
    }
    setSaving(false);
  };

  if (loading) return <ArgonBox textAlign="center" py={6}><CircularProgress /></ArgonBox>;

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4, borderRadius: 4, boxShadow: 3 }}>
      <CardHeader title="Thông tin cá nhân - Nhân viên y tế" sx={{ textAlign: 'center', bgcolor: 'info.light', color: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}/>
      <CardContent>
        <ArgonBox display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Avatar src={form.avatar_url} alt={form.full_name} sx={{ width: 96, height: 96, mb: 2, border: '2px solid #1976d2' }}/>
          {editMode
            ? <TextField label="Họ tên" value={form.full_name} onChange={handleChange} name="full_name" fullWidth sx={{ maxWidth: 320, mb: 2 }} />
            : <ArgonTypography variant="h5" fontWeight="bold">{profile.user.full_name}</ArgonTypography>}
          <ArgonTypography variant="body2" color="text" mb={2}>
            {profile.user && profile.user.username}
          </ArgonTypography>
        </ArgonBox>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><TextField label="Email" value={form.email} onChange={handleChange} name="email" fullWidth disabled={!editMode} /></Grid>
          <Grid item xs={12} md={6}><TextField label="Số điện thoại" value={form.phone_number} onChange={handleChange} name="phone_number" fullWidth disabled={!editMode} /></Grid>
          <Grid item xs={12} md={6}><TextField label="Chuyên môn" value={form.qualification} onChange={handleChange} name="qualification" fullWidth disabled={!editMode} /></Grid>
          <Grid item xs={12} md={6}><TextField label="Ngành nghề" value={form.major} onChange={handleChange} name="major" fullWidth disabled={!editMode} /></Grid>
          <Grid item xs={12} md={6}><TextField label="Năm kinh nghiệm" value={form.experience_years} onChange={handleChange} name="experience_years" fullWidth type="number" disabled={!editMode} /></Grid>
          <Grid item xs={12} md={6}><TextField label="Ghi chú" value={form.note || ''} onChange={handleChange} name="note" fullWidth disabled={!editMode} /></Grid>
          {/* Đổi avatar và mật khẩu nếu editMode */}
          {editMode && <Grid item xs={12}><TextField label="Link ảnh đại diện (avatar_url)" value={form.avatar_url} onChange={handleChange} name="avatar_url" fullWidth /></Grid>}
          {editMode && <Grid item xs={12}><TextField label="Đổi mật khẩu mới (tuỳ chọn)" value={form.password || ''} onChange={handleChange} name="password" fullWidth type="password" /></Grid>}
        </Grid>
        <ArgonBox textAlign="center" mt={3}>
          {!editMode && <Button variant="contained" color="info" onClick={handleEdit}>Chỉnh sửa</Button>}
          {editMode && (
            <>
              <Button variant="contained" color="info" sx={{ mr: 2 }} onClick={handleSave} disabled={saving}>
                Lưu lại
              </Button>
              <Button variant="outlined" onClick={handleCancel} disabled={saving}>Huỷ bỏ</Button>
            </>
          )}
        </ArgonBox>
        <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}
