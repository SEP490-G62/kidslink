/**
=========================================================
* KidsLink Teacher Profile Page - v1.0.0
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
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  Chip
} from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';

// Auth context
import { useAuth } from 'context/AuthContext';

const TeacherProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    specialization: user?.specialization || '',
    experience: user?.experience || '',
    education: user?.education || '',
    bio: user?.bio || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // TODO: Save profile data to API
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      specialization: user?.specialization || '',
      experience: user?.experience || '',
      education: user?.education || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" mb={1}>
            Hồ sơ cá nhân
          </ArgonTypography>
          <ArgonTypography variant="body1" color="text">
            Quản lý thông tin cá nhân và chuyên môn
          </ArgonTypography>
        </ArgonBox>

        <Grid container spacing={3}>
          {/* Profile Info */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box textAlign="center" mb={3}>
                  <Avatar 
                    src={user?.avatar} 
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto', 
                      mb: 2,
                      border: '4px solid',
                      borderColor: 'success.main'
                    }}
                  >
                    {user?.name?.charAt(0) || 'T'}
                  </Avatar>
                  <ArgonTypography variant="h5" fontWeight="bold" mb={1}>
                    {user?.name || 'Giáo viên'}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" mb={1}>
                    {user?.email || 'teacher@kidslink.com'}
                  </ArgonTypography>
                  <Chip 
                    label="Giáo viên mầm non" 
                    color="success" 
                    size="small"
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
                  Thông tin cơ bản
                </ArgonTypography>
                
                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" mb={0.5}>
                    <strong>Số điện thoại:</strong>
                  </ArgonTypography>
                  <ArgonTypography variant="body2">
                    {user?.phone || 'Chưa cập nhật'}
                  </ArgonTypography>
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" mb={0.5}>
                    <strong>Địa chỉ:</strong>
                  </ArgonTypography>
                  <ArgonTypography variant="body2">
                    {user?.address || 'Chưa cập nhật'}
                  </ArgonTypography>
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" mb={0.5}>
                    <strong>Chuyên môn:</strong>
                  </ArgonTypography>
                  <ArgonTypography variant="body2">
                    {user?.specialization || 'Chưa cập nhật'}
                  </ArgonTypography>
                </ArgonBox>
                
                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" mb={0.5}>
                    <strong>Kinh nghiệm:</strong>
                  </ArgonTypography>
                  <ArgonTypography variant="body2">
                    {user?.experience || 'Chưa cập nhật'}
                  </ArgonTypography>
                </ArgonBox>
              </CardContent>
              
              <CardActions sx={{ p: 2 }}>
                <ArgonButton 
                  variant="contained" 
                  color="info" 
                  fullWidth
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
                </ArgonButton>
              </CardActions>
            </Card>
          </Grid>

          {/* Edit Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
                  {isEditing ? 'Chỉnh sửa thông tin' : 'Thông tin chi tiết'}
                </ArgonTypography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      type="email"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Chuyên môn"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Kinh nghiệm"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Ví dụ: 5 năm kinh nghiệm"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Học vấn"
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Ví dụ: Cử nhân Sư phạm Mầm non"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Giới thiệu bản thân"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      multiline
                      rows={4}
                      placeholder="Viết một vài dòng về bản thân..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
              
              {isEditing && (
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <ArgonButton 
                    variant="contained" 
                    color="success" 
                    onClick={handleSave}
                    sx={{ mr: 1 }}
                  >
                    Lưu thay đổi
                  </ArgonButton>
                  <ArgonButton 
                    variant="outlined" 
                    color="error" 
                    onClick={handleCancel}
                  >
                    Hủy
                  </ArgonButton>
                </CardActions>
              )}
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default TeacherProfile;



