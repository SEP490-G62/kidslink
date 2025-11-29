import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  IconButton,
  Alert,
  Paper,
  Stack,
  Box,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";

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

const SlotTemplateModal = ({ open, onClose, slotData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    slotName: "",
    startTime: "",
    endTime: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (slotData) {
        // Chỉnh sửa slot có sẵn
        setFormData({
          slotName: slotData.slotName || "",
          startTime: slotData.startTime || "",
          endTime: slotData.endTime || ""
        });
      } else {
        // Thêm mới
        setFormData({
          slotName: "",
          startTime: "",
          endTime: ""
        });
      }
      setErrors({});
    }
  }, [open, slotData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    setError(null);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.slotName || formData.slotName.trim() === '') {
      newErrors.slotName = "Tên tiết học là bắt buộc";
    }
    
    if (!formData.startTime) {
      newErrors.startTime = "Giờ bắt đầu là bắt buộc";
    }
    
    if (!formData.endTime) {
      newErrors.endTime = "Giờ kết thúc là bắt buộc";
    }
    
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = "Giờ kết thúc phải sau giờ bắt đầu";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError(null);
    try {
      const slotPayload = {
        slotName: formData.slotName.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime
      };

      if (slotData && slotData.id) {
        // Update existing slot (bao gồm cả slotName)
        await schoolAdminService.updateSlot(slotData.id, slotPayload);
      } else {
        // Create new slot
        await schoolAdminService.createSlot(slotPayload);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving slot:", error);
      const errorMessage = error.message || "Vui lòng thử lại";
      
      // Hiển thị lỗi chi tiết hơn
      if (errorMessage.includes("trùng") || errorMessage.includes("đè") || errorMessage.includes("overlapping")) {
        setError("⚠️ Khung giờ này bị trùng với tiết học đã có! Vui lòng chọn khoảng thời gian khác hoặc kiểm tra lại danh sách tiết học.");
      } else {
        setError("Lỗi khi lưu tiết học: " + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.25)",
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
          <AccessTimeIcon sx={{ fontSize: 28 }} />
          <ArgonTypography variant="h5" fontWeight="bold" color="#ffffff">
            {slotData ? "Chỉnh sửa tiết học" : "Thêm tiết học mới"}
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

        <SectionCard
          icon={<AccessTimeIcon />}
          title={slotData ? "Chỉnh sửa tiết học" : "Thông tin tiết học"}
          subtitle={slotData ? "Chỉnh sửa khung giờ tiết học" : "Thêm tiết học mới với tên và khung giờ"}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                Tên tiết học <span style={{ color: "#d32f2f" }}>*</span>
              </ArgonTypography>
              <TextField
                fullWidth
                placeholder="VD: Tiết 1, Tiết 2, ..."
                value={formData.slotName}
                onChange={(e) => handleChange('slotName', e.target.value)}
                error={!!errors.slotName}
                helperText={errors.slotName || ""}
                variant="outlined"
                required
                sx={{
                  flex: 1,
                  minWidth: 200,
                  maxWidth: 1000,
                  width: '100%',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    width: '100%',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    width: '100% !important',
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                Giờ bắt đầu <span style={{ color: "#d32f2f" }}>*</span>
              </ArgonTypography>
              <TextField
                fullWidth
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                error={!!errors.startTime}
                helperText={errors.startTime || ""}
                variant="outlined"
                required
                sx={{
                  flex: 1,
                  minWidth: 200,
                  maxWidth: 400,
                  width: '100%',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    width: '100%',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    width: '100% !important',
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                Giờ kết thúc <span style={{ color: "#d32f2f" }}>*</span>
              </ArgonTypography>
              <TextField
                fullWidth
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                error={!!errors.endTime}
                helperText={errors.endTime || ""}
                variant="outlined"
                required
                sx={{
                  flex: 1,
                  minWidth: 200,
                  maxWidth: 400,
                  width: '100%',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    width: '100%',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    width: '100% !important',
                  }
                }}
              />
            </Grid>
          </Grid>
        </SectionCard>
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
          startIcon={
            loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <AccessTimeIcon />
            )
          }
        >
          {loading ? "Đang lưu..." : (slotData ? "Cập nhật" : "Thêm mới")}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

SlotTemplateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  slotData: PropTypes.shape({
    id: PropTypes.string,
    slotName: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string
  }),
  onSuccess: PropTypes.func.isRequired
};

export default SlotTemplateModal;