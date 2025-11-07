import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
} from "@mui/material";
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";

const SlotModal = ({ open, onClose, calendarEntry, date, weekDays = [], classId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [activities, setActivities] = useState([]);
  const [formData, setFormData] = useState({
    slotId: "",
    activityId: "",
    teacherId: ""
  });

  useEffect(() => {
    if (open) {
      setSelectedDate(date || "");
      fetchSlots();
      fetchActivities();
      
      if (calendarEntry) {
        // Chỉnh sửa calendar entry có sẵn
        setFormData({
          slotId: calendarEntry.slotId || "",
          activityId: calendarEntry.activity?._id || "",
          teacherId: calendarEntry.teacher?._id || ""
        });
      } else {
        // Thêm mới
        setFormData({
          slotId: "",
          activityId: "",
          teacherId: ""
        });
      }
    }
  }, [open, calendarEntry, date]);

  const fetchSlots = async () => {
    try {
      const response = await schoolAdminService.getAllSlots();
      setSlots(response.data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await schoolAdminService.getAllActivities();
      setActivities(response.data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const dateToUse = date || selectedDate;
    
    // Validate required fields
    if (!formData.slotId || !formData.activityId) {
      alert("Vui lòng chọn khung giờ và hoạt động");
      return;
    }
    if (!dateToUse) {
      alert("Vui lòng chọn ngày");
      return;
    }

    setLoading(true);
    try {
      const calendarId = calendarEntry?.id || 'new';
      const requestData = {
        classId: classId,
        date: dateToUse,
        slotId: formData.slotId,
        activityId: formData.activityId,
        teacherId: formData.teacherId || undefined
      };
      
      await schoolAdminService.createOrUpdateCalendarEntry(calendarId, requestData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving calendar entry:", error);
      alert("Lỗi khi lưu tiết học: " + (error.message || "Vui lòng thử lại"));
    } finally {
      setLoading(false);
    }
  };

  // Get selected slot info for display
  const selectedSlot = slots.find(s => s._id === formData.slotId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h5" fontWeight="bold">
          {calendarEntry ? "Chỉnh sửa tiết học" : "Thêm tiết học mới"}
        </ArgonTypography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <ArgonBox>
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

            {/* Chọn khung giờ tiết học */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chọn khung giờ tiết học *</InputLabel>
                <Select
                  value={formData.slotId}
                  onChange={(e) => handleChange('slotId', e.target.value)}
                  label="Chọn khung giờ tiết học *"
                  required
                >
                  <MenuItem value="">
                    <em>-- Chọn khung giờ --</em>
                  </MenuItem>
                  {slots.map(slot => (
                    <MenuItem key={slot._id} value={slot._id}>
                      {slot.slotName} ({slot.startTime} - {slot.endTime})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedSlot && (
                <ArgonTypography variant="caption" color="text" mt={0.5}>
                  Khung giờ: {selectedSlot.startTime} - {selectedSlot.endTime}
                </ArgonTypography>
              )}
            </Grid>

            {/* Chọn nội dung hoạt động */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chọn nội dung hoạt động *</InputLabel>
                <Select
                  value={formData.activityId}
                  onChange={(e) => handleChange('activityId', e.target.value)}
                  label="Chọn nội dung hoạt động *"
                  required
                >
                  <MenuItem value="">
                    <em>-- Chọn hoạt động --</em>
                  </MenuItem>
                  {activities.map(activity => (
                    <MenuItem key={activity._id} value={activity._id}>
                      <div>
                        <strong>{activity.name}</strong>
                        <br />
                        <small style={{ color: '#666' }}>{activity.description}</small>
                      </div>
                    </MenuItem>
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
          {loading ? <CircularProgress size={20} color="inherit" /> : (calendarEntry ? "Cập nhật" : "Thêm mới")}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

SlotModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  calendarEntry: PropTypes.shape({
    id: PropTypes.string,
    slotId: PropTypes.string,
    slotName: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    activity: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      require_outdoor: PropTypes.number
    }),
    teacher: PropTypes.shape({
      _id: PropTypes.string,
      fullName: PropTypes.string
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
