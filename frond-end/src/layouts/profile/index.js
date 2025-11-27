import { useEffect, useState } from "react";
import PropTypes from "prop-types";
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
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useAuth } from "context/AuthContext";
import api from "services/api";

const PasswordSectionCard = ({ icon, title, subtitle, children }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      border: "1px solid #e3f2fd",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(243,248,255,0.98) 100%)",
      boxShadow: "0 10px 25px rgba(25,118,210,0.12)",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <ArgonBox
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#e3f2fd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1976d2",
        }}
      >
        {icon}
      </ArgonBox>
      <ArgonBox>
        <ArgonTypography variant="subtitle1" fontWeight="bold" color="dark">
          {title}
        </ArgonTypography>
        {subtitle && (
          <ArgonTypography variant="caption" color="text" fontWeight="regular">
            {subtitle}
          </ArgonTypography>
        )}
      </ArgonBox>
    </Stack>
    {children}
  </Paper>
);

PasswordSectionCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

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
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdSaving, setPwdSaving] = useState(false);

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

  const getPasswordError = (password) => {
    if (!password) return "Vui lòng nhập mật khẩu mới";
    if (password.length < 8 || password.length > 16) {
      return "Mật khẩu phải có từ 8-16 ký tự";
    }
    if (!/[A-Z]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ hoa";
    }
    if (!/[a-z]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ thường";
    }
    if (!/[0-9]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 số";
    }
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)";
    }
    return "";
  };

  const changePassword = async () => {
    const errors = {};
    if (!pwd.currentPassword) {
      errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }
    const passwordError = getPasswordError(pwd.newPassword);
    if (passwordError) {
      errors.newPassword = passwordError;
    }
    if (!pwd.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (!errors.newPassword && pwd.newPassword !== pwd.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    setPwdErrors(errors);
    if (Object.keys(errors).length > 0) {
      setAlert({ open: true, message: "Vui lòng kiểm tra lại thông tin mật khẩu", severity: "error" });
      return false;
    }
    try {
      setPwdSaving(true);
      await api.put("/users/change-password", { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }, true).catch(() => ({}));
      setAlert({ open: true, message: "Đổi mật khẩu thành công", severity: "success" });
      return true;
    } catch (e) {
      setAlert({ open: true, message: "Không thể đổi mật khẩu", severity: "error" });
      return false;
    } finally {
      setPwdSaving(false);
    }
  };

  const closePasswordDialog = () => {
    setOpenPwd(false);
    setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPwdErrors({});
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
                  <Button variant="contained" color="info" onClick={() => { setOpenPwd(true); setPwdErrors({}); }} startIcon={<i className="ni ni-lock-circle-open" />}>Đổi mật khẩu</Button>
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

        <Dialog
          open={openPwd}
          onClose={closePasswordDialog}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { borderRadius: 3, boxShadow: "0 16px 40px rgba(13,71,161,0.25)" }
          }}
        >
          <DialogTitle
            sx={{
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.info.main} 100%)`,
              color: "#fff",
              py: 2.5,
              px: 3
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <LockOutlinedIcon sx={{ fontSize: 26 }} />
                <ArgonBox>
                  <ArgonTypography variant="h5" fontWeight="bold" color="#fff">
                    Đổi mật khẩu
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="rgba(255,255,255,0.85)">
                    Bảo vệ tài khoản quản trị của bạn
                  </ArgonTypography>
                </ArgonBox>
              </Stack>
              <Button
                onClick={closePasswordDialog}
                disabled={pwdSaving}
                sx={{
                  minWidth: "auto",
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  p: 0,
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                    borderColor: "rgba(255,255,255,0.45)"
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </Button>
            </Stack>
          </DialogTitle>
          <DialogContent
            sx={{
              p: 3,
              background: "linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%)"
            }}
          >
            <Stack spacing={3}>
              <PasswordSectionCard
                icon={<SecurityOutlinedIcon />}
                title="Thông tin bảo mật"
                subtitle="Nhập mật khẩu hiện tại và mật khẩu mới"
              >
                <Stack spacing={2.5}>
                  <ArgonBox>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={0.75}>
                      Mật khẩu hiện tại <span style={{ color: "#d32f2f" }}>*</span>
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      type="password"
                      value={pwd.currentPassword}
                      onChange={(e)=>setPwd({ ...pwd, currentPassword: e.target.value })}
                      placeholder="Nhập mật khẩu hiện tại"
                      error={Boolean(pwdErrors.currentPassword)}
                      helperText={pwdErrors.currentPassword}
                    />
                  </ArgonBox>
                  <ArgonBox>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={0.75}>
                      Mật khẩu mới <span style={{ color: "#d32f2f" }}>*</span>
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      type="password"
                      value={pwd.newPassword}
                      onChange={(e)=>setPwd({ ...pwd, newPassword: e.target.value })}
                      placeholder="Nhập mật khẩu mới"
                      error={Boolean(pwdErrors.newPassword)}
                      helperText={pwdErrors.newPassword || "8-16 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"}
                    />
                  </ArgonBox>
                  <ArgonBox>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={0.75}>
                      Xác nhận mật khẩu mới <span style={{ color: "#d32f2f" }}>*</span>
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      type="password"
                      value={pwd.confirmPassword}
                      onChange={(e)=>setPwd({ ...pwd, confirmPassword: e.target.value })}
                      placeholder="Nhập lại mật khẩu mới"
                      error={Boolean(pwdErrors.confirmPassword)}
                      helperText={pwdErrors.confirmPassword}
                    />
                  </ArgonBox>
                </Stack>
              </PasswordSectionCard>
              <PasswordSectionCard
                icon={<ChecklistOutlinedIcon />}
                title="Yêu cầu mật khẩu mạnh"
                subtitle="Đảm bảo đáp ứng đủ các tiêu chí"
              >
                <Stack spacing={1.2} color="text.secondary">
                  <ArgonTypography variant="body2">• Độ dài từ 8 - 16 ký tự</ArgonTypography>
                  <ArgonTypography variant="body2">• Chứa ít nhất 1 chữ hoa và 1 chữ thường</ArgonTypography>
                  <ArgonTypography variant="body2">• Chứa ít nhất 1 chữ số</ArgonTypography>
                  <ArgonTypography variant="body2">• Chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)</ArgonTypography>
                </Stack>
              </PasswordSectionCard>
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
              borderTop: "1px solid #e3f2fd"
            }}
          >
            <Button onClick={closePasswordDialog} disabled={pwdSaving}>Hủy</Button>
            <Button variant="contained" onClick={async () => { const ok = await changePassword(); if (ok) closePasswordDialog(); }} disabled={pwdSaving}>
              {pwdSaving ? "Đang cập nhật..." : "Đổi mật khẩu"}
            </Button>
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
