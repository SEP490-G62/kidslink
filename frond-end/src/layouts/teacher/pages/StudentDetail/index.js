/**
=========================================================
* KidsLink Teacher Student Detail Page - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
*/

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Grid, Box, Avatar, Chip, Divider, Stack, CircularProgress, Alert, IconButton } from '@mui/material';
import { ArrowBack, Phone, Badge, CalendarMonth, Female, Male, Group } from '@mui/icons-material';

import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import Footer from 'examples/Footer';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

import api from 'services/api';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/teachers/students/${id}`);
        setData(res);
      } catch (err) {
        setError(err.message || 'Không thể tải thông tin học sinh');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // Đoạn dưới này bỏ vì không cần cập nhật document.title động nữa
  // useEffect(() => {
  //   if (data?.student?.full_name) {
  //     document.title = `${data.student.full_name} - KidsLink`;
  //   }
  // }, [data]);

  const getGenderText = (gender) => (gender === 0 ? 'Nam' : 'Nữ');
  const getGenderIcon = (gender) => (gender === 0 ? <Male color="action" /> : <Female color="action" />);
  const getStatus = (status) => ({ label: status === 1 ? 'Hoạt động' : 'Tạm dừng', color: status === 1 ? 'success' : 'error' });
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <TeacherNavbar
          breadcrumbOverride={{ route: ['teacher', 'classes'], title: '' }}
        />
        <ArgonBox py={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <TeacherNavbar
          breadcrumbOverride={{ route: ['teacher', 'classes'], title: '' }}
        />
        <ArgonBox py={3}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <ArgonButton color="info" onClick={() => navigate(-1)}>Quay lại</ArgonButton>
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const { student, parents = [], pickups = [] } = data || {};
  const status = getStatus(student?.status);

  return (
    <DashboardLayout>
      <TeacherNavbar
        breadcrumbOverride={{ route: ['teacher', 'classes'], title: student?.full_name || '' }}
      />
      <ArgonBox py={0}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <ArgonTypography variant="h5" fontWeight="bold">{student?.full_name || 'Chi tiết học sinh'}</ArgonTypography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar src={student?.avatar_url} alt={student?.full_name} sx={{ width: 80, height: 80, mr: 2 }} />
                  <Box>
                    <ArgonTypography variant="h6" fontWeight="bold">{student?.full_name}</ArgonTypography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getGenderIcon(student?.gender)}
                      <ArgonTypography variant="body2" color="text">{getGenderText(student?.gender)}</ArgonTypography>
                      <Chip size="small" color={status.color} label={status.label} variant="outlined" />
                    </Stack>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonth color="action" />
                    <ArgonTypography variant="body2" color="text"><strong>Ngày sinh:</strong> {formatDate(student?.dob)}</ArgonTypography>
                  </Stack>
                  {student?.allergy && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Badge color="action" />
                      <ArgonTypography variant="body2" color="text"><strong>Dị ứng:</strong> {student?.allergy}</ArgonTypography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Group color="action" />
                  <ArgonTypography variant="h6" fontWeight="bold">Phụ huynh</ArgonTypography>
                </Stack>
                {parents.length === 0 ? (
                  <ArgonTypography variant="body2" color="text">Chưa có thông tin phụ huynh</ArgonTypography>
                ) : (
                  <Grid container spacing={2}>
                    {parents.map((p) => (
                      <Grid item xs={12} sm={6} key={p.parent_id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" alignItems="center">
                              <Avatar src={p.user?.avatar_url} alt={p.user?.full_name} sx={{ width: 48, height: 48, mr: 2 }} />
                              <Box>
                                <ArgonTypography variant="subtitle2" fontWeight="bold">{p.user?.full_name}</ArgonTypography>
                                <ArgonTypography variant="caption" color="text">Quan hệ: {p.relationship || 'N/A'}</ArgonTypography>
                              </Box>
                            </Box>
                            {p.user?.phone_number && (
                              <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                                <Phone fontSize="small" color="action" />
                                <ArgonTypography variant="caption" color="text">{p.user.phone_number}</ArgonTypography>
                              </Stack>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={1}>Người đón</ArgonTypography>
                {pickups.length === 0 ? (
                  <ArgonTypography variant="body2" color="text">Chưa có thông tin người đón</ArgonTypography>
                ) : (
                  <Grid container spacing={2}>
                    {pickups.map((p) => (
                      <Grid item xs={12} sm={6} key={p.pickup_id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" alignItems="center">
                              <Avatar src={p.avatar_url} alt={p.full_name} sx={{ width: 44, height: 44, mr: 2 }} />
                              <Box>
                                <ArgonTypography variant="subtitle2" fontWeight="bold">{p.full_name}</ArgonTypography>
                                <ArgonTypography variant="caption" color="text">{p.relationship}</ArgonTypography>
                              </Box>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                              <Badge fontSize="small" color="action" />
                              <ArgonTypography variant="caption" color="text">CMND/CCCD: {p.id_card_number}</ArgonTypography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                              <Phone fontSize="small" color="action" />
                              <ArgonTypography variant="caption" color="text">{p.phone}</ArgonTypography>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default StudentDetail;


