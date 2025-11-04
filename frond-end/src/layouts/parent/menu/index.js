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
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// import Footer from "examples/Footer";

function Menu() {
  const weeklyMenu = [
    {
      day: "Thứ 2",
      date: "16/12/2024",
      meals: {
        breakfast: {
          name: "Cháo thịt bằm",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "250 cal"
        },
        lunch: {
          name: "Cơm, thịt kho, canh chua",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "400 cal"
        },
        snack: {
          name: "Sữa chua, bánh quy",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "150 cal"
        }
      }
    },
    {
      day: "Thứ 3",
      date: "17/12/2024",
      meals: {
        breakfast: {
          name: "Bánh mì pate",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "280 cal"
        },
        lunch: {
          name: "Cơm, cá chiên, rau xào",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "420 cal"
        },
        snack: {
          name: "Trái cây, sữa",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "120 cal"
        }
      }
    },
    {
      day: "Thứ 4",
      date: "18/12/2024",
      meals: {
        breakfast: {
          name: "Phở gà",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "300 cal"
        },
        lunch: {
          name: "Cơm, thịt nướng, canh khổ qua",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "450 cal"
        },
        snack: {
          name: "Chè đậu đỏ",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "180 cal"
        }
      }
    },
    {
      day: "Thứ 5",
      date: "19/12/2024",
      meals: {
        breakfast: {
          name: "Bún bò Huế",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "320 cal"
        },
        lunch: {
          name: "Cơm, tôm rang, canh chua cá",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "380 cal"
        },
        snack: {
          name: "Bánh flan",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "160 cal"
        }
      }
    },
    {
      day: "Thứ 6",
      date: "20/12/2024",
      meals: {
        breakfast: {
          name: "Xôi đậu xanh",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "280 cal"
        },
        lunch: {
          name: "Cơm, gà nướng, rau luộc",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "400 cal"
        },
        snack: {
          name: "Kem, bánh ngọt",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          calories: "200 cal"
        }
      }
    }
  ];

  const nutritionInfo = {
    totalCalories: "1800-2000 cal/ngày",
    protein: "15-20%",
    carbs: "50-60%",
    fat: "25-30%",
    fiber: "20-25g",
    vitamins: "Đầy đủ A, B, C, D"
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Thực đơn tuần
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Xem thực đơn dinh dưỡng hàng tuần cho con
          </ArgonTypography>
        </ArgonBox>

        {/* Filter */}
        <ArgonBox mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="week"
                label="Chọn tuần"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Loại bữa ăn</InputLabel>
                <Select label="Loại bữa ăn">
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="breakfast">Sáng</MenuItem>
                  <MenuItem value="lunch">Trưa</MenuItem>
                  <MenuItem value="snack">Chiều</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button variant="contained" color="primary" fullWidth>
                Xem thực đơn
              </Button>
            </Grid>
          </Grid>
        </ArgonBox>

        {/* Nutrition Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
              📊 Thông tin dinh dưỡng
            </ArgonTypography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <ArgonBox textAlign="center">
                  <ArgonTypography variant="h6" fontWeight="bold" color="primary">
                    {nutritionInfo.totalCalories}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    Calo/ngày
                  </ArgonTypography>
                </ArgonBox>
              </Grid>
              <Grid item xs={12} md={2}>
                <ArgonBox textAlign="center">
                  <ArgonTypography variant="h6" fontWeight="bold" color="success">
                    {nutritionInfo.protein}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    Protein
                  </ArgonTypography>
                </ArgonBox>
              </Grid>
              <Grid item xs={12} md={2}>
                <ArgonBox textAlign="center">
                  <ArgonTypography variant="h6" fontWeight="bold" color="warning">
                    {nutritionInfo.carbs}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    Carb
                  </ArgonTypography>
                </ArgonBox>
              </Grid>
              <Grid item xs={12} md={2}>
                <ArgonBox textAlign="center">
                  <ArgonTypography variant="h6" fontWeight="bold" color="error">
                    {nutritionInfo.fat}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    Chất béo
                  </ArgonTypography>
                </ArgonBox>
              </Grid>
              <Grid item xs={12} md={2}>
                <ArgonBox textAlign="center">
                  <ArgonTypography variant="h6" fontWeight="bold" color="info">
                    {nutritionInfo.fiber}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    Chất xơ
                  </ArgonTypography>
                </ArgonBox>
              </Grid>
              <Grid item xs={12} md={2}>
                <ArgonBox textAlign="center">
                  <ArgonTypography variant="h6" fontWeight="bold" color="secondary">
                    {nutritionInfo.vitamins}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    Vitamin
                  </ArgonTypography>
                </ArgonBox>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Weekly Menu */}
        <Grid container spacing={3}>
          {weeklyMenu.map((dayMenu, index) => (
            <Grid item xs={12} lg={6} key={index}>
              <Card>
                <CardContent>
                  <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      {dayMenu.day}
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="text">
                      {dayMenu.date}
                    </ArgonTypography>
                  </ArgonBox>

                  {/* Breakfast */}
                  <ArgonBox mb={2}>
                    <ArgonTypography variant="body1" fontWeight="bold" color="primary" mb={1}>
                      🌅 Sáng
                    </ArgonTypography>
                    <CardMedia
                      component="img"
                      height="120"
                      image={dayMenu.meals.breakfast.image}
                      alt={dayMenu.meals.breakfast.name}
                      sx={{ borderRadius: 1, mb: 1 }}
                    />
                    <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                      {dayMenu.meals.breakfast.name}
                    </ArgonTypography>
                    <Chip label={dayMenu.meals.breakfast.calories} size="small" color="primary" />
                  </ArgonBox>

                  {/* Lunch */}
                  <ArgonBox mb={2}>
                    <ArgonTypography variant="body1" fontWeight="bold" color="success" mb={1}>
                      ☀️ Trưa
                    </ArgonTypography>
                    <CardMedia
                      component="img"
                      height="120"
                      image={dayMenu.meals.lunch.image}
                      alt={dayMenu.meals.lunch.name}
                      sx={{ borderRadius: 1, mb: 1 }}
                    />
                    <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                      {dayMenu.meals.lunch.name}
                    </ArgonTypography>
                    <Chip label={dayMenu.meals.lunch.calories} size="small" color="success" />
                  </ArgonBox>

                  {/* Snack */}
                  <ArgonBox>
                    <ArgonTypography variant="body1" fontWeight="bold" color="warning" mb={1}>
                      🌆 Chiều
                    </ArgonTypography>
                    <CardMedia
                      component="img"
                      height="120"
                      image={dayMenu.meals.snack.image}
                      alt={dayMenu.meals.snack.name}
                      sx={{ borderRadius: 1, mb: 1 }}
                    />
                    <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                      {dayMenu.meals.snack.name}
                    </ArgonTypography>
                    <Chip label={dayMenu.meals.snack.calories} size="small" color="warning" />
                  </ArgonBox>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Special Notes */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
              📝 Lưu ý đặc biệt
            </ArgonTypography>
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <i className="ni ni-notification-70" style={{ color: "#ff9800" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Dị ứng thực phẩm"
                  secondary="Con có dị ứng với hải sản và đậu phộng. Vui lòng thông báo nếu có thay đổi."
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <i className="ni ni-heart-2" style={{ color: "#f44336" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Sở thích ăn uống"
                  secondary="Con thích ăn rau xanh và trái cây. Không thích ăn cay."
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <i className="ni ni-bulb-61" style={{ color: "#4caf50" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Gợi ý dinh dưỡng"
                  secondary="Nên bổ sung thêm canxi và vitamin D cho sự phát triển xương."
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </ArgonBox>
      {/* <Footer /> */}
    </DashboardLayout>
  );
}

export default Menu;
