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
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";

const SlotTemplateModal = ({ open, onClose, slotData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startHour: "07",
    startMinute: "00",
    endHour: "08",
    endMinute: "00"
  });
  const [errors, setErrors] = useState({});

  // Generate hours 0-23
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  // Generate minutes 0-59 with 5 min steps
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  useEffect(() => {
    if (open) {
      if (slotData) {
        // Parse existing time
        const [startH, startM] = (slotData.startTime || "07:00").split(':');
        const [endH, endM] = (slotData.endTime || "08:00").split(':');
        setFormData({
          startHour: startH,
          startMinute: startM,
          endHour: endH,
          endMinute: endM
        });
      } else {
        // Default values
        setFormData({
          startHour: "07",
          startMinute: "00",
          endHour: "08",
          endMinute: "00"
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
    
    const startTime = `${formData.startHour}:${formData.startMinute}`;
    const endTime = `${formData.endHour}:${formData.endMinute}`;
    
    if (startTime >= endTime) {
      newErrors.time = "Giờ kết thúc phải sau giờ bắt đầu";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        startTime: `${formData.startHour}:${formData.startMinute}`,
        endTime: `${formData.endHour}:${formData.endMinute}`
      };

      if (slotData && slotData.id) {
        // Update existing slot
        await schoolAdminService.updateSlot(slotData.id, payload);
      } else {
        // Create new slot
        await schoolAdminService.createSlot(payload);
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
        <ArgonTypography variant="h4" fontWeight="bold" color="primary.main">
          {slotData ? "Chỉnh sửa tiết học" : "Thêm tiết học mới"}
        </ArgonTypography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <ArgonBox>
          <ArgonTypography variant="caption" color="text" sx={{ display: 'block', mb: 2 }}>
            Chọn khung giờ tiết học. Tên tiết (Tiết 1, 2, 3...) sẽ tự động sắp xếp theo thời gian.
          </ArgonTypography>
          
          {errors.time && (
            <ArgonTypography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
              {errors.time}
            </ArgonTypography>
          )}
          
          <Grid container spacing={2}>
            {/* Giờ bắt đầu */}
            <Grid item xs={12}>
              <ArgonTypography variant="subtitle2" fontWeight="medium" mb={1}>
                Giờ bắt đầu
              </ArgonTypography>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <Select
                  value={formData.startHour}
                  onChange={(e) => handleChange('startHour', e.target.value)}
                  displayEmpty
                >
                  {hours.map(h => (
                    <MenuItem key={h} value={h}>{h} giờ</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <Select
                  value={formData.startMinute}
                  onChange={(e) => handleChange('startMinute', e.target.value)}
                  displayEmpty
                >
                  {minutes.map(m => (
                    <MenuItem key={m} value={m}>{m} phút</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Giờ kết thúc */}
            <Grid item xs={12}>
              <ArgonTypography variant="subtitle2" fontWeight="medium" mb={1} mt={1}>
                Giờ kết thúc
              </ArgonTypography>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <Select
                  value={formData.endHour}
                  onChange={(e) => handleChange('endHour', e.target.value)}
                  displayEmpty
                >
                  {hours.map(h => (
                    <MenuItem key={h} value={h}>{h} giờ</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <Select
                  value={formData.endMinute}
                  onChange={(e) => handleChange('endMinute', e.target.value)}
                  displayEmpty
                >
                  {minutes.map(m => (
                    <MenuItem key={m} value={m}>{m} phút</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
