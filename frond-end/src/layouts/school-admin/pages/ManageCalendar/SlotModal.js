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
  Snackbar,
  Alert,
} from "@mui/material";
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";
import api from "services/api";

const SlotModal = ({ open, onClose, calendarEntry, date, weekDays = [], classId, onSuccess, preSelectedSlot }) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", severity: "error" });
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
      if (classId) {
        fetchTeachers();
      }
      
      if (calendarEntry) {
        // Chỉnh sửa calendar entry có sẵn - populate form data
        console.log('Editing calendar entry:', calendarEntry);
        setFormData({
          slotId: calendarEntry.slotId || calendarEntry.slot?._id || "",
          activityId: calendarEntry.activity?._id || calendarEntry.activityId || "",
          teacherId: calendarEntry.teacher?._id || calendarEntry.teacherId || ""
        });
      } else if (preSelectedSlot) {
        // Thêm mới từ ô lịch - slot đã được chọn sẵn
        setFormData({
          slotId: preSelectedSlot._id || "",
          activityId: "",
          teacherId: ""
        });
      } else {
        // Thêm mới hoàn toàn
        setFormData({
          slotId: "",
          activityId: "",
          teacherId: ""
        });
      }
    }
  }, [open, calendarEntry, date, preSelectedSlot]);

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

  const fetchTeachers = async () => {
    try {
      const response = await api.get(`/classes/${classId}`, true);
      console.log("Class data response:", response);
      const classData = response.data || response;
      console.log("Class data:", classData);
      // Lấy teachers từ class data (teacher_id và teacher_id2)
      const teacherList = [];
      if (classData.teacher_id) {
        teacherList.push({
          _id: classData.teacher_id._id,
          user_id: classData.teacher_id.user_id,
          role: 'main'
        });
      }
      if (classData.teacher_id2) {
        teacherList.push({
          _id: classData.teacher_id2._id,
          user_id: classData.teacher_id2.user_id,
          role: 'sub'
        });
      }
      console.log("Teacher list:", teacherList);
      setTeachers(teacherList);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const dateToUse = date || selectedDate;
    
    // Validate required fields
    if (!formData.slotId || !formData.activityId) {
      setAlertInfo({ show: true, message: "Vui lòng chọn khung giờ và hoạt động", severity: "warning" });
      return;
    }
    if (!dateToUse) {
      setAlertInfo({ show: true, message: "Vui lòng chọn ngày", severity: "warning" });
      return;
    }
    if (!classId) {
      setAlertInfo({ show: true, message: "Không tìm thấy thông tin lớp học", severity: "error" });
      return;
    }
    
    setAlertInfo({ show: false, message: "", severity: "error" });

    setLoading(true);
    try {
      // If editing, use existing calendar entry id, otherwise 'new'
      const calendarId = calendarEntry?.id || 'new';
      const requestData = {
        classId: classId,
        date: dateToUse,
        slotId: formData.slotId,
        activityId: formData.activityId
      };
      
      // Only include teacherId if it's provided
      if (formData.teacherId) {
        requestData.teacherId = formData.teacherId;
      }
      
      console.log("Sending calendar entry data:", requestData);
      console.log("Calendar ID:", calendarId);
      
      await schoolAdminService.createOrUpdateCalendarEntry(calendarId, requestData);
      setAlertInfo({ show: true, message: "Lưu tiết học thành công!", severity: "success" });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error saving calendar entry:", error);
      console.error("Full error object:", error);
      
      // Parse error message from backend
      let errorMessage = "Vui lòng thử lại";
      if (error.message) {
        errorMessage = error.message;
        
        // Specific error messages
        if (errorMessage.includes("giáo viên chủ nhiệm")) {
          errorMessage = "Lớp học này chưa có giáo viên chủ nhiệm. Vui lòng thêm giáo viên cho lớp trước.";
        } else if (errorMessage.includes("trùng") || errorMessage.includes("overlapping")) {
          errorMessage = "Tiết học này bị trùng với tiết khác trong cùng ngày. Vui lòng kiểm tra lại.";
        }
      }
      
      setAlertInfo({ show: true, message: "Lỗi khi lưu tiết học: " + errorMessage, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Get selected slot info for display
  const selectedSlot = slots.find(s => s._id === formData.slotId);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <ArgonTypography variant="h4" fontWeight="bold" color="primary.main">
            {calendarEntry ? "Sửa nội dung tiết học" : "Thêm nội dung tiết học"}
          </ArgonTypography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <ArgonBox>
            {/* Hiển thị thông tin tiết học và ngày khi mở từ ô lịch */}
            {preSelectedSlot && date && (
              <ArgonBox 
                sx={{ 
                  mb: 3, 
                  p: 2, 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: 2,
                  border: '1px solid #90caf9'
                }}
              >
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <ArgonTypography variant="caption" color="text" fontWeight="medium">
                      Tiết học:
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="info" fontWeight="bold">
                      {preSelectedSlot.slotName} ({preSelectedSlot.startTime} - {preSelectedSlot.endTime})
                    </ArgonTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ArgonTypography variant="caption" color="text" fontWeight="medium">
                      Ngày:
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="info" fontWeight="bold">
                      {(() => {
                        // Split date string "YYYY-MM-DD"
                        const [yearStr, monthStr, dayStr] = date.split('-');
                        
                        // Format Vietnamese date manually to avoid timezone issues
                        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                        const monthNames = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 
                                            'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
                        
                        // Create date object and get day of week
                        const tempDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr), 12, 0, 0);
                        const dayOfWeek = dayNames[tempDate.getDay()];
                        
                        return `${dayOfWeek}, ${parseInt(dayStr)} ${monthNames[parseInt(monthStr) - 1]} năm ${yearStr}`;
                      })()}
                    </ArgonTypography>
                  </Grid>
                </Grid>
              </ArgonBox>
            )}
            <Grid container spacing={2}>
              {/* Date selector - only show if adding new and weekDays provided */}
              {!date && weekDays.length > 0 && (
                <Grid item xs={12}>
                  <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                    Ngày trong tuần
                  </ArgonTypography>
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
              
              {/* Chọn khung giờ tiết học - ẩn khi đã chọn sẵn từ bảng */}
              {!preSelectedSlot && (
                <Grid item xs={12}>
                  <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                    Khung giờ tiết học
                  </ArgonTypography>
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
              )}

              {/* Chọn nội dung hoạt động */}
              <Grid item xs={12}>
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Nội dung hoạt động
                </ArgonTypography>
                <FormControl fullWidth>
                  {/* <InputLabel>Chọn nội dung hoạt động *</InputLabel> */}
                  <Select
                    value={formData.activityId}
                    onChange={(e) => handleChange('activityId', e.target.value)}
                    // label="Chọn nội dung hoạt động *"
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

              {/* Chọn giáo viên */}
              <Grid item xs={12}>
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Giáo viên phụ trách
                </ArgonTypography>
                <FormControl fullWidth>
                  {/* <InputLabel>Chọn giáo viên</InputLabel> */}
                  <Select
                    value={formData.teacherId}
                    onChange={(e) => handleChange('teacherId', e.target.value)}
                    // label="Chọn giáo viên"
                  >
                    <MenuItem value="">
                      <em>-- Chọn giáo viên --</em>
                    </MenuItem>
                    {teachers.map(teacher => (
                      <MenuItem key={teacher._id} value={teacher._id}>
                        {teacher.user_id?.full_name || 'N/A'} ({teacher.role === 'main' ? 'Giáo viên chính' : 'Giáo viên phụ'})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Hiển thị thông tin giáo viên đã chọn */}
              {formData.teacherId && (() => {
                const selectedTeacher = teachers.find(t => t._id === formData.teacherId);
                if (!selectedTeacher) return null;
                return (
                  <Grid item xs={12}>
                    <ArgonBox
                      sx={{
                        p: 2,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 2,
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <ArgonTypography variant="caption" color="text" fontWeight="medium">
                        Giáo viên được chọn:
                      </ArgonTypography>
                      <ArgonBox display="flex" alignItems="center" mt={1}>
                        <ArgonBox
                          component="img"
                          src={selectedTeacher.user_id?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedTeacher.user_id?.full_name || 'Teacher')}
                          alt={selectedTeacher.user_id?.full_name}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            mr: 2
                          }}
                        />
                        <ArgonBox>
                          <ArgonTypography variant="body2" fontWeight="bold">
                            {selectedTeacher.user_id?.full_name || 'N/A'}
                          </ArgonTypography>
                          <ArgonTypography variant="caption" color="text">
                            {selectedTeacher.role === 'main' ? '👑 Giáo viên chính' : '👤 Giáo viên phụ'}
                          </ArgonTypography>
                        </ArgonBox>
                      </ArgonBox>
                    </ArgonBox>
                  </Grid>
                );
              })()}
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
      
      {/* Snackbar thông báo */}
      <Snackbar
        open={alertInfo.show}
        autoHideDuration={4000}
        onClose={() => setAlertInfo({ ...alertInfo, show: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlertInfo({ ...alertInfo, show: false })} 
          severity={alertInfo.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </>
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
    activityId: PropTypes.string,
    teacherId: PropTypes.string,
    slot: PropTypes.shape({
      _id: PropTypes.string
    }),
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
  onSuccess: PropTypes.func.isRequired,
  preSelectedSlot: PropTypes.shape({
    _id: PropTypes.string,
    slotName: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string
  })
};

export default SlotModal;
