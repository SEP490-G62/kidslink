import { useEffect, useMemo, useState } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
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

  // Dialog state for add/edit dish
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dishForm, setDishForm] = useState({ dish_name: "", description: "" });
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

  // Filtered lists for dialogs
  const filteredAllDishes = useMemo(() => {
    if (!dishSearch.trim()) return dishes;
    const q = dishSearch.trim().toLowerCase();
    return dishes.filter(d => (d.dish_name || "").toLowerCase().includes(q));
  }, [dishes, dishSearch]);

  const filteredAllDishesWeekly = useMemo(() => {
    if (!dishSearchWeekly.trim()) return dishes;
    const q = dishSearchWeekly.trim().toLowerCase();
    return dishes.filter(d => (d.dish_name || "").toLowerCase().includes(q));
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
    if (!search.trim()) return dishes;
    const q = search.trim().toLowerCase();
    return dishes.filter(d =>
      (d.dish_name || "").toLowerCase().includes(q) ||
      (d.description || "").toLowerCase().includes(q)
    );
  }, [dishes, search]);

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
    setDishForm({ dish_name: "", description: "" });
    setDishDialogOpen(true);
  };

  const openEditDish = (dish) => {
    setEditingDish(dish);
    setDishForm({ dish_name: dish.dish_name || "", description: dish.description || "" });
    setDishDialogOpen(true);
  };

  const submitDish = async () => {
    if (!dishForm.dish_name?.trim() || !dishForm.description?.trim()) return;
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
            <Grid container spacing={2}>
              <Grid item xs={12} display="flex" gap={2} alignItems="center">
                <TextField
                  placeholder="Tìm kiếm món ăn..."
                  value={search}
                  onChange={(e)=>setSearch(e.target.value)}
                  size="small"
                  sx={{ flex: 1, maxWidth: 400 }}
                />
                <Button 
                  startIcon={<AddIcon />} 
                  variant="contained" 
                  color="success" 
                  onClick={openAddDish}
                  sx={{ minWidth: 140 }}
                >
                  Thêm món
                </Button>
              </Grid>

              <Grid item xs={12}>
                <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                
                  <Table size="medium" sx={{ tableLayout: 'fixed' }}>
                  
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '15px', width: '30%', py: 2 }}>Tên món</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '15px', width: '50%', py: 2 }}>Mô tả</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '15px', width: '20%', py: 2 }}>Cập nhật</TableCell>
                      </TableRow>
                    
                    <TableBody>
                      {filteredDishes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                            <ArgonTypography color="text">Không có món ăn nào</ArgonTypography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDishes.map(d => (
                          <TableRow key={d._id} hover sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                            <TableCell sx={{ fontSize: '14px', width: '30%', py: 2 }}>{d.dish_name}</TableCell>
                            <TableCell sx={{ fontSize: '14px', width: '50%', py: 2 }}>{d.description}</TableCell>
                            <TableCell align="right" sx={{ width: '20%', py: 2 }}>
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
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
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="class-age-table-label">Nhóm tuổi</InputLabel>
                  <Select 
                    labelId="class-age-table-label" 
                    label="Nhóm tuổi" 
                    value={selectedClassAgeForTable} 
                    onChange={(e) => {
                      console.log('Selected class age:', e.target.value);
                      setSelectedClassAgeForTable(e.target.value);
                    }}
                    disabled={loading || classAges.length === 0}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return <em>Chọn nhóm tuổi</em>;
                      }
                      const selectedAge = classAges.find(ca => ca._id === selected);
                      return selectedAge ? selectedAge.age_name : '';
                    }}
                  >
                    {classAges.length === 0 ? (
                      <MenuItem disabled value="">
                        <em>Chưa có nhóm tuổi nào</em>
                      </MenuItem>
                    ) : (
                      classAges.map(ca => (
                        <MenuItem key={ca._id} value={ca._id}>
                          {ca.age_name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8} display="flex" alignItems="center" gap={2}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    setWeekStartForTable(addDaysVietnam(weekStartForTable, -7));
                  }}
                >
                  <i className="ni ni-bold-left" style={{ fontSize: '16px' }} />
                </Button>
                <ArgonTypography variant="body1" fontWeight="bold" color="dark" sx={{ minWidth: '200px', textAlign: 'center' }}>
                  Tuần ({getDateForWeekdayTable(0).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {getDateForWeekdayTable(6).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})
                </ArgonTypography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    setWeekStartForTable(addDaysVietnam(weekStartForTable, 7));
                  }}
                >
                  <i className="ni ni-bold-right" style={{ fontSize: '16px' }} />
                </Button>
              </Grid>
            </Grid>
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
                <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Table size="small" sx={{ tableLayout: 'fixed' }}>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        {weekDaysOptions.map((wd, idx) => {
                          const date = getDateForWeekdayTable(idx);
                          return (
                            <TableCell 
                              key={wd.id} 
                              align="center" 
                              sx={{ 
                                fontWeight: 700, 
                                fontSize: '14px', 
                                py: 2, 
                                borderLeft: idx > 0 ? '1px solid #e0e0e0' : 'none',
                                minWidth: '150px'
                              }}
                            >
                              <ArgonTypography variant="body2" fontWeight="bold" color="dark">
                                {wd.name}
                              </ArgonTypography>
                              <ArgonTypography variant="caption" color="text.secondary">
                                {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                              </ArgonTypography>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    <TableBody>
                      <TableRow>
                        {weekDaysOptions.map((wd, dayIndex) => {
                          const date = getDateForWeekdayTable(dayIndex);
                          const isWeekend = dayIndex >= 5; // T7 (index 5) and CN (index 6)
                          
                          return (
                            <TableCell 
                              key={wd.id}
                              sx={{ 
                                py: 1.5,
                                px: 1.5,
                                borderLeft: dayIndex > 0 ? '1px solid #e0e0e0' : 'none',
                                verticalAlign: 'top',
                                minWidth: '150px'
                              }}
                            >
                              {isWeekend ? (
                                <ArgonBox textAlign="center" py={4}>
                                  <ArgonTypography variant="body2" color="text.secondary">
                                    Không có thực đơn
                                  </ArgonTypography>
                                </ArgonBox>
                              ) : (
                                <ArgonBox>
                                  {meals.map((meal) => {
                                    const key = `${meal._id}-${wd.id}`;
                                    const slotData = weeklyMealSelection[key] || { dishes: [] };
                                    const mealColors = {
                                      'Breakfast': '#1976d2',
                                      'Lunch': '#43a047',
                                      'Snack': '#ff9800'
                                    };
                                    const mealColor = mealColors[meal.meal] || '#666';
                                    
                                    return (
                                      <ArgonBox 
                                        key={meal._id}
                                        sx={{
                                          border: '1px solid #e0e0e0',
                                          borderRadius: 1.5,
                                          p: 1.5,
                                          mb: 1.5,
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                          backgroundColor: '#fff',
                                          '&:hover': {
                                            backgroundColor: '#f9f9f9',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                            transform: 'translateY(-1px)'
                                          }
                                        }}
                                        onClick={() => {
                                          const dateStr = addDaysVietnam(weekStartForTable, dayIndex);
                                          const dateStrISO = toVietnamISOString(dateStr);
                                          handleOpenWeeklyMealSlot(meal._id, wd.id, dateStrISO);
                                        }}
                                      >
                                        <ArgonTypography 
                                          variant="body2" 
                                          fontWeight="bold"
                                          sx={{ color: mealColor, mb: 1, fontSize: '13px' }}
                                        >
                                          {meal.meal}
                                        </ArgonTypography>
                                        {slotData.dishes.length === 0 ? (
                                          <ArgonTypography variant="caption" sx={{ fontSize: '11px', color: 'error.main' }}>
                                            Click để chọn món
                                          </ArgonTypography>
                                        ) : (
                                          <ArgonBox>
                                            {slotData.dishes.map((dish, idx) => (
                                              <ArgonTypography 
                                                key={dish._id || idx} 
                                                variant="caption" 
                                                display="block"
                                                sx={{ fontSize: '12px', mb: 0.5, color: '#333', fontWeight: 'bold', fontStyle: 'italic' }}
                                              >
                                                {dish.dish_name || dish.name}
                                              </ArgonTypography>
                                            ))}
                                          </ArgonBox>
                                        )}
                                      </ArgonBox>
                                    );
                                  })}
                                </ArgonBox>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
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
        maxWidth="sm"
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          Chọn món ăn
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
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                size="small"
                placeholder="Tìm món theo tên" 
                value={dishSearch} 
                onChange={(e) => setDishSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <ArgonBox display="flex" flexWrap="wrap" gap={1}>
                {Array.from(selectedDishIds).map(id => {
                  const dish = dishes.find(x => x._id === id);
                  if (!dish) return null;
                  return (
                    <Chip 
                      key={id} 
                      label={dish.dish_name} 
                      color="success" 
                      variant="outlined" 
                      onDelete={() => handleToggleDish(id)}
                      size="small"
                    />
                  );
                })}
                {selectedDishIds.size === 0 && (
                  <ArgonTypography variant="caption" color="text.secondary">Chưa chọn món nào</ArgonTypography>
                )}
              </ArgonBox>
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Button 
                size="small" 
                variant="contained" 
                color="success"
                onClick={() => {
                  const allIds = new Set(filteredAllDishes.map(d => d._id));
                  setSelectedDishIds(allIds);
                }}
              >
                Chọn tất cả
              </Button>
              <Button 
                size="small" 
                variant="text" 
                color="error"
                onClick={() => setSelectedDishIds(new Set())}
              >
                Bỏ chọn hết
              </Button>
            </Grid>
            <Grid item xs={12}>
              <List dense sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 0 }}>
                {filteredAllDishes.length === 0 ? (
                  <ListItem>
                    <ListItemText 
                      primary="Không tìm thấy món phù hợp" 
                      secondary={dishSearch ? `Từ khóa: "${dishSearch}"` : 'Vui lòng thêm món ăn ở phần trên'}
                    />
                  </ListItem>
                ) : (
                  filteredAllDishes.map(d => (
                    <ListItem 
                      key={d._id} 
                      button 
                      onClick={() => handleToggleDish(d._id)}
                      sx={{ '&:hover': { backgroundColor: '#fafafa' }, py: 0.5 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox 
                          edge="start" 
                          color="success"
                          checked={selectedDishIds.has(d._id)} 
                          tabIndex={-1} 
                          disableRipple
                          size="small" 
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primaryTypographyProps={{ sx: { fontWeight: selectedDishIds.has(d._id) ? 'bold' : 500 } }}
                        primary={d.dish_name}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setMealSlotDialogOpen(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleSaveSlot} 
            disabled={savingSlot}
          >
            {savingSlot ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog chọn món cho weekly meal slot */}
      <Dialog 
        open={weeklyMealDialogOpen} 
        onClose={() => setWeeklyMealDialogOpen(false)} 
        fullWidth 
        maxWidth="sm"
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          Chọn món ăn
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
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                size="small"
                placeholder="Tìm món theo tên " 
                value={dishSearchWeekly} 
                onChange={(e) => setDishSearchWeekly(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <ArgonBox display="flex" flexWrap="wrap" gap={1}>
                {Array.from(selectedDishesForWeekly).map(id => {
                  const dish = dishes.find(x => x._id === id);
                  if (!dish) return null;
                  return (
                    <Chip 
                      key={id} 
                      label={dish.dish_name} 
                      color="success" 
                      variant="outlined" 
                      onDelete={() => handleToggleDishForWeekly(id)}
                      size="small"
                    />
                  );
                })}
                {selectedDishesForWeekly.size === 0 && (
                  <ArgonTypography variant="caption" color="text.secondary">Chưa chọn món nào</ArgonTypography>
                )}
              </ArgonBox>
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Button 
                size="small" 
                variant="contained" 
                color="success"
                onClick={() => {
                  const allIds = new Set(filteredAllDishesWeekly.map(d => d._id));
                  setSelectedDishesForWeekly(allIds);
                }}
              >
                Chọn tất cả
              </Button>
              <Button 
                size="small" 
                variant="text" 
                color="error"
                onClick={() => setSelectedDishesForWeekly(new Set())}
              >
                Bỏ chọn hết
              </Button>
            </Grid>
            <Grid item xs={12}>
              <List dense sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 0 }}>
                {filteredAllDishesWeekly.length === 0 ? (
                  <ListItem>
                    <ListItemText 
                      primary="Không tìm thấy món phù hợp" 
                      secondary={dishSearchWeekly ? `Từ khóa: "${dishSearchWeekly}"` : 'Vui lòng thêm món ăn ở phần trên'}
                    />
                  </ListItem>
                ) : (
                  filteredAllDishesWeekly.map(d => (
                    <ListItem 
                      key={d._id} 
                      button 
                      onClick={() => handleToggleDishForWeekly(d._id)}
                      sx={{ '&:hover': { backgroundColor: '#fafafa' }, py: 0.5 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox 
                          edge="start" 
                          color="success"
                          checked={selectedDishesForWeekly.has(d._id)} 
                          tabIndex={-1} 
                          disableRipple
                          size="small" 
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primaryTypographyProps={{ sx: { fontWeight: selectedDishesForWeekly.has(d._id) ? 'bold' : 500 } }}
                        primary={d.dish_name}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWeeklyMealDialogOpen(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleSaveWeeklyMeal} 
            disabled={savingWeeklyMeal}
          >
            {savingWeeklyMeal ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Add/Edit Dish */}
      <Dialog open={dishDialogOpen} onClose={() => setDishDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {editingDish ? 'Sửa món ăn' : 'Thêm món ăn'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Tên món" 
                value={dishForm.dish_name} 
                onChange={(e)=>setDishForm(v=>({...v, dish_name: e.target.value}))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Mô tả" 
                multiline 
                rows={3} 
                value={dishForm.description} 
                onChange={(e)=>setDishForm(v=>({...v, description: e.target.value}))}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={()=>setDishDialogOpen(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={submitDish} 
            disabled={dishSubmitting || !dishForm.dish_name?.trim() || !dishForm.description?.trim()}
          >
            {dishSubmitting ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

