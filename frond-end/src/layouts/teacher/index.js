/* eslint-disable no-unused-vars */
/**
=========================================================
* KidsLink Teacher Dashboard - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import TeacherNavbar from "examples/Navbars/TeacherNavbar";
import Footer from "examples/Footer";
import DetailedStatisticsCard from "examples/Cards/StatisticsCards/DetailedStatisticsCard";

function TeacherHome() {
  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* Welcome Section */}
        <ArgonBox mb={3}>
          <ArgonBox
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              p: 3,
              color: 'white',
            }}
          >
            <ArgonTypography variant="h4" fontWeight="bold" mb={1}>
              Chào mừng đến với KidsLink! 👋
            </ArgonTypography>
            <ArgonTypography variant="body1" opacity={0.9}>
              Trang dashboard dành cho giáo viên mầm non
            </ArgonTypography>
          </ArgonBox>
        </ArgonBox>
        
        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Tổng số lớp"
              count="5"
              icon={{ color: "info", component: <i className="ni ni-books" /> }}
              percentage={{ color: "success", count: "+1", text: "lớp mới tháng này" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Tổng số học sinh"
              count="120"
              icon={{ color: "success", component: <i className="ni ni-circle-08" /> }}
              percentage={{ color: "success", count: "+8", text: "học sinh mới" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Thông báo chưa đọc"
              count="12"
              icon={{ color: "warning", component: <i className="ni ni-notification-70" /> }}
              percentage={{ color: "error", count: "+3", text: "thông báo mới" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Hoạt động hôm nay"
              count="8"
              icon={{ color: "error", component: <i className="ni ni-calendar-grid-58" /> }}
              percentage={{ color: "success", count: "+2", text: "so với hôm qua" }}
            />
          </Grid>
        </Grid>

        {/* Content */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <ArgonBox>
              <ArgonTypography variant="h5" fontWeight="bold" mb={2}>
                Tổng quan lớp học
              </ArgonTypography>
              <ArgonBox p={3} bgColor="white" borderRadius={2} boxShadow={1}>
                <ArgonTypography variant="body1" color="text">
                  Đây là trang dashboard dành cho giáo viên. Bạn có thể quản lý lớp học, học sinh và các hoạt động hàng ngày tại đây.
                </ArgonTypography>
              </ArgonBox>
            </ArgonBox>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <ArgonBox>
              <ArgonTypography variant="h5" fontWeight="bold" mb={2}>
                Thông báo quan trọng
              </ArgonTypography>
              <ArgonBox p={3} bgColor="white" borderRadius={2} boxShadow={1}>
                <ArgonTypography variant="body2" color="text">
                  Không có thông báo mới
                </ArgonTypography>
              </ArgonBox>
            </ArgonBox>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default TeacherHome;