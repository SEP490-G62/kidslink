import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Box,
  Avatar,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SchoolIcon from "@mui/icons-material/School";
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(?:\+?\d{1,3})?[0-9]{8,15}$/;
const baseTextFieldSx = {
  flex: 1,
  width: "100%",
  borderRadius: 2,
  "& .MuiOutlinedInput-root": {
    width: "100%",
    "&:hover fieldset": {
      borderColor: "primary.main",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
    },
  },
  "& .MuiInputBase-input": {
    width: "100% !important",
    fontFamily: "'Roboto', sans-serif",
  },
  "& .MuiInputBase-input::placeholder": {
    fontFamily: "'Roboto', sans-serif",
  },
};

const SchoolModal = ({ open, onClose, schoolData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [formData, setFormData] = useState({
    school_name: "",
    address: "",
    phone: "",
    email: "",
    logo_url: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    phone: "",
  });

  const isEditMode = !!schoolData;

  useEffect(() => {
    if (open) {
      if (schoolData) {
        setFormData({
          school_name: schoolData.school_name || "",
          address: schoolData.address || "",
          phone: schoolData.phone || "",
          email: schoolData.email || "",
          logo_url: schoolData.logo_url || "",
        });
        setLogoPreview(schoolData.logo_url || "");
      } else {
        setFormData({
          school_name: "",
          address: "",
          phone: "",
          email: "",
          logo_url: "",
        });
        setLogoPreview("");
      }
      setLogoFile(null);
      setError(null);
      setValidationErrors({ email: "", phone: "" });
    }
  }, [open, schoolData]);

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Vui lòng chọn file ảnh hợp lệ");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Kích thước file không được vượt quá 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setLogoPreview(base64Image);
        setFormData({
          ...formData,
          logo_url: base64Image
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
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: "",
      });
    }
  };

  const validateFields = () => {
    const newErrors = { email: "", phone: "" };
    let isValid = true;

    if (formData.email && !emailRegex.test(formData.email.trim())) {
      newErrors.email = "Email không hợp lệ";
      isValid = false;
    }

    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Số điện thoại phải gồm 8-15 chữ số";
      isValid = false;
    }

    setValidationErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!formData.school_name || !formData.address) {
      setError("Tên trường học và địa chỉ là bắt buộc");
      return;
    }

    if (!validateFields()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let result;
      if (isEditMode) {
        result = await adminService.updateSchool(schoolData._id, formData);
      } else {
        result = await adminService.createSchool(formData);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      console.error("Error saving school:", err);
      setError(err.message || "Có lỗi xảy ra khi lưu trường học");
    } finally {
      setLoading(false);
    }
  };

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
            {isEditMode ? "Chỉnh sửa trường học" : "Thêm trường học mới"}
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
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              mb: 3,
              borderRadius: 2,
              "& .MuiAlert-message": {
                fontWeight: 500,
              },
            }}
          >
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          <SectionCard
            icon={<SchoolIcon />}
            title="Thông tin trường học"
            subtitle="Nhập các thông tin cơ bản của trường"
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Tên trường học <span style={{ color: "#d32f2f" }}>*</span>
                </ArgonTypography>
                <TextField
                  fullWidth
                  placeholder="Nhập tên trường học..."
                  value={formData.school_name}
                  onChange={handleInputChange("school_name")}
                  required
                  variant="outlined"
                  sx={{
                    ...baseTextFieldSx,
                    minWidth: 200,
                    maxWidth: 1000,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Địa chỉ <span style={{ color: "#d32f2f" }}>*</span>
                </ArgonTypography>
                <TextField
                  fullWidth
                  placeholder="Nhập địa chỉ..."
                  value={formData.address}
                  onChange={handleInputChange("address")}
                  multiline
                  rows={3}
                  required
                  variant="outlined"
                  sx={{
                    ...baseTextFieldSx,
                    minWidth: 200,
                    maxWidth: 1000,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Email
                </ArgonTypography>
                <TextField
                  fullWidth
                  placeholder="nhathuong@example.com"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  variant="outlined"
                  sx={{
                    ...baseTextFieldSx,
                    minWidth: 200,
                    maxWidth: 500,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Số điện thoại
                </ArgonTypography>
                <TextField
                  fullWidth
                  placeholder="VD: 0912345678"
                  value={formData.phone}
                  onChange={handleInputChange("phone")}
                  error={!!validationErrors.phone}
                  helperText={validationErrors.phone}
                  variant="outlined"
                  sx={{
                    ...baseTextFieldSx,
                    minWidth: 200,
                    maxWidth: 500,
                  }}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard
            icon={<SchoolIcon />}
            title="Logo & hiển thị"
            subtitle="Cập nhật logo sẽ giúp phụ huynh dễ nhận diện"
          >
            <Stack spacing={2} alignItems="center">
              <Avatar
                src={logoPreview}
                alt="School Logo"
                sx={{
                  width: 160,
                  height: 160,
                  mb: 1,
                  border: "2px solid #e0e0e0",
                  backgroundColor: "#f5f5f5",
                }}
              >
                <SchoolIcon sx={{ fontSize: 64 }} />
              </Avatar>
              <ArgonButton
                variant="outlined"
                color="info"
                size="small"
                component="label"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Chọn logo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </ArgonButton>
              <ArgonTypography variant="caption" color="#757575">
                Hỗ trợ định dạng PNG, JPG, tối đa 5MB
              </ArgonTypography>
            </Stack>
          </SectionCard>
        </Stack>
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
          variant="outlined"
          color="error"
          sx={{
            minWidth: 120,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderWidth: 1.5,
            "&:hover": {
              borderWidth: 1.5,
              backgroundColor: "#ffebee",
              transform: "translateY(-1px)",
              boxShadow: "0 2px 6px rgba(211, 47, 47, 0.2)",
            },
            transition: "all 0.2s ease",
          }}
          disabled={loading}
        >
          Hủy
        </ArgonButton>
        <ArgonButton
          onClick={handleSubmit}
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
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : isEditMode ? "Cập nhật" : "Tạo mới"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

SchoolModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  schoolData: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};

export default SchoolModal;




