import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import GroupIcon from "@mui/icons-material/Group";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";

import nutritionService from "services/nutritionService";

const getVietnamDate = () => {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
};

const getVietnamDateString = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const vietnamTime = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, "0");
  const day = String(vietnamTime.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStartOfWeekVietnam = () => {
  const now = getVietnamDate();
  const day = now.getDay();
  const diffToMon = ((day + 6) % 7);
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMon);
  return getVietnamDateString(monday);
};

const addDaysVietnam = (dateString, days) => {
  const date = new Date(dateString + "T00:00:00+07:00");
  date.setDate(date.getDate() + days);
  return getVietnamDateString(date);
};

const getDateForWeekdayVietnam = (weekStartString, dayIndex) => {
  const date = new Date(weekStartString + "T00:00:00+07:00");
  date.setDate(date.getDate() + dayIndex);
  return date;
};

const toVietnamISOString = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString + "T00:00:00+07:00");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00.000Z`;
};

const SectionCard = ({ icon, title, subtitle, children }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      border: "1px solid #e3f2fd",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(243,248,255,0.98) 100%)",
      boxShadow: "0 12px 30px rgba(25,118,210,0.08)",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <ArgonBox
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
      </ArgonBox>
      <ArgonBox>
        <ArgonTypography variant="subtitle1" fontWeight="bold" color="dark">
          {title}
        </ArgonTypography>
        {subtitle && (
          <ArgonTypography variant="caption" color="text" fontWeight="regular">
            {subtitle}
          </ArgonTypography>
        )}
      </ArgonBox>
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

export default function SchedulePlanner() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dishes, setDishes] = useState([]);
  const [classAges, setClassAges] = useState([]);
  const [meals, setMeals] = useState([]);
  const [weekDays, setWeekDays] = useState([]);

  const [selectedClassAge, setSelectedClassAge] = useState("");
  const [weekStart, setWeekStart] = useState(() => getStartOfWeekVietnam());
  const [weeklyMealSelection, setWeeklyMealSelection] = useState({});
  const [loadingWeeklySelection, setLoadingWeeklySelection] = useState(false);
  const [weeklyMealDialogOpen, setWeeklyMealDialogOpen] = useState(false);
  const [currentWeeklySlot, setCurrentWeeklySlot] = useState(null);
  const [selectedDishesForWeekly, setSelectedDishesForWeekly] = useState(new Set());
  const [savingWeeklyMeal, setSavingWeeklyMeal] = useState(false);
  const [dishSearchWeekly, setDishSearchWeekly] = useState("");

  const [latestClassGroups, setLatestClassGroups] = useState([]);
  const [loadingLatestClasses, setLoadingLatestClasses] = useState(false);

  const weekDaysOptions = useMemo(() => weekDays.map(d => ({ id: d._id, name: d.day_of_week })), [weekDays]);
  const filteredAllDishesWeekly = useMemo(() => {
    let filtered = dishes;
    
    // Filter by meal_id: chỉ hiển thị dishes có category chứa meal_id hiện tại
    if (currentWeeklySlot?.meal_id) {
      filtered = filtered.filter((dish) => {
        const categories = dish.category || [];
        return categories.some((cat) => {
          const catId = cat?._id || cat;
          return String(catId) === String(currentWeeklySlot.meal_id);
        });
      });
    }
    
    // Filter by search term
    if (dishSearchWeekly.trim()) {
      const q = dishSearchWeekly.trim().toLowerCase();
      filtered = filtered.filter(d => (d.dish_name || "").toLowerCase().includes(q));
    }
    
    return filtered;
  }, [dishes, dishSearchWeekly, currentWeeklySlot]);

  const hasAnyDishThisWeek = useMemo(() => {
    if (!weeklyMealSelection || Object.keys(weeklyMealSelection).length === 0) return false;
    return Object.values(weeklyMealSelection).some(slot => (slot?.dishes || []).length > 0);
  }, [weeklyMealSelection]);

  useEffect(() => {
    async function loadInit() {
      try {
        setLoading(true);
        setError("");
        const [dishRes, caRes, mealRes, weekdayRes] = await Promise.all([
          nutritionService.getDishes(),
          nutritionService.getClassAges(),
          nutritionService.getMeals(),
          nutritionService.getWeekDays()
        ]);
        const dishesData = dishRes.dishes || dishRes.data || [];
        const classAgesData = caRes.classAges || caRes.data || [];
        const mealsData = mealRes.meals || mealRes.data || [];
        const weekDaysData = weekdayRes.weekDays || weekdayRes.data || [];
        setDishes(dishesData);
        setClassAges(classAgesData);
        setMeals(mealsData);
        setWeekDays(weekDaysData);
        if (!selectedClassAge && classAgesData.length > 0) {
          setSelectedClassAge(classAgesData[0]._id);
        }
      } catch (e) {
        setError(e.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    loadInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadWeeklyMealSelection() {
      if (!selectedClassAge || !weekStart || !weekDaysOptions.length || !meals.length) {
        setWeeklyMealSelection({});
        return;
      }
      setLoadingWeeklySelection(true);
      try {
        const schedule = {};
        for (const meal of meals) {
          for (let dayIndex = 0; dayIndex < weekDaysOptions.length; dayIndex++) {
            const weekday = weekDaysOptions[dayIndex];
            const dateStr = addDaysVietnam(weekStart, dayIndex);
            const dateStrISO = toVietnamISOString(dateStr);
            try {
              const assigned = await nutritionService.getAssignedDishes({
                class_age_id: selectedClassAge,
                meal_id: meal._id,
                weekday_id: weekday.id,
                date: dateStrISO
              });
              const key = `${meal._id}-${weekday.id}`;
              schedule[key] = {
                dishes: assigned.dishes || [],
                date: dateStrISO,
                meal_id: meal._id,
                weekday_id: weekday.id
              };
            } catch (e) {
              const key = `${meal._id}-${weekday.id}`;
              schedule[key] = {
                dishes: [],
                date: dateStrISO,
                meal_id: meal._id,
                weekday_id: weekday.id
              };
            }
          }
        }
        setWeeklyMealSelection(schedule);
      } catch (e) {
        setError(e.message || "Không thể tải lịch tuần");
      } finally {
        setLoadingWeeklySelection(false);
      }
    }
    loadWeeklyMealSelection();
  }, [selectedClassAge, weekStart, weekDaysOptions.length, meals.length]);

  const handleOpenWeeklyMealSlot = (mealId, weekdayId, date) => {
    const key = `${mealId}-${weekdayId}`;
    const slotData = weeklyMealSelection[key] || { dishes: [], date, meal_id: mealId, weekday_id: weekdayId };
    setCurrentWeeklySlot({ meal_id: mealId, weekday_id: weekdayId, date });
    setSelectedDishesForWeekly(new Set((slotData.dishes || []).map(d => d._id)));
    setDishSearchWeekly(""); // Reset search khi mở dialog mới
    setWeeklyMealDialogOpen(true);
  };

  const handleToggleDishForWeekly = (dishId) => {
    setSelectedDishesForWeekly(prev => {
      const next = new Set(prev);
      if (next.has(dishId)) next.delete(dishId); else next.add(dishId);
      return next;
    });
  };

  const handleSaveWeeklyMeal = async () => {
    if (!currentWeeklySlot || !selectedClassAge) return;
    setSavingWeeklyMeal(true);
    setError("");
    try {
      await nutritionService.assignDishes({
        class_age_id: selectedClassAge,
        meal_id: currentWeeklySlot.meal_id,
        weekday_id: currentWeeklySlot.weekday_id,
        date: currentWeeklySlot.date,
        dish_ids: Array.from(selectedDishesForWeekly)
      });
      const assigned = await nutritionService.getAssignedDishes({
        class_age_id: selectedClassAge,
        meal_id: currentWeeklySlot.meal_id,
        weekday_id: currentWeeklySlot.weekday_id,
        date: currentWeeklySlot.date
      });
      const key = `${currentWeeklySlot.meal_id}-${currentWeeklySlot.weekday_id}`;
      setWeeklyMealSelection(prev => ({
        ...prev,
        [key]: {
          dishes: assigned.dishes || [],
          date: currentWeeklySlot.date,
          meal_id: currentWeeklySlot.meal_id,
          weekday_id: currentWeeklySlot.weekday_id
        }
      }));
      setWeeklyMealDialogOpen(false);
    } catch (e) {
      setError(e.message || "Lưu thất bại");
    } finally {
      setSavingWeeklyMeal(false);
    }
  };

  const getDateForWeekdayTable = (dayIndex) => getDateForWeekdayVietnam(weekStart, dayIndex);

  const formatDateDisplay = (value) => {
    if (!value) return "—";
    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return "—";
    return dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const renderGender = (value) => {
    if (value === 0) return "Nam";
    if (value === 1) return "Nữ";
    return "—";
  };

  const loadLatestClassData = async (classAgeId) => {
    if (!classAgeId) {
      setLatestClassGroups([]);
      return;
    }
    try {
      setLoadingLatestClasses(true);
      const classesRes = await nutritionService.getClasses({ class_age_id: classAgeId });
      const classes = classesRes.classes || classesRes.data || [];
      if (!classes.length) {
        setLatestClassGroups([]);
        return;
      }
      const sorted = [...classes].sort((a, b) => (b.academic_year || "").localeCompare(a.academic_year || ""));
      const latestYear = sorted[0]?.academic_year || "";
      const latestClasses = sorted.filter((clazz) => (clazz.academic_year || "") === latestYear);

      const groups = [];
      for (const clazz of latestClasses) {
        try {
          const studentsRes = await nutritionService.getStudentsByClass(clazz._id);
          const students = studentsRes.students || [];
          const studentsWithAllergy = studentsRes.studentsWithAllergy !== undefined
            ? studentsRes.studentsWithAllergy
            : students.filter((s) => (s.allergy || "").trim()).length;
          const totalStudents = studentsRes.totalStudents !== undefined ? studentsRes.totalStudents : students.length;
          groups.push({
            classInfo: clazz,
            students,
            stats: { totalStudents, studentsWithAllergy }
          });
        } catch (innerErr) {
          groups.push({
            classInfo: clazz,
            students: [],
            stats: { totalStudents: 0, studentsWithAllergy: 0 },
            error: innerErr.message || "Không thể tải học sinh lớp này"
          });
        }
      }
      setLatestClassGroups(groups);
    } catch (e) {
      setError(e.message || "Không thể tải thông tin học sinh");
      setLatestClassGroups([]);
    } finally {
      setLoadingLatestClasses(false);
    }
  };

  useEffect(() => {
    if (selectedClassAge) {
      loadLatestClassData(selectedClassAge);
    } else {
      setLatestClassGroups([]);
    }
  }, [selectedClassAge]);

  return (
    <>
      <Card sx={{ maxWidth: 1400, mx: "auto", mb: 3, borderRadius: 4, boxShadow: 4 }}>
        <CardHeader
          title={<ArgonTypography variant="h5" fontWeight="bold" color="success.main">Chọn món ăn cho từng nhóm tuổi</ArgonTypography>}
        />
        <Divider />
        <CardContent>
          {loading && <ArgonBox display="flex" justifyContent="center" py={4}><CircularProgress /></ArgonBox>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {!loading && (
            <>
              <Card
                sx={{
                  mb: 3,
                  background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
                  border: "1px solid #e3f2fd",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <CardContent>
                  <ArgonBox
                    display="flex"
                    gap={2}
                    flexWrap="wrap"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <TextField
                      select
                      size="small"
                      value={selectedClassAge}
                      onChange={(e) => setSelectedClassAge(e.target.value)}
                      disabled={loading || classAges.length === 0}
                      sx={{
                        minWidth: 200,
                        maxWidth: 220,
                        width: 220,
                        flexShrink: 0,
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#fff",
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          pl: 1,
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#e0e0e0",
                          borderWidth: 1.5,
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#1976d2",
                          boxShadow: "0 2px 6px rgba(25, 118, 210, 0.15)",
                        },
                        "& .MuiOutlinedInput-root.Mui-focused": {
                          boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.1)",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#1976d2",
                            borderWidth: 2,
                          },
                        },
                        "& .MuiInputBase-input": {
                          fontWeight: selectedClassAge ? 600 : 400,
                        },
                        "&.Mui-disabled": {
                          bgcolor: "#f5f5f5",
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconButton
                              size="small"
                              edge="start"
                              sx={{ color: "#1976d2" }}
                              onMouseDown={(event) => event.preventDefault()}
                            >
                              <GroupIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (value) => {
                          if (!value) return "Chọn nhóm tuổi";
                          const selectedAge = classAges.find((ca) => ca._id === value);
                          return selectedAge ? selectedAge.age_name : value;
                        },
                      }}
                    >
                      {classAges.length === 0 ? (
                        <MenuItem disabled value="">
                          <em>Chưa có nhóm tuổi nào</em>
                        </MenuItem>
                      ) : (
                        classAges.map((ca) => (
                          <MenuItem key={ca._id} value={ca._id}>
                            {ca.age_name}
                          </MenuItem>
                        ))
                      )}
                    </TextField>
                    <ArgonBox
                      display="flex"
                      alignItems="center"
                      gap={2}
                      sx={{ flex: 1, justifyContent: "center", minWidth: 300 }}
                    >
                      <ArgonButton
                        variant="contained"
                        color="info"
                        size="medium"
                        onClick={() => setWeekStart(addDaysVietnam(weekStart, -7))}
                        startIcon={<ChevronLeftIcon />}
                        sx={{
                          minWidth: 140,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: '14px',
                          py: 1.2,
                          px: 2,
                          boxShadow: "0 2px 8px rgba(25, 118, 210, 0.2)",
                          "&:hover": {
                            backgroundColor: "#1565c0",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                          },
                          transition: "all 0.3s ease",
                        }}
                      >
                        Tuần trước
                      </ArgonButton>
                      <ArgonBox
                        sx={{
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          backgroundColor: "#fff",
                          border: "2px solid #1976d2",
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          minWidth: 280,
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(25, 118, 210, 0.15)",
                        }}
                      >
                        <CalendarTodayIcon sx={{ color: "#1976d2", fontSize: 24 }} />
                        <ArgonTypography variant="body1" fontWeight="bold" color="dark" sx={{ fontSize: '15px' }}>
                          Tuần ({getDateForWeekdayTable(0).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {getDateForWeekdayTable(6).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})
                        </ArgonTypography>
                      </ArgonBox>
                      <ArgonButton
                        variant="contained"
                        color="info"
                        size="medium"
                        onClick={() => setWeekStart(addDaysVietnam(weekStart, 7))}
                        endIcon={<ChevronRightIcon />}
                        sx={{
                          minWidth: 140,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: '14px',
                          py: 1.2,
                          px: 2,
                          boxShadow: "0 2px 8px rgba(25, 118, 210, 0.2)",
                          "&:hover": {
                            backgroundColor: "#1565c0",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                          },
                          transition: "all 0.3s ease",
                        }}
                      >
                        Tuần sau
                      </ArgonButton>
                    </ArgonBox>
                  </ArgonBox>
                </CardContent>
              </Card>
            </>
          )}

          {selectedClassAge && !loading && !loadingWeeklySelection && !hasAnyDishThisWeek && (
            <Alert severity="info" sx={{ mb: 2 }}>tuần này chưa có danh sách món ăn</Alert>
          )}

          {selectedClassAge && !loading && (
            <>
              {loadingWeeklySelection ? (
                <ArgonBox display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </ArgonBox>
              ) : (
                <TableContainer
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 3,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    background: "linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)",
                    overflow: 'hidden'
                  }}
                >
                  <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                      <TableRow
                        sx={{
                          backgroundColor: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          '& .MuiTableCell-root': {
                            borderBottom: 'none',
                          }
                        }}
                      >
                        {weekDaysOptions.map((wd, idx) => {
                          const date = getDateForWeekdayTable(idx);
                          const cellWidth = weekDaysOptions.length > 0 ? `${100 / weekDaysOptions.length}%` : 'auto';
                          return (
                            <TableCell
                              key={wd.id}
                              align="center"
                              sx={{
                                fontWeight: 700,
                                fontSize: '14px',
                                py: 2.5,
                                borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.3)' : 'none',
                                width: cellWidth,
                                maxWidth: cellWidth,
                                minWidth: cellWidth,
                                color: '#ffffff'
                              }}
                            >
                              <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                                {wd.name}
                              </ArgonTypography>
                              <ArgonTypography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', display: 'block', mt: 0.5 }}>
                                {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                              </ArgonTypography>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    <TableBody>
                      {meals.map((meal) => {
                        const mealColors = {
                          'Breakfast': '#1976d2',
                          'Lunch': '#43a047',
                          'Snack': '#ff9800'
                        };
                        const mealColor = mealColors[meal.meal] || '#666';

                        return (
                          <TableRow key={meal._id}>
                            {weekDaysOptions.map((wd, dayIndex) => {
                              const cellWidth = weekDaysOptions.length > 0 ? `${100 / weekDaysOptions.length}%` : 'auto';
                              const key = `${meal._id}-${wd.id}`;
                              const slotData = weeklyMealSelection[key] || { dishes: [] };

                              return (
                                <TableCell
                                  key={wd.id}
                                  sx={{
                                    py: 1.5,
                                    px: 1.5,
                                    borderLeft: dayIndex > 0 ? '1px solid #e0e0e0' : 'none',
                                    verticalAlign: 'top',
                                    width: cellWidth,
                                    maxWidth: cellWidth,
                                    minWidth: cellWidth,
                                    overflow: 'hidden',
                                    wordWrap: 'break-word',
                                    height: '100%'
                                  }}
                                >
                                  <ArgonBox
                                    sx={{
                                      border: `2px solid ${mealColor}`,
                                      borderRadius: 2,
                                      p: 1.5,
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease',
                                      backgroundColor: '#fff',
                                      width: '100%',
                                      height: '100%',
                                      minHeight: '100px',
                                      boxSizing: 'border-box',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                      '&:hover': {
                                        backgroundColor: '#f9f9f9',
                                        boxShadow: `0 4px 12px ${mealColor}40`,
                                        transform: 'translateY(-2px)',
                                        borderColor: mealColor,
                                        borderWidth: 2.5
                                      }
                                    }}
                                    onClick={() => {
                                      const dateStr = addDaysVietnam(weekStart, dayIndex);
                                      const dateStrISO = toVietnamISOString(dateStr);
                                      handleOpenWeeklyMealSlot(meal._id, wd.id, dateStrISO);
                                    }}
                                  >
                                    <ArgonBox display="flex" alignItems="center" gap={0.5} mb={1} flexShrink={0}>
                                      <ArgonBox
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: '50%',
                                          backgroundColor: mealColor,
                                          flexShrink: 0
                                        }}
                                      />
                                      <ArgonTypography
                                        variant="body2"
                                        fontWeight="bold"
                                        sx={{ color: mealColor, fontSize: '13px' }}
                                      >
                                        {meal.meal}
                                      </ArgonTypography>
                                    </ArgonBox>
                                    {slotData.dishes.length === 0 ? (
                                      <ArgonTypography
                                        variant="caption"
                                        sx={{
                                          fontSize: '11px',
                                          color: 'text.secondary',
                                          fontStyle: 'italic',
                                          flex: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          textAlign: 'center',
                                          py: 1
                                        }}
                                      >
                                        Click để chọn món
                                      </ArgonTypography>
                                    ) : (
                                      <ArgonBox
                                        sx={{
                                          width: '100%',
                                          wordWrap: 'break-word',
                                          overflowWrap: 'break-word',
                                          flex: 1,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 0.6
                                        }}
                                      >
                                        {slotData.dishes.map((dish, idx) => {
                                          const dishName = dish.dish_name || dish.name || '';
                                          return (
                                            <Chip
                                              key={dish._id || idx}
                                              label={dishName}
                                              size="small"
                                              sx={{
                                                height: 'auto',
                                                minHeight: '24px',
                                                fontSize: '11px',
                                                fontWeight: 500,
                                                backgroundColor: '#f5f5f5',
                                                border: '1px solid #e0e0e0',
                                                maxWidth: '100%',
                                                cursor: 'pointer',
                                                '& .MuiChip-label': {
                                                  px: 1,
                                                  py: 0.5,
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  whiteSpace: 'nowrap',
                                                  display: 'block'
                                                },
                                                '&:hover': {
                                                  backgroundColor: '#e3f2fd',
                                                  borderColor: mealColor
                                                }
                                              }}
                                            />
                                          );
                                        })}
                                      </ArgonBox>
                                    )}
                                  </ArgonBox>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {!selectedClassAge && !loading && (
            <ArgonBox textAlign="center" py={4}>
              <ArgonTypography variant="body1" color="text.secondary">
                Vui lòng chọn nhóm tuổi để xem và chọn món ăn
              </ArgonTypography>
            </ArgonBox>
          )}
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: 1400, mx: "auto", mb: 3, borderRadius: 4, boxShadow: 4 }}>
        <CardHeader
          title={<ArgonTypography variant="h5" fontWeight="bold" color="success.main">Danh sách học sinh (các lớp năm học mới nhất)</ArgonTypography>}
          subheader="Các lớp thuộc nhóm tuổi này có năm học mới nhất sẽ được hiển thị cùng thông tin dị ứng"
        />
        <Divider />
        <CardContent>
          {loadingLatestClasses ? (
            <ArgonBox display="flex" justifyContent="center" py={3}>
              <CircularProgress size={32} />
            </ArgonBox>
          ) : latestClassGroups.length === 0 ? (
            <ArgonBox textAlign="center" py={3}>
              <ArgonTypography variant="body2" color="text.secondary">
                Nhóm tuổi này chưa có lớp nào trong năm học hiện tại.
              </ArgonTypography>
            </ArgonBox>
          ) : (
            latestClassGroups.map(({ classInfo, students, stats, error }) => (
              <ArgonBox key={classInfo._id} mb={4}>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" mb={2}>
                  <Chip
                    icon={<ChildCareIcon sx={{ fontSize: 18 }} />}
                    label={`Lớp: ${classInfo.class_name}`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
                    label={`Năm học: ${classInfo.academic_year || "—"}`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<GroupIcon sx={{ fontSize: 18 }} />}
                    label={`Tổng học sinh: ${stats.totalStudents}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<WarningAmberIcon sx={{ fontSize: 18 }} />}
                    label={`Có dị ứng: ${stats.studentsWithAllergy}`}
                    color={stats.studentsWithAllergy ? "warning" : "default"}
                    variant="outlined"
                  />
                </Stack>

                {error ? (
                  <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                ) : (
                  <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Họ tên</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Ngày sinh</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Giới tính</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Dị ứng</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                              <ArgonTypography variant="body2" color="text.secondary">
                                Chưa có học sinh trong lớp này.
                              </ArgonTypography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          students.map((student) => {
                            const hasAllergy = Boolean(student.allergy && student.allergy.trim());
                            return (
                              <TableRow
                                key={student._id}
                                sx={{
                                  backgroundColor: hasAllergy ? 'rgba(255, 193, 7, 0.15)' : 'inherit'
                                }}
                              >
                                <TableCell sx={{ fontWeight: hasAllergy ? 600 : 400 }}>
                                  {student.full_name}
                                </TableCell>
                                <TableCell>{formatDateDisplay(student.dob)}</TableCell>
                                <TableCell>{renderGender(student.gender)}</TableCell>
                                <TableCell>
                                  {hasAllergy ? (
                                    <Chip
                                      label={student.allergy}
                                      color="warning"
                                      size="small"
                                      icon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
                                    />
                                  ) : (
                                    <ArgonTypography variant="body2" color="text.secondary">
                                      Không
                                    </ArgonTypography>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </ArgonBox>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={weeklyMealDialogOpen}
        onClose={() => {
          setWeeklyMealDialogOpen(false);
          setDishSearchWeekly(""); // Reset search khi đóng dialog
        }}
        fullWidth
        maxWidth="md"
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
            <RestaurantIcon sx={{ fontSize: 28 }} />
            <ArgonBox>
              <ArgonTypography variant="h5" fontWeight="bold" color="#ffffff">
                Chọn món ăn
              </ArgonTypography>
              {currentWeeklySlot && meals.find(m => m._id === currentWeeklySlot.meal_id) && weekDaysOptions.find(w => w.id === currentWeeklySlot.weekday_id) && (
                <ArgonTypography variant="body2" color="white" sx={{ mt: 0.5, opacity: 0.9 }}>
                  {meals.find(m => m._id === currentWeeklySlot.meal_id)?.meal} - {weekDaysOptions.find(w => w.id === currentWeeklySlot.weekday_id)?.name}
                  {currentWeeklySlot?.date && (
                    <>
                      {" "}- {new Date(currentWeeklySlot.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </>
                  )}
                </ArgonTypography>
              )}
            </ArgonBox>
          </Stack>
          <ArgonButton
            onClick={() => setWeeklyMealDialogOpen(false)}
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
          <Stack spacing={3}>
            <SectionCard
              icon={<RestaurantIcon />}
              title="Danh sách món ăn"
              subtitle="Chọn các món ăn cho slot này"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm món ăn..."
                    value={dishSearchWeekly}
                    onChange={(e) => setDishSearchWeekly(e.target.value)}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "#1976d2" }} />
                        </InputAdornment>
                      ),
                      endAdornment: dishSearchWeekly && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setDishSearchWeekly("")}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'info.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'info.main',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  {currentWeeklySlot?.meal_id && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Chỉ hiển thị các món ăn thuộc loại bữa: <strong>{meals.find(m => m._id === currentWeeklySlot.meal_id)?.meal || "—"}</strong>
                    </Alert>
                  )}
                  <ArgonBox sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <ArgonButton
                      size="small"
                      variant="contained"
                      color="info"
                      onClick={() => setSelectedDishesForWeekly(new Set(filteredAllDishesWeekly.map(d => d._id)))}
                      disabled={filteredAllDishesWeekly.length === 0}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Chọn tất cả
                    </ArgonButton>
                    <ArgonButton
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => setSelectedDishesForWeekly(new Set())}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Bỏ chọn hết
                    </ArgonButton>
                  </ArgonBox>
                </Grid>

                <Grid item xs={12}>
                  {selectedDishesForWeekly.size > 0 && (
                    <ArgonBox sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {Array.from(selectedDishesForWeekly).map(id => {
                        const dish = dishes.find(x => x._id === id);
                        if (!dish) return null;
                        return (
                          <Chip
                            key={id}
                            label={dish.dish_name}
                            color="primary"
                            variant="outlined"
                            onDelete={() => handleToggleDishForWeekly(id)}
                            size="small"
                            sx={{
                              fontWeight: 500,
                              borderWidth: 1.5,
                            }}
                          />
                        );
                      })}
                    </ArgonBox>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 2,
                      maxHeight: 400,
                      overflowY: "auto",
                      borderRadius: 2,
                      bgcolor: "#fff",
                      border: "1px solid #e0e0e0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <FormGroup>
                      {filteredAllDishesWeekly.length === 0 ? (
                        <ArgonBox sx={{ p: 3, textAlign: "center" }}>
                          <ArgonTypography variant="body2" color="text.secondary">
                            {dishSearchWeekly
                              ? `Không tìm thấy món phù hợp với "${dishSearchWeekly}"`
                              : currentWeeklySlot?.meal_id
                              ? `Chưa có món ăn nào thuộc loại bữa "${meals.find(m => m._id === currentWeeklySlot.meal_id)?.meal || "—"}". Vui lòng thêm món ăn ở phần Quản lý món và chọn loại bữa phù hợp.`
                              : "Chưa có món ăn nào. Vui lòng thêm món ăn ở phần Quản lý món."}
                          </ArgonTypography>
                        </ArgonBox>
                      ) : (
                        filteredAllDishesWeekly.map(d => {
                          const isChecked = selectedDishesForWeekly.has(d._id);
                          return (
                            <ArgonBox
                              key={d._id}
                              sx={{
                                mb: 1,
                                p: 1.5,
                                borderRadius: 1.5,
                                border: isChecked ? "1px solid #1976d2" : "1px solid #e0e0e0",
                                bgcolor: isChecked ? "#e3f2fd" : "#fff",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={isChecked}
                                    onChange={() => handleToggleDishForWeekly(d._id)}
                                    sx={{
                                      color: "#1976d2",
                                      "&.Mui-checked": {
                                        color: "#1976d2",
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <ArgonBox>
                                    <ArgonTypography
                                      variant="body2"
                                      fontWeight={isChecked ? 600 : 400}
                                      color={isChecked ? "#1976d2" : "#424242"}
                                    >
                                      {d.dish_name}
                                    </ArgonTypography>
                                    {d.description && (
                                      <ArgonTypography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: "block", mt: 0.5 }}
                                      >
                                        {d.description}
                                      </ArgonTypography>
                                    )}
                                  </ArgonBox>
                                }
                                sx={{ m: 0 }}
                              />
                            </ArgonBox>
                          );
                        })
                      )}
                    </FormGroup>
                  </Paper>
                </Grid>

                {selectedDishesForWeekly.size > 0 && (
                  <Grid item xs={12}>
                    <ArgonTypography
                      variant="caption"
                      color="info"
                      sx={{ display: "block", fontWeight: 500 }}
                    >
                      Đã chọn {selectedDishesForWeekly.size} món ăn
                    </ArgonTypography>
                  </Grid>
                )}
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
            onClick={() => setWeeklyMealDialogOpen(false)}
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
            disabled={savingWeeklyMeal}
          >
            Hủy
          </ArgonButton>
          <ArgonButton
            variant="contained"
            color="info"
            onClick={handleSaveWeeklyMeal}
            disabled={savingWeeklyMeal}
            sx={{
              minWidth: 140,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
              },
            }}
            startIcon={
              savingWeeklyMeal ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RestaurantIcon />
              )
            }
          >
            {savingWeeklyMeal ? "Đang lưu..." : "Lưu"}
          </ArgonButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

