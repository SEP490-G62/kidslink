import React, { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// Note: using simple Paper KPI to avoid theme dark-mode text issues
import DefaultDoughnutChart from "examples/Charts/DoughnutCharts/DefaultDoughnutChart";
import colorsTheme from "assets/theme/base/colors";
import DefaultLineChart from "examples/Charts/LineCharts/DefaultLineChart";
import { useAuth } from "context/AuthContext";
import api from "services/api";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

function SchoolDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [growthView, setGrowthView] = useState("month"); // month | year
  const [monthStart, setMonthStart] = useState("");
  const [monthEnd, setMonthEnd] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [u, c, p, s] = await Promise.all([
          api.get(`/users?limit=1000&page=1`, true).catch(() => ({ data: [] })),
          api.get(`/classes`, true).catch(() => []),
          api.get(`/school-admin/posts`, true).catch(() => []),
          api.get(`/student/all`, true).catch(() => ({ students: [] })),
        ]);
        if (!mounted) return;
        setUsers(Array.isArray(u?.data) ? u.data : (u?.data?.data || []));
        setClasses(Array.isArray(c) ? c : (c?.data || []));
        setPosts(Array.isArray(p) ? p : (p?.data || []));
        const listS = Array.isArray(s) ? s : (s?.students || s?.data || []);
        setStudents(Array.isArray(listS) ? listS : []);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  const counts = useMemo(() => {
    const byRole = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
    const activeUsers = users.filter(u => u.status === 1).length;
    return {
      totalUsers: users.length,
      totalTeachers: byRole["teacher"] || 0,
      totalParents: byRole["parent"] || 0,
      totalClasses: classes.length,
      activeUsers,
      roleBreakdown: byRole,
    };
  }, [users, classes]);

  const availableMonths = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      const d = new Date(s.createdAt || s.created_at || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      set.add(key);
    });
    const sorted = Array.from(set).sort();
    // Giới hạn chỉ hiển thị 24 tháng gần nhất
    return sorted.slice(-24);
  }, [students]);

  const availableYears = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      const d = new Date(s.createdAt || s.created_at || Date.now());
      set.add(`${d.getFullYear()}`);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filter months for start selector: only show months <= monthEnd
  const availableMonthsForStart = useMemo(() => {
    if (!monthEnd) return availableMonths;
    return availableMonths.filter(m => m <= monthEnd);
  }, [availableMonths, monthEnd]);

  // Filter months for end selector: only show months >= monthStart
  const availableMonthsForEnd = useMemo(() => {
    if (!monthStart) return availableMonths;
    return availableMonths.filter(m => m >= monthStart);
  }, [availableMonths, monthStart]);

  // Filter years for start selector: only show years <= yearEnd
  const availableYearsForStart = useMemo(() => {
    if (!yearEnd) return availableYears;
    return availableYears.filter(y => y <= yearEnd);
  }, [availableYears, yearEnd]);

  // Filter years for end selector: only show years >= yearStart
  const availableYearsForEnd = useMemo(() => {
    if (!yearStart) return availableYears;
    return availableYears.filter(y => y >= yearStart);
  }, [availableYears, yearStart]);

  useEffect(() => {
    if (!monthStart && availableMonths.length) setMonthStart(availableMonths[0]);
    if (!monthEnd && availableMonths.length) setMonthEnd(availableMonths[availableMonths.length - 1]);
  }, [availableMonths, monthStart, monthEnd]);

  useEffect(() => {
    if (!yearStart && availableYears.length) setYearStart(availableYears[0]);
    if (!yearEnd && availableYears.length) setYearEnd(availableYears[availableYears.length - 1]);
  }, [availableYears, yearStart, yearEnd]);

  // Auto-adjust monthEnd if monthStart is after it
  useEffect(() => {
    if (monthStart && monthEnd && monthStart > monthEnd) {
      setMonthEnd(monthStart);
    }
  }, [monthStart, monthEnd]);

  // Auto-adjust yearEnd if yearStart is after it
  useEffect(() => {
    if (yearStart && yearEnd && yearStart > yearEnd) {
      setYearEnd(yearStart);
    }
  }, [yearStart, yearEnd]);

  const doughnutConfig = useMemo(() => ({
    labels: Object.keys(counts.roleBreakdown || {}),
    datasets: {
      label: "Số lượng",
      backgroundColors: ["#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF6384"],
      data: Object.values(counts.roleBreakdown || {}),
    },
  }), [counts]);

  const postsByMonth = useMemo(() => {
    const map = new Map();
    posts.forEach((p) => {
      const d = new Date(p.created_at || p.createdAt || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    const sortedKeys = Array.from(map.keys()).sort();
    return {
      labels: sortedKeys,
      datasets: [{ label: "Bài đăng", color: "info", data: sortedKeys.map(k => map.get(k)) }],
    };
  }, [posts]);

  const monthEnrollStats = useMemo(() => {
    const now = new Date();
    const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const thisKey = ym(now);
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastKey = ym(last);
    const map = new Map();
    students.forEach((s) => {
      const dt = new Date(s.createdAt || s.created_at || Date.now());
      const key = ym(dt);
      map.set(key, (map.get(key) || 0) + 1);
    });
    const thisCount = map.get(thisKey) || 0;
    const lastCount = map.get(lastKey) || 0;
    const diff = thisCount - lastCount;
    return { thisCount, lastCount, diff };
  }, [students]);

  const studentsGrowthLine = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      const d = new Date(s.createdAt || s.created_at || Date.now());
      const key = growthView === "year" ? `${d.getFullYear()}` : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    let keys = Array.from(map.keys()).sort();
    // filter by selected range
    if (growthView === "year" && yearStart && yearEnd) {
      keys = keys.filter((k) => k >= yearStart && k <= yearEnd);
    }
    if (growthView === "month" && monthStart && monthEnd) {
      keys = keys.filter((k) => k >= monthStart && k <= monthEnd);
    }
    let cumulative = 0;
    const data = keys.map((k) => { cumulative += map.get(k) || 0; return cumulative; });
    return { labels: keys, datasets: [{ label: "Học sinh", color: "primary", data }] };
  }, [students, growthView, monthStart, monthEnd, yearStart, yearEnd]);

  const ageOrClassDistribution = useMemo(() => {
    const buckets = new Map();
    const now = new Date();
    
    students.forEach((s) => {
      // Tính tuổi từ ngày sinh (dob)
      let ageLabel = "Không xác định";
      
      if (s.dob) {
        const birthDate = new Date(s.dob);
        if (!isNaN(birthDate.getTime())) {
          // Tính tuổi (năm)
          let age = now.getFullYear() - birthDate.getFullYear();
          const monthDiff = now.getMonth() - birthDate.getMonth();
          
          // Điều chỉnh nếu chưa đến sinh nhật trong năm
          if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
            age--;
          }
          
          // Phân nhóm theo độ tuổi
          if (age < 0) {
            ageLabel = "Dưới 1 tuổi";
          } else if (age < 3) {
            ageLabel = "1-2 tuổi";
          } else if (age < 4) {
            ageLabel = "3 tuổi";
          } else if (age < 5) {
            ageLabel = "4 tuổi";
          } else if (age < 6) {
            ageLabel = "5 tuổi";
          } else if (age < 7) {
            ageLabel = "6 tuổi";
          } else if (age < 8) {
            ageLabel = "7 tuổi";
          } else if (age < 9) {
            ageLabel = "8 tuổi";
          } else if (age < 10) {
            ageLabel = "9 tuổi";
          } else {
            ageLabel = "10 tuổi trở lên";
          }
        }
      }
      
      buckets.set(ageLabel, (buckets.get(ageLabel) || 0) + 1);
    });
    
    // Sắp xếp labels theo thứ tự độ tuổi
    const ageOrder = [
      "Dưới 1 tuổi",
      "1-2 tuổi",
      "3 tuổi",
      "4 tuổi",
      "5 tuổi",
      "6 tuổi",
      "7 tuổi",
      "8 tuổi",
      "9 tuổi",
      "10 tuổi trở lên",
      "Không xác định"
    ];
    
    const allLabels = Array.from(buckets.keys());
    const sortedLabels = ageOrder.filter(label => allLabels.includes(label))
      .concat(allLabels.filter(label => !ageOrder.includes(label)));
    
    const gradientKeys = ["info", "warning", "success", "primary", "error", "secondary", "dark", "info"];
    const resolve = (key) => {
      const { gradients, dark } = colorsTheme;
      if (gradients[key]) {
        return key === "info" ? gradients.info.main : gradients[key].state;
      }
      return dark.main;
    };
    const legendColors = sortedLabels.map((_, idx) => resolve(gradientKeys[idx % gradientKeys.length]));
    return {
      labels: sortedLabels,
      colors: legendColors,
      datasets: { label: "Số HS", backgroundColors: gradientKeys.slice(0, sortedLabels.length), data: sortedLabels.map(l => buckets.get(l)) },
    };
  }, [students]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} position="relative" zIndex={3}>
        <ArgonBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h5" fontWeight="bold" color="white">Tổng quan trường</ArgonTypography>
        </ArgonBox>

        {loading ? (
          <ArgonBox p={3} bgcolor="white" borderRadius={2} display="flex" justifyContent="center"><CircularProgress size={28} /></ArgonBox>
        ) : (
          <>
            <Grid container spacing={3} mb={2} sx={{ mt: -3 }}>
              {[{
                title: "Tổng lớp",
                value: counts.totalClasses,
                icon: <i className="ni ni-hat-3" />,
                color: "#3b82f6",
              }, {
                title: "Giáo viên",
                value: counts.totalTeachers,
                icon: <i className="ni ni-single-02" />,
                color: "#10b981",
              }, {
                title: "Học sinh",
                value: students.length,
                icon: <i className="ni ni-circle-08" />,
                color: "#f59e0b",
              }, {
                title: "HS nhập học (tháng này)",
                value: monthEnrollStats.thisCount,
                delta: monthEnrollStats.diff,
                icon: <i className="ni ni-chart-bar-32" />,
                color: "#8b5cf6",
              }].map((kpi, idx) => (
                <Grid item xs={12} md={6} lg={3} key={idx}>
                  <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: 2, minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.08)', transition: 'transform 180ms ease, box-shadow 180ms ease', willChange: 'transform', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 28px rgba(0,0,0,0.18)' } }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Box sx={{ width: 28, height: 28, borderRadius: '10px', backgroundColor: `${kpi.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, fontSize: 16 }}>
                        {kpi.icon}
                      </Box>
                      <ArgonTypography variant="button" color="text" fontWeight="medium" textTransform="uppercase">
                        {kpi.title}
                      </ArgonTypography>
                    </Box>
                    <ArgonTypography variant="h5" color="dark" fontWeight="bold" mb={0.5} sx={{ letterSpacing: 0.2 }}>
                      {kpi.value}
                    </ArgonTypography>
                    <ArgonTypography variant="caption" fontWeight="bold" color={kpi.delta !== undefined ? (kpi.delta >= 0 ? 'success' : 'error') : 'text'} sx={{ visibility: kpi.delta === undefined ? 'hidden' : 'visible' }}>
                      {kpi.delta !== undefined ? (kpi.delta >= 0 ? `+${kpi.delta}` : kpi.delta) : '0'} <ArgonTypography component="span" variant="caption" color="text">so với tháng trước</ArgonTypography>
                    </ArgonTypography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3} mb={3} sx={{ mt: 0, position: 'relative', zIndex: 5 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', height: 450, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <Box mb={1.5} display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
                    <ArgonTypography variant="h6" fontWeight="bold">
                      Tăng trưởng số lượng học sinh
                    </ArgonTypography>
                    <Box display="flex" alignItems="flex-start" gap={2} flexWrap="wrap">
                      <Box>
                        <ArgonTypography variant="caption" fontWeight="bold" color="text" mb={0.5} display="block">
                          Xem theo
                        </ArgonTypography>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select value={growthView} onChange={(e) => setGrowthView(e.target.value)}>
                            <MenuItem value="month">Theo tháng</MenuItem>
                            <MenuItem value="year">Theo năm</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      {growthView === 'month' ? (
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <Box>
                            <ArgonTypography variant="caption" fontWeight="bold" color="text" mb={0.5} display="block">
                              Từ tháng
                            </ArgonTypography>
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                              <Select value={monthStart} onChange={(e) => setMonthStart(e.target.value)}>
                                {availableMonthsForStart.map((m) => (
                                  <MenuItem key={m} value={m}>{m}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                          <Box sx={{ mt: 3 }}>
                            <ArrowForwardIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <ArgonTypography variant="caption" fontWeight="bold" color="text" mb={0.5} display="block">
                              Đến tháng
                            </ArgonTypography>
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                              <Select value={monthEnd} onChange={(e) => setMonthEnd(e.target.value)}>
                                {availableMonthsForEnd.map((m) => (
                                  <MenuItem key={m} value={m}>{m}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        </Box>
                      ) : (
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <Box>
                            <ArgonTypography variant="caption" fontWeight="bold" color="text" mb={0.5} display="block">
                              Từ năm
                            </ArgonTypography>
                            <FormControl size="small" sx={{ minWidth: 110 }}>
                              <Select value={yearStart} onChange={(e) => setYearStart(e.target.value)}>
                                {availableYearsForStart.map((y) => (
                                  <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                          <Box sx={{ mt: 3 }}>
                            <ArrowForwardIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <ArgonTypography variant="caption" fontWeight="bold" color="text" mb={0.5} display="block">
                              Đến năm
                            </ArgonTypography>
                            <FormControl size="small" sx={{ minWidth: 110 }}>
                              <Select value={yearEnd} onChange={(e) => setYearEnd(e.target.value)}>
                                {availableYearsForEnd.map((y) => (
                                  <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
                    <DefaultLineChart icon={{}} title="" description="" height={280} chart={studentsGrowthLine} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', height: 450, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <ArgonTypography variant="h6" mb={1}>Phân bố độ tuổi</ArgonTypography>
                  <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
                    <DefaultDoughnutChart title="" height={280} chart={ageOrClassDistribution} />
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={0.75} mt={1} sx={{ maxWidth: '100%', justifyContent: 'center' }}>
                    {ageOrClassDistribution.labels.map((label, idx) => (
                      <Box key={label} display="flex" alignItems="center" gap={0.75} mr={2}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: ageOrClassDistribution.colors[idx] }} />
                        <ArgonTypography variant="caption">{label}</ArgonTypography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </ArgonBox>
    </DashboardLayout>
  );
}

export default SchoolDashboard;
