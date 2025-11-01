/**
=========================================================
* KidsLink Parent Dashboard - Class Calendar
* Redesigned for better UX in kindergarten management
=========================================================
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
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
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "context/AuthContext";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import parentService from "services/parentService";

function ClassCalendar() {
  const { selectedChild } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarData, setCalendarData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(0);

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
      days.push({
        name: dayNames[i],
        shortName: dayShortNames[i],
        date: day,
        dateStr: `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`,
        isoDate: day.toISOString().split('T')[0],
        isToday,
      });
    }
    return days;
  }, [selectedWeek]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await parentService.getLatestClassCalendar(selectedChild?._id);
        if (mounted) setCalendarData(data);
      } catch (e) {
        if (mounted) setError(e.message || 'Không thể tải lịch lớp');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedChild]);

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

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      yearsList.push(i);
    }
    return yearsList;
  }, []);

  const formatWeekRange = () => {
    const monday = getSelectedWeekMonday();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const monStr = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}/${monday.getFullYear()}`;
    const sunStr = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}/${sunday.getFullYear()}`;
    return `${monStr} - ${sunStr}`;
  };

  // Tính toán tuần đầu tiên của một năm
  const getFirstWeekOfYear = (year) => {
    const janFirst = new Date(year, 0, 1); // 1/1 của năm
    const firstMonday = getMonday(janFirst);
    const currentMonday = getCurrentWeekMonday();
    // Tính số tuần từ tuần hiện tại đến tuần đầu của năm
    const diffMs = firstMonday.getTime() - currentMonday.getTime();
    const diffWeeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    const currentYear = new Date().getFullYear();
    
    if (newYear === currentYear) {
      // Năm hiện tại → chuyển về tuần hiện tại
      setSelectedWeek(0);
    } else {
      // Năm khác → chuyển về tuần đầu của năm đó
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

  const getDayActivities = (day) => {
    const slots = slotsByDay.get(day.isoDate) || [];
    
    if (slots.length === 0) {
      return (
        <ArgonBox 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center"
          sx={{ 
            py: 4,
            minHeight: 150
          }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: '0.875rem'
            }}
          >
            Không có hoạt động
          </Typography>
        </ArgonBox>
      );
    }
    
    return (
      <ArgonBox sx={{ p: 1.5 }}>
        {slots.map((slot, idx) => {
          const activityName = slot.activity?.name || slot.slotName || 'Hoạt động';
          const timeRange = slot.startTime && slot.endTime ? `${slot.startTime}-${slot.endTime}` : '';
          
          return (
            <Card
              key={`${slot.id}-${idx}`}
              sx={{
                mb: idx < slots.length - 1 ? 2 : 0,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                backgroundColor: '#fff'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <ArgonBox sx={{ flex: 1, minWidth: 0 }}>
                    <ArgonTypography 
                      variant="body2" 
                      fontWeight="bold" 
                      sx={{ 
                        mb: 0.5,
                        color: '#1976d2',
                        fontSize: '0.95rem',
                        lineHeight: 1.4
                      }}
                    >
                      {activityName}
                    </ArgonTypography>
                    {timeRange && (
                      <Chip
                        label={timeRange}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          backgroundColor: '#4caf50',
                          color: '#fff',
                          fontWeight: 600,
                          mb: 0.5
                        }}
                      />
                    )}
                    <ArgonBox display="flex" alignItems="center" mt={0.5}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.75rem',
                          color: '#666'
                        }}
                      >
                        Giáo viên: {slot.teacher?.fullName || calendarData?.class?.teacher?.fullName || 'Chưa xác định'}
                      </Typography>
                    </ArgonBox>
                    {slot.activity?.require_outdoor === 1 && (
                      <Chip
                        label="Ngoài trời"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          backgroundColor: '#81c784',
                          color: '#fff',
                          mt: 0.5
                        }}
                      />
                    )}
                </ArgonBox>
              </CardContent>
            </Card>
          );
        })}
      </ArgonBox>
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
                Lịch Học Hàng Tuần
              </ArgonTypography>
              <ArgonTypography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {calendarData?.class?.name ? (
                  <>
                    <strong>{calendarData.class.name}</strong> • {calendarData.class.academicYear}
                  </>
                ) : (
                  'Xem lịch học và hoạt động của bé'
                )}
              </ArgonTypography>
            </ArgonBox>
          </ArgonBox>
        </ArgonBox>

        {loading && (
          <ArgonBox display="flex" justifyContent="center" py={5}>
            <CircularProgress size={40} />
          </ArgonBox>
        )}
        
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

        {!loading && !error && (
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Week Navigation Header */}
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
                  {/* <Grid item xs={12} sm={6} md={3}>
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
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#adb5bd'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            }
                          }}
                        >
                          {years.map(year => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </ArgonBox>
                  </Grid> */}
                  {/* <Grid item xs={12} sm={6} md={4}>
                    <ArgonBox>
                      <Typography variant="body2" fontWeight="medium" color="text" sx={{ mb: 1.5 }}>
                        Tuần
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedWeek}
                          onChange={(e) => setSelectedWeek(Number(e.target.value))}
                          sx={{
                            backgroundColor: '#fff',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#dee2e6'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#adb5bd'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            }
                          }}
                        >
                          <MenuItem value={-2}>Hai tuần trước</MenuItem>
                          <MenuItem value={-1}>Tuần trước</MenuItem>
                          <MenuItem value={0}>Tuần này</MenuItem>
                          <MenuItem value={1}>Tuần sau</MenuItem>
                          <MenuItem value={2}>Hai tuần sau</MenuItem>
                        </Select>
                      </FormControl>
                    </ArgonBox>
                  </Grid> */}
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
                      width: `${100 / weekDays.length}% !important`
                    }
                  }}
                >
                  <TableBody>
                    {/* Day Headers */}
                    <TableRow>
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
                    {/* Activities Row */}
                    <TableRow>
                      {weekDays.map(day => (
                        <TableCell 
                          key={day.isoDate}
                          sx={{
                            minHeight: 250,
                            p: '0 !important',
                            backgroundColor: day.isToday ? '#f8fbff' : '#fff'
                          }}
                        >
                          {getDayActivities(day)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Footer Note */}
              <ArgonBox 
                mt={3}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107'
                }}
              >
                <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={0.5}>
                  Lưu ý
                </ArgonTypography>
                <ArgonTypography variant="body2" sx={{ fontSize: '0.875rem', color: '#856404' }}>
                  Lịch học có thể thay đổi theo tình hình thực tế. Vui lòng cập nhật thường xuyên để theo dõi các hoạt động của bé.
                </ArgonTypography>
              </ArgonBox>
            </CardContent>
          </Card>
        )}
      </ArgonBox>
    </DashboardLayout>
  );
}

export default ClassCalendar;
