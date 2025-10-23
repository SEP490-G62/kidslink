/**
=========================================================
* KidsLink Parent Dashboard - Class Calendar
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
import Divider from "@mui/material/Divider";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function ClassCalendar() {
  const categories = [
    { value: "Meeting", label: "Cuộc họp" },
    { value: "Event", label: "Sự kiện" },
    { value: "Health", label: "Y tế" },
    { value: "Holiday", label: "Nghỉ lễ" },
    { value: "Activity", label: "Hoạt động" }
  ];

  const events = [
    {
      id: 1,
      title: "Họp phụ huynh",
      date: "20/12/2024",
      time: "14:00 - 16:00",
      type: "Meeting",
      description: "Họp phụ huynh định kỳ tháng 12",
      location: "Phòng họp tầng 2",
      status: "Sắp diễn ra"
    },
    {
      id: 2,
      title: "Lễ Giáng Sinh",
      date: "25/12/2024",
      time: "09:00 - 11:00",
      type: "Event",
      description: "Chương trình văn nghệ Giáng Sinh",
      location: "Sân trường",
      status: "Sắp diễn ra"
    },
    {
      id: 3,
      title: "Kiểm tra sức khỏe định kỳ",
      date: "28/12/2024",
      time: "08:30 - 10:30",
      type: "Health",
      description: "Khám sức khỏe định kỳ cho các con",
      location: "Phòng y tế",
      status: "Sắp diễn ra"
    },
    {
      id: 4,
      title: "Nghỉ Tết Dương lịch",
      date: "01/01/2025",
      time: "Cả ngày",
      type: "Holiday",
      description: "Nghỉ lễ Tết Dương lịch",
      location: "Toàn trường",
      status: "Đã lên lịch"
    },
    {
      id: 5,
      title: "Hoạt động ngoại khóa",
      date: "05/01/2025",
      time: "08:00 - 11:00",
      type: "Activity",
      description: "Tham quan bảo tàng khoa học",
      location: "Bảo tàng TP.HCM",
      status: "Đã lên lịch"
    }
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case "Meeting":
        return "primary";
      case "Event":
        return "success";
      case "Health":
        return "info";
      case "Holiday":
        return "warning";
      case "Activity":
        return "secondary";
      default:
        return "default";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Meeting":
        return "ni ni-calendar-grid-58";
      case "Event":
        return "ni ni-app";
      case "Health":
        return "ni ni-ambulance";
      case "Holiday":
        return "ni ni-calendar-grid-58";
      case "Activity":
        return "ni ni-world";
      default:
        return "ni ni-calendar-grid-58";
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Lịch lớp học
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Xem lịch học và sự kiện của lớp
          </ArgonTypography>
        </ArgonBox>

        {/* Filter */}
        <ArgonBox mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="month"
                label="Chọn tháng"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Loại sự kiện</InputLabel>
                <Select label="Loại sự kiện">
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="Meeting">Cuộc họp</MenuItem>
                  <MenuItem value="Event">Sự kiện</MenuItem>
                  <MenuItem value="Health">Y tế</MenuItem>
                  <MenuItem value="Holiday">Nghỉ lễ</MenuItem>
                  <MenuItem value="Activity">Hoạt động</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select label="Trạng thái">
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="upcoming">Sắp diễn ra</MenuItem>
                  <MenuItem value="scheduled">Đã lên lịch</MenuItem>
                  <MenuItem value="completed">Đã hoàn thành</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" color="primary" fullWidth>
                Lọc
              </Button>
            </Grid>
          </Grid>
        </ArgonBox>

        {/* Calendar View */}
        <Grid container spacing={3}>
          {/* Events List */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={3}>
                  Sự kiện sắp tới
                </ArgonTypography>

                <List>
                  {events.map((event) => (
                    <ListItem key={event.id} sx={{ px: 0, mb: 2 }}>
                      <ListItemIcon>
                        <i className={getTypeIcon(event.type)} style={{ color: `var(--${getTypeColor(event.type)}-main)` }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <ArgonBox display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                              {event.title}
                            </ArgonTypography>
                            <ArgonBox display="flex" gap={1}>
                              <Chip
                                label={event.type}
                                color={getTypeColor(event.type)}
                                size="small"
                              />
                              <Chip
                                label={event.status}
                                color={event.status === "Sắp diễn ra" ? "warning" : "info"}
                                size="small"
                              />
                            </ArgonBox>
                          </ArgonBox>
                        }
                        secondary={
                          <ArgonBox>
                            <ArgonTypography variant="body2" color="text" mb={1}>
                              📅 {event.date} • ⏰ {event.time}
                            </ArgonTypography>
                            <ArgonTypography variant="body2" color="text" mb={1}>
                              📍 {event.location}
                            </ArgonTypography>
                            <ArgonTypography variant="body2" color="text">
                              {event.description}
                            </ArgonTypography>
                          </ArgonBox>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Calendar Widget */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={3}>
                  Tháng 12/2024
                </ArgonTypography>

                {/* Simple Calendar Grid */}
                <ArgonBox>
                  <Grid container spacing={1}>
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                      <Grid item xs key={day}>
                        <ArgonBox textAlign="center" py={1}>
                          <ArgonTypography variant="caption" fontWeight="bold" color="text">
                            {day}
                          </ArgonTypography>
                        </ArgonBox>
                      </Grid>
                    ))}
                    
                    {/* Calendar days */}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <Grid item xs key={day}>
                        <ArgonBox
                          textAlign="center"
                          py={1}
                          sx={{
                            cursor: "pointer",
                            borderRadius: 1,
                            backgroundColor: day === 15 ? "#e3f2fd" : "transparent",
                            "&:hover": { backgroundColor: "#f5f5f5" }
                          }}
                        >
                          <ArgonTypography 
                            variant="caption" 
                            color={day === 15 ? "primary" : "text"}
                            fontWeight={day === 15 ? "bold" : "regular"}
                          >
                            {day}
                          </ArgonTypography>
                        </ArgonBox>
                      </Grid>
                    ))}
                  </Grid>
                </ArgonBox>

                <Divider sx={{ my: 3 }} />

                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
                  Chú thích
                </ArgonTypography>
                
                <ArgonBox display="flex" flexDirection="column" gap={1}>
                  {categories.map((category) => (
                    <ArgonBox key={category.value} display="flex" alignItems="center">
                      <i className={getTypeIcon(category.value)} style={{ marginRight: 8, color: `var(--${getTypeColor(category.value)}-main)` }} />
                      <ArgonTypography variant="caption" color="text">
                        {category.label}
                      </ArgonTypography>
                    </ArgonBox>
                  ))}
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ClassCalendar;
