/**
=========================================================
* KidsLink Parent Dashboard - Quick Actions
=========================================================
*/

// @mui material components
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

function QuickActions() {
  const actions = [
    {
      title: "Xem báo cáo hàng ngày",
      icon: "ni ni-calendar-grid-58",
      color: "info",
      route: "/parent/daily-report"
    },
    {
      title: "Thanh toán học phí",
      icon: "ni ni-credit-card",
      color: "success",
      route: "/parent/payment"
    },
    {
      title: "Chat với giáo viên",
      icon: "ni ni-chat-round",
      color: "warning",
      route: "/parent/chat"
    },
    {
      title: "Khiếu nại & Phản hồi",
      icon: "ni ni-notification-70",
      color: "error",
      route: "/parent/complaints"
    },
    {
      title: "Xem thực đơn",
      icon: "ni ni-app",
      color: "primary",
      route: "/parent/menu"
    },
    {
      title: "Lịch học",
      icon: "ni ni-calendar-grid-58",
      color: "secondary",
      route: "/parent/schedule"
    }
  ];

  return (
    <Card>
      <CardContent>
        <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
          Thao tác nhanh
        </ArgonTypography>

        <Grid container spacing={2}>
          {actions.map((action, index) => (
            <Grid item xs={6} key={index}>
              <Button
                variant="outlined"
                fullWidth
                sx={{ 
                  height: 80, 
                  flexDirection: "column",
                  border: `2px solid`,
                  borderColor: `${action.color}.main`,
                  color: `${action.color}.main`,
                  "&:hover": {
                    backgroundColor: `${action.color}.main`,
                    color: "white"
                  }
                }}
              >
                <ArgonBox component="i" className={action.icon} fontSize="24px" mb={1} />
                <ArgonTypography variant="caption" textAlign="center">
                  {action.title}
                </ArgonTypography>
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default QuickActions;
