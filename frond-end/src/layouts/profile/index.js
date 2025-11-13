import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useAuth } from "context/AuthContext";
import api from "services/api";

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    username: user?.username || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    avatar_url: user?.avatar_url || "",
  });
  const [edit, setEdit] = useState(profile);
  const [openEdit, setOpenEdit] = useState(false);
  const [openPwd, setOpenPwd] = useState(false);
  const [pwd, setPwd] = useState({ newPassword: "", confirmPassword: "" });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const me = await api.get("/users/me", true).catch(() => null);
        if (me && (me.user || me.data || me)) {
          const u = me.user || me.data || me;
          const normalized = {
            full_name: u.full_name || "",
            username: u.username || "",
            email: u.email || "",
            phone_number: u.phone_number || "",
            avatar_url: u.avatar_url || "",
          };
          setProfile(normalized);
          setEdit(normalized);
        }
      } catch (e) {}
    };
    fetchMe();
  }, []);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setAvatarPreview(base64);
      setEdit({ ...edit, avatar_url: base64 });
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    try {
      await api.put("/users/me", edit, true).catch(() => ({}));
      setProfile(edit);
      setOpenEdit(false);
      setAlert({ open: true, message: "Cập nhật thông tin thành công", severity: "success" });
    } catch (e) {
      setAlert({ open: true, message: "Không thể cập nhật thông tin", severity: "error" });
    }
  };

  const changePassword = async () => {
    if (!pwd.newPassword || pwd.newPassword.length < 6) {
      setAlert({ open: true, message: "Mật khẩu tối thiểu 6 ký tự", severity: "error" });
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      setAlert({ open: true, message: "Mật khẩu không khớp", severity: "error" });
      return;
    }
    try {
      await api.put("/users/change-password", { password: pwd.newPassword }, true).catch(() => ({}));
      setOpenPwd(false);
      setPwd({ newPassword: "", confirmPassword: "" });
      setAlert({ open: true, message: "Đổi mật khẩu thành công", severity: "success" });
    } catch (e) {
      setAlert({ open: true, message: "Không thể đổi mật khẩu", severity: "error" });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <ArgonBox mb={4}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">Thông tin cá nhân</ArgonTypography>
          <ArgonTypography variant="body2" color="text">Quản lý hồ sơ, ảnh đại diện và mật khẩu</ArgonTypography>
        </ArgonBox>

        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={10} lg={8}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" alignItems="center" gap={3} pb={3}>
                  <Avatar src={profile.avatar_url} sx={{ width: 120, height: 120, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {profile.full_name?.[0] || 'A'}
                  </Avatar>
                  <ArgonBox flex={1}>
                    <ArgonTypography variant="h5" fontWeight="bold" color="dark">{profile.full_name || '—'}</ArgonTypography>
                    <ArgonTypography variant="body2" color="text" mb={1}>Username: <b>{profile.username}</b></ArgonTypography>
                    <ArgonTypography variant="body2" color="text" mb={1}>Email: <b>{profile.email || '—'}</b></ArgonTypography>
                    <ArgonTypography variant="body2" color="text">SĐT: <b>{profile.phone_number || '—'}</b></ArgonTypography>
                  </ArgonBox>
                </ArgonBox>

                <ArgonBox display="flex" gap={2} justifyContent="flex-end">
                  <Button variant="contained" color="info" onClick={() => setOpenPwd(true)} startIcon={<i className="ni ni-lock-circle-open" />}>Đổi mật khẩu</Button>
                  <Button variant="contained" color="primary" onClick={() => { setEdit(profile); setAvatarPreview(""); setOpenEdit(true); }} startIcon={<i className="ni ni-single-02" />}>Cập nhật thông tin</Button>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
          <DialogTitle>Cập nhật thông tin cá nhân</DialogTitle>
          <DialogContent>
            <ArgonBox mt={1}>
              <ArgonBox display="flex" flexDirection="column" alignItems="center" mb={3}>
                <input id="profile-avatar" type="file" hidden accept="image/*" onChange={onUpload} />
                <label htmlFor="profile-avatar" style={{ cursor: 'pointer' }}>
                  <Avatar src={avatarPreview || edit.avatar_url} sx={{ width: 120, height: 120 }} />
                </label>
                <ArgonTypography variant="caption" color="text" mt={1}>Click để thay ảnh</ArgonTypography>
              </ArgonBox>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="body2" fontWeight="medium" color="dark" sx={{ mb: 0.5 }}>Họ và tên</ArgonTypography>
                  <TextField fullWidth value={edit.full_name} onChange={(e)=>setEdit({ ...edit, full_name: e.target.value })} placeholder="Nhập họ và tên" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="body2" fontWeight="medium" color="dark" sx={{ mb: 0.5 }}>Username</ArgonTypography>
                  <TextField fullWidth value={edit.username} disabled placeholder="Username" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="body2" fontWeight="medium" color="dark" sx={{ mb: 0.5 }}>Email</ArgonTypography>
                  <TextField fullWidth type="email" value={edit.email} onChange={(e)=>setEdit({ ...edit, email: e.target.value })} placeholder="Nhập email" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="body2" fontWeight="medium" color="dark" sx={{ mb: 0.5 }}>Số điện thoại</ArgonTypography>
                  <TextField fullWidth value={edit.phone_number} onChange={(e)=>setEdit({ ...edit, phone_number: e.target.value })} placeholder="Nhập số điện thoại" />
                </Grid>
              </Grid>
            </ArgonBox>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setOpenEdit(false)}>Hủy</Button>
            <Button variant="contained" onClick={saveProfile}>Lưu thay đổi</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openPwd} onClose={()=>setOpenPwd(false)} fullWidth maxWidth="sm">
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} mt={0.5}>
              <Grid item xs={12}>
                <ArgonTypography variant="body2" fontWeight="medium" color="dark" sx={{ mb: 0.5 }}>Mật khẩu mới</ArgonTypography>
                <TextField fullWidth type="password" value={pwd.newPassword} onChange={(e)=>setPwd({ ...pwd, newPassword: e.target.value })} placeholder="Nhập mật khẩu mới" />
              </Grid>
              <Grid item xs={12}>
                <ArgonTypography variant="body2" fontWeight="medium" color="dark" sx={{ mb: 0.5 }}>Xác nhận mật khẩu mới</ArgonTypography>
                <TextField fullWidth type="password" value={pwd.confirmPassword} onChange={(e)=>setPwd({ ...pwd, confirmPassword: e.target.value })} placeholder="Nhập lại mật khẩu mới" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setOpenPwd(false)}>Hủy</Button>
            <Button variant="contained" onClick={changePassword}>Đổi mật khẩu</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={alert.open} autoHideDuration={5000} onClose={()=>setAlert({ ...alert, open:false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={alert.severity} onClose={()=>setAlert({ ...alert, open:false })}>{alert.message}</Alert>
        </Snackbar>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Profile;
