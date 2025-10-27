/**
=========================================================
* KidsLink Parent Dashboard - Child Info Card
=========================================================
*/

// @mui material components
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

function ChildInfoCard() {
  return (
    <Card>
      <CardContent>
        <ArgonBox display="flex" alignItems="center" mb={2}>
          <Avatar
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
            alt="Child Avatar"
            sx={{ width: 60, height: 60, mr: 2 }}
          />
          <ArgonBox>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
              Nguyễn Minh Anh
            </ArgonTypography>
            <ArgonTypography variant="body2" color="text">
              Lớp: Mầm Non A1
            </ArgonTypography>
            <ArgonTypography variant="body2" color="text">
              Tuổi: 4 tuổi
            </ArgonTypography>
          </ArgonBox>
        </ArgonBox>

        <ArgonBox mb={2}>
          <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
            Thông tin sức khỏe:
          </ArgonTypography>
          <ArgonTypography variant="body2" color="success" fontWeight="medium">
            ✓ Sức khỏe tốt
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text">
            Cập nhật lần cuối: 15/12/2024
          </ArgonTypography>
        </ArgonBox>

        <ArgonBox mb={2}>
          <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
            Thông tin đón:
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text">
            Người đón: Nguyễn Văn A (Bố)
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text">
            SĐT: 0901234567
          </ArgonTypography>
        </ArgonBox>

        <ArgonBox display="flex" gap={1}>
          <Button variant="contained" color="primary" size="small" fullWidth>
            Cập nhật thông tin
          </Button>
          <Button variant="outlined" color="primary" size="small" fullWidth>
            Quản lý đón
          </Button>
        </ArgonBox>
      </CardContent>
    </Card>
  );
}

export default ChildInfoCard;
