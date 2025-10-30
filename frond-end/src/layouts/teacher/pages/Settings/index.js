/**
=========================================================
* KidsLink Teacher Settings Page - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================
*/

import React, { useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Switch,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  Alert
} from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';

const TeacherSettings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      dailyReport: true,
      parentMessage: true,
      systemUpdate: true
    },
    privacy: {
      showProfile: true,
      showSchedule: false,
      showContact: true
    },
    preferences: {
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
      dateFormat: 'DD/MM/YYYY',
      theme: 'light'
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      loginAlerts: true
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSavePassword = () => {
    // TODO: Save password to API
    console.log('Saving password:', passwordForm);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordForm(false);
  };

  const handleSaveSettings = () => {
    // TODO: Save settings to API
    console.log('Saving settings:', settings);
  };

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" mb={1}>
            Cài đặt
          </ArgonTypography>
          <ArgonTypography variant="body1" color="text">
            Quản lý cài đặt tài khoản và tùy chọn cá nhân
          </ArgonTypography>
        </ArgonBox>

        <Grid container spacing={3}>
          {/* Notifications Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
                  Thông báo
                </ArgonTypography>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.email}
                        onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                      />
                    }
                    label="Email thông báo"
                  />
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.push}
                        onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                      />
                    }
                    label="Thông báo đẩy"
                  />
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.sms}
                        onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                      />
                    }
                    label="SMS thông báo"
                  />
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.dailyReport}
                        onChange={(e) => handleSettingChange('notifications', 'dailyReport', e.target.checked)}
                      />
                    }
                    label="Báo cáo hàng ngày"
                  />
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.parentMessage}
                        onChange={(e) => handleSettingChange('notifications', 'parentMessage', e.target.checked)}
                      />
                    }
                    label="Tin nhắn từ phụ huynh"
                  />
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.systemUpdate}
                        onChange={(e) => handleSettingChange('notifications', 'systemUpdate', e.target.checked)}
                      />
                    }
                    label="Cập nhật hệ thống"
                  />
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>

          {/* Privacy Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
                  Quyền riêng tư
                </ArgonTypography>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.privacy.showProfile}
                        onChange={(e) => handleSettingChange('privacy', 'showProfile', e.target.checked)}
                      />
                    }
                    label="Hiển thị hồ sơ công khai"
                  />
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.privacy.showSchedule}
                        onChange={(e) => handleSettingChange('privacy', 'showSchedule', e.target.checked)}
                      />
                    }
                    label="Hiển thị lịch học"
                  />
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.privacy.showContact}
                        onChange={(e) => handleSettingChange('privacy', 'showContact', e.target.checked)}
                      />
                    }
                    label="Hiển thị thông tin liên hệ"
                  />
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>

          {/* Preferences */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
                  Tùy chọn
                </ArgonTypography>
                
                <ArgonBox mb={2}>
                  <FormControl fullWidth>
                    <InputLabel>Ngôn ngữ</InputLabel>
                    <Select
                      value={settings.preferences.language}
                      onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                      label="Ngôn ngữ"
                    >
                      <MenuItem value="vi">Tiếng Việt</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControl fullWidth>
                    <InputLabel>Múi giờ</InputLabel>
                    <Select
                      value={settings.preferences.timezone}
                      onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                      label="Múi giờ"
                    >
                      <MenuItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</MenuItem>
                      <MenuItem value="UTC">UTC</MenuItem>
                    </Select>
                  </FormControl>
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControl fullWidth>
                    <InputLabel>Định dạng ngày</InputLabel>
                    <Select
                      value={settings.preferences.dateFormat}
                      onChange={(e) => handleSettingChange('preferences', 'dateFormat', e.target.value)}
                      label="Định dạng ngày"
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControl fullWidth>
                    <InputLabel>Giao diện</InputLabel>
                    <Select
                      value={settings.preferences.theme}
                      onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                      label="Giao diện"
                    >
                      <MenuItem value="light">Sáng</MenuItem>
                      <MenuItem value="dark">Tối</MenuItem>
                      <MenuItem value="auto">Tự động</MenuItem>
                    </Select>
                  </FormControl>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
                  Bảo mật
                </ArgonTypography>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.twoFactor}
                        onChange={(e) => handleSettingChange('security', 'twoFactor', e.target.checked)}
                      />
                    }
                    label="Xác thực 2 yếu tố"
                  />
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControl fullWidth>
                    <InputLabel>Thời gian hết phiên (phút)</InputLabel>
                    <Select
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                      label="Thời gian hết phiên (phút)"
                    >
                      <MenuItem value={15}>15 phút</MenuItem>
                      <MenuItem value={30}>30 phút</MenuItem>
                      <MenuItem value={60}>1 giờ</MenuItem>
                      <MenuItem value={120}>2 giờ</MenuItem>
                    </Select>
                  </FormControl>
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.loginAlerts}
                        onChange={(e) => handleSettingChange('security', 'loginAlerts', e.target.checked)}
                      />
                    }
                    label="Cảnh báo đăng nhập"
                  />
                </ArgonBox>
                
                <Divider sx={{ my: 2 }} />
                
                <ArgonButton 
                  variant="outlined" 
                  color="warning" 
                  fullWidth
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  Đổi mật khẩu
                </ArgonButton>
              </CardContent>
            </Card>
          </Grid>

          {/* Password Change Form */}
          {showPasswordForm && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
                    Đổi mật khẩu
                  </ArgonTypography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Mật khẩu hiện tại"
                        name="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Mật khẩu mới"
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Xác nhận mật khẩu"
                        name="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                    </Grid>
                  </Grid>
                  
                  {passwordForm.newPassword && passwordForm.confirmPassword && 
                   passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      Mật khẩu xác nhận không khớp
                    </Alert>
                  )}
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <ArgonButton 
                    variant="contained" 
                    color="success" 
                    onClick={handleSavePassword}
                    disabled={passwordForm.newPassword !== passwordForm.confirmPassword}
                    sx={{ mr: 1 }}
                  >
                    Lưu mật khẩu
                  </ArgonButton>
                  <ArgonButton 
                    variant="outlined" 
                    color="error" 
                    onClick={() => setShowPasswordForm(false)}
                  >
                    Hủy
                  </ArgonButton>
                </CardActions>
              </Card>
            </Grid>
          )}

          {/* Save Button */}
          <Grid item xs={12}>
            <Card>
              <CardActions sx={{ p: 2 }}>
                <ArgonButton 
                  variant="contained" 
                  color="success" 
                  size="large"
                  onClick={handleSaveSettings}
                >
                  Lưu tất cả cài đặt
                </ArgonButton>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default TeacherSettings;



