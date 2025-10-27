/**
=========================================================
* KidsLink Parent Dashboard - Child Information
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
import Chip from "@mui/material/Chip";
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

function ChildInformation() {
  const childInfo = {
    name: "Nguyễn Minh Anh",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    age: 4,
    class: "Mầm Non A1",
    birthDate: "15/03/2020",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    phone: "0901234567",
    healthStatus: "Tốt",
    allergies: ["Không có"],
    medications: ["Không có"],
    emergencyContact: {
      name: "Nguyễn Văn A",
      relationship: "Bố",
      phone: "0901234567"
    }
  };

  const pickupPersons = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      relationship: "Bố",
      phone: "0901234567",
      idCard: "123456789",
      isDefault: true
    },
    {
      id: 2,
      name: "Nguyễn Thị B",
      relationship: "Mẹ",
      phone: "0901234568",
      idCard: "123456790",
      isDefault: false
    },
    {
      id: 3,
      name: "Nguyễn Văn C",
      relationship: "Ông nội",
      phone: "0901234569",
      idCard: "123456791",
      isDefault: false
    }
  ];

  const healthRecords = [
    {
      date: "15/12/2024",
      type: "Kiểm tra định kỳ",
      status: "Bình thường",
      note: "Sức khỏe tốt, cân nặng phù hợp"
    },
    {
      date: "10/12/2024",
      type: "Tiêm phòng",
      status: "Hoàn thành",
      note: "Tiêm phòng cúm mùa"
    },
    {
      date: "05/12/2024",
      type: "Khám sức khỏe",
      status: "Bình thường",
      note: "Không có vấn đề gì"
    }
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Thông tin con
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Quản lý thông tin cá nhân và sức khỏe của con
          </ArgonTypography>
        </ArgonBox>

        <Grid container spacing={3}>
          {/* Child Basic Info */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" flexDirection="column" alignItems="center" mb={3}>
                  <Avatar
                    src={childInfo.avatar}
                    alt={childInfo.name}
                    sx={{ width: 100, height: 100, mb: 2 }}
                  />
                  <ArgonTypography variant="h5" fontWeight="bold" color="dark" textAlign="center">
                    {childInfo.name}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" textAlign="center">
                    {childInfo.class} • {childInfo.age} tuổi
                  </ArgonTypography>
                </ArgonBox>

                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    📅 Ngày sinh: {childInfo.birthDate}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    📍 Địa chỉ: {childInfo.address}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    📞 SĐT: {childInfo.phone}
                  </ArgonTypography>
                </ArgonBox>

                <Divider sx={{ my: 2 }} />

                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    🏥 Tình trạng sức khỏe:
                  </ArgonTypography>
                  <Chip label={childInfo.healthStatus} color="success" />
                </ArgonBox>

                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    ⚠️ Dị ứng:
                  </ArgonTypography>
                  {childInfo.allergies.map((allergy, index) => (
                    <Chip key={index} label={allergy} color="warning" size="small" sx={{ mr: 1 }} />
                  ))}
                </ArgonBox>

                <Button variant="contained" color="primary" fullWidth>
                  Cập nhật thông tin
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Pickup Management */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                    Quản lý người đón
                  </ArgonTypography>
                  <Button variant="contained" color="primary" size="small">
                    Thêm người đón
                  </Button>
                </ArgonBox>

                <Grid container spacing={2}>
                  {pickupPersons.map((person) => (
                    <Grid item xs={12} md={6} key={person.id}>
                      <ArgonBox 
                        p={2} 
                        sx={{ 
                          border: "1px solid #e0e0e0", 
                          borderRadius: 2,
                          backgroundColor: person.isDefault ? "#f5f5f5" : "white"
                        }}
                      >
                        <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <ArgonTypography variant="body1" fontWeight="bold" color="dark">
                            {person.name}
                          </ArgonTypography>
                          {person.isDefault && (
                            <Chip label="Mặc định" color="primary" size="small" />
                          )}
                        </ArgonBox>
                        <ArgonTypography variant="body2" color="text" mb={1}>
                          {person.relationship}
                        </ArgonTypography>
                        <ArgonTypography variant="body2" color="text" mb={1}>
                          📞 {person.phone}
                        </ArgonTypography>
                        <ArgonTypography variant="body2" color="text" mb={2}>
                          🆔 {person.idCard}
                        </ArgonTypography>
                        <ArgonBox display="flex" gap={1}>
                          <Button size="small" variant="outlined">
                            Sửa
                          </Button>
                          <Button size="small" variant="outlined" color="error">
                            Xóa
                          </Button>
                        </ArgonBox>
                      </ArgonBox>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Health Records */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={3}>
                  Lịch sử sức khỏe
                </ArgonTypography>

                <List>
                  {healthRecords.map((record, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <i className="ni ni-ambulance" style={{ color: "#4caf50" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
                            <ArgonTypography variant="body1" fontWeight="medium" color="dark">
                              {record.type}
                            </ArgonTypography>
                            <ArgonTypography variant="caption" color="text">
                              {record.date}
                            </ArgonTypography>
                          </ArgonBox>
                        }
                        secondary={
                          <ArgonBox>
                            <ArgonTypography variant="body2" color="text" mb={1}>
                              {record.note}
                            </ArgonTypography>
                            <Chip 
                              label={record.status} 
                              size="small" 
                              color={record.status === "Bình thường" ? "success" : "primary"}
                            />
                          </ArgonBox>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                <ArgonBox mt={2}>
                  <Button variant="outlined" color="primary" fullWidth>
                    Xem tất cả hồ sơ sức khỏe
                  </Button>
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

export default ChildInformation;
