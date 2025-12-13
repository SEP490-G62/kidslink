import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SchoolIcon from "@mui/icons-material/School";
import Divider from "@mui/material/Divider";
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

const SlotModal = ({ open, onClose, calendarEntry, date, weekDays = [], classId, onSuccess, preSelectedSlot }) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState(null);
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
        fetchTeachers();
      
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
      setError(null);
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
      // Lấy tất cả giáo viên từ API
      const response = await schoolAdminService.getAllTeachers();
      console.log("All teachers response:", response);
      const teacherList = response.data || [];
      console.log("Teacher list:", teacherList);
      setTeachers(teacherList);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    const dateToUse = date || selectedDate;
    
    // Validate required fields
    if (!formData.slotId || !formData.activityId) {
      setError("Vui lòng chọn khung giờ và hoạt động");
      return;
    }
    if (!dateToUse) {
      setError("Vui lòng chọn ngày");
      return;
    }
    // Không cho phép sửa / tạo lịch cho ngày đã qua
    try {
      const [y, m, d] = dateToUse.split("-").map((v) => parseInt(v, 10));
      const target = new Date(y, m - 1, d, 0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (target < today) {
        setError("Không thể sửa hoặc tạo lịch cho ngày đã qua. Vui lòng chọn ngày hiện tại hoặc tương lai.");
        return;
      }
    } catch (e) {
      // Nếu parse lỗi thì để backend xử lý tiếp
    }
    if (!classId) {
      setError("Không tìm thấy thông tin lớp học");
      return;
    }
    
    setError(null);
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
        onSuccess();
        onClose();
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
      
      setError("Lỗi khi lưu tiết học: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get selected slot info for display
  const selectedSlot = slots.find(s => s._id === formData.slotId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
          <AccessTimeIcon sx={{ fontSize: 28 }} />
          <ArgonTypography variant="h5" fontWeight="bold" color="#ffffff">
            {calendarEntry ? "Sửa nội dung tiết học" : "Thêm nội dung tiết học"}
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

        <Stack spacing={3}>
          <SectionCard
            icon={<AccessTimeIcon />}
            title="Thông tin tiết học"
            subtitle="Chọn ngày và khung giờ cho tiết học"
          >
            <Grid container spacing={3}>
              {/* Date selector - only show if adding new and weekDays provided */}
              {!date && weekDays.length > 0 && (
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Ngày trong tuần
                  </ArgonTypography>
                  <FormControl fullWidth size="small" sx={{ 
                    flex: 1, 
                    minWidth: 200, 
                    maxWidth: '100%',
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
                  }}>
                    <Select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>-- Chọn ngày trong tuần --</em>
                      </MenuItem>
                      {weekDays.map((day) => (
                        <MenuItem key={day.isoDate} value={day.isoDate}>
                          {day.name} - {day.dateStr}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Nếu mở từ ô lịch, hiển thị thông tin ngày + tiết */}
              {preSelectedSlot && date && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px dashed #90caf9",
                      backgroundColor: "#e3f2fd",
                    }}
                  >
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={500}
                        >
                          Tiết học
                        </Typography>
                        <Typography
                          variant="body2"
                          color="primary"
                          fontWeight={600}
                        >
                          {preSelectedSlot.slotName} (
                          {preSelectedSlot.startTime} - {preSelectedSlot.endTime})
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={500}
                        >
                          Ngày
                        </Typography>
                        <Typography
                          variant="body2"
                          color="primary"
                          fontWeight={600}
                        >
                          {(() => {
                            const [yearStr, monthStr, dayStr] = date.split("-");
                            const dayNames = [
                              "Chủ Nhật",
                              "Thứ Hai",
                              "Thứ Ba",
                              "Thứ Tư",
                              "Thứ Năm",
                              "Thứ Sáu",
                              "Thứ Bảy",
                            ];
                            const monthNames = [
                              "tháng 1",
                              "tháng 2",
                              "tháng 3",
                              "tháng 4",
                              "tháng 5",
                              "tháng 6",
                              "tháng 7",
                              "tháng 8",
                              "tháng 9",
                              "tháng 10",
                              "tháng 11",
                              "tháng 12",
                            ];

                            const tempDate = new Date(
                              parseInt(yearStr),
                              parseInt(monthStr) - 1,
                              parseInt(dayStr),
                              12,
                              0,
                              0
                            );
                            const dayOfWeek = dayNames[tempDate.getDay()];

                            return `${dayOfWeek}, ${parseInt(
                              dayStr
                            )} ${
                              monthNames[parseInt(monthStr) - 1]
                            } năm ${yearStr}`;
                          })()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}
              
              {/* Chọn khung giờ tiết học - ẩn khi đã chọn sẵn từ bảng */}
              {!preSelectedSlot && (
                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Khung giờ tiết học <span style={{ color: "#d32f2f" }}>*</span>
                  </ArgonTypography>
                  <FormControl fullWidth size="small" sx={{ 
                    flex: 1, 
                    minWidth: 200, 
                    maxWidth: '100%',
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
                  }}>
                    <Select
                      value={formData.slotId}
                      onChange={(e) => handleChange("slotId", e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>-- Chọn khung giờ --</em>
                      </MenuItem>
                      {slots.map((slot) => (
                        <MenuItem key={slot._id} value={slot._id}>
                          {slot.slotName} ({slot.startTime} - {slot.endTime})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedSlot && (
                    <ArgonTypography variant="caption" color="#1976d2" sx={{ mt: 0.5, display: "block", fontWeight: 500 }}>
                      Khung giờ: {selectedSlot.startTime} - {selectedSlot.endTime}
                    </ArgonTypography>
                  )}
                </Grid>
              )}
            </Grid>
          </SectionCard>

          <SectionCard
            icon={<SchoolIcon />}
            title="Nội dung học & giáo viên"
            subtitle="Chọn hoạt động và giáo viên phụ trách cho tiết học"
          >
            <Grid container spacing={3}>
              {/* Chọn nội dung hoạt động */}
              <Grid item xs={12} md={6}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Nội dung hoạt động <span style={{ color: "#d32f2f" }}>*</span>
                </ArgonTypography>
                <FormControl fullWidth size="small" sx={{ 
                  flex: 1, 
                  minWidth: 200, 
                  maxWidth: '100%',
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
                }}>
                  <Select
                    value={formData.activityId}
                    onChange={(e) => handleChange("activityId", e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>-- Chọn hoạt động --</em>
                    </MenuItem>
                    {activities.map((activity) => (
                      <MenuItem key={activity._id} value={activity._id}>
                        <div>
                          <strong>{activity.name}</strong>
                          <br />
                          <small style={{ color: "#666" }}>
                            {activity.description}
                          </small>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Chọn giáo viên */}
              <Grid item xs={12} md={6}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Giáo viên phụ trách
                </ArgonTypography>
                <FormControl fullWidth size="small" sx={{ 
                  flex: 1, 
                  minWidth: 200, 
                  maxWidth: '100%',
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
                }}>
                  <Select
                    value={formData.teacherId}
                    onChange={(e) => handleChange("teacherId", e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>-- Chọn giáo viên (mặc định: GVCN của lớp) --</em>
                    </MenuItem>
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher._id} value={teacher._id}>
                        {teacher.fullName || teacher.user_id?.full_name || "N/A"}
                        {teacher.specialization
                          ? ` - ${teacher.specialization}`
                          : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Hiển thị thông tin giáo viên đã chọn */}
              {formData.teacherId && (() => {
                const selectedTeacher = teachers.find(
                  (t) => t._id === formData.teacherId
                );
                if (!selectedTeacher) return null;
                const teacherName =
                  selectedTeacher.fullName ||
                  selectedTeacher.user_id?.full_name ||
                  "N/A";
                const avatarUrl =
                  selectedTeacher.avatarUrl ||
                  selectedTeacher.user_id?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    teacherName
                  )}`;
                return (
                  <Grid item xs={12}>
                    <ArgonBox
                      sx={{
                        p: 2,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 2,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <ArgonTypography
                        variant="caption"
                        color="text"
                        fontWeight="medium"
                      >
                        Giáo viên được chọn:
                      </ArgonTypography>
                      <ArgonBox display="flex" alignItems="center" mt={1}>
                        <ArgonBox
                          component="img"
                          src={avatarUrl}
                          alt={teacherName}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            mr: 2,
                          }}
                        />
                        <ArgonBox>
                          <ArgonTypography variant="body2" fontWeight="bold">
                            {teacherName}
                          </ArgonTypography>
                          {selectedTeacher.specialization && (
                            <ArgonTypography
                              variant="caption"
                              color="text"
                            >
                              {selectedTeacher.specialization}
                          </ArgonTypography>
                          )}
                        </ArgonBox>
                      </ArgonBox>
                    </ArgonBox>
                  </Grid>
                );
              })()}
            </Grid>
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
          color={calendarEntry ? "success" : "info"}
          variant="contained"
            disabled={loading}
          sx={{
            minWidth: calendarEntry ? 140 : 120,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            transition: "all 0.3s ease",
            ...(calendarEntry && {
              backgroundColor: "#2e7d32",
              "&:hover": {
                backgroundColor: "#1b5e20",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
              },
            }),
            ...(!calendarEntry && {
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
              },
            }),
          }}
          startIcon={
            loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : calendarEntry ? (
              <i className="fas fa-save" style={{ fontSize: 14 }} />
            ) : (
              <i className="fas fa-plus" style={{ fontSize: 14 }} />
            )
          }
        >
          {loading 
            ? "Đang lưu..." 
            : calendarEntry 
              ? "Cập nhật tiết học" 
              : "Thêm tiết học"}
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