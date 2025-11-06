import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";

const SlotModal = ({ open, onClose, slot, date, weekDays = [], classId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: ""
  });

  useEffect(() => {
    if (open) {
      setSelectedDate(date || "");
      
      if (slot) {
        // Chỉnh sửa slot có sẵn
        setFormData({
          startTime: slot.startTime || "",
          endTime: slot.endTime || ""
        });
      } else {
        // Thêm mới
        setFormData({
          startTime: "",
          endTime: ""
        });
      }
    }
  }, [open, slot, date]);

  const fetchActivities = async () => {
    // Không cần fetch activities nữa
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const dateToUse = date || selectedDate;
    
    // Chỉ cần thời gian
    if (!formData.startTime || !formData.endTime) {
      alert("Vui lòng nhập thời gian bắt đầu và kết thúc");
      return;
    }
    if (!dateToUse) {
      alert("Vui lòng chọn ngày");
      return;
    }

    setLoading(true);
    try {
      const slotId = slot?.id || 'new';
      const requestData = {
        classId: classId,
        date: dateToUse,
        startTime: formData.startTime,
        endTime: formData.endTime
      };
      
      await schoolAdminService.createOrUpdateSlot(slotId, requestData);
      onSuccess();
    } catch (error) {
      console.error("Error saving slot:", error);
      alert("Lỗi khi lưu tiết học: " + (error.message || "Vui lòng thử lại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <ArgonTypography variant="h5" fontWeight="bold">
          {slot ? "Chỉnh sửa tiết học" : "Thêm tiết học mới"}
        </ArgonTypography>
      </DialogTitle>
      <DialogContent>
        <ArgonBox mt={2}>
          <Grid container spacing={2}>
            {/* Date selector - only show if adding new and weekDays provided */}
            {!date && weekDays.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Chọn ngày trong tuần</InputLabel>
                  <Select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    label="Chọn ngày trong tuần"
                    required
                  >
                    {weekDays.map(day => (
                      <MenuItem key={day.isoDate} value={day.isoDate}>
                        {day.name} - {day.dateStr}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {/* Show date if fixed */}
            {date && (
              <Grid item xs={12}>
                <ArgonTypography variant="body2" color="text">
                  Ngày: <strong>{new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </ArgonTypography>
              </Grid>
            )}

            {/* Thời gian tiết học */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Giờ bắt đầu"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Giờ kết thúc"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
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
          {loading ? <CircularProgress size={20} color="inherit" /> : (slot ? "Cập nhật" : "Thêm mới")}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

SlotModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  slot: PropTypes.shape({
    id: PropTypes.string,
    slotName: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    activity: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      require_outdoor: PropTypes.number
    })
  }),
  date: PropTypes.string,
  weekDays: PropTypes.arrayOf(PropTypes.shape({
    isoDate: PropTypes.string,
    name: PropTypes.string,
    dateStr: PropTypes.string
  })),
  classId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default SlotModal;
