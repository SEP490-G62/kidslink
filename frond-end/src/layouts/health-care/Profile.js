/**
=========================================================
* KidsLink Health Care Staff - Personal Information
=========================================================
*/

import { useState, useEffect } from "react";
import PropTypes from "prop-types";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";

// Services
import healthService from "services/healthService";

const INFO_COLORS = {
  main: "#1976d2",
  dark: "#1565c0",
  light: "#63a4ff",
  surface: "#e3f2fd",
  border: "#bbdefb",
  shadow: "rgba(25,118,210,0.25)",
};

const FormSectionCard = ({ icon, title, subtitle, children }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      border: `1px solid ${INFO_COLORS.border}`,
      background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(227,242,253,0.98) 100%)",
      boxShadow: "0 12px 30px rgba(25,118,210,0.08)",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: INFO_COLORS.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: INFO_COLORS.dark,
        }}
      >
        {icon}
      </Box>
      <Box>
        <ArgonTypography variant="subtitle1" fontWeight="bold" color="dark">
          {title}
        </ArgonTypography>
        {subtitle && (
          <ArgonTypography variant="caption" color="text" fontWeight="regular">
            {subtitle}
          </ArgonTypography>
        )}
      </Box>
    </Stack>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

FormSectionCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function HealthCareProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [profileData, setProfileData] = useState({
    user: {
      full_name: "",
      username: "",
      email: "",
      phone_number: "",
      avatar_url: "",
    },
    staff: {
      qualification: "",
      major: "",
      experience_years: "",
      note: ""
    }
  });
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone_number: "",
    avatar_url: "",
    qualification: "",
    major: "",
    experience_years: "",
    note: ""
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [activeForm, setActiveForm] = useState(null); // null, "profile", or "password"
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    fetchPersonalInfo();
  }, []);

  const fetchPersonalInfo = async () => {
    try {
      setLoading(true);
      const result = await healthService.getStaffProfile();
      if (result && result.success && result.data) {
        setProfileData(result.data);
        setFormData({
          full_name: result.data.user.full_name || "",
          username: result.data.user.username || "",
          email: result.data.user.email || "",
          phone_number: result.data.user.phone_number || "",
          avatar_url: result.data.user.avatar_url || "",
          qualification: result.data.staff?.qualification || "",
          major: result.data.staff?.major || "",
          experience_years: result.data.staff?.experience_years || "",
          note: result.data.staff?.note || ""
        });
        setAvatarPreview("");
      } else {
        setAlert({ open: true, message: result?.error || "Không thể tải thông tin", severity: "error" });
      }
    } catch (error) {
      setAlert({ open: true, message: "Có lỗi xảy ra khi tải thông tin", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setAvatarPreview(base64Image);
        // Cập nhật avatar_url trong formData với base64
        setFormData({
          ...formData,
          avatar_url: base64Image
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const result = await healthService.updateStaffProfile({ ...formData });
      if (result && result.success) {
        setAlert({ open: true, message: "Cập nhật thông tin thành công", severity: "success" });
        // Refresh data after update
        await fetchPersonalInfo();
        // Clear file after successful upload
        setAvatarFile(null);
      } else {
        setAlert({ open: true, message: result?.error || "Không thể cập nhật thông tin", severity: "error" });
      }
    } catch (error) {
      setAlert({ open: true, message: "Có lỗi xảy ra khi cập nhật thông tin", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const getPasswordValidationError = (password) => {
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
    return null;
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setAlert({ open: true, message: "Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới", severity: "error" });
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({ open: true, message: "Mật khẩu mới không khớp", severity: "error" });
      return false;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setAlert({ open: true, message: "Mật khẩu mới phải khác mật khẩu hiện tại", severity: "error" });
      return false;
    }

    const passwordError = getPasswordValidationError(passwordData.newPassword);
    if (passwordError) {
      setAlert({ open: true, message: passwordError, severity: "error" });
      return false;
    }

    try {
      setSaving(true);
      const result = await healthService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      if (result && result.success) {
        setAlert({ open: true, message: result.data?.message || "Đổi mật khẩu thành công", severity: "success" });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        closeForms();
        return true;
      }
      setAlert({ open: true, message: result?.error || "Không thể đổi mật khẩu", severity: "error" });
      return false;
    } catch (error) {
      setAlert({ open: true, message: error.message || "Có lỗi xảy ra khi đổi mật khẩu", severity: "error" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const openProfileForm = () => {
    // Initialize edit state from persisted profile data
    setFormData({
      full_name: profileData.user.full_name || "",
      username: profileData.user.username || "",
      email: profileData.user.email || "",
      phone_number: profileData.user.phone_number || "",
      avatar_url: profileData.user.avatar_url || "",
      qualification: profileData.staff?.qualification || "",
      major: profileData.staff?.major || "",
      experience_years: profileData.staff?.experience_years || "",
      note: profileData.staff?.note || ""
    });
    setAvatarPreview(profileData.user.avatar_url || "");
    setAvatarFile(null);
    setActiveForm("profile");
  };

  const openPasswordForm = () => {
    setActiveForm("password");
  };

  const closeForms = () => {
    // Discard unsaved edits by resetting edit state and preview
    setFormData({
      full_name: profileData.user.full_name || "",
      username: profileData.user.username || "",
      email: profileData.user.email || "",
      phone_number: profileData.user.phone_number || "",
      avatar_url: profileData.user.avatar_url || "",
      qualification: profileData.staff?.qualification || "",
      major: profileData.staff?.major || "",
      experience_years: profileData.staff?.experience_years || "",
      note: profileData.staff?.note || ""
    });
    setAvatarPreview("");
    setAvatarFile(null);
    setActiveForm(null);
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    closeForms();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={4}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Thông tin cá nhân
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Quản lý thông tin cá nhân và cài đặt tài khoản nhân viên y tế
          </ArgonTypography>
        </ArgonBox>

        {/* Alert Notification */}
        <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleCloseAlert} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>

        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={10} lg={8}>
            {/* Profile Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <ArgonBox display="flex" alignItems="center" gap={3} pb={3}>
                  <Avatar
                    src={profileData.user.avatar_url}
                    alt={profileData.user.full_name}
                    sx={{ width: 120, height: 120, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <ArgonBox flex={1}>
                    <ArgonTypography variant="h5" fontWeight="bold" color="dark">
                      {profileData.user.full_name}
                  </ArgonTypography>
                    <ArgonTypography variant="body2" color="text" mb={2}>
                      Nhân viên y tế
                  </ArgonTypography>
                    
                    <ArgonBox display="flex" alignItems="center" gap={1.5} mb={1}>
                      <i className="ni ni-single-02" style={{ color: INFO_COLORS.main, fontSize: '16px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="regular">
                        Username: <span style={{ fontWeight: 'bold' }}>{profileData.user.username}</span>
                  </ArgonTypography>
                </ArgonBox>

                    <ArgonBox display="flex" alignItems="center" gap={1.5} mb={1}>
                      <i className="ni ni-email-83" style={{ color: INFO_COLORS.main, fontSize: '16px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="regular">
                        Email: <span style={{ fontWeight: 'bold' }}>{profileData.user.email || '—'}</span>
                  </ArgonTypography>
                    </ArgonBox>
                    
                    <ArgonBox display="flex" alignItems="center" gap={1.5} mb={1}>
                      <i className="ni ni-mobile-button" style={{ color: INFO_COLORS.main, fontSize: '16px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="regular">
                        SĐT: <span style={{ fontWeight: 'bold' }}>{profileData.user.phone_number || '—'}</span>
                  </ArgonTypography>
                </ArgonBox>

                    {/* Staff detail */}
                    <ArgonBox display="flex" alignItems="center" gap={1.5} mb={1}>
                      <i className="ni ni-hat-3" style={{ color: INFO_COLORS.main, fontSize: '16px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="regular">
                        Chuyên môn: <span style={{ fontWeight: 'bold' }}>{profileData.staff?.qualification || '—'}</span>
                  </ArgonTypography>
                    </ArgonBox>

                    <ArgonBox display="flex" alignItems="center" gap={1.5} mb={1}>
                      <i className="ni ni-bulb-61" style={{ color: INFO_COLORS.main, fontSize: '16px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="regular">
                        Ngành nghề: <span style={{ fontWeight: 'bold' }}>{profileData.staff?.major || '—'}</span>
                  </ArgonTypography>
                    </ArgonBox>

                    <ArgonBox display="flex" alignItems="center" gap={1.5} mb={1}>
                      <i className="ni ni-chart-bar-32" style={{ color: INFO_COLORS.main, fontSize: '16px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="regular">
                        Năm kinh nghiệm: <span style={{ fontWeight: 'bold' }}>{profileData.staff?.experience_years || '—'}</span>
                  </ArgonTypography>
                    </ArgonBox>

                    <ArgonBox display="flex" alignItems="center" gap={1.5}>
                      <i className="ni ni-notification-70" style={{ color: INFO_COLORS.main, fontSize: '16px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="regular">
                        Ghi chú: <span style={{ fontWeight: 'bold' }}>{profileData.staff?.note || '—'}</span>
                  </ArgonTypography>
                    </ArgonBox>
                  </ArgonBox>
                </ArgonBox>

                {/* Action Buttons */}
                <ArgonBox display="flex" gap={2} justifyContent="flex-end" mt={3}>
                  <Button 
                    variant="outlined" 
                    color="info"
                    onClick={openPasswordForm}
                    startIcon={<i className="ni ni-lock-circle-open" />}
                    sx={{ 
                      minWidth: 160,
                      height: 44,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      borderWidth: 2,
                      color: INFO_COLORS.main,
                      borderColor: INFO_COLORS.main,
                      '&:hover': {
                        borderWidth: 2,
                        backgroundColor: `${INFO_COLORS.surface}`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${INFO_COLORS.shadow}`,
                        borderColor: INFO_COLORS.dark
                      }
                    }}
                  >
                    Đổi mật khẩu
                  </Button>
                  <Button 
                    variant="contained" 
                    color="info"
                    onClick={openProfileForm}
                    startIcon={<i className="ni ni-single-02" />}
                    sx={{ 
                      minWidth: 160,
                      height: 44,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: INFO_COLORS.main,
                      boxShadow: `0 6px 16px ${INFO_COLORS.shadow}`,
                      '&:hover': {
                        backgroundColor: INFO_COLORS.dark,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 8px 18px ${INFO_COLORS.shadow}`
                      }
                    }}
                  >
                    Cập nhật thông tin
                </Button>
                </ArgonBox>
              </CardContent>
            </Card>

          </Grid>
          </Grid>

        {/* Edit Profile Dialog */}
        <Dialog 
          open={activeForm === "profile"} 
          onClose={closeForms}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            py: 2.5
          }}>
            <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
              <ArgonTypography variant="h5" fontWeight="bold" color="white">
                Cập nhật thông tin cá nhân
              </ArgonTypography>
              <IconButton onClick={closeForms} sx={{ color: 'white' }}>
                <i className="ni ni-fat-remove" style={{ fontSize: '24px' }} />
              </IconButton>
            </ArgonBox>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              <FormSectionCard
                icon={<PhotoCameraIcon />}
                title="Ảnh đại diện"
                subtitle="Ảnh sẽ hiển thị cho phụ huynh và giáo viên"
              >
                <ArgonBox display="flex" flexDirection="column" alignItems="center">
                  <input
                    type="file"
                    id="avatar-upload-health"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                  <label htmlFor="avatar-upload-health" style={{ cursor: "pointer" }}>
                    <Avatar
                      src={avatarPreview || formData.avatar_url}
                      alt="Avatar"
                      sx={{
                        width: 120,
                        height: 120,
                        border: "2px solid #e0e0e0",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "scale(1.05)",
                          borderColor: INFO_COLORS.main,
                          boxShadow: "0 4px 12px rgba(25,118,210,0.25)",
                        },
                      }}
                    />
                  </label>
                  <ArgonTypography variant="body2" color="text" mt={1}>
                    Nhấp để chọn ảnh mới (JPG, PNG)
                  </ArgonTypography>
                </ArgonBox>
              </FormSectionCard>

              <FormSectionCard
                icon={<InfoOutlinedIcon />}
                title="Thông tin cá nhân"
                subtitle="Cập nhật thông tin liên hệ của bạn"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                      Họ và tên
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      value={formData.full_name}
                      onChange={handleInputChange("full_name")}
                      variant="outlined"
                      placeholder="Nhập họ và tên"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8f9fa",
                          "&:hover fieldset": {
                            borderColor: "info.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "info.main",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                      Username
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      value={formData.username}
                      variant="outlined"
                      disabled
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f0f0f0",
                        },
                      }}
                    />
                    <ArgonTypography variant="caption" color="text" sx={{ mt: 0.5, display: "block" }}>
                      Username không thể thay đổi
                    </ArgonTypography>
                  </Grid>

                  <Grid item xs={12}>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                      Email
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      value={formData.email}
                      onChange={handleInputChange("email")}
                      variant="outlined"
                      type="email"
                      placeholder="Nhập email"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8f9fa",
                          "&:hover fieldset": {
                            borderColor: "info.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "info.main",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                      Số điện thoại
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      value={formData.phone_number}
                      onChange={handleInputChange("phone_number")}
                      variant="outlined"
                      placeholder="Nhập số điện thoại"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8f9fa",
                          "&:hover fieldset": {
                            borderColor: "info.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "info.main",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </FormSectionCard>

              <FormSectionCard
                icon={<LocalHospitalIcon />}
                title="Thông tin chuyên môn"
                subtitle="Chia sẻ kinh nghiệm để phụ huynh yên tâm hơn"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                      Chuyên môn
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      value={formData.qualification}
                      onChange={handleInputChange("qualification")}
                      variant="outlined"
                      placeholder="Nhập chuyên môn"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8f9fa",
                          "&:hover fieldset": {
                            borderColor: "info.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "info.main",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                      Ngành nghề
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      value={formData.major}
                      onChange={handleInputChange("major")}
                      variant="outlined"
                      placeholder="Nhập ngành nghề"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8f9fa",
                          "&:hover fieldset": {
                            borderColor: "info.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "info.main",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                      Năm kinh nghiệm
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      value={formData.experience_years}
                      onChange={handleInputChange("experience_years")}
                      variant="outlined"
                      type="number"
                      placeholder="Nhập số năm kinh nghiệm"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8f9fa",
                          "&:hover fieldset": {
                            borderColor: "info.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "info.main",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                      Ghi chú
                    </ArgonTypography>
                    <TextField
                      fullWidth
                      value={formData.note}
                      onChange={handleInputChange("note")}
                      variant="outlined"
                      multiline
                      rows={3}
                      placeholder="Nhập ghi chú"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8f9fa",
                          "&:hover fieldset": {
                            borderColor: "info.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "info.main",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </FormSectionCard>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              onClick={closeForms}
              disabled={saving}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 'bold',
                border: '2px solid',
                borderColor: 'grey.300',
                '&:hover': { borderWidth: 2 }
              }}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSaveAndClose}
              variant="contained"
              color="info"
              disabled={saving}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: 'none',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: 3,
                color: 'white !important',
                '&:hover': {
                  boxShadow: 5,
                  background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  color: 'white !important'
                },
                '&:disabled': { background: '#ccc', color: 'white !important' }
              }}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog 
          open={activeForm === "password"} 
          onClose={closeForms}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            py: 2.5
          }}>
            <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
              <ArgonTypography variant="h5" fontWeight="bold" color="white">
                Đổi mật khẩu
              </ArgonTypography>
              <IconButton onClick={closeForms} sx={{ color: 'white' }}>
                <i className="ni ni-fat-remove" style={{ fontSize: '24px' }} />
              </IconButton>
            </ArgonBox>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <FormSectionCard
              icon={<LockOutlinedIcon />}
              title="Đổi mật khẩu"
              subtitle="Nhập mật khẩu hiện tại và tạo mật khẩu mới an toàn"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Mật khẩu hiện tại
                  </ArgonTypography>
                  <TextField
                    fullWidth
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    type={showPassword.currentPassword ? "text" : "password"}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => togglePasswordVisibility("currentPassword")} edge="end">
                            {showPassword.currentPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Nhập mật khẩu hiện tại"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#f8f9fa",
                        "&:hover fieldset": {
                          borderColor: "info.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "info.main",
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Mật khẩu mới
                  </ArgonTypography>
                  <TextField
                    fullWidth
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    type={showPassword.newPassword ? "text" : "password"}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => togglePasswordVisibility("newPassword")} edge="end">
                            {showPassword.newPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Nhập mật khẩu mới"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#f8f9fa",
                        "&:hover fieldset": {
                          borderColor: "info.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "info.main",
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                  <ArgonTypography variant="caption" color="text" sx={{ mt: 0.5, display: "block" }}>
                    8-16 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </ArgonTypography>
                </Grid>

                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Xác nhận mật khẩu mới
                  </ArgonTypography>
                  <TextField
                    fullWidth
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    type={showPassword.confirmPassword ? "text" : "password"}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => togglePasswordVisibility("confirmPassword")} edge="end">
                            {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#f8f9fa",
                        "&:hover fieldset": {
                          borderColor: "info.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "info.main",
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </FormSectionCard>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              onClick={closeForms}
              disabled={saving}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 'bold',
                border: '2px solid',
                borderColor: 'grey.300',
                '&:hover': { borderWidth: 2 }
              }}
            >
                    Hủy
                  </Button>
            <Button 
              onClick={handleChangePassword}
              variant="contained" 
              color="info"
              disabled={saving}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: 'none',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: 3,
                color: 'white !important',
                '&:hover': {
                  boxShadow: 5,
                  background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  color: 'white !important'
                },
                '&:disabled': { background: '#ccc', color: 'white !important' }
              }}
            >
              {saving ? "Đang lưu..." : "Đổi mật khẩu"}
            </Button>
          </DialogActions>
        </Dialog>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default HealthCareProfile;
