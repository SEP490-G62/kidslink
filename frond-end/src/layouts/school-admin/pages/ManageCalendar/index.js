/**
=========================================================
* KidsLink School Admin - Manage Class Calendar
* Calendar management with slot editing capabilities
=========================================================
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import Box from "@mui/material/Box";
import { useEffect, useMemo, useState } from "react";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import schoolAdminService from "services/schoolAdminService";
import api from "services/api";
import SlotModal from "./SlotModal";
import SlotTemplateModal from "./SlotTemplateModal";
import SlotManagementModal from "./SlotManagementModal";
import ActivityModal from "./ActivityModal";
import ApplyDefaultScheduleModal from "./ApplyDefaultScheduleModal";

function ManageCalendar() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarData, setCalendarData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotTemplateModalOpen, setSlotTemplateModalOpen] = useState(false);
  const [slotManagementModalOpen, setSlotManagementModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [preSelectedSlot, setPreSelectedSlot] = useState(null);
  const [selectedSlotTemplate, setSelectedSlotTemplate] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedSlotForMenu, setSelectedSlotForMenu] = useState(null);
  const [applyDefaultModalOpen, setApplyDefaultModalOpen] = useState(false);

  // Đặt tiêu đề trang
  useEffect(() => {
    document.title = "Quản lý lịch học - KidsLink";
  }, []);

  // Tính toán ngày bắt đầu tuần (Thứ 2)
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getCurrentWeekMonday = () => getMonday(new Date());
  
  const getSelectedWeekMonday = () => {
    const currentMonday = getCurrentWeekMonday();
    const selectedMonday = new Date(currentMonday);
    selectedMonday.setDate(currentMonday.getDate() + (selectedWeek * 7));
    return selectedMonday;
  };

  // Tạo danh sách 7 ngày trong tuần (T2-CN)
  const weekDays = useMemo(() => {
    const monday = getSelectedWeekMonday();
    const days = [];
    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    const dayShortNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const isToday = day.toDateString() === new Date().toDateString();
      
      // Create ISO date string from local date to avoid timezone issues
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(day.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${dayOfMonth}`;
      
      days.push({
        name: dayNames[i],
        shortName: dayShortNames[i],
        date: day,
        dateStr: `${dayOfMonth}/${month}`,
        isoDate: isoDate,
        isToday,
      });
    }
    return days;
  }, [selectedWeek]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchCalendar();
    }
  }, [selectedClass, selectedWeek]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      // Lấy danh sách lớp, chỉ lấy các lớp thuộc năm học mới nhất cho trang Calendar
      const res = await api.get("/classes?latestAcademicYear=true", true);
      const classesData = res.data?.data || res.data || [];
      setClasses(classesData);
      
      // Tự động chọn class đầu tiên có cùng school_id (backend đã filter)
      if (classesData.length > 0) {
        const firstClassId = classesData[0]._id;
        setSelectedClass(firstClassId);
        // fetchCalendar sẽ được gọi tự động bởi useEffect khi selectedClass thay đổi
        // Không set loading = false ở đây vì fetchCalendar sẽ quản lý loading state
      } else {
        setError("Không có lớp học nào. Vui lòng tạo lớp học trước.");
        setLoading(false);
      }
    } catch (e) {
      console.error("Error fetching classes:", e);
      setError("Không thể tải danh sách lớp học");
      setLoading(false);
    }
  };

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const monday = getSelectedWeekMonday();
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const startDate = monday.toISOString().split('T')[0];
      const endDate = sunday.toISOString().split('T')[0];
      
      const response = await schoolAdminService.getClassCalendars(selectedClass, startDate, endDate);
      setCalendarData(response.data);
      setError("");
    } catch (e) {
      console.error("Error fetching calendar:", e);
      setError(e.message || 'Không thể tải lịch học');
      setCalendarData(null);
    } finally {
      setLoading(false);
    }
  };

  // Tạo map slots theo ngày
  const slotsByDay = useMemo(() => {
    if (!calendarData || !calendarData.calendars) return new Map();
    
    const map = new Map();
    
    weekDays.forEach(day => {
      const calendar = calendarData.calendars.find(c => {
        const calDate = new Date(c.date);
        const calDateStr = calDate.toISOString().split('T')[0];
        return calDateStr === day.isoDate;
      });
      
      if (calendar && calendar.slots && calendar.slots.length > 0) {
        const sortedSlots = [...calendar.slots].sort((a, b) => {
          const timeA = a.startTime || '00:00';
          const timeB = b.startTime || '00:00';
          return timeA.localeCompare(timeB);
        });
        map.set(day.isoDate, sortedSlots);
      }
    });
    
    return map;
  }, [calendarData, weekDays]);

  // Danh sách tiết học từ database (unique slots)
  const predefinedSlots = useMemo(() => {
    if (!calendarData || !calendarData.timeSlots) return [];
    return calendarData.timeSlots;
  }, [calendarData]);

  // Lấy danh sách tất cả các slot duy nhất (theo tên và thời gian)
  const uniqueSlots = useMemo(() => {
    return predefinedSlots;
  }, [predefinedSlots]);

  const years = useMemo(() => {
    if (!selectedClass) {
      // Nếu chưa chọn lớp, dùng năm hiện tại +/- 1
      const currentYear = new Date().getFullYear();
      return [currentYear - 1, currentYear, currentYear + 1];
    }
    
    // Lấy thông tin lớp được chọn
    const selectedClassData = classes.find(c => c._id === selectedClass);
    
    if (!selectedClassData) {
      const currentYear = new Date().getFullYear();
      return [currentYear - 1, currentYear, currentYear + 1];
    }
    
    // Ưu tiên dùng academic_year, nếu không có thì dùng start_date và end_date
    let startYear, endYear;
    
    if (selectedClassData.academic_year) {
      // Parse academic_year (có thể là "2024-2025" hoặc chỉ "2024")
      const academicYear = selectedClassData.academic_year;
      if (academicYear.includes('-')) {
        const parts = academicYear.split('-');
        startYear = parseInt(parts[0], 10);
        endYear = parseInt(parts[1], 10);
      } else {
        startYear = parseInt(academicYear, 10);
        endYear = startYear;
      }
    } else if (selectedClassData.start_date && selectedClassData.end_date) {
      // Dùng start_date và end_date
      startYear = new Date(selectedClassData.start_date).getFullYear();
      endYear = new Date(selectedClassData.end_date).getFullYear();
    } else {
      // Fallback
      const currentYear = new Date().getFullYear();
      return [currentYear - 1, currentYear, currentYear + 1];
    }
    
    // Tạo danh sách năm từ năm bắt đầu đến năm kết thúc
    const yearsList = [];
    for (let y = startYear; y <= endYear; y++) {
      yearsList.push(y);
    }
    
    return yearsList.length > 0 ? yearsList : [new Date().getFullYear()];
  }, [selectedClass, classes]);

  const formatWeekRange = () => {
    const monday = getSelectedWeekMonday();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const monStr = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`;
    const sunStr = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}`;
    return `${monStr} - ${sunStr}`;
  };

  const getFirstWeekOfYear = (year) => {
    const janFirst = new Date(year, 0, 1);
    const firstMonday = getMonday(janFirst);
    const currentMonday = getCurrentWeekMonday();
    const diffMs = firstMonday.getTime() - currentMonday.getTime();
    const diffWeeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    const currentYear = new Date().getFullYear();
    
    if (newYear === currentYear) {
      setSelectedWeek(0);
    } else {
      const firstWeek = getFirstWeekOfYear(newYear);
      setSelectedWeek(firstWeek);
    }
  };

  const handleWeekChange = (direction) => {
    if (direction === 'prev') {
      setSelectedWeek(selectedWeek - 1);
    } else {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  const handleAddSlot = (day) => {
    setSelectedSlot(null);
    setSelectedDate(day.isoDate);
    setSlotModalOpen(true);
  };

  const handleSlotClick = (event, slot, day) => {
    setMenuAnchor(event.currentTarget);
    setSelectedSlotForMenu({ slot, day });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedSlotForMenu(null);
  };

  const handleEditSlot = (calendarEntry, day) => {
    handleMenuClose();
    // Set selectedSlot with calendar entry data
    setSelectedSlot(calendarEntry);
    
    // Set preSelectedSlot to show slot info
    setPreSelectedSlot({
      _id: calendarEntry.slotId || calendarEntry.slot?._id,
      slotName: calendarEntry.slotName,
      startTime: calendarEntry.startTime,
      endTime: calendarEntry.endTime
    });
    
    setSelectedDate(day.isoDate);
    setSlotModalOpen(true);
  };

  const handleEditFromMenu = () => {
    if (selectedSlotForMenu) {
      handleEditSlot(selectedSlotForMenu.slot, selectedSlotForMenu.day);
    }
  };

  const handleDeleteFromMenu = () => {
    if (selectedSlotForMenu) {
      handleMenuClose();
      handleDeleteSlot(selectedSlotForMenu.slot.id);
    }
  };

  const handleDeleteSlot = async (calendarId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tiết học này?")) return;
    
    try {
      await schoolAdminService.deleteCalendarEntry(calendarId);
      fetchCalendar();
    } catch (error) {
      console.error("Error deleting calendar entry:", error);
      alert("Lỗi khi xóa tiết học: " + (error.message || "Vui lòng thử lại"));
    }
  };

  const handleDeleteSlotTemplate = async (slotTemplate) => {
    try {
      // Tìm tất cả các calendar entries có cùng thời gian trong tuần hiện tại và xóa
      const entriesToDelete = [];
      weekDays.forEach(day => {
        const entry = getSlotForDay(day, slotTemplate);
        if (entry) {
          entriesToDelete.push(entry.id);
        }
      });

      if (entriesToDelete.length === 0) {
        alert("Không tìm thấy tiết học nào để xóa");
        return;
      }

      // Xóa từng entry
      await Promise.all(entriesToDelete.map(id => schoolAdminService.deleteCalendarEntry(id)));
      
      fetchCalendar();
      alert(`Đã xóa ${entriesToDelete.length} tiết học thành công`);
    } catch (error) {
      console.error("Error deleting slot template:", error);
      alert("Lỗi khi xóa tiết học: " + (error.message || "Vui lòng thử lại"));
    }
  };

  const handleSlotSuccess = () => {
    setSlotModalOpen(false);
    setSelectedSlot(null);
    setSelectedDate(null);
    fetchCalendar();
  };

  // Tìm slot của một ngày theo slotName và time
  const getSlotForDay = (day, slotTemplate) => {
    const daySlots = slotsByDay.get(day.isoDate) || [];
    return daySlots.find(slot => 
      slot.slotName === slotTemplate.slotName &&
      slot.startTime === slotTemplate.startTime &&
      slot.endTime === slotTemplate.endTime
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header với gradient background */}
        <ArgonBox 
          mb={4}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            p: 3,
            color: '#fff',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
          }}
        >
          <ArgonBox display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <ArgonBox>
              <ArgonTypography variant="h4" fontWeight="bold" sx={{ color: '#fff', mb: 0.5 }}>
                Quản Lý Lịch Học
              </ArgonTypography>
              <ArgonTypography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {calendarData?.class?.name ? (
                  <>
                    <strong>{calendarData.class.name}</strong> • {calendarData.class.academicYear}
                  </>
                ) : (
                  'Chọn lớp để xem và chỉnh sửa lịch học'
                )}
              </ArgonTypography>
            </ArgonBox>
            <ArgonBox display="flex" gap={1} flexWrap="wrap">
              <ArgonButton 
                color="white" 
                onClick={() => {
                  setSlotManagementModalOpen(true);
                }}
                sx={{ color: '#667eea' }}
              >
                <i className="fas fa-clock mr-2" /> Quản lý tiết học
              </ArgonButton>
              <ArgonButton 
                color="white" 
                onClick={() => setActivityModalOpen(true)}
                sx={{ color: '#667eea' }}
              >
                <i className="fas fa-book mr-2" /> Quản lý Môn Học
              </ArgonButton>
              <ArgonButton 
                color="success" 
                onClick={() => {
                  if (!calendarData || !calendarData.calendars || calendarData.calendars.length === 0) {
                    alert("Tuần hiện tại chưa có lịch học nào để đặt mặc định. Vui lòng tạo lịch trước.");
                    return;
                  }
                  setApplyDefaultModalOpen(true);
                }}
                disabled={!selectedClass}
              >
                <i className="fas fa-magic mr-2" /> Đặt Lịch Mặc Định
              </ArgonButton>
            </ArgonBox>
          </ArgonBox>
        </ArgonBox>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2
            }}
          >
            {error}
          </Alert>
        )}

        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Class and Week Navigation Header */}
            <ArgonBox 
              mb={3}
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef'
              }}
            >
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={6} md={4}>
                  <ArgonBox>
                    <Typography variant="body2" fontWeight="medium" color="text" sx={{ mb: 1.5 }}>
                      Chọn lớp
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        sx={{
                          backgroundColor: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#dee2e6'
                          }
                        }}
                      >
                        {classes.map(cls => (
                          <MenuItem key={cls._id} value={cls._id}>
                            {cls.class_name} - {cls.academic_year}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </ArgonBox>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ArgonBox>
                    <Typography variant="body2" fontWeight="medium" color="text" sx={{ mb: 1.5 }}>
                      Năm học
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedYear}
                        onChange={(e) => handleYearChange(Number(e.target.value))}
                        sx={{
                          backgroundColor: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#dee2e6'
                          }
                        }}
                      >
                        {years.map(year => (
                          <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </ArgonBox>
                </Grid>
                <Grid item xs={12} md={5}>
                  <ArgonBox display="flex" alignItems="center" gap={1}>
                    <IconButton
                      onClick={() => handleWeekChange('prev')}
                      size="small"
                      sx={{
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        '&:hover': { backgroundColor: '#f8f9fa' }
                      }}
                    >
                      ‹
                    </IconButton>
                    <ArgonBox 
                      sx={{ 
                        flex: 1, 
                        textAlign: 'center',
                        px: 2,
                        py: 1,
                        backgroundColor: '#fff',
                        borderRadius: 1,
                        border: '1px solid #dee2e6'
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        Tuần: {formatWeekRange()}
                      </Typography>
                    </ArgonBox>
                    <IconButton
                      onClick={() => handleWeekChange('next')}
                      size="small"
                      sx={{
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        '&:hover': { backgroundColor: '#f8f9fa' }
                      }}
                    >
                      ›
                    </IconButton>
                  </ArgonBox>
                </Grid>
              </Grid>
            </ArgonBox>

            {loading ? (
              <ArgonBox display="flex" justifyContent="center" py={5}>
                <CircularProgress size={40} />
              </ArgonBox>
            ) : (
              <>
                {/* Weekly Schedule Grid */}
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    overflowX: 'auto',
                    borderRadius: 2,
                    border: '1px solid #e9ecef'
                  }}
                >
                  <Table 
                    sx={{ 
                      minWidth: 800,
                      width: '100%',
                      tableLayout: 'fixed',
                      borderCollapse: 'separate',
                      borderSpacing: 0,
                      '& .MuiTableCell-root': {
                        padding: '0 !important',
                        border: '1px solid #e9ecef',
                        boxSizing: 'border-box !important',
                        verticalAlign: 'top',
                        width: `${100 / (weekDays.length + 1)}% !important`
                      }
                    }}
                  >
                    <TableBody>
                      {/* Day Headers Row */}
                      <TableRow>
                        {/* Time column header */}
                        <TableCell 
                          align="center"
                          sx={{ 
                            p: '16px 12px !important',
                            backgroundColor: '#f1f3f5',
                            borderBottom: '2px solid #dee2e6',
                            width: '120px !important',
                            maxWidth: '140px !important'
                          }}
                        >
                          <ArgonTypography variant="subtitle2" fontWeight="bold" color="text">
                            Thời gian
                          </ArgonTypography>
                        </TableCell>
                      {/* Day headers */}
                      {weekDays.map(day => (
                        <TableCell 
                          key={`header-${day.isoDate}`}
                          align="center"
                          sx={{ 
                            p: '16px 12px !important',
                            backgroundColor: day.isToday ? '#e3f2fd' : '#f8f9fa',
                            borderBottom: '2px solid #dee2e6'
                          }}
                        >
                          <ArgonBox>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight="bold" 
                              sx={{ 
                                color: day.isToday ? '#1976d2' : '#495057',
                                mb: 0.5
                              }}
                            >
                              {day.shortName}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#6c757d',
                                fontSize: '0.875rem'
                              }}
                            >
                              {day.dateStr}
                            </Typography>
                            {day.isToday && (
                              <Chip
                                label="Hôm nay"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  mt: 0.5,
                                  backgroundColor: '#1976d2',
                                  color: '#fff'
                                }}
                              />
                            )}
                          </ArgonBox>
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Slot Rows */}
                    {uniqueSlots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={weekDays.length + 1} align="center" sx={{ p: '24px !important' }}>
                          <Typography variant="body2" color="text.secondary">Không có hoạt động</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      uniqueSlots.map((slotTemplate, slotIdx) => (
                        <TableRow key={slotIdx}>
                          {/* Time Column */}
                          <TableCell 
                            align="center"
                            sx={{
                              p: '12px !important',
                              backgroundColor: '#fff',
                              color: '#495057',
                              borderRight: '2px solid #e9ecef'
                            }}
                          >
                            <ArgonBox>
                              <ArgonTypography variant="button" fontWeight="bold" sx={{ color: '#343a40', display: 'block', mb: 0.5 }}>
                                {slotTemplate.slotName || 'Khung giờ'}
                              </ArgonTypography>
                              <Chip
                                label={`${slotTemplate.startTime || '00:00'} - ${slotTemplate.endTime || '00:00'}`}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.72rem',
                                  backgroundColor: '#e9f7ef',
                                  color: '#2e7d32',
                                  fontWeight: 600
                                }}
                              />
                              <ArgonBox display="flex" justifyContent="center" gap={0.5} mt={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedSlotForDefault({
                                      id: slotTemplate.id,
                                      slotName: slotTemplate.slotName,
                                      startTime: slotTemplate.startTime,
                                      endTime: slotTemplate.endTime
                                    });
                                    setApplyDefaultModalOpen(true);
                                  }}
                                  sx={{ color: '#4caf50', padding: '4px' }}
                                  title="Đặt lịch mặc định cho tiết này"
                                >
                                  <i className="fas fa-magic" style={{ fontSize: 12 }} />
                                </IconButton>
                              </ArgonBox>
                            </ArgonBox>
                          </TableCell>
                          
                          {/* Activity cells for each day */}
                          {weekDays.map(day => {
                            const slot = getSlotForDay(day, slotTemplate);
                            
                            // Không cho phép thêm lịch cho các ngày trong quá khứ
                            const isPastDay = (() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const dayDate = new Date(day.date);
                              dayDate.setHours(0, 0, 0, 0);
                              return dayDate < today;
                            })();
                            
                            return (
                              <TableCell 
                                key={`cell-${day.isoDate}-${slotTemplate.id || slotIdx}`}
                                sx={{
                                  p: '8px !important',
                                  backgroundColor: day.isToday ? '#f8fbff' : '#fff',
                                  verticalAlign: 'top',
                                  height: 110
                                }}
                              >
                                {slot ? (
                                  <Card
                                    onClick={(e) => handleSlotClick(e, slot, day)}
                                    sx={{
                                      borderRadius: 2,
                                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.08)',
                                      backgroundColor: '#fff',
                                      border: '1px solid #e9ecef',
                                      overflow: 'hidden',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      minHeight: 100,
                                      height: '100%',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      '&:hover': {
                                        boxShadow: '0 6px 16px rgba(25, 118, 210, 0.12)',
                                        transform: 'translateY(-2px)'
                                      }
                                    }}
                                  >
                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                      <ArgonBox sx={{ flex: 1, minWidth: 0 }}>
                                        <ArgonTypography 
                                          variant="body1" 
                                          fontWeight="bold" 
                                          sx={{ 
                                            mb: 1.5,
                                            color: '#1976d2',
                                            fontSize: '1.05rem',
                                            lineHeight: 1.5,
                                            minHeight: 48,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            letterSpacing: '0.01em'
                                          }}
                                        >
                                          {slot.activity?.name || slot.slotName || 'Hoạt động'}
                                        </ArgonTypography>
                                        <ArgonBox display="flex" alignItems="center" mt="auto">
                                          <Typography 
                                            variant="body2" 
                                            sx={{ 
                                              fontSize: '0.875rem',
                                              color: '#495057',
                                              fontWeight: 500,
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis'
                                            }}
                                          >
                                            {slot.teacher?.fullName || calendarData?.class?.teacher?.fullName || 'Chưa xác định'}
                                          </Typography>
                                        </ArgonBox>
                                      </ArgonBox>
                                    </CardContent>
                                  </Card>
                                ) : (
                                  <ArgonBox 
                                    display="flex" 
                                    justifyContent="center" 
                                    alignItems="center"
                                    sx={{ minHeight: 100, height: '100%' }}
                                  >
                                    {isPastDay ? (
                                      // Ngày đã qua: không cho phép bấm để thêm lịch
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontStyle: 'italic' }}
                                      >
                                        Ngày đã qua
                                      </Typography>
                                    ) : (
                                      <IconButton
                                        size="medium"
                                        onClick={() => {
                                          setSelectedSlot(null);
                                          setPreSelectedSlot({
                                            _id: slotTemplate.id,
                                            slotName: slotTemplate.slotName,
                                            startTime: slotTemplate.startTime,
                                            endTime: slotTemplate.endTime
                                          });
                                          setSelectedDate(day.isoDate);
                                          setSlotModalOpen(true);
                                        }}
                                        sx={{ 
                                          color: '#999',
                                          width: 48,
                                          height: 48,
                                          '&:hover': { 
                                            color: '#1976d2', 
                                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                            transform: 'scale(1.1)'
                                          }
                                        }}
                                        title="Thêm nội dung tiết học"
                                      >
                                        <i className="fas fa-plus" style={{ fontSize: 20 }} />
                                      </IconButton>
                                    )}
                                  </ArgonBox>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </TableContainer>
                
              </>
            )}
          </CardContent>
        </Card>
      </ArgonBox>

      {/* Modals */}
      <SlotManagementModal
        open={slotManagementModalOpen}
        onClose={() => {
          setSlotManagementModalOpen(false);
        }}
        onSuccess={() => {
          fetchCalendar();
        }}
      />

      <SlotTemplateModal
        open={slotTemplateModalOpen}
        onClose={() => {
          setSlotTemplateModalOpen(false);
          setSelectedSlotTemplate(null);
        }}
        slotData={selectedSlotTemplate}
        onSuccess={() => {
          setSlotTemplateModalOpen(false);
          setSelectedSlotTemplate(null);
          fetchCalendar();
        }}
      />

      <SlotModal
        open={slotModalOpen}
        onClose={() => {
          setSlotModalOpen(false);
          setSelectedSlot(null);
          setPreSelectedSlot(null);
          setSelectedDate(null);
        }}
        calendarEntry={selectedSlot}
        date={selectedDate}
        weekDays={weekDays}
        classId={selectedClass}
        onSuccess={handleSlotSuccess}
        preSelectedSlot={preSelectedSlot}
      />

      <ActivityModal
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
      />

      <ApplyDefaultScheduleModal
        open={applyDefaultModalOpen}
        onClose={() => {
          setApplyDefaultModalOpen(false);
        }}
        classId={selectedClass}
        classEndDate={classes.find(c => c._id === selectedClass)?.end_date}
        weeklyCalendars={calendarData?.calendars || []}
        timeSlots={calendarData?.timeSlots || []}
        onSuccess={() => {
          setApplyDefaultModalOpen(false);
          fetchCalendar();
        }}
      />

      {/* Context menu for slot actions */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem onClick={handleEditFromMenu}>
          <i className="fas fa-edit" style={{ fontSize: 14, marginRight: 8, color: '#1976d2' }} />
          Sửa nội dung
        </MenuItem>
        <MenuItem onClick={handleDeleteFromMenu} sx={{ color: '#f44336' }}>
          <i className="fas fa-trash" style={{ fontSize: 14, marginRight: 8 }} />
          Xóa tiết học
        </MenuItem>
      </Menu>
      <Footer />
    </DashboardLayout>
  );
}

export default ManageCalendar;