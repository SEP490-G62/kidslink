/**
=========================================================
* KidsLink Parent Dashboard - Menu
=========================================================
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CardMedia from "@mui/material/CardMedia";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "context/AuthContext";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import parentService from "services/parentService";

function Menu() {
  const { selectedChild } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuData, setMenuData] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0: this week, -1 prev, +1 next
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let startYear = currentYear - 2; // Default fallback
    
    // Extract start year from academicYear (format: "2023-2024")
    if (menuData?.class?.academicYear) {
      const academicYearStr = menuData.class.academicYear;
      const match = academicYearStr.match(/^(\d{4})/);
      if (match) {
        const parsedStartYear = parseInt(match[1], 10);
        if (!isNaN(parsedStartYear)) {
          startYear = parsedStartYear;
        }
      }
    }
    
    const yearsList = [];
    for (let i = startYear; i <= currentYear; i++) {
      yearsList.push(i);
    }
    return yearsList;
  }, [menuData]);

  const getFirstWeekOfYear = (year) => {
    const janFirst = new Date(year, 0, 1);
    const firstMonday = getMonday(janFirst);
    const currentMonday = getCurrentWeekMonday();
    const diffMs = firstMonday.getTime() - currentMonday.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
  };

  const weekDays = useMemo(() => {
    const monday = getSelectedWeekMonday();
    const days = [];
    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    const dayShortNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const isToday = day.toDateString() === new Date().toDateString();
      const localISO = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
      days.push({
        name: dayNames[i],
        shortName: dayShortNames[i],
        date: day,
        dateStr: `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`,
        isoDate: day.toISOString().split('T')[0],
        localISO,
        isToday,
      });
    }
    return days;
  }, [selectedWeek]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await parentService.getWeeklyMenu(selectedChild?._id);
      setMenuData(data);
    } catch (e) {
      setError(e.message || 'Không thể tải thực đơn tuần');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild, selectedWeek]);

  const handleWeekChange = (direction) => {
    setSelectedWeek((prev) => prev + (direction === 'prev' ? -1 : 1));
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

  const formatWeekRange = () => {
    const monday = getSelectedWeekMonday();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const monStr = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`;
    const sunStr = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}`;
    return `${monStr} - ${sunStr}`;
  };

  const mealsOrder = ['Breakfast', 'Lunch', 'Snack'];

  const mealMeta = {
    Breakfast: { color: '#1976d2' },
    Lunch: { color: '#2e7d32' },
    Snack: { color: '#ed6c02' }
  };

  const renderDayMenu = (day, index) => {
    // Only Mon-Fri
    const dayIndex = day.date.getDay();
    if (dayIndex === 0 || dayIndex === 6) {
      return (
        <ArgonBox 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          sx={{ py: 6, color: '#999' }}
        >
          Không có thực đơn
        </ArgonBox>
      );
    }

    // Map by index to avoid timezone mismatch (server days are Mon..Fri in order)
    // Helper: local yyyy-mm-dd
    const toLocalISO = (d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    };
    // Match by local date string to avoid timezone drift
    const serverDay = menuData?.menus?.find(d => toLocalISO(d.date) === day.localISO || d.dateISO === day.isoDate) || null;
    if (!serverDay) {
      return (
        <ArgonBox display="flex" alignItems="center" justifyContent="center" sx={{ py: 6, color: '#999' }}>
          Chưa có thực đơn
        </ArgonBox>
      );
    }

    return (
      <ArgonBox sx={{ p: 1.5 }}>
        {mealsOrder.map((mealName) => {
          const dishes = serverDay.meals?.[mealName] || [];
          const meta = mealMeta[mealName];
          return (
            <Card
              key={`${day.isoDate}-${mealName}`}
              sx={{
                mb: 2,
                borderRadius: 2,
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                border: `1px solid ${meta.color}22`,
                background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)'
              }}
            >
              <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                <ArgonBox display="flex" alignItems="center" justifyContent="space-between" mb={1.25}>
                  <ArgonTypography variant="body2" fontWeight="bold" sx={{ color: meta.color }}>
                    {mealName}
                  </ArgonTypography>
                </ArgonBox>

                {dishes.length === 0 ? (
                  <ArgonTypography variant="caption" color="text.secondary">Chưa có món</ArgonTypography>
                ) : (
                  <ArgonBox display="flex" flexDirection="column" gap={1}>
                    {dishes.map((dish) => (
                      <ArgonBox key={dish.id} display="flex" alignItems="center" justifyContent="space-between">
                        <ArgonTypography variant="body2" fontWeight="medium" color="dark" sx={{ pr: 1 }}>
                          {dish.name}
                        </ArgonTypography>
                        {/* {dish.description && (
                          <Chip
                            label={dish.description}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', backgroundColor: `${meta.color}0f`, color: meta.color, fontWeight: 600 }}
                          />
                        )} */}
                      </ArgonBox>
                    ))}
                  </ArgonBox>
                )}
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
        <ArgonBox 
          mb={4}
          sx={{
            background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
            borderRadius: 3,
            p: 3,
            color: '#fff',
            boxShadow: '0 4px 20px rgba(250, 208, 196, 0.5)'
          }}
        >
          <ArgonBox display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <ArgonBox>
              <ArgonTypography variant="h4" fontWeight="bold" sx={{ color: '#fff', mb: 0.5 }}>
                Thực Đơn Hàng Tuần
              </ArgonTypography>
              <ArgonTypography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {menuData?.class?.name ? (
                  <>
                    <strong>{menuData.class.name}</strong> • {menuData.class.academicYear}
                  </>
                ) : (
                  'Xem thực đơn bữa ăn của bé theo tuần'
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
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <ArgonBox mb={3} sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} sm={6} md={3}>
                    <ArgonBox>
                      <ArgonTypography variant="body2" fontWeight="medium" color="text" mb={1.5}>
                        Năm
                      </ArgonTypography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedYear}
                          onChange={(e) => handleYearChange(Number(e.target.value))}
                          sx={{
                            backgroundColor: '#fff',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#dee2e6' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#adb5bd' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' }
                          }}
                        >
                          {years.map((year) => (
                            <MenuItem key={year} value={year}>
                              {year}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </ArgonBox>
                  </Grid>
                  <Grid item xs={12} sm={6} md={5}>
                    <ArgonBox display="flex" alignItems="center" gap={1}>
                      <IconButton onClick={() => handleWeekChange('prev')} size="small" sx={{ backgroundColor: '#fff', border: '1px solid #dee2e6', '&:hover': { backgroundColor: '#f8f9fa' } }}>
                        ‹
                      </IconButton>
                      <ArgonBox sx={{ flex: 1, textAlign: 'center', px: 2, py: 1, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #dee2e6' }}>
                        <ArgonTypography variant="body2" fontWeight="bold" color="primary">
                          Tuần: {formatWeekRange()}
                        </ArgonTypography>
                      </ArgonBox>
                      <IconButton onClick={() => handleWeekChange('next')} size="small" sx={{ backgroundColor: '#fff', border: '1px solid #dee2e6', '&:hover': { backgroundColor: '#f8f9fa' } }}>
                        ›
                      </IconButton>
                    </ArgonBox>
                  </Grid>
                </Grid>
              </ArgonBox>

              <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 2, border: '1px solid #e9ecef' }}>
                <Table sx={{ minWidth: 800, width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, '& .MuiTableCell-root': { padding: '0 !important', border: '1px solid #e9ecef', boxSizing: 'border-box !important', verticalAlign: 'top', width: `${100 / weekDays.length}% !important` } }}>
                  <TableBody>
                    <TableRow>
                      {weekDays.map(day => (
                        <TableCell key={`header-${day.isoDate}`} align="center" sx={{ p: '16px 12px !important', backgroundColor: day.isToday ? '#e3f2fd' : '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          <ArgonBox>
                            <ArgonTypography variant="subtitle1" fontWeight="bold" sx={{ color: day.isToday ? '#1976d2' : '#495057', mb: 0.5 }}>
                              {day.shortName}
                            </ArgonTypography>
                            <ArgonTypography variant="body2" sx={{ color: '#6c757d', fontSize: '0.875rem' }}>
                              {day.dateStr}
                            </ArgonTypography>
                            {day.isToday && (
                              <Chip label="Hôm nay" size="small" sx={{ height: 18, fontSize: '0.65rem', mt: 0.5, backgroundColor: '#1976d2', color: '#fff' }} />
                            )}
                          </ArgonBox>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      {weekDays.map((day, idx) => (
                        <TableCell key={day.isoDate} sx={{ minHeight: 250, p: '0 !important', backgroundColor: day.isToday ? '#f8fbff' : '#fff' }}>
                          {renderDayMenu(day, idx)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <Grid container spacing={3} mt={1}>
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                    Ghi chú dinh dưỡng & dị ứng của bé
                  </ArgonTypography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <Chip label="Bữa sáng giàu năng lượng" size="small" sx={{ mr: 1, mb: 1 }} color="primary" variant="outlined" />
                      <Chip label="Bổ sung rau củ mỗi bữa" size="small" sx={{ mr: 1, mb: 1 }} color="success" variant="outlined" />
                      <Chip label="Hạn chế đồ ngọt" size="small" sx={{ mr: 1, mb: 1 }} color="warning" variant="outlined" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ArgonTypography variant="caption" color="text">
                        Dị ứng của bé: {selectedChild?.allergy ? selectedChild.allergy : 'Không có'}
                      </ArgonTypography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                    Chú thích
                  </ArgonTypography>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Chip label="Breakfast" size="small" sx={{ mr: 1, mb: 1, color: mealMeta.Breakfast.color }} variant="outlined" />
                      <Chip label="Lunch" size="small" sx={{ mr: 1, mb: 1, color: mealMeta.Lunch.color }} variant="outlined" />
                      <Chip label="Snack" size="small" sx={{ mr: 1, mb: 1, color: mealMeta.Snack.color }} variant="outlined" />
                    </Grid>
                    <Grid item xs={12}>
                      <ArgonTypography variant="caption" color="text">
                        Mỗi mục hiển thị danh sách món và mô tả nhanh (chip bên phải).
                      </ArgonTypography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Menu;
