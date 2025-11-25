import React, { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DefaultDoughnutChart from "examples/Charts/DoughnutCharts/DefaultDoughnutChart";
import DefaultLineChart from "examples/Charts/LineCharts/DefaultLineChart";
import colorsTheme from "assets/theme/base/colors";
import adminService from "services/adminService";
import api from "services/api";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    inactiveSchools: 0,
    totalUsers: 0,
    usersByRole: {},
  });

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Lấy tất cả schools (với limit lớn để lấy hết)
        const schoolsRes = await adminService.getAllSchools(1, 1000, '');
        const schoolsData = schoolsRes?.data?.schools || schoolsRes?.data || [];
        
        // Lấy tất cả users
        const usersRes = await api.get('/users?limit=10000&page=1', true).catch(() => ({ success: false, data: [] }));
        // Response có cấu trúc: { success: true, data: [...], pagination: {...} }
        const usersData = usersRes?.success && Array.isArray(usersRes?.data) 
          ? usersRes.data 
          : (Array.isArray(usersRes?.data) ? usersRes.data : []);

        if (!mounted) return;

        setSchools(schoolsData);
        setUsers(usersData);

        // Tính toán thống kê
        const activeSchools = schoolsData.filter(s => s.status === 1).length;
        const inactiveSchools = schoolsData.filter(s => s.status === 0).length;
        
        const usersByRole = usersData.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});

        setStats({
          totalSchools: schoolsData.length,
          activeSchools,
          inactiveSchools,
          totalUsers: usersData.length,
          usersByRole,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  const schoolStatusChart = useMemo(() => {
    return {
      labels: ["Hoạt động", "Vô hiệu hóa"],
      datasets: {
        label: "Trường học",
        backgroundColors: ["#22c55e", "#ef4444"],
        data: [stats.activeSchools, stats.inactiveSchools],
      },
    };
  }, [stats.activeSchools, stats.inactiveSchools]);

  const usersByRoleChart = useMemo(() => {
    const roleLabels = {
      admin: "Quản trị viên",
      school_admin: "Quản trị trường",
      teacher: "Giáo viên",
      parent: "Phụ huynh",
      health_care_staff: "Nhân viên y tế",
      nutrition_staff: "Nhân viên dinh dưỡng",
    };

    const labels = Object.keys(stats.usersByRole).map(role => roleLabels[role] || role);
    const data = Object.values(stats.usersByRole);
    const gradientKeys = ["info", "warning", "success", "primary", "error", "secondary"];
    
    return {
      labels,
      datasets: {
        label: "Người dùng",
        backgroundColors: gradientKeys.slice(0, labels.length),
        data,
      },
    };
  }, [stats.usersByRole]);

  const schoolsByMonth = useMemo(() => {
    const map = new Map();
    schools.forEach((school) => {
      const d = new Date(school.createdAt || school.created_at || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    const sortedKeys = Array.from(map.keys()).sort();
    return {
      labels: sortedKeys,
      datasets: [{ label: "Trường học", color: "info", data: sortedKeys.map(k => map.get(k)) }],
    };
  }, [schools]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <ArgonBox mb={3}>
          <ArgonTypography variant="h5" fontWeight="bold" color="dark">
            Tổng quan hệ thống
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" mt={0.5}>
            Quản lý và theo dõi toàn bộ hệ thống KidsLink
          </ArgonTypography>
        </ArgonBox>

        {loading ? (
          <ArgonBox p={3} bgcolor="white" borderRadius={2} display="flex" justifyContent="center">
            <CircularProgress size={28} />
          </ArgonBox>
        ) : (
          <>
            {/* KPI Cards */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 2,
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                    transition: 'transform 180ms ease, box-shadow 180ms ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.18)'
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: '#3b82f622',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                      }}
                    >
                      <SchoolIcon />
                    </Box>
                    <ArgonTypography variant="button" color="text" fontWeight="medium" textTransform="uppercase">
                      Tổng trường học
                    </ArgonTypography>
                  </Box>
                  <ArgonTypography variant="h4" color="dark" fontWeight="bold" mb={0.5}>
                    {stats.totalSchools}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    Tổng số trường học trong hệ thống
                  </ArgonTypography>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 2,
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                    transition: 'transform 180ms ease, box-shadow 180ms ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.18)'
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: '#22c55e22',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#22c55e',
                      }}
                    >
                      <CheckCircleIcon />
                    </Box>
                    <ArgonTypography variant="button" color="text" fontWeight="medium" textTransform="uppercase">
                      Trường hoạt động
                    </ArgonTypography>
                  </Box>
                  <ArgonTypography variant="h4" color="dark" fontWeight="bold" mb={0.5}>
                    {stats.activeSchools}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    Đang hoạt động trong hệ thống
                  </ArgonTypography>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 2,
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                    transition: 'transform 180ms ease, box-shadow 180ms ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.18)'
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: '#ef444422',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ef4444',
                      }}
                    >
                      <CancelIcon />
                    </Box>
                    <ArgonTypography variant="button" color="text" fontWeight="medium" textTransform="uppercase">
                      Trường vô hiệu hóa
                    </ArgonTypography>
                  </Box>
                  <ArgonTypography variant="h4" color="dark" fontWeight="bold" mb={0.5}>
                    {stats.inactiveSchools}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    Đã bị vô hiệu hóa
                  </ArgonTypography>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 2,
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                    transition: 'transform 180ms ease, box-shadow 180ms ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.18)'
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: '#f59e0b22',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f59e0b',
                      }}
                    >
                      <PeopleIcon />
                    </Box>
                    <ArgonTypography variant="button" color="text" fontWeight="medium" textTransform="uppercase">
                      Tổng người dùng
                    </ArgonTypography>
                  </Box>
                  <ArgonTypography variant="h4" color="dark" fontWeight="bold" mb={0.5}>
                    {stats.totalUsers}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    Tổng số người dùng trong hệ thống
                  </ArgonTypography>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    height: 400,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <ArgonTypography variant="h6" mb={2} fontWeight="bold">
                    Phân bố trạng thái trường học
                  </ArgonTypography>
                  <Box sx={{ flexGrow: 1 }}>
                    <DefaultDoughnutChart title="" height={300} chart={schoolStatusChart} />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    height: 400,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <ArgonTypography variant="h6" mb={2} fontWeight="bold">
                    Phân bố người dùng theo vai trò
                  </ArgonTypography>
                  <Box sx={{ flexGrow: 1 }}>
                    <DefaultDoughnutChart title="" height={300} chart={usersByRoleChart} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Schools Growth Chart */}
            {schoolsByMonth.labels.length > 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      bgcolor: 'white',
                      borderRadius: 2,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      height: 400,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <ArgonTypography variant="h6" mb={2} fontWeight="bold">
                      Tăng trưởng số lượng trường học theo tháng
                    </ArgonTypography>
                    <Box sx={{ flexGrow: 1 }}>
                      <DefaultLineChart
                        icon={{}}
                        title=""
                        description=""
                        height={300}
                        chart={schoolsByMonth}
                      />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AdminDashboard;

