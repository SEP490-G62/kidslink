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
  Snackbar,
  Alert,
  Chip,
  LinearProgress,
  Box,
} from "@mui/material";
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";

const ApplyDefaultScheduleModal = ({ 
  open, 
  onClose, 
  classId, 
  classEndDate,
  weeklyCalendars, // lịch của tuần hiện tại trên màn hình
  timeSlots = [],
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", severity: "error" });
  const [progress, setProgress] = useState({ current: 0, total: 0, processing: false });
  
  // Các ngày trong tuần được chọn (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Mặc định T2-T6
  
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: ""
  });

  const dayLabels = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 0, label: 'Chủ nhật' },
  ];

  useEffect(() => {
    if (open) {
      // Set end date từ class
      if (classEndDate) {
        const endDate = new Date(classEndDate);
        setFormData(prev => ({
          ...prev,
          startDate: new Date().toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [open, classEndDate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (dayValue) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      }
      return [...prev, dayValue];
    });
  };

  // Tính toán tất cả các ngày cần tạo lịch
  const getDatesBetween = (start, end, daysOfWeek) => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Reset time để so sánh chỉ ngày
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (daysOfWeek.includes(dayOfWeek)) {
        // Format date as YYYY-MM-DD
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const handleSubmit = async () => {
    // Validate cơ bản
    if (!weeklyCalendars || weeklyCalendars.length === 0) {
      setAlertInfo({
        show: true,
        message: "Không có dữ liệu lịch mẫu của tuần hiện tại. Vui lòng kiểm tra lại.",
        severity: "warning",
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setAlertInfo({
        show: true,
        message: "Vui lòng chọn ngày bắt đầu và kết thúc",
        severity: "warning",
      });
      return;
    }

    // Không cho phép chọn startDate trong quá khứ
    try {
      const [sy, sm, sd] = formData.startDate.split("-").map((v) => parseInt(v, 10));
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        setAlertInfo({
          show: true,
          message: "Ngày bắt đầu không được nằm trong quá khứ. Vui lòng chọn từ hôm nay trở đi.",
          severity: "warning",
        });
        return;
      }
    } catch (e) {
      // ignore parse error, để các check khác xử lý
    }

    // Không cho phép endDate vượt quá end_date của Class
    if (classEndDate) {
      try {
        const [ey, em, ed] = formData.endDate.split("-").map((v) => parseInt(v, 10));
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
        const classEnd = new Date(classEndDate);
        classEnd.setHours(23, 59, 59, 999);
        if (end > classEnd) {
          setAlertInfo({
            show: true,
            message: "Ngày kết thúc không được vượt quá ngày kết thúc năm học của lớp.",
            severity: "warning",
          });
          return;
        }
      } catch (e) {
        // ignore parse error
      }
    }

    if (selectedDays.length === 0) {
      setAlertInfo({
        show: true,
        message: "Vui lòng chọn ít nhất một ngày trong tuần",
        severity: "warning",
      });
      return;
    }

    // Kiểm tra ngày: start trước end
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setAlertInfo({
        show: true,
        message: "Ngày bắt đầu phải trước ngày kết thúc",
        severity: "warning",
      });
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: 0, processing: true });

    try {
      // 1. Xây pattern theo thứ trong tuần từ lịch tuần hiện tại
      // patternByWeekday: dayOfWeek -> { slotId -> { slotId, activityId?, teacherId?, delete? } }
      const patternByWeekday = {};

      // Khởi tạo cho tất cả thứ được chọn để có thể clear lịch (delete) nếu tuần mẫu không có
      selectedDays.forEach((dow) => {
        if (!patternByWeekday[dow]) patternByWeekday[dow] = {};
      });

      // Lấp đầy các slot có activity trong tuần mẫu
      weeklyCalendars.forEach((cal) => {
        const dayOfWeek = new Date(cal.date).getDay();
        if (!patternByWeekday[dayOfWeek]) patternByWeekday[dayOfWeek] = {};

        if (Array.isArray(cal.slots)) {
          cal.slots.forEach((slot) => {
            const activityId = slot.activity?._id || slot.activityId;
            if (!activityId) return;

            const slotId = slot.slotId || slot.slot_id || slot.slot?._id;
            if (!slotId) return;

            patternByWeekday[dayOfWeek][slotId] = {
              slotId,
              activityId,
              teacherId:
                slot.teacher?._id ||
                slot.teacherId ||
                (slot.teacher && slot.teacher.id) ||
                null,
            };
          });
        }
      });

      // Với mỗi thứ + mỗi slot chuẩn, nếu không có trong pattern => đánh dấu delete
      // (clear lịch cho slot đó ở các tuần sau)
      if (Array.isArray(timeSlots) && timeSlots.length > 0) {
        Object.keys(patternByWeekday).forEach((key) => {
          const dow = Number(key);
          const slotMap = patternByWeekday[dow] || {};

          timeSlots.forEach((ts) => {
            const slotId = ts.id || ts._id;
            if (!slotId) return;
            if (!slotMap[slotId]) {
              slotMap[slotId] = {
                slotId,
                delete: true,
              };
            }
          });

          patternByWeekday[dow] = slotMap;
        });
      }

      const hasAnyPattern = Object.values(patternByWeekday).some((slotMap) => {
        return slotMap && Object.values(slotMap).some((v) => !v.delete && v.activityId);
      });
      if (!hasAnyPattern) {
        setAlertInfo({
          show: true,
          message:
            "Tuần hiện tại chưa có tiết học nào (chưa có activity), không thể đặt lịch mặc định.",
          severity: "warning",
        });
        setLoading(false);
        setProgress({ current: 0, total: 0, processing: false });
        return;
      }

      // 2. Sinh danh sách tất cả ngày trong khoảng [startDate, endDate] theo selectedDays
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const targetDates = [];
      const cur = new Date(startDate);
      while (cur <= endDate) {
        const dow = cur.getDay(); // 0-6
        if (selectedDays.includes(dow)) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, "0");
          const d = String(cur.getDate()).padStart(2, "0");
          targetDates.push({
            dateStr: `${y}-${m}-${d}`,
            dayOfWeek: dow,
          });
        }
        cur.setDate(cur.getDate() + 1);
      }

      if (targetDates.length === 0) {
        setAlertInfo({
          show: true,
          message:
            "Không có ngày nào phù hợp trong khoảng thời gian đã chọn (theo các thứ trong tuần đã chọn).",
          severity: "warning",
        });
        setLoading(false);
        setProgress({ current: 0, total: 0, processing: false });
        return;
      }

      setProgress({
        current: 0,
        total: targetDates.length,
        processing: true,
      });

      // 3. Build danh sách entries cho bulk API
      const bulkEntries = [];
      for (const { dateStr, dayOfWeek } of targetDates) {
        const slotMap = patternByWeekday[dayOfWeek] || {};
        const entries = Object.values(slotMap);
        if (!entries.length) continue;

        for (const entry of entries) {
          bulkEntries.push({
            classId,
            date: dateStr,
            slotId: entry.slotId,
            activityId: entry.activityId,
            teacherId: entry.teacherId || null,
            delete: entry.delete === true,
          });
        }
      }

      if (bulkEntries.length === 0) {
        setAlertInfo({
          show: true,
          message: "Không có tiết học nào để áp dụng trong khoảng thời gian đã chọn.",
          severity: "warning",
        });
        setLoading(false);
        setProgress({ current: 0, total: 0, processing: false });
        return;
      }

      // Gọi API bulk một lần
      const resp = await schoolAdminService.bulkUpsertCalendars(bulkEntries);
      const summary = resp.data || resp.data?.data || resp.data?.summary || resp;
      const successCount = summary.successCount ?? bulkEntries.length;
      const errorCount = summary.errorCount ?? 0;

      setProgress({
        current: targetDates.length,
        total: targetDates.length,
        processing: false,
      });

      if (errorCount === 0) {
        setAlertInfo({
          show: true,
          message: `Đã áp dụng lịch mặc định thành công cho ${successCount} tiết học!`,
          severity: "success",
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setAlertInfo({
          show: true,
          message: `Áp dụng lịch: thành công ${successCount} tiết, lỗi ${errorCount} tiết (có thể do trùng lịch hoặc ràng buộc giáo viên).`,
          severity: "warning",
        });
        if (successCount > 0) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error applying default weekly schedule:", error);
      setAlertInfo({
        show: true,
        message:
          "Lỗi khi áp dụng lịch mặc định: " +
          (error.message || "Vui lòng thử lại"),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const estimatedDates = formData.startDate && formData.endDate && selectedDays.length > 0
    ? getDatesBetween(formData.startDate, formData.endDate, selectedDays).length
    : 0;

  return (
    <>
      <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <ArgonTypography variant="h5" fontWeight="bold" color="primary">
            Đặt lịch mặc định
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" sx={{ mt: 0.5 }}>
            Tự động áp dụng lại toàn bộ lịch tuần hiện tại cho các tuần trong khoảng thời gian
          </ArgonTypography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <ArgonBox>
            <Grid container spacing={2}>
              {/* Ngày bắt đầu */}
              <Grid item xs={12} sm={6}>
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Ngày bắt đầu *
                </ArgonTypography>
                <TextField
                  fullWidth
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              {/* Ngày kết thúc */}
              <Grid item xs={12} sm={6}>
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Ngày kết thúc *
                </ArgonTypography>
                <TextField
                  fullWidth
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              {/* Chọn các ngày trong tuần */}
              <Grid item xs={12}>
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={1}>
                  Áp dụng cho các ngày trong tuần *
                </ArgonTypography>
                <ArgonBox display="flex" flexWrap="wrap" gap={1}>
                  {dayLabels.map(day => (
                    <Chip
                      key={day.value}
                      label={day.label}
                      onClick={() => toggleDay(day.value)}
                      color={selectedDays.includes(day.value) ? "primary" : "default"}
                      variant={selectedDays.includes(day.value) ? "filled" : "outlined"}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </ArgonBox>
              </Grid>

              {/* Thông tin ước tính */}
              {estimatedDates > 0 && (
                <Grid item xs={12}>
                  <ArgonBox 
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#fff3e0', 
                      borderRadius: 2,
                      border: '1px solid #ffcc80'
                    }}
                  >
                    <ArgonTypography variant="body2" color="warning" fontWeight="medium">
                      📅 Sẽ tạo khoảng <strong>{estimatedDates}</strong> lịch học
                    </ArgonTypography>
                    <ArgonTypography variant="caption" color="text">
                      Từ {formData.startDate} đến {formData.endDate}, vào các ngày: {
                        selectedDays
                          .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                          .map(d => dayLabels.find(l => l.value === d)?.label)
                          .join(', ')
                      }
                    </ArgonTypography>
                  </ArgonBox>
                </Grid>
              )}

              {/* Progress bar */}
              {progress.processing && (
                <Grid item xs={12}>
                  <ArgonBox sx={{ width: '100%' }}>
                    <ArgonTypography variant="caption" color="text">
                      Đang xử lý: {progress.current}/{progress.total}
                    </ArgonTypography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(progress.current / progress.total) * 100} 
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </ArgonBox>
                </Grid>
              )}
            </Grid>
          </ArgonBox>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <ArgonButton 
            onClick={onClose} 
            color="secondary" 
            variant="outlined"
            disabled={loading}
          >
            Hủy
          </ArgonButton>
          <ArgonButton 
            onClick={handleSubmit} 
            color="success" 
            disabled={loading || estimatedDates === 0}
          >
            {loading ? (
              <>
                <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-magic" style={{ marginRight: 8 }} />
                Áp dụng ({estimatedDates} lịch)
              </>
            )}
          </ArgonButton>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={alertInfo.show}
        autoHideDuration={5000}
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

ApplyDefaultScheduleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  classId: PropTypes.string.isRequired,
  classEndDate: PropTypes.string,
  weeklyCalendars: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    slots: PropTypes.arrayOf(PropTypes.shape({
      slotId: PropTypes.string,
      slot_id: PropTypes.string,
      slot: PropTypes.shape({
        _id: PropTypes.string
      }),
      activity: PropTypes.shape({
        _id: PropTypes.string
      }),
      activityId: PropTypes.string,
      teacher: PropTypes.shape({
        _id: PropTypes.string,
        id: PropTypes.string
      }),
      teacherId: PropTypes.string
    }))
  })),
  timeSlots: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    slotName: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
  })),
  onSuccess: PropTypes.func.isRequired
};

export default ApplyDefaultScheduleModal;

