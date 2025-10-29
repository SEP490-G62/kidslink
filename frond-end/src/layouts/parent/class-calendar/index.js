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
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useEffect, useMemo, useState } from "react";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import parentService from "services/parentService";

function ClassCalendar() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarData, setCalendarData] = useState(null);
  const [filterMonth, setFilterMonth] = useState("");

  const categories = [
    { value: "Meeting", label: "Cuộc họp" },
    { value: "Event", label: "Sự kiện" },
    { value: "Health", label: "Y tế" },
    { value: "Holiday", label: "Nghỉ lễ" },
    { value: "Activity", label: "Hoạt động" }
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await parentService.getLatestClassCalendar();
        if (mounted) setCalendarData(data);
      } catch (e) {
        if (mounted) setError(e.message || 'Không thể tải lịch lớp');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const events = useMemo(() => {
    if (!calendarData || !calendarData.calendars) return [];
    const items = [];
    for (const c of calendarData.calendars) {
      const dateObj = new Date(c.date);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const isoMonth = `${yyyy}-${mm}`;
      if (filterMonth && isoMonth !== filterMonth) continue;
      for (const s of (c.slots || [])) {
        items.push({
          id: `${c.id}-${s.id}`,
          title: s.activity?.name || s.slotName || 'Hoạt động',
          date: `${dd}/${mm}/${yyyy}`,
          time: `${s.startTime} - ${s.endTime}`,
          type: 'Activity',
          description: s.teacher?.fullName ? `GV: ${s.teacher.fullName}` : '',
          location: calendarData.class?.name || '',
          status: 'Đã lên lịch'
        });
      }
    }
    return items.sort((a, b) => {
      const [da, ma, ya] = a.date.split('/').map(Number);
      const [db, mb, yb] = b.date.split('/').map(Number);
      const ad = new Date(ya, ma - 1, da);
      const bd = new Date(yb, mb - 1, db);
      if (ad - bd !== 0) return ad - bd;
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [calendarData, filterMonth]);

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
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
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
                  Lịch học {calendarData?.class?.name ? `- ${calendarData.class.name} (${calendarData.class.academicYear})` : ''}
                </ArgonTypography>

                {loading && (
                  <ArgonBox display="flex" justifyContent="center" py={3}>
                    <CircularProgress size={24} />
                  </ArgonBox>
                )}
                {error && (
                  <Alert severity="error">{error}</Alert>
                )}
                {!loading && !error && (
                  <List>
                    {events.length === 0 && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText primary={<ArgonTypography variant="body2" color="text">Không có lịch trong tháng đã chọn</ArgonTypography>} />
                      </ListItem>
                    )}
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
                              {event.location && (
                                <ArgonTypography variant="body2" color="text" mb={1}>
                                  📍 {event.location}
                                </ArgonTypography>
                              )}
                              {event.description && (
                                <ArgonTypography variant="body2" color="text">
                                  {event.description}
                                </ArgonTypography>
                              )}
                            </ArgonBox>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Calendar Widget */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={3}>
                  {filterMonth ? `Tháng ${filterMonth.split('-')[1]}/${filterMonth.split('-')[0]}` : 'Tháng hiện tại'}
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
