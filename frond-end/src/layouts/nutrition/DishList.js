import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GroupIcon from "@mui/icons-material/Group";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import nutritionService from "services/nutritionService";

// Helper functions for Vietnam timezone (UTC+7)
const getVietnamDate = () => {
  const now = new Date();
  // Convert to Vietnam time (UTC+7)
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  return vietnamTime;
};

const getVietnamDateString = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  // Convert to Vietnam timezone
  const vietnamTime = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfWeekVietnam = () => {
  const now = getVietnamDate();
  const day = now.getDay(); // 0-6 (Sun-Sat)
  const diffToMon = ((day + 6) % 7); // days since Monday
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMon);
  return getVietnamDateString(monday);
};

const addDaysVietnam = (dateString, days) => {
  const date = new Date(dateString + 'T00:00:00+07:00'); // Vietnam timezone
  date.setDate(date.getDate() + days);
  return getVietnamDateString(date);
};

const getDateForWeekdayVietnam = (weekStartString, dayIndex) => {
  const date = new Date(weekStartString + 'T00:00:00+07:00'); // Vietnam timezone
  date.setDate(date.getDate() + dayIndex);
  return date;
};

const toVietnamISOString = (dateString) => {
  if (!dateString) return null;
  // Parse as Vietnam date and convert to ISO string
  const date = new Date(dateString + 'T00:00:00+07:00');
  // Return as ISO string but ensure it's at midnight Vietnam time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
};

// SectionCard component for better UI organization
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

