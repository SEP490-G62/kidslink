import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Box,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import QrCodeIcon from "@mui/icons-material/QrCode";
import PaymentIcon from "@mui/icons-material/Payment";
import PeopleIcon from "@mui/icons-material/People";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import adminService from "services/adminService";

const SchoolDetailModal = ({ open, onClose, schoolData }) => {
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    if (open && schoolData?._id) {
      fetchSchoolDetail();
    }
  }, [open, schoolData]);

  const fetchSchoolDetail = async () => {
    try {
      setLoading(true);
      const result = await adminService.getSchoolById(schoolData._id);
      if (result.success && result.data) {
        setSchool(result.data);
      }
    } catch (error) {
      console.error("Error fetching school detail:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!school && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h5" fontWeight="bold">
            Chi tiết trường học
          </ArgonTypography>
          <ArgonButton
            variant="text"
            color="secondary"
            onClick={onClose}
            sx={{ minWidth: "auto", p: 1 }}
          >
            <CloseIcon />
          </ArgonButton>
        </ArgonBox>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <ArgonBox display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </ArgonBox>
        ) : school ? (
          <Grid container spacing={3}>
            {/* Logo and Basic Info */}
            <Grid item xs={12} md={4}>
              <ArgonBox display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  src={school.logo_url}
                  alt={school.school_name}
                  sx={{
                    width: 200,
                    height: 200,
                    mb: 2,
                    border: "2px solid #e0e0e0",
                  }}
                >
                  <SchoolIcon sx={{ fontSize: 80 }} />
                </Avatar>
                <Chip
                  label={school.status === 1 ? "Hoạt động" : "Vô hiệu hóa"}
                  color={school.status === 1 ? "success" : "error"}
                  sx={{ mb: 2 }}
                />
                <ArgonBox display="flex" alignItems="center" gap={1}>
                  <PeopleIcon fontSize="small" />
                  <ArgonTypography variant="body2">
                    {school.user_count || 0} người dùng
                  </ArgonTypography>
                </ArgonBox>
              </ArgonBox>
            </Grid>

            <Grid item xs={12} md={8}>
              <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
                Thông tin cơ bản
              </ArgonTypography>
              <Divider sx={{ mb: 2 }} />

              <ArgonBox mb={2}>
                <ArgonTypography variant="caption" color="text" fontWeight="bold">
                  Tên trường học
                </ArgonTypography>
                <ArgonTypography variant="body1">{school.school_name}</ArgonTypography>
              </ArgonBox>

              <ArgonBox mb={2}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <ArgonTypography variant="caption" color="text" fontWeight="bold">
                    Địa chỉ
                  </ArgonTypography>
                </Box>
                <ArgonTypography variant="body1">{school.address || "-"}</ArgonTypography>
              </ArgonBox>

              <ArgonBox mb={2}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <EmailIcon fontSize="small" color="action" />
                  <ArgonTypography variant="caption" color="text" fontWeight="bold">
                    Email
                  </ArgonTypography>
                </Box>
                <ArgonTypography variant="body1">{school.email || "-"}</ArgonTypography>
              </ArgonBox>

              <ArgonBox mb={2}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <PhoneIcon fontSize="small" color="action" />
                  <ArgonTypography variant="caption" color="text" fontWeight="bold">
                    Số điện thoại
                  </ArgonTypography>
                </Box>
                <ArgonTypography variant="body1">{school.phone || "-"}</ArgonTypography>
              </ArgonBox>

              {school.qr_data && (
                <ArgonBox mb={2}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <QrCodeIcon fontSize="small" color="action" />
                    <ArgonTypography variant="caption" color="text" fontWeight="bold">
                      QR Data
                    </ArgonTypography>
                  </Box>
                  <ArgonTypography variant="body1">{school.qr_data}</ArgonTypography>
                </ArgonBox>
              )}

              <ArgonBox mb={2}>
                <ArgonTypography variant="caption" color="text" fontWeight="bold">
                  Ngày tạo
                </ArgonTypography>
                <ArgonTypography variant="body1">
                  {school.createdAt ? new Date(school.createdAt).toLocaleString('vi-VN') : "-"}
                </ArgonTypography>
              </ArgonBox>

              <ArgonBox mb={2}>
                <ArgonTypography variant="caption" color="text" fontWeight="bold">
                  Cập nhật lần cuối
                </ArgonTypography>
                <ArgonTypography variant="body1">
                  {school.updatedAt ? new Date(school.updatedAt).toLocaleString('vi-VN') : "-"}
                </ArgonTypography>
              </ArgonBox>
            </Grid>

            {/* PayOS Config */}
            {school.payos_config && (
              <Grid item xs={12}>
                <ArgonBox display="flex" alignItems="center" gap={1} mb={2}>
                  <PaymentIcon color="primary" />
                  <ArgonTypography variant="h6" fontWeight="bold">
                    Cấu hình PayOS
                  </ArgonTypography>
                </ArgonBox>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <ArgonTypography variant="caption" color="text" fontWeight="bold">
                      Client ID
                    </ArgonTypography>
                    <ArgonTypography variant="body2">
                      {school.payos_config.client_id || "-"}
                    </ArgonTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ArgonTypography variant="caption" color="text" fontWeight="bold">
                      Số tài khoản
                    </ArgonTypography>
                    <ArgonTypography variant="body2">
                      {school.payos_config.account_number || "-"}
                    </ArgonTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ArgonTypography variant="caption" color="text" fontWeight="bold">
                      Tên chủ tài khoản
                    </ArgonTypography>
                    <ArgonTypography variant="body2">
                      {school.payos_config.account_name || "-"}
                    </ArgonTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ArgonTypography variant="caption" color="text" fontWeight="bold">
                      Mã ngân hàng
                    </ArgonTypography>
                    <ArgonTypography variant="body2">
                      {school.payos_config.bank_code || "-"}
                    </ArgonTypography>
                  </Grid>
                  <Grid item xs={12}>
                    <ArgonTypography variant="caption" color="text" fontWeight="bold">
                      Webhook URL
                    </ArgonTypography>
                    <ArgonTypography variant="body2">
                      {school.payos_config.webhook_url || "-"}
                    </ArgonTypography>
                  </Grid>
                  <Grid item xs={12}>
                    <Chip
                      label={school.payos_config.active ? "Đã kích hoạt" : "Chưa kích hoạt"}
                      color={school.payos_config.active ? "success" : "default"}
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        ) : null}
      </DialogContent>
      <DialogActions>
        <ArgonButton onClick={onClose} color="secondary">
          Đóng
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

SchoolDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  schoolData: PropTypes.object,
};

export default SchoolDetailModal;

