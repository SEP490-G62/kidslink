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
  Paper,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import PeopleIcon from "@mui/icons-material/People";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import adminService from "services/adminService";

const SectionCard = ({ icon, title, subtitle, children }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      border: "1px solid #e3f2fd",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(243,248,255,0.98) 100%)",
      boxShadow: "0 12px 30px rgba(25,118,210,0.12)",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <Box
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

SectionCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          background: "linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
          color: "#ffffff",
          py: 2.5,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SchoolIcon sx={{ fontSize: 28 }} />
          <ArgonTypography variant="h5" fontWeight="bold" color="#ffffff">
            Chi tiết trường học
          </ArgonTypography>
        </Stack>
        <ArgonButton
          onClick={onClose}
          sx={{
            minWidth: "auto",
            width: 40,
            height: 40,
            borderRadius: "50%",
            p: 0,
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.3)",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.3)",
              borderColor: "rgba(255,255,255,0.5)",
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease",
          }}
        >
          <CloseIcon sx={{ fontSize: 22 }} />
        </ArgonButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <ArgonBox display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </ArgonBox>
        ) : school ? (
          <Stack spacing={3}>
            <SectionCard
              icon={<SchoolIcon />}
              title="Thông tin tổng quan"
              subtitle="Logo, trạng thái và số lượng người dùng"
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                alignItems={{ xs: "center", md: "flex-start" }}
              >
                <Avatar
                  src={school.logo_url}
                  alt={school.school_name}
                  sx={{
                    width: 180,
                    height: 180,
                    border: "2px solid #e0e0e0",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <SchoolIcon sx={{ fontSize: 72 }} />
                </Avatar>
                <Stack spacing={2} alignItems={{ xs: "center", md: "flex-start" }}>
                  <Chip
                    label={school.status === 1 ? "Hoạt động" : "Vô hiệu hóa"}
                    color={school.status === 1 ? "success" : "error"}
                    sx={{ fontWeight: 600 }}
                  />
                  <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon fontSize="small" />
                    <ArgonTypography variant="body2">
                      {school.user_count || 0} người dùng
                    </ArgonTypography>
                  </Box>
                  <ArgonTypography variant="caption" color="#757575">
                    ID: {school._id}
                  </ArgonTypography>
                </Stack>
              </Stack>
            </SectionCard>

            <SectionCard
              icon={<LocationOnIcon />}
              title="Thông tin liên hệ"
              subtitle="Địa chỉ và các kênh liên lạc chính"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ArgonTypography variant="caption" color="text" fontWeight="bold">
                    Tên trường học
                  </ArgonTypography>
                  <ArgonTypography variant="body1" fontWeight="600">
                    {school.school_name}
                  </ArgonTypography>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <ArgonTypography variant="caption" color="text" fontWeight="bold">
                      Địa chỉ
                    </ArgonTypography>
                  </Box>
                  <ArgonTypography variant="body1">{school.address || "-"}</ArgonTypography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <EmailIcon fontSize="small" color="action" />
                    <ArgonTypography variant="caption" color="text" fontWeight="bold">
                      Email
                    </ArgonTypography>
                  </Box>
                  <ArgonTypography variant="body1">{school.email || "-"}</ArgonTypography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <PhoneIcon fontSize="small" color="action" />
                    <ArgonTypography variant="caption" color="text" fontWeight="bold">
                      Số điện thoại
                    </ArgonTypography>
                  </Box>
                  <ArgonTypography variant="body1">{school.phone || "-"}</ArgonTypography>
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard
              icon={<InfoOutlinedIcon />}
              title="Lịch sử cập nhật"
              subtitle="Theo dõi thời gian tạo và chỉnh sửa"
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="caption" color="text" fontWeight="bold">
                    Ngày tạo
                  </ArgonTypography>
                  <ArgonTypography variant="body1">
                    {school.createdAt ? new Date(school.createdAt).toLocaleString("vi-VN") : "-"}
                  </ArgonTypography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="caption" color="text" fontWeight="bold">
                    Cập nhật lần cuối
                  </ArgonTypography>
                  <ArgonTypography variant="body1">
                    {school.updatedAt ? new Date(school.updatedAt).toLocaleString("vi-VN") : "-"}
                  </ArgonTypography>
                </Grid>
              </Grid>
            </SectionCard>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
          borderTop: "1px solid #e3f2fd",
        }}
      >
        <ArgonButton
          onClick={onClose}
          variant="contained"
          color="info"
          sx={{
            minWidth: 140,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
            },
          }}
        >
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

