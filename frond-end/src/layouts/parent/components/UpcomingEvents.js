/**
=========================================================
* KidsLink Parent Dashboard - Upcoming Events
=========================================================
*/

// @mui material components
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

function UpcomingEvents() {
  const events = [
    {
      id: 1,
      title: "Họp phụ huynh",
      date: "20/12/2024",
      time: "14:00",
      type: "Quan trọng",
      color: "error"
    },
    {
      id: 2,
      title: "Lễ Giáng Sinh",
      date: "25/12/2024",
      time: "09:00",
      type: "Sự kiện",
      color: "success"
    },
    {
      id: 3,
      title: "Kiểm tra sức khỏe định kỳ",
      date: "28/12/2024",
      time: "08:30",
      type: "Y tế",
      color: "info"
    },
    {
      id: 4,
      title: "Nghỉ Tết Dương lịch",
      date: "01/01/2025",
      time: "Cả ngày",
      type: "Nghỉ lễ",
      color: "warning"
    }
  ];

  const getEventIcon = (type) => {
    switch (type) {
      case "Quan trọng":
        return "ni ni-notification-70";
      case "Sự kiện":
        return "ni ni-calendar-grid-58";
      case "Y tế":
        return "ni ni-ambulance";
      case "Nghỉ lễ":
        return "ni ni-calendar-grid-58";
      default:
        return "ni ni-calendar-grid-58";
    }
  };

  return (
    <Card>
      <CardContent>
        <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
          Sự kiện sắp tới
        </ArgonTypography>

        <List>
          {events.map((event) => (
            <ListItem key={event.id} sx={{ px: 0 }}>
              <ListItemIcon>
                <ArgonBox 
                  component="i" 
                  className={getEventIcon(event.type)}
                  color={event.color}
                  fontSize="20px"
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
                    <ArgonTypography variant="body1" fontWeight="medium" color="dark">
                      {event.title}
                    </ArgonTypography>
                    <Chip 
                      label={event.type} 
                      size="small" 
                      color={event.color}
                    />
                  </ArgonBox>
                }
                secondary={
                  <ArgonBox>
                    <ArgonTypography variant="body2" color="text">
                      📅 {event.date} - {event.time}
                    </ArgonTypography>
                  </ArgonBox>
                }
              />
            </ListItem>
          ))}
        </List>

        <ArgonBox mt={2}>
          <ArgonTypography 
            variant="body2" 
            color="primary" 
            textAlign="center"
            sx={{ cursor: "pointer", textDecoration: "underline" }}
          >
            Xem lịch đầy đủ
          </ArgonTypography>
        </ArgonBox>
      </CardContent>
    </Card>
  );
}

export default UpcomingEvents;
