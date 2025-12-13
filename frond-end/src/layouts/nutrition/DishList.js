import { useEffect, useMemo, useState } from "react";

import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
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
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";

import nutritionService from "services/nutritionService";

export default function NutritionDishList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dishes, setDishes] = useState([]);
  const [meals, setMeals] = useState([]);
  const [search, setSearch] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState("");

  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dishForm, setDishForm] = useState({ dish_name: "", description: "", meal_type: "" });
  const [dishSubmitting, setDishSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [dishRes, mealRes] = await Promise.all([
          nutritionService.getDishes(),
          nutritionService.getMeals()
        ]);
        const dishesData = dishRes.dishes || dishRes.data || [];
        const mealsData = mealRes.meals || mealRes.data || [];
        setDishes(dishesData);
        setMeals(mealsData);
      } catch (e) {
        setError(e.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredDishes = useMemo(() => {
    let filtered = dishes;
    if (mealTypeFilter) {
      filtered = filtered.filter((dish) => {
        const id = dish.meal_type?._id || dish.meal_type;
        return String(id) === String(mealTypeFilter);
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (dish) =>
          (dish.dish_name || "").toLowerCase().includes(q) ||
          (dish.description || "").toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [dishes, mealTypeFilter, search]);

  const openAddDish = () => {
    setEditingDish(null);
    setDishForm({ dish_name: "", description: "", meal_type: "" });
    setDishDialogOpen(true);
  };

  const openEditDish = (dish) => {
    setEditingDish(dish);
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
        setDishes((prev) => prev.map((dish) => (dish._id === updated._id ? updated : dish)));
      } else {
        const created = await nutritionService.createDish(dishForm);
        setDishes((prev) => [...prev, created].sort((a, b) => a.dish_name.localeCompare(b.dish_name)));
      }
      setDishDialogOpen(false);
    } catch (e) {
      setError(e.message || "Không thể lưu món ăn");
    } finally {
      setDishSubmitting(false);
    }
  };

  const deleteDish = async (id) => {
    if (!window.confirm("Xoá món ăn này?")) return;
    try {
      await nutritionService.deleteDish(id);
      setDishes((prev) => prev.filter((dish) => dish._id !== id));
    } catch (e) {
      setError(e.message || "Xoá thất bại");
    }
  };

  return (
    <>
      <Card sx={{ maxWidth: 1200, mx: "auto", mb: 3, borderRadius: 4, boxShadow: 4 }}>
        <CardHeader 
          title={<ArgonTypography variant="h5" fontWeight="bold" color="success.main">Quản lý món ăn</ArgonTypography>}
        />
        <Divider />
        <CardContent>
          {loading && (
            <ArgonBox display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </ArgonBox>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
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
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                    <TextField
                        fullWidth
                      size="small"
                      placeholder="Tìm kiếm theo tên món ăn hoặc mô tả..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: "#1976d2" }} />
                          </InputAdornment>
                        ),
                          endAdornment: search && (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setSearch("")}>
                                <ClearIcon />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#fff",
                          borderRadius: 2,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={mealTypeFilter}
                        onChange={(e) => setMealTypeFilter(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                              <FilterListIcon sx={{ color: "#1976d2" }} />
                          </InputAdornment>
                        ),
                      }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            bgcolor: "#fff",
                              borderRadius: 2,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
                    </Grid>
                    <Grid item xs={12} md={3} display="flex" justifyContent="flex-end" gap={1}>
                    {(search || mealTypeFilter) && (
                      <ArgonButton
                        variant="outlined"
                        color="error"
                          size="small"
                        onClick={() => {
                          setSearch("");
                          setMealTypeFilter("");
                        }}
                        startIcon={<ClearIcon />}
                        >
                          Xoá lọc
                      </ArgonButton>
                    )}
                      <ArgonButton
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={openAddDish}
                      >
                        Thêm món
                      </ArgonButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <TableContainer sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Tên món</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Bữa ăn</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
                      </TableRow>
                  </TableHead>
                    <TableBody>
                      {filteredDishes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <ArgonTypography color="text">Chưa có món ăn nào.</ArgonTypography>
                          </TableCell>
                        </TableRow>
                      ) : (
                      filteredDishes.map((dish) => {
                        const mealName = dish.meal_type?.meal || dish.meal_type || "—";
                          return (
                          <TableRow key={dish._id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{dish.dish_name}</TableCell>
                            <TableCell>{dish.description}</TableCell>
                            <TableCell>
                              <Chip label={mealName} size="small" color="success" variant="outlined" />
                              </TableCell>
                            <TableCell align="right">
                              <IconButton color="primary" size="small" onClick={() => openEditDish(dish)} sx={{ mr: 1 }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              <IconButton color="error" size="small" onClick={() => deleteDish(dish._id)}>
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
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dishDialogOpen} onClose={() => setDishDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingDish ? "Cập nhật món ăn" : "Thêm món ăn mới"}
        </DialogTitle>
        <DialogContent dividers>
              <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                label="Tên món ăn"
                value={dishForm.dish_name}
                onChange={(e) => setDishForm((prev) => ({ ...prev, dish_name: e.target.value }))}
                placeholder="Nhập tên món"
                  />
                </Grid>
            <Grid item xs={12} md={6}>
                  <TextField
                select
                    fullWidth
                label="Loại bữa ăn"
                value={dishForm.meal_type}
                onChange={(e) => setDishForm((prev) => ({ ...prev, meal_type: e.target.value }))}
                placeholder="Chọn bữa ăn"
              >
                {meals.map((meal) => (
                  <MenuItem key={meal._id} value={meal._id}>
                    {meal.meal}
                  </MenuItem>
                ))}
              </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                label="Mô tả"
                    value={dishForm.description}
                onChange={(e) => setDishForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả thành phần, cách chế biến..."
                  />
                </Grid>
                </Grid>
        </DialogContent>
        <DialogActions>
          <ArgonButton variant="outlined" color="secondary" onClick={() => setDishDialogOpen(false)} disabled={dishSubmitting}>
            Hủy
          </ArgonButton>
          <ArgonButton
            variant="contained"
            color="success"
            onClick={submitDish}
            disabled={dishSubmitting || !dishForm.dish_name?.trim() || !dishForm.description?.trim() || !dishForm.meal_type}
            startIcon={dishSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {dishSubmitting ? "Đang lưu..." : editingDish ? "Cập nhật" : "Thêm mới"}
          </ArgonButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

