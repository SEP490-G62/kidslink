/**
=========================================================
* KidsLink Teacher Schedule Page - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================
*/

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Divider,
  Chip,
  Box,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';
import apiService from 'services/api';

const TeacherSchedule = () => {
  // Đồng bộ cách chọn tuần như trang Parent: dùng offset tuần
  const [selectedWeek, setSelectedWeek] = useState(0); // 0: tuần hiện tại
  const [calendarData, setCalendarData] = useState(null);
  const [timeSlotsApi, setTimeSlotsApi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [calendarRes, slotsRes] = await Promise.all([
          apiService.get('/teachers/class-calendar'),
          apiService.get('/teachers/class-calendar/slots')
        ]);
        if (mounted) {
          setCalendarData(calendarRes);
          // Xử lý response slots - có thể là { data: [...] } hoặc trực tiếp array
          let slotsArray = [];
          if (Array.isArray(slotsRes)) {
            slotsArray = slotsRes;
          } else if (Array.isArray(slotsRes?.data)) {
            slotsArray = slotsRes.data;
          } else if (slotsRes?.data?.data && Array.isArray(slotsRes.data.data)) {
            slotsArray = slotsRes.data.data;
          }
          setTimeSlotsApi(slotsArray);
        }
      } catch (e) {
        console.error('TeacherSchedule load error:', e);
        if (mounted) setError(e.message || 'Không thể tải lịch học');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Helpers tính thứ Hai của tuần được chọn (giống Parent)
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    monday.setHours(0,0,0,0);
    return monday;
  };
  const getCurrentWeekMonday = () => getMonday(new Date());
  const getSelectedWeekMonday = () => {
    const currentMonday = getCurrentWeekMonday();
    const selectedMonday = new Date(currentMonday);
    selectedMonday.setDate(currentMonday.getDate() + (selectedWeek * 7));
    return selectedMonday;
  };

  // Helper: format date to local ISO yyyy-mm-dd (avoid UTC shift)
  const toLocalISO = (inputDate) => {
    const d = new Date(inputDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Danh sách năm +/- 2 năm quanh năm hiện tại
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y++) arr.push(y);
    return arr;
  }, []);

  // Tính tuần đầu (offset) của một năm so với tuần hiện tại
  const getFirstWeekOfYear = (year) => {
    const janFirst = new Date(year, 0, 1);
    const firstMonday = getMonday(janFirst);
    const currentMonday = getCurrentWeekMonday();
    const diffMs = firstMonday.getTime() - currentMonday.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    const currentYear = new Date().getFullYear();
    if (newYear === currentYear) {
      setSelectedWeek(0);
    } else {
      setSelectedWeek(getFirstWeekOfYear(newYear));
    }
  };

  const weekDays = useMemo(() => {
    const monday = getSelectedWeekMonday();
    const dayNames = ['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'];
    const dayShort = ['T2','T3','T4','T5','T6','T7','CN'];
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const iso = toLocalISO(dayDate);
      arr.push({
        label: dayNames[i],
        short: dayShort[i],
        iso,
        isToday: iso === toLocalISO(new Date()),
        display: `${String(dayDate.getDate()).padStart(2,'0')}/${String(dayDate.getMonth()+1).padStart(2,'0')}`
      });
    }
    return arr;
  }, [selectedWeek]);

  // Map slot theo ngày (giống parent)
  const slotsByDay = useMemo(() => {
    if (!calendarData || !calendarData.calendars) return new Map();
    const map = new Map();
    weekDays.forEach(day => {
      const calendarsOfDay = calendarData.calendars.filter(c => {
        const calDate = new Date(c.date);
        const calDateStr = toLocalISO(calDate);
        return calDateStr === day.iso;
      });
      const slots = calendarsOfDay.flatMap(c => Array.isArray(c.slots) ? c.slots : []);
      if (slots.length > 0) {
        const sorted = [...slots].sort((a,b) => (a.startTime||'00:00').localeCompare(b.startTime||'00:00'));
        map.set(day.iso, sorted);
      }
    });
    return map;
  }, [calendarData, weekDays]);

  // Danh sách khung giờ từ API hoặc từ dữ liệu
  const timeSlots = useMemo(() => {
    if (Array.isArray(timeSlotsApi) && timeSlotsApi.length > 0) {
      const list = timeSlotsApi.map(s => ({
        label: `${s.startTime || '00:00'} - ${s.endTime || '00:00'}`,
        name: s.slotName || ''
      }));
      const map = new Map();
      list.forEach(it => { if (!map.has(it.label)) map.set(it.label, it.name); });
      return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([label, name]) => ({ label, name }));
    }
    const labelToNames = new Map();
    weekDays.forEach(d => {
      const slots = slotsByDay.get(d.iso) || [];
      slots.forEach(s => {
        const label = `${s.startTime || '00:00'} - ${s.endTime || '00:00'}`;
        const name = s.slotName || '';
        if (!labelToNames.has(label)) labelToNames.set(label, []);
        if (name) labelToNames.get(label).push(name);
      });
    });
    const labels = Array.from(labelToNames.keys()).sort((a,b)=>a.localeCompare(b));
    return labels.map(label => ({ label, name: (labelToNames.get(label)||[])[0] || '' }));
  }, [timeSlotsApi, slotsByDay, weekDays]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'upcoming': return 'info';
      case 'cancelled': return 'error';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'upcoming': return 'Sắp tới';
      case 'cancelled': return 'Đã hủy';
      case 'in-progress': return 'Đang diễn ra';
      default: return 'Không xác định';
    }
  };

  const getCurrentDay = () => {
    const today = new Date();
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return dayNames[today.getDay()];
  };

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Week navigation helpers (đồng bộ Parent)
  const handlePrevWeek = () => setSelectedWeek(w => w - 1);
  const handleNextWeek = () => setSelectedWeek(w => w + 1);

  const weekRange = useMemo(() => {
    if (!weekDays || weekDays.length === 0) return '';
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.display} - ${end.display}`;
  }, [weekDays]);

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3} sx={{ mt: 6 }}>
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
                  'Xem lịch học và hoạt động của lớp'
                )}
              </ArgonTypography>
            </ArgonBox>
          </ArgonBox>
        </ArgonBox>

        {/* Controls */}
        <ArgonBox
          mb={3}
          sx={{
            backgroundColor: '#fff',
            borderRadius: 2,
            p: 2,
            border: '1px solid #e9ecef',
            boxShadow: '0 6px 16px rgba(0,0,0,0.04)'
          }}
        >
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={3}>
              <ArgonTypography variant="button" color="text" sx={{ mb: 1, display: 'block' }}>
                Năm
              </ArgonTypography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  sx={{
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#dee2e6' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#adb5bd' }
                  }}
                >
                  {years.map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <ArgonBox display="flex" alignItems="center" gap={1}>
                <IconButton
                  onClick={handlePrevWeek}
                  size="small"
                  sx={{ backgroundColor: '#fff', border: '1px solid #dee2e6', '&:hover': { backgroundColor: '#f8f9fa' } }}
                >
                  ‹
                </IconButton>
                <ArgonBox sx={{ flex: 1, textAlign: 'center', px: 2, py: 1, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #dee2e6' }}>
                  <ArgonTypography variant="button" fontWeight="bold" color="primary">
                    Tuần: {weekRange}
                  </ArgonTypography>
                </ArgonBox>
                <IconButton
                  onClick={handleNextWeek}
                  size="small"
                  sx={{ backgroundColor: '#fff', border: '1px solid #dee2e6', '&:hover': { backgroundColor: '#f8f9fa' } }}
                >
                  ›
                </IconButton>
              </ArgonBox>
            </Grid>
          </Grid>
        </ArgonBox>

        {/* Loading State */}
        {loading && (
          <ArgonBox display="flex" justifyContent="center" py={5}>
            <CircularProgress size={40} />
          </ArgonBox>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Schedule Display: kiểu bảng giống Parent */}
        {!loading && !error && (
          <Card>
                  <CardContent>
            <TableContainer 
              component={Paper} 
              sx={{ 
                overflowX: 'auto',
                maxHeight: '70vh',
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
                  {/* Header hàng tiêu đề: cột đầu Thời gian, sau đó là các ngày */}
                  <TableRow>
                    <TableCell 
                      align="center"
                      sx={{
                        p: '16px 12px !important',
                        backgroundColor: '#f1f3f5',
                        borderBottom: '2px solid #dee2e6',
                        width: '120px !important',
                        maxWidth: '140px !important',
                        position: 'sticky',
                        left: 0,
                        zIndex: 3
                      }}
                    >
                      <ArgonTypography variant="subtitle2" fontWeight="bold" color="text">
                        Thời gian
                      </ArgonTypography>
                    </TableCell>
                    {weekDays.map(day => (
                      <TableCell 
                        key={`header-${day.iso}`}
                        align="center"
                        sx={{ 
                          p: '16px 12px !important',
                          backgroundColor: day.isToday ? '#e3f2fd' : '#f8f9fa',
                          borderBottom: '2px solid #dee2e6',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
                        }}
                      >
                        <ArgonBox>
                          <ArgonTypography variant="subtitle1" fontWeight="bold" sx={{ color: day.isToday ? '#1976d2' : '#495057', mb: 0.5 }}>
                            {day.short}
                          </ArgonTypography>
                          <ArgonTypography variant="body2" sx={{ color: '#6c757d', fontSize: '0.875rem' }}>
                            {day.display}
                          </ArgonTypography>
                          {day.isToday && (
                            <Chip label="Hôm nay" size="small" sx={{ height: 18, fontSize: '0.65rem', mt: 0.5, backgroundColor: '#1976d2', color: '#fff' }} />
                          )}
                        </ArgonBox>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Mỗi hàng tương ứng một khung giờ */}
                  {timeSlots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={weekDays.length + 1} align="center" sx={{ p: '24px !important' }}>
                        <ArgonTypography variant="body2" color="text.secondary">Không có hoạt động</ArgonTypography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    timeSlots.map(ts => (
                      <TableRow key={`row-${ts.label}`}>
                        {/* Cột thời gian */}
                        <TableCell 
                          align="center"
                          sx={{
                            p: '12px !important',
                            backgroundColor: '#fff',
                            color: '#495057',
                            borderRight: '2px solid #e9ecef',
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backdropFilter: 'blur(2px)'
                          }}
                        >
                          <ArgonBox>
                            <ArgonTypography variant="button" fontWeight="bold" sx={{ color: '#343a40', display: 'block', mb: 0.5 }}>
                              {ts.name || 'Khung giờ'}
                            </ArgonTypography>
                            <Chip 
                              label={ts.label}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.72rem',
                                backgroundColor: '#e9f7ef',
                                color: '#2e7d32',
                                fontWeight: 600
                              }}
                            />
                          </ArgonBox>
                          </TableCell>
                        {/* Các cột ngày cho khung giờ này */}
                        {weekDays.map(day => {
                          const slots = slotsByDay.get(day.iso) || [];
                          const slot = slots.find(s => `${s.startTime || '00:00'} - ${s.endTime || '00:00'}` === ts.label);
                          return (
                            <TableCell 
                              key={`cell-${day.iso}-${ts.label}`}
                              sx={{
                                p: '8px !important',
                                backgroundColor: day.isToday ? '#f8fbff' : '#fff',
                                verticalAlign: 'top',
                                transition: 'background-color 120ms ease',
                                '&:hover': { backgroundColor: '#f6f7fb' }
                              }}
                            >
                              {slot ? (
                                <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(25,118,210,0.08)', backgroundColor: '#fff', border: '1px solid #e9ecef', overflow: 'hidden', position: 'relative' }}>
                                  {slot.activity?.require_outdoor === 1 && (
                                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, #2e7d32, #81c784)' }} />
                                  )}
                                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <ArgonBox sx={{ flex: 1, minWidth: 0 }}>
                                      <ArgonTypography variant="body2" fontWeight="bold" sx={{ mb: 0.75, color: '#1976d2', fontSize: '0.98rem', lineHeight: 1.4 }}>
                                        {slot.activity?.name || slot.slotName || 'Hoạt động'}
                                      </ArgonTypography>
                                      <ArgonBox display="flex" alignItems="center" gap={1} mb={0.5}>
                                        <Chip label={`${slot.startTime || ''}-${slot.endTime || ''}`} size="small" sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }} />
                                        {slot.slotName && (
                                          <Chip label={slot.slotName} size="small" sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#f1f3f5', color: '#495057', fontWeight: 600 }} />
                                        )}
                                      </ArgonBox>
                                      {slot.teacher && (
                                        <ArgonBox display="flex" alignItems="center" mt={0.5}>
                                          <ArgonTypography variant="caption" sx={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            Giáo viên: {slot.teacher.fullName || 'Chưa xác định'}
                                          </ArgonTypography>
                                        </ArgonBox>
                                      )}
                                      {slot.activity?.require_outdoor === 1 && (
                                        <Chip
                                          label="Ngoài trời"
                                          size="small"
                                          sx={{
                                            height: 18,
                                            fontSize: '0.65rem',
                                            backgroundColor: '#e8f5e9',
                                            color: '#2e7d32',
                                            mt: 0.5
                                          }}
                                        />
                                      )}
                                    </ArgonBox>
                                  </CardContent>
                                </Card>
                              ) : (
                                <ArgonBox display="flex" alignItems="center" justifyContent="center" sx={{ py: 2, color: '#adb5bd', fontSize: '0.8rem' }}>
                                  —
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
            </CardContent>
          </Card>
        )}
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default TeacherSchedule;



