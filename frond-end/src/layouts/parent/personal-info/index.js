/**
=========================================================
* KidsLink Parent Dashboard - Personal Information
=========================================================
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
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

function PersonalInformation() {
  const parentInfo = {
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "0901234567",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    job: "Kỹ sư phần mềm",
    company: "Công ty ABC",
    relationship: "Bố",
    idCard: "123456789",
    birthDate: "15/03/1985"
  };

  const notificationSettings = [
    { id: 1, title: "Thông báo bài viết mới", enabled: true },
    { id: 2, title: "Thông báo tin nhắn", enabled: true },
    { id: 3, title: "Thông báo sự kiện", enabled: false },
    { id: 4, title: "Thông báo học phí", enabled: true },
    { id: 5, title: "Thông báo sức khỏe", enabled: true },
    { id: 6, title: "Thông báo email", enabled: false }
  ];

  const recentActivities = [
    {
      id: 1,
      action: "Cập nhật thông tin con",
      time: "15/12/2024 14:30",
      icon: "ni ni-single-02"
    },
    {
      id: 2,
      action: "Thanh toán học phí",
      time: "14/12/2024 10:15",
      icon: "ni ni-credit-card"
    },
    {
      id: 3,
      action: "Gửi tin nhắn cho giáo viên",
      time: "13/12/2024 16:45",
      icon: "ni ni-chat-round"
    },
    {
      id: 4,
      action: "Xem báo cáo hàng ngày",
      time: "12/12/2024 09:20",
      icon: "ni ni-calendar-grid-58"
    }
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Thông tin cá nhân
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </ArgonTypography>
        </ArgonBox>

        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" flexDirection="column" alignItems="center" mb={3}>
                  <Avatar
                    src={parentInfo.avatar}
                    alt={parentInfo.name}
                    sx={{ width: 100, height: 100, mb: 2 }}
                  />
                  <ArgonTypography variant="h5" fontWeight="bold" color="dark" textAlign="center">
                    {parentInfo.name}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" textAlign="center">
                    {parentInfo.relationship} của Minh Anh
                  </ArgonTypography>
                </ArgonBox>

                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    📧 Email: {parentInfo.email}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    📞 SĐT: {parentInfo.phone}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    📍 Địa chỉ: {parentInfo.address}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    💼 Nghề nghiệp: {parentInfo.job}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    🏢 Công ty: {parentInfo.company}
                  </ArgonTypography>
                </ArgonBox>

                <Button variant="contained" color="primary" fullWidth>
                  Thay đổi ảnh đại diện
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Edit Form */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={3}>
                  Chỉnh sửa thông tin
                </ArgonTypography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      defaultValue={parentInfo.name}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      defaultValue={parentInfo.email}
                      variant="outlined"
                      type="email"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      defaultValue={parentInfo.phone}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="CMND/CCCD"
                      defaultValue={parentInfo.idCard}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Ngày sinh"
                      defaultValue={parentInfo.birthDate}
                      variant="outlined"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Mối quan hệ</InputLabel>
                      <Select
                        value={parentInfo.relationship}
                        label="Mối quan hệ"
                      >
                        <MenuItem value="Bố">Bố</MenuItem>
                        <MenuItem value="Mẹ">Mẹ</MenuItem>
                        <MenuItem value="Người giám hộ">Người giám hộ</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nghề nghiệp"
                      defaultValue={parentInfo.job}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Công ty"
                      defaultValue={parentInfo.company}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      defaultValue={parentInfo.address}
                      variant="outlined"
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>

                <ArgonBox display="flex" gap={2} mt={3}>
                  <Button variant="contained" color="primary">
                    Lưu thay đổi
                  </Button>
                  <Button variant="outlined" color="primary">
                    Hủy
                  </Button>
                </ArgonBox>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={3}>
                  Cài đặt thông báo
                </ArgonTypography>

                <List>
                  {notificationSettings.map((setting) => (
                    <ListItem key={setting.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <i className="ni ni-notification-70" style={{ color: "#4caf50" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <ArgonTypography variant="body1" color="dark">
                            {setting.title}
                          </ArgonTypography>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={setting.enabled}
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activities */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={3}>
              Hoạt động gần đây
            </ArgonTypography>

            <List>
              {recentActivities.map((activity) => (
                <ListItem key={activity.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <i className={activity.icon} style={{ color: "#4caf50" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <ArgonTypography variant="body1" color="dark">
                        {activity.action}
                      </ArgonTypography>
                    }
                    secondary={
                      <ArgonTypography variant="body2" color="text">
                        {activity.time}
                      </ArgonTypography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default PersonalInformation;
