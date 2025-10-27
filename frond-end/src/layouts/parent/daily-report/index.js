/**
=========================================================
* KidsLink Parent Dashboard - Daily Report
=========================================================
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function DailyReport() {
  const dailyReports = [
    {
      id: 1,
      date: "15/12/2024",
      childName: "Nguyễn Minh Anh",
      attendance: "Có mặt",
      meals: {
        breakfast: "Đã ăn",
        lunch: "Đã ăn",
        snack: "Đã ăn"
      },
      activities: [
        "Hoạt động ngoại khóa",
        "Học toán",
        "Vẽ tranh"
      ],
      health: "Bình thường",
      notes: "Con học rất tốt và tích cực tham gia các hoạt động",
      teacher: "Cô Lan"
    },
    {
      id: 2,
      date: "14/12/2024",
      childName: "Nguyễn Minh Anh",
      attendance: "Có mặt",
      meals: {
        breakfast: "Đã ăn",
        lunch: "Đã ăn",
        snack: "Đã ăn"
      },
      activities: [
        "Thể dục",
        "Học tiếng Việt",
        "Làm thủ công"
      ],
      health: "Bình thường",
      notes: "Con có tiến bộ trong việc đọc",
      teacher: "Cô Lan"
    },
    {
      id: 3,
      date: "13/12/2024",
      childName: "Nguyễn Minh Anh",
      attendance: "Có mặt",
      meals: {
        breakfast: "Đã ăn",
        lunch: "Đã ăn",
        snack: "Không ăn"
      },
      activities: [
        "Khoa học",
        "Âm nhạc",
        "Chơi ngoài trời"
      ],
      health: "Bình thường",
      notes: "Con không muốn ăn bữa phụ chiều",
      teacher: "Cô Lan"
    }
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Báo cáo hàng ngày
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Theo dõi hoạt động hàng ngày của con
          </ArgonTypography>
        </ArgonBox>

        {/* Filter */}
        <ArgonBox mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Chọn ngày"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select label="Trạng thái">
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="present">Có mặt</MenuItem>
                  <MenuItem value="absent">Vắng mặt</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button variant="contained" color="primary" fullWidth>
                Tìm kiếm
              </Button>
            </Grid>
          </Grid>
        </ArgonBox>

        {/* Reports List */}
        <Grid container spacing={3}>
          {dailyReports.map((report) => (
            <Grid item xs={12} key={report.id}>
              <Card>
                <CardContent>
                  <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <ArgonBox display="flex" alignItems="center">
                      <Avatar
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                        alt={report.childName}
                        sx={{ width: 48, height: 48, mr: 2 }}
                      />
                      <ArgonBox>
                        <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                          {report.childName}
                        </ArgonTypography>
                        <ArgonTypography variant="body2" color="text">
                          {report.date} • {report.teacher}
                        </ArgonTypography>
                      </ArgonBox>
                    </ArgonBox>
                    <Chip
                      label={report.attendance}
                      color={report.attendance === "Có mặt" ? "success" : "error"}
                    />
                  </ArgonBox>

                  <Grid container spacing={3}>
                    {/* Meals */}
                    <Grid item xs={12} md={4}>
                      <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={1}>
                        🍽️ Bữa ăn
                      </ArgonTypography>
                      <List dense>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Sáng"
                            secondary={report.meals.breakfast}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Trưa"
                            secondary={report.meals.lunch}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Chiều"
                            secondary={report.meals.snack}
                          />
                        </ListItem>
                      </List>
                    </Grid>

                    {/* Activities */}
                    <Grid item xs={12} md={4}>
                      <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={1}>
                        🎯 Hoạt động
                      </ArgonTypography>
                      <List dense>
                        {report.activities.map((activity, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon>
                              <i className="ni ni-check-bold" style={{ color: "#4caf50", fontSize: 16 }} />
                            </ListItemIcon>
                            <ListItemText primary={activity} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>

                    {/* Health & Notes */}
                    <Grid item xs={12} md={4}>
                      <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={1}>
                        🏥 Sức khỏe
                      </ArgonTypography>
                      <Chip
                        label={report.health}
                        color="success"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                        Ghi chú:
                      </ArgonTypography>
                      <ArgonTypography variant="body2" color="text">
                        {report.notes}
                      </ArgonTypography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default DailyReport;
