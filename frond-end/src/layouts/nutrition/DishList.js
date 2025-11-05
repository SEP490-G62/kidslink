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
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import nutritionService from "services/nutritionService";

export default function NutritionDishList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dishes, setDishes] = useState([]);
  const [classAges, setClassAges] = useState([]);
  const [meals, setMeals] = useState([]);
  const [weekDays, setWeekDays] = useState([]);

  const [selectedClassAge, setSelectedClassAge] = useState("");
  const [selectedMeal, setSelectedMeal] = useState("");
  const [selectedWeekDay, setSelectedWeekDay] = useState("");
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay(); // 0-6 (Sun-Sat)
    const diffToMon = ((day + 6) % 7); // days since Monday
    const monday = new Date(now);
    monday.setHours(0,0,0,0);
    monday.setDate(now.getDate() - diffToMon);
    return monday.toISOString().slice(0,10);
  });
  const [selectedDishIds, setSelectedDishIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Dialog state for add/edit dish
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dishForm, setDishForm] = useState({ dish_name: "", description: "" });
  const [dishSubmitting, setDishSubmitting] = useState(false);

  const weekDaysOptions = useMemo(() => weekDays.map(d => ({ id: d._id, name: d.day_of_week })), [weekDays]);

  useEffect(() => {
    async function loadInit() {
      try {
        setLoading(true);
        setError("");
        const [d, ca, m, wd] = await Promise.all([
          nutritionService.getDishes(),
          nutritionService.getClassAges(),
          nutritionService.getMeals(),
          nutritionService.getWeekDays()
        ]);
        setDishes(d.dishes || []);
        setClassAges(ca.classAges || []);
        setMeals(m.meals || []);
        setWeekDays(wd.weekDays || []);
      } catch (e) {
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

  // Load assigned dishes whenever selection changes
  useEffect(() => {
    async function loadAssigned() {
      if (!selectedClassAge || !selectedMeal || !selectedWeekDay || !weekStart) {
        setSelectedDishIds(new Set());
        return;
      }
      try {
        const monday = new Date(weekStart);
        const dayIndex = weekDaysOptions.findIndex(d => d.id === selectedWeekDay); // 0..6 if sorted
        const date = new Date(monday);
        date.setDate(monday.getDate() + (dayIndex >= 0 ? dayIndex : 0));
        const res = await nutritionService.getClassAgeMeals({});
        // Use direct endpoint to get assigned for the exact day
        const assigned = await nutritionService.getAssignedDishes({
          class_age_id: selectedClassAge,
          meal_id: selectedMeal,
          weekday_id: selectedWeekDay,
          date: date.toISOString()
        });
        const ids = new Set((assigned.dishes || []).map(d => d._id));
        setSelectedDishIds(ids);
      } catch (e) {
        // Ignore prefill errors, keep empty selection
        setSelectedDishIds(new Set());
      }
    }
    // Only run when we have week days loaded
    if (weekDaysOptions.length) loadAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassAge, selectedMeal, selectedWeekDay, weekStart, weekDaysOptions.length]);

  const handleToggleDish = (id) => {
    setSelectedDishIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedClassAge || !selectedMeal || !selectedWeekDay || !weekStart) {
      setError('Vui lòng chọn đủ Nhóm tuổi, Bữa ăn, Ngày và Tuần');
      return;
    }
    setError("");
    setSaving(true);
    try {
      const monday = new Date(weekStart);
      const dayIndex = weekDaysOptions.findIndex(d => d.id === selectedWeekDay);
      const date = new Date(monday);
      date.setDate(monday.getDate() + (dayIndex >= 0 ? dayIndex : 0));
      await nutritionService.assignDishes({
        class_age_id: selectedClassAge,
        meal_id: selectedMeal,
        weekday_id: selectedWeekDay,
        date: date.toISOString(),
        dish_ids: Array.from(selectedDishIds)
      });
    } catch (e) {
      setError(e.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
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

  return (
    <>
      <Card sx={{ maxWidth: 1200, mx: "auto", borderRadius: 4, boxShadow: 4 }}>
        <CardHeader title={<ArgonTypography variant="h4" fontWeight="bold" color="success.main">Quản lý thực đơn theo tuần</ArgonTypography>} />
        <CardContent>
          {loading && <ArgonBox display="flex" justifyContent="center" py={4}><CircularProgress /></ArgonBox>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {!loading && (
            <Grid container spacing={2}>
              <Grid item xs={12} display="flex" gap={2} alignItems="center">
                <TextField
                  placeholder="Search"
                  value={search}
                  onChange={(e)=>setSearch(e.target.value)}
                  size="small"
                  sx={{ maxWidth: 360 }}
                />
                <Button startIcon={<AddIcon />} variant="outlined" color="success" onClick={openAddDish}>Thêm món</Button>
              </Grid>

              <Grid item xs={12}>
                <TableContainer sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Tên món</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Cập nhật</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDishes.map(d => (
                        <TableRow key={d._id} hover>
                          <TableCell>{d.dish_name}</TableCell>
                          <TableCell>{d.description}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="primary" onClick={() => openEditDish(d)}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => deleteDish(d._id)}><DeleteIcon fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="class-age-label">Nhóm tuổi</InputLabel>
                  <Select labelId="class-age-label" label="Nhóm tuổi" value={selectedClassAge} onChange={(e) => setSelectedClassAge(e.target.value)}>
                    {classAges.map(ca => (
                      <MenuItem key={ca._id} value={ca._id}>{ca.age_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="meal-label">Bữa ăn</InputLabel>
                  <Select labelId="meal-label" label="Bữa ăn" value={selectedMeal} onChange={(e) => setSelectedMeal(e.target.value)}>
                    {meals.map(m => (
                      <MenuItem key={m._id} value={m._id}>{m.meal}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="weekday-label">Ngày trong tuần</InputLabel>
                  <Select labelId="weekday-label" label="Ngày trong tuần" value={selectedWeekDay} onChange={(e) => setSelectedWeekDay(e.target.value)}>
                    {weekDaysOptions.map((d, idx) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField type="date" fullWidth label="Tuần bắt đầu (Thứ 2)" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid item xs={12}>
                <ArgonTypography variant="h6" fontWeight="bold">Chọn món cho ngày đã chọn</ArgonTypography>
                <List dense sx={{ maxHeight: 420, overflow: 'auto', border: '1px solid #eee', borderRadius: 2, mt: 1 }}>
                  {dishes.map(d => (
                    <ListItem key={d._id} button onClick={() => handleToggleDish(d._id)}>
                      <ListItemIcon>
                        <Checkbox edge="start" checked={selectedDishIds.has(d._id)} tabIndex={-1} disableRipple />
                      </ListItemIcon>
                      <ListItemText primary={d.dish_name} secondary={d.description} />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12} display="flex" justifyContent="flex-end">
                <Button variant="contained" color="success" onClick={handleSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu cho ngày này'}
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Dialog open={dishDialogOpen} onClose={() => setDishDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingDish ? 'Sửa món ăn' : 'Thêm món ăn'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Tên món" value={dishForm.dish_name} onChange={(e)=>setDishForm(v=>({...v, dish_name: e.target.value}))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Mô tả" multiline rows={3} value={dishForm.description} onChange={(e)=>setDishForm(v=>({...v, description: e.target.value}))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDishDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={submitDish} disabled={dishSubmitting}>{dishSubmitting ? 'Đang lưu...' : 'Lưu'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