export default function NutritionDishList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dishes, setDishes] = useState([]);
  const [classAges, setClassAges] = useState([]);
  const [meals, setMeals] = useState([]);
  const [weekDays, setWeekDays] = useState([]);

  const [selectedClassAge, setSelectedClassAge] = useState("");
  const [weekStart, setWeekStart] = useState(() => getStartOfWeekVietnam());
  const [weekSchedule, setWeekSchedule] = useState({}); // { 'meal_id-weekday_id': { dishes: [], date: string } }
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [search, setSearch] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState("");

  // Dialog state for add/edit dish
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dishForm, setDishForm] = useState({ dish_name: "", description: "", meal_type: "" });
  const [dishSubmitting, setDishSubmitting] = useState(false);

  // Dialog state for selecting dishes for a meal slot
  const [mealSlotDialogOpen, setMealSlotDialogOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null); // { meal_id, weekday_id, date }
  const [selectedDishIds, setSelectedDishIds] = useState(new Set());
  const [savingSlot, setSavingSlot] = useState(false);
  const [dishSearch, setDishSearch] = useState("");

  // State for class age meal selection table (weekly view)
  const [selectedClassAgeForTable, setSelectedClassAgeForTable] = useState("");
  const [weekStartForTable, setWeekStartForTable] = useState(() => getStartOfWeekVietnam());
  const [weeklyMealSelection, setWeeklyMealSelection] = useState({}); // { 'meal_id-weekday_id': { dishes: [] } }
  const [loadingWeeklySelection, setLoadingWeeklySelection] = useState(false);
  const [weeklyMealDialogOpen, setWeeklyMealDialogOpen] = useState(false);
  const [currentWeeklySlot, setCurrentWeeklySlot] = useState(null); // { meal_id, weekday_id, date }
  const [selectedDishesForWeekly, setSelectedDishesForWeekly] = useState(new Set());
  const [savingWeeklyMeal, setSavingWeeklyMeal] = useState(false);
  const [dishSearchWeekly, setDishSearchWeekly] = useState("");

  const weekDaysOptions = useMemo(() => weekDays.map(d => ({ id: d._id, name: d.day_of_week })), [weekDays]);

  // Check if there is any dish assigned in the selected week (for the table view)
  const hasAnyDishThisWeek = useMemo(() => {
    if (!weeklyMealSelection || Object.keys(weeklyMealSelection).length === 0) return false;
    return Object.values(weeklyMealSelection).some(slot => (slot?.dishes || []).length > 0);
  }, [weeklyMealSelection]);

  // Filtered lists for dialogs - only filter by search term, not by meal_type
  const filteredAllDishes = useMemo(() => {
    let filtered = dishes;
    
    // Filter by search term only
    if (dishSearch.trim()) {
      const q = dishSearch.trim().toLowerCase();
      filtered = filtered.filter(d => (d.dish_name || "").toLowerCase().includes(q));
    }
    
    return filtered;
  }, [dishes, dishSearch]);

  const filteredAllDishesWeekly = useMemo(() => {
    let filtered = dishes;
    
    // Filter by search term only
    if (dishSearchWeekly.trim()) {
      const q = dishSearchWeekly.trim().toLowerCase();
      filtered = filtered.filter(d => (d.dish_name || "").toLowerCase().includes(q));
    }
    
    return filtered;
  }, [dishes, dishSearchWeekly]);

  useEffect(() => {
    async function loadInit() {
      try {
        setLoading(true);
        setError("");
        const [d, ca, m, wd] = await Promise.all([
          nutritionService.getDishes(),
          nutritionService.getClassAges(), // GET /nutrition/class-ages
          nutritionService.getMeals(),
          nutritionService.getWeekDays()
        ]);
        // Handle response format: { count: N, classAges: [...] }
        const dishesData = d.dishes || d.data || [];
        const classAgesData = ca.classAges || ca.data || [];
        const mealsData = m.meals || m.data || [];
        const weekDaysData = wd.weekDays || wd.data || [];
        
        console.log('Loaded data:', { 
          dishes: dishesData.length, 
          classAges: classAgesData.length, 
          meals: mealsData.length, 
          weekDays: weekDaysData.length,
          classAgesData
        });
        
        setDishes(dishesData);
        setClassAges(classAgesData);
        setMeals(mealsData);
        setWeekDays(weekDaysData);
      } catch (e) {
        console.error('Error loading nutrition data:', e);
        setError(e.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }
    loadInit();
  }, []);

  const filteredDishes = useMemo(() => {
    let filtered = dishes;
    
    // Filter by meal_type
    if (mealTypeFilter) {
      filtered = filtered.filter(d => {
        const dishMealTypeId = d.meal_type?._id || d.meal_type;
        return String(dishMealTypeId) === String(mealTypeFilter);
      });
    }
    
    // Filter by search term
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(d =>
        (d.dish_name || "").toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [dishes, search, mealTypeFilter]);

  // Load week schedule when class age or week changes
  useEffect(() => {
    async function loadWeekSchedule() {
      if (!selectedClassAge || !weekStart || !weekDaysOptions.length || !meals.length) {
        setWeekSchedule({});
        return;
      }
      setLoadingSchedule(true);
      try {
        const schedule = {};
        
        // Load dishes for each meal and each day of the week
        for (const meal of meals) {
          for (let dayIndex = 0; dayIndex < weekDaysOptions.length; dayIndex++) {
            const weekday = weekDaysOptions[dayIndex];
            const date = getDateForWeekdayVietnam(weekStart, dayIndex);
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
        setWeekSchedule(schedule);
      } catch (e) {
        setError(e.message || 'Không thể tải lịch tuần');
      } finally {
        setLoadingSchedule(false);
      }
    }
    loadWeekSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassAge, weekStart, weekDaysOptions.length, meals.length]);

  const handleOpenMealSlot = (mealId, weekdayId, date) => {
    const key = `${mealId}-${weekdayId}`;
    const slotData = weekSchedule[key] || { dishes: [], date, meal_id: mealId, weekday_id: weekdayId };
    setCurrentSlot({ meal_id: mealId, weekday_id: weekdayId, date });
    setSelectedDishIds(new Set(slotData.dishes.map(d => d._id)));
    setMealSlotDialogOpen(true);
  };

  const handleToggleDish = (id) => {
    setSelectedDishIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSaveSlot = async () => {
    if (!currentSlot || !selectedClassAge) return;
    setSavingSlot(true);
    setError("");
    try {
      await nutritionService.assignDishes({
        class_age_id: selectedClassAge,
        meal_id: currentSlot.meal_id,
        weekday_id: currentSlot.weekday_id,
        date: currentSlot.date,
        dish_ids: Array.from(selectedDishIds)
      });
      // Reload schedule
      const dayIndex = weekDaysOptions.findIndex(d => d.id === currentSlot.weekday_id);
      const dateStr = dayIndex >= 0 ? addDaysVietnam(weekStart, dayIndex) : weekStart;
      const dateStrISO = toVietnamISOString(dateStr);
      const assigned = await nutritionService.getAssignedDishes({
        class_age_id: selectedClassAge,
        meal_id: currentSlot.meal_id,
        weekday_id: currentSlot.weekday_id,
        date: dateStrISO
      });
      const key = `${currentSlot.meal_id}-${currentSlot.weekday_id}`;
      setWeekSchedule(prev => ({
        ...prev,
        [key]: {
          dishes: assigned.dishes || [],
          date: dateStrISO,
          meal_id: currentSlot.meal_id,
          weekday_id: currentSlot.weekday_id
        }
      }));
      setMealSlotDialogOpen(false);
    } catch (e) {
      setError(e.message || 'Lưu thất bại');
    } finally {
      setSavingSlot(false);
    }
  };

  // Helper to get date for a weekday (Vietnam timezone)
  const getDateForWeekday = (dayIndex) => {
    return getDateForWeekdayVietnam(weekStart, dayIndex);
  };

  const openAddDish = () => {
    setEditingDish(null);
    setDishForm({ dish_name: "", description: "", meal_type: "" });
    setDishDialogOpen(true);
  };

  const openEditDish = (dish) => {
    setEditingDish(dish);
    // meal_type có thể là object (populated) hoặc string (ObjectId)
    const mealTypeId = dish.meal_type?._id || dish.meal_type || "";
    setDishForm({ 
      dish_name: dish.dish_name || "", 
      description: dish.description || "",
      meal_type: mealTypeId
    });
    setDishDialogOpen(true);
  };

  const submitDish = async () => {
    if (!dishForm.dish_name?.trim() || !dishForm.description?.trim() || !dishForm.meal_type) return;
    setDishSubmitting(true);
    try {
      if (editingDish) {
        const updated = await nutritionService.updateDish(editingDish._id, dishForm);
        setDishes(prev => prev.map(d => (d._id === updated._id ? updated : d)));
      } else {
        const created = await nutritionService.createDish(dishForm);
        setDishes(prev => [...prev, created].sort((a,b)=>a.dish_name.localeCompare(b.dish_name)));
      }
      setDishDialogOpen(false);
    } catch (e) {
      setError(e.message || 'Không thể lưu món');
    } finally {
      setDishSubmitting(false);
    }
  };

  const deleteDish = async (id) => {
    if (!window.confirm('Xoá món ăn này?')) return;
    try {
      await nutritionService.deleteDish(id);
      setDishes(prev => prev.filter(d => d._id !== id));
      // Also unselect if was selected
      setSelectedDishIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e) {
      setError(e.message || 'Xoá thất bại');
    }
  };

  // Load weekly meal selection when class age or week changes
  useEffect(() => {
    async function loadWeeklyMealSelection() {
      if (!selectedClassAgeForTable || !weekStartForTable || !weekDaysOptions.length || !meals.length) {
        setWeeklyMealSelection({});
        return;
      }
      
      setLoadingWeeklySelection(true);
      try {
        const schedule = {};
        
        for (const meal of meals) {
          for (let dayIndex = 0; dayIndex < weekDaysOptions.length; dayIndex++) {
            const weekday = weekDaysOptions[dayIndex];
            const date = getDateForWeekdayVietnam(weekStartForTable, dayIndex);
            const dateStr = addDaysVietnam(weekStartForTable, dayIndex);
            const dateStrISO = toVietnamISOString(dateStr);
            
            try {
              const assigned = await nutritionService.getAssignedDishes({
                class_age_id: selectedClassAgeForTable,
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
        setError(e.message || 'Không thể tải lịch tuần');
      } finally {
        setLoadingWeeklySelection(false);
      }
    }
    loadWeeklyMealSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassAgeForTable, weekStartForTable, weekDaysOptions.length, meals.length]);

  // Handle open weekly meal slot dialog
  const handleOpenWeeklyMealSlot = (mealId, weekdayId, date) => {
    const key = `${mealId}-${weekdayId}`;
    const slotData = weeklyMealSelection[key] || { dishes: [], date, meal_id: mealId, weekday_id: weekdayId };
    setCurrentWeeklySlot({ meal_id: mealId, weekday_id: weekdayId, date });
    setSelectedDishesForWeekly(new Set(slotData.dishes.map(d => d._id)));
    setWeeklyMealDialogOpen(true);
  };

  // Handle toggle dish for weekly meal
  const handleToggleDishForWeekly = (dishId) => {
    setSelectedDishesForWeekly(prev => {
      const next = new Set(prev);
      if (next.has(dishId)) next.delete(dishId); else next.add(dishId);
      return next;
    });
  };

  // Handle save weekly meal selection
  const handleSaveWeeklyMeal = async () => {
    if (!currentWeeklySlot || !selectedClassAgeForTable) return;
    
    setSavingWeeklyMeal(true);
    setError("");
    try {
      await nutritionService.assignDishes({
        class_age_id: selectedClassAgeForTable,
        meal_id: currentWeeklySlot.meal_id,
        weekday_id: currentWeeklySlot.weekday_id,
        date: currentWeeklySlot.date,
        dish_ids: Array.from(selectedDishesForWeekly)
      });

      // Reload schedule
      const dayIndex = weekDaysOptions.findIndex(d => d.id === currentWeeklySlot.weekday_id);
      const dateStr = dayIndex >= 0 ? addDaysVietnam(weekStartForTable, dayIndex) : weekStartForTable;
      const dateStrISO = toVietnamISOString(dateStr);
      const assigned = await nutritionService.getAssignedDishes({
        class_age_id: selectedClassAgeForTable,
        meal_id: currentWeeklySlot.meal_id,
        weekday_id: currentWeeklySlot.weekday_id,
        date: dateStrISO
      });
      const key = `${currentWeeklySlot.meal_id}-${currentWeeklySlot.weekday_id}`;
      setWeeklyMealSelection(prev => ({
        ...prev,
        [key]: {
          dishes: assigned.dishes || [],
          date: dateStrISO,
          meal_id: currentWeeklySlot.meal_id,
          weekday_id: currentWeeklySlot.weekday_id
        }
      }));
      
      setWeeklyMealDialogOpen(false);
    } catch (e) {
      setError(e.message || 'Lưu thất bại');
    } finally {
      setSavingWeeklyMeal(false);
    }
  };

  // Helper to get date for weekday in weekly table (Vietnam timezone)
  const getDateForWeekdayTable = (dayIndex) => {
    return getDateForWeekdayVietnam(weekStartForTable, dayIndex);
  };

  return (
    <>
      {/* Card 1: Danh sách món ăn */}
      <Card sx={{ maxWidth: 1200, mx: "auto", mb: 3, borderRadius: 4, boxShadow: 4 }}>
        <CardHeader 
          title={<ArgonTypography variant="h5" fontWeight="bold" color="success.main">Danh sách các món ăn</ArgonTypography>} 
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
                  >
                    <TextField
                      size="small"
                      placeholder="Tìm kiếm theo tên món ăn hoặc mô tả..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      sx={{ 
                        flex: 1, 
                        minWidth: 200, 
                        maxWidth: 400,  
                        width: '100%',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          width: '100%',
                          bgcolor: "#fff",
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                            boxShadow: "0 2px 6px rgba(25, 118, 210, 0.15)",
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                            boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.1)",
                          },
                        },
                        '& .MuiInputBase-input': {
                          width: '100% !important',
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: "#1976d2" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      select
                      size="small"
                      value={mealTypeFilter}
                      onChange={(e) => setMealTypeFilter(e.target.value)}
                      sx={{
                        minWidth: 280,
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
                          fontWeight: mealTypeFilter ? 600 : 400,
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
                              <FilterListIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (value) => {
                          if (!value) return "Tất cả loại bữa ăn";
                          const selectedMeal = meals.find((m) => m._id === value);
                          return selectedMeal ? selectedMeal.meal : value;
                        },
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              borderRadius: 2,
                              mt: 1,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              "& .MuiMenuItem-root": {
                                borderRadius: 1,
                                mx: 0.5,
                                my: 0.25,
                                "&:hover": {
                                  backgroundColor: "#e3f2fd",
                                },
                                "&.Mui-selected": {
                                  backgroundColor: "#1976d2",
                                  color: "#fff",
                                  "&:hover": {
                                    backgroundColor: "#1565c0",
                                  },
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>Tất cả loại bữa ăn</em>
                      </MenuItem>
                      {meals.map((meal) => (
                        <MenuItem key={meal._id} value={meal._id}>
                          {meal.meal}
                        </MenuItem>
                      ))}
                    </TextField>
                    <ArgonButton
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={openAddDish}
                      startIcon={<AddIcon />}
                      sx={{
                        minWidth: 140,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow: "0 4px 12px rgba(67, 160, 71, 0.3)",
                        },
                      }}
                    >
                      Thêm món
                    </ArgonButton>
                    {(search || mealTypeFilter) && (
                      <ArgonButton
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          setSearch("");
                          setMealTypeFilter("");
                        }}
                        startIcon={<ClearIcon />}
                        sx={{
                          minWidth: 120,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 500,
                          borderWidth: 1.5,
                          "&:hover": {
                            borderWidth: 1.5,
                            backgroundColor: "#ffebee",
                            transform: "translateY(-1px)",
                            boxShadow: "0 2px 6px rgba(211, 47, 47, 0.2)",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        Xóa bộ lọc
                      </ArgonButton>
                    )}
                  </ArgonBox>
                </CardContent>
              </Card>

              <Grid container spacing={2}>

              <Grid item xs={12}>
                <TableContainer 
                  sx={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 2,
                    maxHeight: 500,
                    overflow: 'auto'
                  }}
                >
                
                  <Table size="medium" sx={{ tableLayout: 'fixed' }}>
                  
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '15px', width: '25%', py: 2, position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>Tên món</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '15px', width: '40%', py: 2, position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>Mô tả</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '15px', width: '20%', py: 2, position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>Loại bữa ăn</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '15px', width: '15%', py: 2, position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>Cập nhật</TableCell>
                      </TableRow>
                    
                    <TableBody>
                      {filteredDishes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                            <ArgonTypography color="text">Không có món ăn nào</ArgonTypography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDishes.map(d => {
                          // meal_type có thể là object (populated) hoặc string (ObjectId)
                          const mealTypeName = d.meal_type?.meal || d.meal_type || "N/A";
                          return (
                            <TableRow key={d._id} hover sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                              <TableCell sx={{ fontSize: '14px', width: '25%', py: 2 }}>{d.dish_name}</TableCell>
                              <TableCell sx={{ fontSize: '14px', width: '40%', py: 2 }}>{d.description}</TableCell>
                              <TableCell sx={{ fontSize: '14px', width: '20%', py: 2 }}>
                                <Chip 
                                  label={mealTypeName} 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ width: '15%', py: 2 }}>
                                <IconButton 
                                  size="small" 
                                  color="primary" 
                                  onClick={() => openEditDish(d)}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => deleteDish(d._id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Bảng chọn món cho từng nhóm tuổi theo tuần */}
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
                      value={selectedClassAgeForTable}
                      onChange={(e) => {
                        console.log('Selected class age:', e.target.value);
                        setSelectedClassAgeForTable(e.target.value);
                      }}
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
                          fontWeight: selectedClassAgeForTable ? 600 : 400,
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
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              borderRadius: 2,
                              mt: 1,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              "& .MuiMenuItem-root": {
                                borderRadius: 1,
                                mx: 0.5,
                                my: 0.25,
                                "&:hover": {
                                  backgroundColor: "#e3f2fd",
                                },
                                "&.Mui-selected": {
                                  backgroundColor: "#1976d2",
                                  color: "#fff",
                                  "&:hover": {
                                    backgroundColor: "#1565c0",
                                  },
                                },
                              },
                            },
                          },
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
                        onClick={() => {
                          setWeekStartForTable(addDaysVietnam(weekStartForTable, -7));
                        }}
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
                        onClick={() => {
                          setWeekStartForTable(addDaysVietnam(weekStartForTable, 7));
                        }}
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

          {selectedClassAgeForTable && !loading && !loadingWeeklySelection && !hasAnyDishThisWeek && (
            <Alert severity="info" sx={{ mb: 2 }}>tuần này chưa có danh sách món ăn</Alert>
          )}

          {selectedClassAgeForTable && !loading && (
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
                              const date = getDateForWeekdayTable(dayIndex);
                              const isWeekend = dayIndex >= 5; // T7 (index 5) and CN (index 6)
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
                                  {isWeekend ? (
                                    <ArgonBox textAlign="center" py={4}>
                                      <ArgonTypography variant="body2" color="text.secondary">
                                        Không có thực đơn
                                      </ArgonTypography>
                                    </ArgonBox>
                                  ) : (
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
                                        const dateStr = addDaysVietnam(weekStartForTable, dayIndex);
                                        const dateStrISO = toVietnamISOString(dateStr);
                                        handleOpenWeeklyMealSlot(meal._id, wd.id, dateStrISO);
                                      }}
                                    >
                                      <ArgonBox display="flex" alignItems="center" gap={0.5} mb={1} flexShrink={0}>
                                        <Box
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
                                  )}
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

          {!selectedClassAgeForTable && !loading && (
            <ArgonBox textAlign="center" py={4}>
              <ArgonTypography variant="body1" color="text.secondary">
                Vui lòng chọn nhóm tuổi để xem và chọn món ăn
              </ArgonTypography>
            </ArgonBox>
          )}
        </CardContent>
      </Card>

      {/* Dialog chọn món cho một slot */}
      <Dialog 
        open={mealSlotDialogOpen} 
        onClose={() => setMealSlotDialogOpen(false)} 
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
            <Box>
              <ArgonTypography variant="h5" fontWeight="bold" color="#ffffff">
                Chọn món ăn
              </ArgonTypography>
              {currentSlot && meals.find(m => m._id === currentSlot.meal_id) && weekDaysOptions.find(w => w.id === currentSlot.weekday_id) && (
                <ArgonTypography variant="body2" color="white" sx={{ mt: 0.5, opacity: 0.9 }}>
                  {meals.find(m => m._id === currentSlot.meal_id)?.meal} - {weekDaysOptions.find(w => w.id === currentSlot.weekday_id)?.name}
                  {currentSlot?.date && (
                    <>
                      {" "}- {new Date(currentSlot.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </>
                  )}
                </ArgonTypography>
              )}
            </Box>
          </Stack>
          <ArgonButton
            onClick={() => setMealSlotDialogOpen(false)}
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
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "#43a047" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'success.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'success.main',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <ArgonButton
                      size="small"
                      variant="contained"
                      color="info"
                      onClick={() => {
                        const allIds = new Set(filteredAllDishes.map(d => d._id));
                        setSelectedDishIds(allIds);
                      }}
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
                      onClick={() => setSelectedDishIds(new Set())}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Bỏ chọn hết
                    </ArgonButton>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  {selectedDishIds.size > 0 && (
                    <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {Array.from(selectedDishIds).map(id => {
                        const dish = dishes.find(x => x._id === id);
                        if (!dish) return null;
                        return (
                          <Chip
                            key={id}
                            label={dish.dish_name}
                            color="primary"
                            variant="outlined"
                            onDelete={() => handleToggleDish(id)}
                            size="small"
                            sx={{
                              fontWeight: 500,
                              borderWidth: 1.5,
                            }}
                          />
                        );
                      })}
                    </Box>
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
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "#f1f1f1",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#43a047",
                        borderRadius: "4px",
                        "&:hover": {
                          background: "#2e7d32",
                        },
                      },
                    }}
                  >
                    <FormGroup>
                      {filteredAllDishes.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: "center" }}>
                          <ArgonTypography variant="body2" color="text.secondary">
                            {dishSearch
                              ? `Không tìm thấy món phù hợp với "${dishSearch}"`
                              : "Chưa có món ăn nào. Vui lòng thêm món ăn ở phần trên."}
                          </ArgonTypography>
                        </Box>
                      ) : (
                        filteredAllDishes.map(d => {
                          const isChecked = selectedDishIds.has(d._id);
                          return (
                            <Box
                              key={d._id}
                              sx={{
                                mb: 1,
                                p: 1.5,
                                borderRadius: 1.5,
                                border: isChecked ? "1px solid #1976d2" : "1px solid #e0e0e0",
                                bgcolor: isChecked ? "#e3f2fd" : "#fff",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  bgcolor: isChecked ? "#e3f2fd" : "#f5f5f5",
                                },
                              }}
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={isChecked}
                                    onChange={() => handleToggleDish(d._id)}
                                    sx={{
                                      color: "#1976d2",
                                      "&.Mui-checked": {
                                        color: "#1976d2",
                                      },
                                      "&:hover": {
                                        backgroundColor: "rgba(25, 118, 210, 0.08)",
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Box>
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
                                  </Box>
                                }
                                sx={{ m: 0 }}
                              />
                            </Box>
                          );
                        })
                      )}
                    </FormGroup>
                  </Paper>
                </Grid>

                {selectedDishIds.size > 0 && (
                  <Grid item xs={12}>
                    <ArgonTypography
                      variant="caption"
                      color="info"
                      sx={{ display: "block", fontWeight: 500 }}
                    >
                      Đã chọn {selectedDishIds.size} món ăn
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
            onClick={() => setMealSlotDialogOpen(false)}
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
            disabled={savingSlot}
          >
            Hủy
          </ArgonButton>
          <ArgonButton
            variant="contained"
            color="info"
            onClick={handleSaveSlot}
            disabled={savingSlot}
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
              savingSlot ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RestaurantIcon />
              )
            }
          >
            {savingSlot ? "Đang lưu..." : "Lưu"}
          </ArgonButton>
        </DialogActions>
      </Dialog>

      {/* Dialog chọn món cho weekly meal slot */}
      <Dialog 
        open={weeklyMealDialogOpen} 
        onClose={() => setWeeklyMealDialogOpen(false)} 
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
            <Box>
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
            </Box>
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
                    }}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <ArgonButton
                      size="small"
                      variant="contained"
                      color="info"
                      onClick={() => {
                        const allIds = new Set(filteredAllDishesWeekly.map(d => d._id));
                        setSelectedDishesForWeekly(allIds);
                      }}
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
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  {selectedDishesForWeekly.size > 0 && (
                    <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
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
                    </Box>
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
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "#f1f1f1",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#1976d2",
                        borderRadius: "4px",
                        "&:hover": {
                          background: "#1565c0",
                        },
                      },
                    }}
                  >
                    <FormGroup>
                      {filteredAllDishesWeekly.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: "center" }}>
                          <ArgonTypography variant="body2" color="text.secondary">
                            {dishSearchWeekly
                              ? `Không tìm thấy món phù hợp với "${dishSearchWeekly}"`
                              : "Chưa có món ăn nào. Vui lòng thêm món ăn ở phần trên."}
                          </ArgonTypography>
                        </Box>
                      ) : (
                        filteredAllDishesWeekly.map(d => {
                          const isChecked = selectedDishesForWeekly.has(d._id);
                          return (
                            <Box
                              key={d._id}
                              sx={{
                                mb: 1,
                                p: 1.5,
                                borderRadius: 1.5,
                                border: isChecked ? "1px solid #1976d2" : "1px solid #e0e0e0",
                                bgcolor: isChecked ? "#e3f2fd" : "#fff",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  bgcolor: isChecked ? "#e3f2fd" : "#f5f5f5",
                                },
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
                                      "&:hover": {
                                        backgroundColor: "rgba(25, 118, 210, 0.08)",
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Box>
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
                                  </Box>
                                }
                                sx={{ m: 0 }}
                              />
                            </Box>
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

      {/* Dialog Add/Edit Dish */}
      <Dialog 
        open={dishDialogOpen} 
        onClose={() => setDishDialogOpen(false)} 
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
            <ArgonTypography variant="h5" fontWeight="bold" color="#ffffff">
              {editingDish ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}
            </ArgonTypography>
          </Stack>
          <ArgonButton
            onClick={() => setDishDialogOpen(false)}
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
              icon={<InfoOutlinedIcon />}
              title="Thông tin món ăn"
              subtitle="Nhập các chi tiết cơ bản cho món ăn"
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Tên món <span style={{ color: "#d32f2f" }}>*</span>
                  </ArgonTypography>
                  <TextField
                    fullWidth
                    placeholder="Nhập tên món ăn..."
                    value={dishForm.dish_name}
                    onChange={(e) => setDishForm(v => ({ ...v, dish_name: e.target.value }))}
                    variant="outlined"
                    required
                    sx={{
                      flex: 1,
                      minWidth: 200,
                      maxWidth: 1000,
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
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Mô tả <span style={{ color: "#d32f2f" }}>*</span>
                  </ArgonTypography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Nhập mô tả món ăn..."
                    value={dishForm.description}
                    onChange={(e) => setDishForm(v => ({ ...v, description: e.target.value }))}
                    variant="outlined"
                    required
                    sx={{
                      flex: 1,
                      minWidth: 200,
                      maxWidth: 1000,
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
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Loại bữa ăn <span style={{ color: "#d32f2f" }}>*</span>
                  </ArgonTypography>
                  <FormControl fullWidth required>
                    <Select
                      value={dishForm.meal_type}
                      onChange={(e) => setDishForm(v => ({ ...v, meal_type: e.target.value }))}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) {
                          return <em>Chọn loại bữa ăn</em>;
                        }
                        const selectedMeal = meals.find(m => m._id === selected);
                        return selectedMeal ? selectedMeal.meal : '';
                      }}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      {meals.length === 0 ? (
                        <MenuItem disabled value="">
                          <em>Chưa có loại bữa ăn nào</em>
                        </MenuItem>
                      ) : (
                        meals.map(meal => (
                          <MenuItem key={meal._id} value={meal._id}>
                            {meal.meal}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
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
            onClick={() => setDishDialogOpen(false)}
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
            disabled={dishSubmitting}
          >
            Hủy
          </ArgonButton>
          <ArgonButton
            onClick={submitDish}
            variant="contained"
            color="info"
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
            disabled={dishSubmitting || !dishForm.dish_name?.trim() || !dishForm.description?.trim() || !dishForm.meal_type}
            startIcon={
              dishSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RestaurantIcon />
              )
            }
          >
            {dishSubmitting ? "Đang lưu..." : editingDish ? "Cập nhật" : "Tạo mới"}
          </ArgonButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

