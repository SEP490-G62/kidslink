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
} from "@mui/material";
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";

const SlotTemplateModal = ({ open, onClose, slotData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (slotData) {
        // Chỉnh sửa slot có sẵn
        setFormData({
          startTime: slotData.startTime || "",
          endTime: slotData.endTime || ""
        });
      } else {
        // Thêm mới
        setFormData({
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
  };

  const validate = () => {
    const newErrors = {};
    
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
    try {
      if (slotData && slotData.id) {
        // Update existing slot
        await schoolAdminService.updateSlot(slotData.id, formData);
      } else {
        // Create new slot
        await schoolAdminService.createSlot(formData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving slot:", error);
      const errorMessage = error.message || "Vui lòng thử lại";
      
      // Hiển thị lỗi chi tiết hơn
      if (errorMessage.includes("trùng") || errorMessage.includes("đè") || errorMessage.includes("overlapping")) {
        alert("⚠️ Khung giờ này bị trùng với tiết học đã có!\n\nVui lòng chọn khoảng thời gian khác hoặc kiểm tra lại danh sách tiết học.");
      } else {
        alert("Lỗi khi lưu tiết học: " + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h5" fontWeight="bold">
          {slotData ? "Chỉnh sửa tiết học" : "Thêm tiết học mới"}
        </ArgonTypography>
        <ArgonTypography variant="caption" color="text" sx={{ display: 'block', mt: 0.5 }}>
          Chọn khung giờ tiết học. Tên tiết (Tiết 1, 2, 3...) sẽ tự động sắp xếp theo thời gian.
        </ArgonTypography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <ArgonBox>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Giờ bắt đầu"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                error={!!errors.startTime}
                helperText={errors.startTime || "Chọn giờ bắt đầu tiết học"}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Giờ kết thúc"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                error={!!errors.endTime}
                helperText={errors.endTime || "Chọn giờ kết thúc tiết học"}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </ArgonBox>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <ArgonButton onClick={onClose} color="secondary" variant="outlined">
          Hủy
        </ArgonButton>
        <ArgonButton 
          onClick={handleSubmit} 
          color="info" 
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : (slotData ? "Cập nhật" : "Thêm mới")}
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
