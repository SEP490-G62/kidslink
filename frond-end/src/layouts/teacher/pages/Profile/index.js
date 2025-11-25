/**
=========================================================
* KidsLink Teacher Profile Page - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================
*/

import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';

// Auth context
import { useAuth } from 'context/AuthContext';
import TeacherService from 'services/teacherService';
import SuccessMessage from 'components/SuccessMessage';
import PropTypes from 'prop-types';

const PasswordSectionCard = ({ icon, title, subtitle, children }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      border: '1px solid #e3f2fd',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(243,248,255,0.98) 100%)',
      boxShadow: '0 10px 25px rgba(25,118,210,0.12)',
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: '#e3f2fd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1976d2',
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

PasswordSectionCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const TeacherProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    teacher: {
      qualification: '',
      major: '',
      experience_years: '',
      note: ''
    },
    user: {
      full_name: '',
      email: '',
      phone_number: '',
      avatar_url: ''
    }
  });

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    avatar_url: '',
    qualification: '',
    major: '',
    experience_years: '',
    note: ''
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Style dùng chung cho các TextField để đồng bộ giao diện
  const getFieldSx = (editable) => ({
    '& .MuiInputBase-input': editable
      ? { color: 'text.primary' }
      : {
          color: 'text.primary',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        },
    '& .MuiInputLabel-root': { color: 'text.secondary', pointerEvents: 'none' },
    '& .MuiInputLabel-root.MuiInputLabel-shrink': {
      zIndex: 1,
      px: 0.5,
      backgroundColor: 'background.paper'
    },
    '& .MuiOutlinedInput-root': {
      bgcolor: editable ? 'background.paper' : 'grey.50',
      '& fieldset': { borderColor: 'grey.300' },
      '&:hover fieldset': { borderColor: editable ? 'primary.light' : 'grey.300' },
      '&.Mui-focused fieldset': { borderColor: 'primary.main' }
    }
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await TeacherService.getMyProfile();
        if (!mounted) return;
        setProfile(data);
        setFormData({
          full_name: data?.user?.full_name || '',
          email: data?.user?.email || '',
          phone_number: data?.user?.phone_number || '',
          avatar_url: data?.user?.avatar_url || '',
          qualification: data?.teacher?.qualification || '',
          major: data?.teacher?.major || '',
          experience_years: data?.teacher?.experience_years ?? '',
          note: data?.teacher?.note || ''
        });
      } catch (e) {
        setError(e.message || 'Không tải được hồ sơ');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        avatar_url: formData.avatar_url,
        qualification: formData.qualification,
        major: formData.major,
        experience_years: formData.experience_years,
        note: formData.note
      };
      const result = await TeacherService.updateMyProfile(payload);
      setSuccess('Cập nhật hồ sơ thành công');
      setProfile(result);
      setIsEditing(false);
    } catch (e) {
      setError(e.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.user?.full_name || '',
      email: profile?.user?.email || '',
      phone_number: profile?.user?.phone_number || '',
      avatar_url: profile?.user?.avatar_url || '',
      qualification: profile?.teacher?.qualification || '',
      major: profile?.teacher?.major || '',
      experience_years: profile?.teacher?.experience_years ?? '',
      note: profile?.teacher?.note || ''
    });
    setIsEditing(false);
  };

  const validateNewPassword = (password) => {
    if (!password) return 'Vui lòng nhập mật khẩu mới';
    if (password.length < 8 || password.length > 16) {
      return 'Mật khẩu phải có từ 8-16 ký tự';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    }
    if (!/[a-z]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 chữ thường';
    }
    if (!/[0-9]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 số';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)';
    }
    return '';
  };

  const handlePasswordChange = async () => {
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    const passwordError = validateNewPassword(passwordForm.newPassword);
    if (passwordError) {
      errors.newPassword = passwordError;
    }
    if (!errors.newPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setPasswordSaving(true);
      setError('');
      setSuccess('');
      await TeacherService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess('Đổi mật khẩu thành công');
      setPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (err) {
      setError(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPasswordSaving(false);
    }
  };

  const closePasswordDialog = () => {
    if (passwordSaving) return;
    setPasswordDialogOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
  };

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {success && <SuccessMessage message={success} />} 
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {/* Header hiện đại với nền gradient */}
        <Card sx={{ mb: 3, overflow: 'hidden' }}>
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: { xs: 2, md: 2.5 },
              background: 'linear-gradient(135deg, rgba(33,150,243,0.15) 0%, rgba(0,200,83,0.15) 100%)'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ width: 36, height: 36 }} src={formData.avatar_url}>
                    {formData.full_name?.charAt(0) || 'T'}
                  </Avatar>
                  <Box>
                    <ArgonTypography variant="h5" fontWeight="bold" letterSpacing={0.2}>
                      Hồ sơ cá nhân
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="text" mt={0.25}>
                      Quản lý thông tin cá nhân và chuyên môn
                    </ArgonTypography>
                  </Box>
                </Stack>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                {formData.qualification && (
                  <Chip color="success" variant="outlined" label={formData.qualification} />
                )}
                {formData.major && (
                  <Chip color="primary" variant="outlined" label={formData.major} />
                )}
                {String(formData.experience_years).length > 0 && (
                  <Chip color="info" variant="outlined" label={`${formData.experience_years} năm`} />
                )}
              </Stack>
            </Box>
          </Box>
        </Card>

        <Grid container spacing={3}>
          {/* Profile Info */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box textAlign="center" mb={3}>
                  <Box sx={{ position: 'relative', width: 120, height: 120, mx: 'auto', mb: 2 }}>
                    <Avatar 
                      src={formData.avatar_url} 
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        border: '4px solid',
                        borderColor: 'success.main'
                      }}
                    >
                      {formData.full_name?.charAt(0) || 'T'}
                    </Avatar>
                    {isEditing && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          bgcolor: 'rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%'
                        }}
                        onClick={() => document.getElementById('avatar-input').click()}
                      >
                        <Tooltip title="Đổi ảnh đại diện">
                          <ArgonTypography variant="button" color="white" fontWeight="bold">
                            Đổi ảnh
                          </ArgonTypography>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                  <ArgonTypography variant="h5" fontWeight="bold" mb={1}>
                    {formData.full_name || 'Giáo viên'}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" mb={1} sx={{ wordBreak: 'break-word' }}>
                    {formData.email || 'teacher@kidslink.com'}
                  </ArgonTypography>
                  <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
                    {formData.major && (
                      <Chip label={formData.major} color="success" size="small" />
                    )}
                    {String(formData.experience_years).length > 0 && (
                      <Chip label={`${formData.experience_years} năm kinh nghiệm`} color="info" size="small" />
                    )}
                  </Box>
                </Box>
                
                {isEditing && (
                  <Box textAlign="center">
                    <input
                      type="file"
                      accept="image/*"
                      id="avatar-input"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        try {
                          setSaving(true);
                          setError('');
                          setSuccess('');
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              const dataUrl = reader.result;
                              const res = await TeacherService.uploadAvatar(dataUrl);
                              setFormData(prev => ({ ...prev, avatar_url: res.avatar_url }));
                              setSuccess('Tải ảnh thành công');
                            } catch (err) {
                              setError(err.message || 'Tải ảnh thất bại');
                            } finally {
                              setSaving(false);
                            }
                          };
                          reader.readAsDataURL(file);
                        } catch (err) {
                          setSaving(false);
                          setError('Không thể đọc file ảnh');
                        }
                      }}
                    />
                    <ArgonButton
                      variant="outlined"
                      color="info"
                      onClick={() => document.getElementById('avatar-input').click()}
                      disabled={saving}
                      sx={{ mt: 1 }}
                    >
                      {saving ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}
                    </ArgonButton>
                  </Box>
                )}
              </CardContent>
              
              <CardActions sx={{ p: 2, flexDirection: 'column', gap: 1 }}>
                <ArgonButton 
                  variant="contained" 
                  color="info" 
                  fullWidth
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
                </ArgonButton>
                <ArgonButton 
                  variant="outlined" 
                  color="warning" 
                  fullWidth
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Đổi mật khẩu
                </ArgonButton>
              </CardActions>
            </Card>
          </Grid>

          {/* Edit Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={1}>
                  Thông tin tài khoản
                </ArgonTypography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  {isEditing && (
                    <Grid item xs={12}>
                      {/* Nút đổi ảnh đã chuyển sang thẻ bên trái để tránh lặp */}
                    </Grid>
                  )}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      InputProps={{ readOnly: !isEditing }}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={getFieldSx(isEditing)}
                      helperText={isEditing ? 'Tên hiển thị trong hệ thống' : ''}
                      inputProps={{ title: formData.full_name }}
                    />
                  </Grid>
                  
                  
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      InputProps={{ readOnly: !isEditing }}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={getFieldSx(isEditing)}
                      helperText={isEditing ? 'VD: 0912 345 678' : ''}
                      inputProps={{ title: formData.phone_number }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <ArgonTypography variant="h6" fontWeight="bold" mb={1} mt={1}>
                      Thông tin chuyên môn
                    </ArgonTypography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Chuyên môn (major)"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                      InputProps={{ readOnly: !isEditing }}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={getFieldSx(isEditing)}
                      helperText={isEditing ? 'VD: Giáo dục mầm non, Tâm lý học...' : ''}
                      inputProps={{ title: formData.major }}
                    />
                  </Grid>
                  
                  
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Kinh nghiệm (năm)"
                      name="experience_years"
                      value={formData.experience_years}
                      onChange={handleInputChange}
                      InputProps={{ readOnly: !isEditing }}
                      placeholder="Ví dụ: 5"
                      type="number"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={getFieldSx(isEditing)}
                      helperText={isEditing ? 'Nhập số năm kinh nghiệm' : ''}
                      inputProps={{ title: String(formData.experience_years || '') }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Bằng cấp (qualification)"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      InputProps={{ readOnly: !isEditing }}
                      placeholder="Ví dụ: Cử nhân Sư phạm Mầm non"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={getFieldSx(isEditing)}
                      helperText={isEditing ? 'Bằng cấp cao nhất liên quan lĩnh vực' : ''}
                      inputProps={{ title: formData.qualification }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ghi chú (note)"
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      InputProps={{ readOnly: !isEditing }}
                      multiline
                      rows={4}
                      placeholder="Ghi chú thêm về hồ sơ..."
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        ...getFieldSx(isEditing),
                        '& .MuiInputBase-input': {
                          whiteSpace: 'pre-wrap',
                          overflow: 'auto',
                          textOverflow: 'unset',
                          color: 'text.primary'
                        }
                      }}
                      helperText={isEditing ? 'Thông tin bổ sung giúp nhà trường hiểu rõ hơn' : ''}
                      inputProps={{ title: formData.note }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              
              {isEditing && (
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <ArgonTypography variant="caption" color="text">
                    Hãy kiểm tra kỹ thông tin trước khi lưu
                  </ArgonTypography>
                  <Box>
                    <ArgonButton 
                      variant="contained" 
                      color="success" 
                      onClick={handleSave}
                      sx={{ mr: 1 }}
                      disabled={saving}
                    >
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </ArgonButton>
                    <ArgonButton 
                      variant="outlined" 
                      color="error" 
                      onClick={handleCancel}
                    >
                      Hủy
                    </ArgonButton>
                  </Box>
                </CardActions>
              )}
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
      <Dialog
        open={passwordDialogOpen}
        onClose={closePasswordDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 16px 40px rgba(13,71,161,0.25)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.info.main} 100%)`,
            color: '#fff',
            py: 2.5,
            px: 3,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <LockOutlinedIcon sx={{ fontSize: 26 }} />
              <Box>
                <ArgonTypography variant="h5" fontWeight="bold" color="#fff">
                  Đổi mật khẩu
                </ArgonTypography>
                <ArgonTypography variant="caption" color="rgba(255,255,255,0.85)">
                  Bảo vệ tài khoản giáo viên của bạn
                </ArgonTypography>
              </Box>
            </Stack>
            <ArgonButton
              onClick={closePasswordDialog}
              color="secondary"
              sx={{
                minWidth: 'auto',
                width: 38,
                height: 38,
                borderRadius: '50%',
                p: 0,
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderColor: 'rgba(255,255,255,0.45)',
                },
              }}
              disabled={passwordSaving}
            >
              <CloseIcon fontSize="small" />
            </ArgonButton>
          </Stack>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%)',
          }}
        >
          <Stack spacing={3}>
            <PasswordSectionCard
              icon={<SecurityOutlinedIcon />}
              title="Thông tin bảo mật"
              subtitle="Nhập mật khẩu hiện tại và mật khẩu mới của bạn"
            >
              <Stack spacing={2.5}>
                <Box>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={0.75}>
                    Mật khẩu hiện tại <span style={{ color: '#d32f2f' }}>*</span>
                  </ArgonTypography>
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    error={Boolean(passwordErrors.currentPassword)}
                    helperText={passwordErrors.currentPassword}
                  />
                </Box>
                <Box>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={0.75}>
                    Mật khẩu mới <span style={{ color: '#d32f2f' }}>*</span>
                  </ArgonTypography>
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    error={Boolean(passwordErrors.newPassword)}
                    helperText={passwordErrors.newPassword || '8-16 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'}
                  />
                </Box>
                <Box>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={0.75}>
                    Xác nhận mật khẩu mới <span style={{ color: '#d32f2f' }}>*</span>
                  </ArgonTypography>
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    error={Boolean(passwordErrors.confirmPassword)}
                    helperText={passwordErrors.confirmPassword}
                  />
                </Box>
              </Stack>
            </PasswordSectionCard>

            <PasswordSectionCard
              icon={<ChecklistOutlinedIcon />}
              title="Yêu cầu mật khẩu mạnh"
              subtitle="Đảm bảo đáp ứng đủ các điều kiện dưới đây"
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
            background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
            borderTop: '1px solid #e3f2fd',
          }}
        >
          <ArgonButton
            onClick={closePasswordDialog}
            variant="outlined"
            color="error"
            disabled={passwordSaving}
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            Hủy
          </ArgonButton>
          <ArgonButton
            onClick={handlePasswordChange}
            variant="contained"
            color="warning"
            disabled={passwordSaving}
            sx={{ borderRadius: 2, minWidth: 150 }}
          >
            {passwordSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
          </ArgonButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherProfile;



