/**
=========================================================
* KidsLink Parent Dashboard - Personal Information
=========================================================
*/

import { useState, useEffect } from "react";

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

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";

// Services
import parentService from "services/parentService";

function PersonalInformation() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [profileData, setProfileData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone_number: "",
    avatar_url: "",
  });
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone_number: "",
    avatar_url: "",
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [children, setChildren] = useState([]);
  const [activeForm, setActiveForm] = useState(null); // null, "profile", or "password"
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    fetchPersonalInfo();
  }, []);

  const fetchPersonalInfo = async () => {
    try {
      setLoading(true);
      const result = await parentService.getPersonalInfo();
      if (result.success) {
        const userData = result.data.user;
        const normalized = {
          full_name: userData.full_name || "",
          username: userData.username || "",
          email: userData.email || "",
          phone_number: userData.phone_number || "",
          avatar_url: userData.avatar_url || "",
        };
        setProfileData(normalized);
        setFormData(normalized);
        setChildren(result.data.children || []);
        setAvatarPreview("");
      } else {
        setAlert({ open: true, message: result.error || "Không thể tải thông tin", severity: "error" });
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
      
      const result = await parentService.updatePersonalInfo(formData);
      if (result.success) {
        setAlert({ open: true, message: "Cập nhật thông tin thành công", severity: "success" });
        // Refresh data after update
        await fetchPersonalInfo();
        // Clear file after successful upload
        setAvatarFile(null);
      } else {
        setAlert({ open: true, message: result.error || "Không thể cập nhật thông tin", severity: "error" });
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

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setAlert({ open: true, message: "Vui lòng điền đầy đủ thông tin mật khẩu mới", severity: "error" });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({ open: true, message: "Mật khẩu mới không khớp", severity: "error" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setAlert({ open: true, message: "Mật khẩu phải có ít nhất 6 ký tự", severity: "error" });
      return;
    }

    try {
      setSaving(true);
      const result = await parentService.updatePersonalInfo({
        password: passwordData.newPassword
      });
      if (result.success) {
        setAlert({ open: true, message: "Đổi mật khẩu thành công", severity: "success" });
        // Clear password fields
        setPasswordData({
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setAlert({ open: true, message: result.error || "Không thể đổi mật khẩu", severity: "error" });
      }
    } catch (error) {
      setAlert({ open: true, message: "Có lỗi xảy ra khi đổi mật khẩu", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const openProfileForm = () => {
    // Initialize edit state from persisted profile data
    setFormData(profileData);
    setAvatarPreview(profileData.avatar_url || "");
    setAvatarFile(null);
    setActiveForm("profile");
  };

  const openPasswordForm = () => {
    setActiveForm("password");
  };

  const closeForms = () => {
    // Discard unsaved edits by resetting edit state and preview
    setFormData(profileData);
    setAvatarPreview("");
    setAvatarFile(null);
    setActiveForm(null);
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    closeForms();
  };

  const handlePasswordAndClose = async () => {
    await handleChangePassword();
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
            Quản lý thông tin cá nhân và cài đặt tài khoản
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
                    src={profileData.avatar_url}
                    alt={profileData.full_name}
                    sx={{ width: 120, height: 120, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <ArgonBox flex={1}>
                    <ArgonTypography variant="h5" fontWeight="bold" color="dark">
                      {profileData.full_name}
                  </ArgonTypography>
                    <ArgonTypography variant="body2" color="text" mb={2}>
                      Phụ huynh
                  </ArgonTypography>
                    
                    <ArgonBox display="flex" alignItems="center" gap={1.5} mb={1}>
                      <i className="ni ni-single-02" style={{ color: '#5e72e4', fontSize: '16px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="regular">
                        Username: <span style={{ fontWeight: 'bold' }}>{profileData.username}</span>
                  </ArgonTypography>
                </ArgonBox>

                    <ArgonBox display="flex" alignItems="center" gap={1.5} mb={1}>
                      <i className="ni ni-email-83" style={{ color: '#5e72e4', fontSize: '16px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="regular">
                        Email: <span style={{ fontWeight: 'bold' }}>{profileData.email}</span>
                  </ArgonTypography>
                    </ArgonBox>
                    
                    <ArgonBox display="flex" alignItems="center" gap={1.5} mb={1}>
                      <i className="ni ni-mobile-button" style={{ color: '#5e72e4', fontSize: '16px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="regular">
                        SĐT: <span style={{ fontWeight: 'bold' }}>{profileData.phone_number}</span>
                  </ArgonTypography>
                </ArgonBox>

                    {children.length > 0 && (
                      <ArgonBox display="flex" alignItems="center" gap={1.5}>
                        <i className="ni ni-circle-08" style={{ color: '#5e72e4', fontSize: '16px' }} />
                        <ArgonTypography variant="body2" color="text" fontWeight="regular">
                          {children.map((child, index) => (
                            <span key={child._id}>
                              {child.full_name}
                              {index < children.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </ArgonTypography>
                      </ArgonBox>
                    )}
                  </ArgonBox>
                </ArgonBox>

                {/* Action Buttons */}
                <ArgonBox display="flex" gap={2} justifyContent="flex-end" mt={3}>
                  <Button 
                    variant="outlined" 
                    color="warning"
                    onClick={openPasswordForm}
                    startIcon={<i className="ni ni-lock-circle-open" />}
                    sx={{ 
                      minWidth: 160,
                      height: 44,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      borderWidth: '2px',
                      color: '#ff9800',
                      borderColor: '#ff9800',
                      '&:hover': {
                        borderWidth: '2px',
                        backgroundColor: 'rgba(255, 152, 0, 0.08)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                        borderColor: '#f57c00'
                      }
                    }}
                  >
                    Đổi mật khẩu
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={openProfileForm}
                    startIcon={<i className="ni ni-single-02" />}
                    sx={{ 
                      minWidth: 160,
                      height: 44,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 16px rgba(94, 114, 228, 0.4)'
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          <DialogContent>
            <ArgonBox sx={{ mt: 2 }}>
              {/* Avatar - Hiển thị ở đầu, có thể click để upload */}
              <ArgonBox display="flex" flexDirection="column" alignItems="center" mb={3}>
                <ArgonTypography variant="body2" fontWeight="bold" mb={2}>
                  Ảnh đại diện
                </ArgonTypography>
                <input
                  type="file"
                  id="avatar-upload"
                  hidden
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <label htmlFor="avatar-upload" style={{ cursor: 'pointer' }}>
                  <Avatar
                    src={avatarPreview || formData.avatar_url}
                    alt="Avatar"
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      border: '2px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: 'primary.main',
                        boxShadow: '0 4px 12px rgba(94, 114, 228, 0.3)'
                      }
                    }}
                  />
                </label>
                <ArgonTypography variant="body2" color="text" mt={1}>
                  Click để thay đổi ảnh
                </ArgonTypography>
              </ArgonBox>

              {/* Personal Information Section */}
              <ArgonBox>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ArgonBox mb={1}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                        Họ và tên
                      </ArgonTypography>
                    </ArgonBox>
                    <TextField
                      fullWidth
                      value={formData.full_name}
                      onChange={handleInputChange("full_name")}
                      variant="outlined"
                      placeholder="Nhập họ và tên"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                          '& .MuiInputBase-input': {
                          width: '100% !important',
                          minWidth: '0 !important',
                          maxWidth: 'none !important',
                          overflow: 'visible !important',
                          textOverflow: 'unset !important',
                          whiteSpace: 'nowrap !important',
                          boxSizing: 'border-box !important',
                        },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: '2px',
                          },
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <ArgonBox mb={1}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                        Username
                      </ArgonTypography>
                    </ArgonBox>
                    <TextField
                      fullWidth
                      value={formData.username}
                      onChange={handleInputChange("username")}
                      variant="outlined"
                      disabled
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f0f0f0',
                        },
                      }}
                    />
                    <ArgonTypography variant="caption" color="text" sx={{ mt: 0.5, display: 'block' }}>
                      Username không thể thay đổi
                    </ArgonTypography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <ArgonBox mb={1}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                        Email
                      </ArgonTypography>
                    </ArgonBox>
                    <TextField
                      fullWidth
                      value={formData.email}
                      onChange={handleInputChange("email")}
                      variant="outlined"
                      type="email"
                      placeholder="Nhập email"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: '2px',
                          },
                        },
                        '& .MuiInputBase-input': {
                          width: '100% !important',
                          minWidth: '0 !important',
                          maxWidth: 'none !important',
                          overflow: 'visible !important',
                          textOverflow: 'unset !important',
                          whiteSpace: 'nowrap !important',
                          boxSizing: 'border-box !important',
                        },
                        '& .MuiOutlinedInput-input': {
                          width: '100% !important',
                          minWidth: '0 !important',
                          maxWidth: 'none !important',
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <ArgonBox mb={1}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                        Số điện thoại
                      </ArgonTypography>
                    </ArgonBox>
                    <TextField
                      fullWidth
                      value={formData.phone_number}
                      onChange={handleInputChange("phone_number")}
                      variant="outlined"
                      placeholder="Nhập số điện thoại"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: '2px',
                          },
                        },
                        '& .MuiInputBase-input': {
                          width: '100% !important',
                          minWidth: '0 !important',
                          maxWidth: 'none !important',
                          overflow: 'visible !important',
                          textOverflow: 'unset !important',
                          whiteSpace: 'nowrap !important',
                          boxSizing: 'border-box !important',
                        },
                        '& .MuiOutlinedInput-input': {
                          width: '100% !important',
                          minWidth: '0 !important',
                          maxWidth: 'none !important',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </ArgonBox>
            </ArgonBox>
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
              color="primary"
              disabled={saving}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: 'none',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: 3,
                color: 'white !important',
                '&:hover': {
                  boxShadow: 5,
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          <DialogContent>
            <ArgonBox sx={{ mt: 2 }}>
              {/* Password Section */}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ArgonBox mb={1}>
                    <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                      Mật khẩu mới
                    </ArgonTypography>
                  </ArgonBox>
                    <TextField
                      fullWidth
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                      variant="outlined"
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8f9fa',
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: '2px',
                        },
                      },
                    }}
                  />
                  <ArgonTypography variant="caption" color="text" sx={{ mt: 0.5, display: 'block' }}>
                    Tối thiểu 6 ký tự
                  </ArgonTypography>
                  </Grid>
                
                  <Grid item xs={12}>
                  <ArgonBox mb={1}>
                    <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                      Xác nhận mật khẩu mới
                    </ArgonTypography>
                  </ArgonBox>
                    <TextField
                      fullWidth
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                      variant="outlined"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f8f9fa',
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: '2px',
                        },
                      },
                    }}
                    />
                  </Grid>
                </Grid>
            </ArgonBox>
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
              onClick={handlePasswordAndClose}
              variant="contained" 
                            color="primary"
              disabled={saving}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: 'none',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: 3,
                color: 'white !important',
                '&:hover': {
                  boxShadow: 5,
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
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
    </DashboardLayout>
  );
}

export default PersonalInformation;
