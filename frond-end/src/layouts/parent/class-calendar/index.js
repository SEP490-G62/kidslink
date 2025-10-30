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
import { useAuth } from "context/AuthContext";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";
import parentService from "services/parentService";

function ClassCalendar() {
  const { selectedChild } = useAuth();
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
        const data = await parentService.getLatestClassCalendar(selectedChild?._id);
        if (mounted) setCalendarData(data);
      } catch (e) {
        if (mounted) setError(e.message || 'Không thể tải lịch lớp');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedChild]);

  const groupedEvents = useMemo(() => {
    if (!calendarData || !calendarData.calendars) return [];
    const map = new Map();
    for (const c of calendarData.calendars) {
      const dateObj = new Date(c.date);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const isoMonth = `${yyyy}-${mm}`;
      if (filterMonth && isoMonth !== filterMonth) continue;
      const key = `${yyyy}-${mm}-${dd}`;
      const label = `${dd}/${mm}/${yyyy}`;
      if (!map.has(key)) map.set(key, { key, label, items: [] });
      for (const s of (c.slots || [])) {
        map.get(key).items.push({
          id: `${c.id}-${s.id}`,
          slotName: s.slotName,
          activityName: s.activity?.name || 'Hoạt động',
          activityDescription: s.activity?.description || '',
          requireOutdoor: s.activity?.require_outdoor === 1,
          startTime: s.startTime,
          endTime: s.endTime,
          teacherName: s.teacher?.fullName || '',
        });
      }
    }
    // sort each day's items by time asc
    const groups = Array.from(map.values()).map(g => ({
      ...g,
      items: g.items.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    }));
    // sort days by date desc (newest first)
    groups.sort((a, b) => new Date(b.key) - new Date(a.key));
    return groups;
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
                    {groupedEvents.length === 0 && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText primary={<ArgonTypography variant="body2" color="text">Không có lịch trong tháng đã chọn</ArgonTypography>} />
                      </ListItem>
                    )}
                    {groupedEvents.map((group) => (
                      <ArgonBox key={group.key} mb={2}>
                        <ArgonBox display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                            📅 {group.label}
                          </ArgonTypography>
                          <Chip label={`${group.items.length} hoạt động`} color="info" size="small" />
                        </ArgonBox>
                        {group.items.map((item) => (
                          <ListItem key={item.id} sx={{ px: 0, mb: 1.25 }}>
                            <ListItemIcon>
                              <i className="ni ni-world" style={{ color: 'var(--secondary-main)' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
                                  <ArgonTypography variant="subtitle1" fontWeight="bold" color="dark">
                                    {item.activityName}{item.slotName ? ` • ${item.slotName}` : ''}
                                  </ArgonTypography>
                                  <Chip label={`${item.startTime} - ${item.endTime}`} color="secondary" size="small" />
                                </ArgonBox>
                              }
                              secondary={
                                <ArgonBox>
                                  <ArgonBox display="flex" gap={2} mb={0.5}>
                                    {calendarData.class?.name && (
                                      <ArgonTypography variant="caption" color="text">📍 {calendarData.class.name}</ArgonTypography>
                                    )}
                                    {item.teacherName && (
                                      <ArgonTypography variant="caption" color="text">👩‍🏫 {item.teacherName}</ArgonTypography>
                                    )}
                                    {item.requireOutdoor && (
                                      <ArgonTypography variant="caption" color="text">🏞️ Ngoài trời</ArgonTypography>
                                    )}
                                  </ArgonBox>
                                  {item.activityDescription && (
                                    <ArgonTypography variant="body2" color="text">
                                      {item.activityDescription}
                                    </ArgonTypography>
                                  )}
                                </ArgonBox>
                              }
                            />
                          </ListItem>
                        ))}
                      </ArgonBox>
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
