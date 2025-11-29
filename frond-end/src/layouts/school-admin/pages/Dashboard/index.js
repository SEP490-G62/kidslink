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
import api from "services/api";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

function SchoolDashboard() {
  const getStudentCreationDate = (student) => {
    const raw =
      student.created_at ||
      student.createdAt ||
      student.enrolled_at ||
      student.enrolledAt ||
      null;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [growthView, setGrowthView] = useState("month"); // month | year
  const [monthStart, setMonthStart] = useState("");
  const [monthEnd, setMonthEnd] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const schoolResponse = await api.get(`/school-admin/school`, true);
        const resolvedSchool = schoolResponse?.data || schoolResponse?.school || schoolResponse || null;
        const resolvedSchoolId = resolvedSchool?._id ? resolvedSchool._id.toString() : null;
        setSchoolInfo(resolvedSchool);

        const studentEndpoint = resolvedSchoolId
          ? `/student/all?school_id=${resolvedSchoolId}`
          : `/student/all`;

        const [u, c, p, s] = await Promise.all([
          api.get(`/users?limit=1000&page=1`, true).catch(() => ({ data: [] })),
          api.get(`/classes`, true).catch(() => []),
          api.get(`/school-admin/posts`, true).catch(() => []),
          api.get(studentEndpoint, true).catch(() => ({ students: [] })),
        ]);
        if (!mounted) return;
        setUsers(Array.isArray(u?.data) ? u.data : (u?.data?.data || []));
        setClasses(Array.isArray(c) ? c : (c?.data || []));
        setPosts(Array.isArray(p) ? p : (p?.data || []));
        const rawStudents = Array.isArray(s) ? s : (s?.students || s?.data || []);
        setStudents(Array.isArray(rawStudents) ? rawStudents : []);
      } catch (error) {
        console.error("SchoolDashboard fetch error:", error);
        if (mounted) {
          setErrorMessage(error.message || "Không thể tải dữ liệu trường học");
          setUsers([]);
          setClasses([]);
          setPosts([]);
          setStudents([]);
        }
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

  const timelineBounds = useMemo(() => {
    let minYear = Infinity;
    let maxYear = -Infinity;
    students.forEach((student) => {
      const date = getStudentCreationDate(student);
      if (!date) return;
      const year = date.getFullYear();
      if (year < minYear) minYear = year;
      if (year > maxYear) maxYear = year;
    });
    if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
      const currentYear = new Date().getFullYear();
      return { minYear: currentYear, maxYear: currentYear };
    }
    return { minYear, maxYear };
  }, [students]);

  const availableYears = useMemo(() => {
    const years = [];
    for (let year = timelineBounds.minYear; year <= timelineBounds.maxYear; year += 1) {
      years.push(`${year}`);
    }
    return years;
  }, [timelineBounds]);

  const availableMonths = useMemo(() => {
    const months = [];
    for (let year = timelineBounds.minYear; year <= timelineBounds.maxYear; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        months.push(`${year}-${String(month).padStart(2, "0")}`);
      }
    }
    return months;
  }, [timelineBounds]);

  const monthEndOptions = useMemo(() => {
    if (!monthStart) return availableMonths;
    return availableMonths.filter((m) => m >= monthStart);
  }, [availableMonths, monthStart]);

  const yearEndOptions = useMemo(() => {
    if (!yearStart) return availableYears;
    return availableYears.filter((y) => y >= yearStart);
  }, [availableYears, yearStart]);

  useEffect(() => {
    if (!availableMonths.length) return;
    const latestYear = availableMonths[availableMonths.length - 1]?.split("-")?.[0];
    const startOfYear = latestYear ? `${latestYear}-01` : availableMonths[0];
    const endOfYear = latestYear ? `${latestYear}-12` : availableMonths[availableMonths.length - 1];
    if (!monthStart) setMonthStart(startOfYear);
    if (!monthEnd) setMonthEnd(endOfYear);
  }, [availableMonths, monthStart, monthEnd]);

  useEffect(() => {
    if (monthStart && monthEnd && monthEnd < monthStart) {
      setMonthEnd(monthStart);
    }
  }, [monthStart, monthEnd]);

  useEffect(() => {
    if (!availableYears.length) return;
    const minYear = availableYears[0];
    const maxYear = availableYears[availableYears.length - 1];
    if (!yearStart) setYearStart(minYear);
    if (!yearEnd) setYearEnd(maxYear);
  }, [availableYears, yearStart, yearEnd]);

  useEffect(() => {
    if (yearStart && yearEnd && yearEnd < yearStart) {
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
    const normalizeMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const thisMonthKey = normalizeMonthKey(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = normalizeMonthKey(lastMonthDate);

    let thisMonthCount = 0;
    let lastMonthCount = 0;

    students.forEach((student) => {
      const createdAt = student.created_at || student.createdAt || student.enrolled_at || student.enrolledAt;
      if (!createdAt) return;
      const createdDate = new Date(createdAt);
      if (Number.isNaN(createdDate.getTime())) return;
      const key = normalizeMonthKey(createdDate);
      if (key === thisMonthKey) {
        thisMonthCount += 1;
      } else if (key === lastMonthKey) {
        lastMonthCount += 1;
      }
    });

    return {
      thisCount: thisMonthCount,
      lastCount: lastMonthCount,
      diff: thisMonthCount - lastMonthCount,
    };
  }, [students]);

  const studentsGrowthLine = useMemo(() => {
    const incrementMap = new Map();
    const formatMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    students.forEach((student) => {
      const date = getStudentCreationDate(student);
      if (!date) return;
      const key = growthView === "year" ? `${date.getFullYear()}` : formatMonthKey(date);
      incrementMap.set(key, (incrementMap.get(key) || 0) + 1);
    });

    const buildMonthRange = (startKey, endKey) => {
      if (!startKey || !endKey) return [];
      const [startYear, startMonth] = startKey.split("-").map(Number);
      const [endYear, endMonth] = endKey.split("-").map(Number);
      const result = [];
      let currentYear = startYear;
      let currentMonth = startMonth;
      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        result.push(`${currentYear}-${String(currentMonth).padStart(2, "0")}`);
        currentMonth += 1;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear += 1;
        }
      }
      return result;
    };

    const buildYearRange = (startYear, endYear) => {
      if (!startYear || !endYear) return [];
      const start = Number(startYear);
      const end = Number(endYear);
      if (Number.isNaN(start) || Number.isNaN(end)) return [];
      const result = [];
      for (let year = start; year <= end; year += 1) {
        result.push(`${year}`);
      }
      return result;
    };

    let labels = [];
    if (growthView === "month" && monthStart && monthEnd) {
      labels = buildMonthRange(monthStart, monthEnd);
    } else if (growthView === "year" && yearStart && yearEnd) {
      labels = buildYearRange(yearStart, yearEnd);
    } else {
      labels = Array.from(incrementMap.keys()).sort();
    }

    if (!labels.length) {
      return {
        labels: ["Chưa có dữ liệu"],
        datasets: [{ label: "Học sinh mới", color: "primary", data: [0] }],
      };
    }

    const dataset = labels.map((label) => incrementMap.get(label) || 0);

    return {
      labels,
      datasets: [{ label: "Học sinh mới", color: "primary", data: dataset }],
    };
  }, [students, growthView, monthStart, monthEnd, yearStart, yearEnd]);

  const ageOrClassDistribution = useMemo(() => {
    const ageBuckets = [
      { label: "0-2 tuổi", min: 0, max: 3 },
      { label: "3-4 tuổi", min: 3, max: 5 },
      { label: "5-6 tuổi", min: 5, max: 7 },
      { label: "7+ tuổi", min: 7, max: Infinity },
    ];
    const bucketCount = new Map(ageBuckets.map((bucket) => [bucket.label, 0]));
    let missingDobCount = 0;
    const now = new Date();

    students.forEach((student) => {
      const dob = student.dob || student.date_of_birth || student.dateOfBirth || student.birth_date || student.birthDate;
      const birthDate = dob ? new Date(dob) : null;
      if (!birthDate || Number.isNaN(birthDate.getTime())) {
        missingDobCount += 1;
        return;
      }
      const ageYears = (now - birthDate) / (1000 * 60 * 60 * 24 * 365.25);
      const matchedBucket = ageBuckets.find((bucket) => ageYears >= bucket.min && ageYears < bucket.max);
      const key = matchedBucket ? matchedBucket.label : "Khác";
      bucketCount.set(key, (bucketCount.get(key) || 0) + 1);
    });

    if (missingDobCount > 0) {
      bucketCount.set("Khác", (bucketCount.get("Khác") || 0) + missingDobCount);
    }

    const orderedLabels = ageBuckets.map((bucket) => bucket.label);
    if (bucketCount.get("Khác")) {
      orderedLabels.push("Khác");
    }

    const labels = orderedLabels.filter((label) => (bucketCount.get(label) || 0) > 0);
    if (labels.length === 0) {
      return {
        labels: ["Chưa có dữ liệu"],
        colors: [colorsTheme.info.main],
        datasets: { label: "Số HS", backgroundColors: ["info"], data: [0] },
      };
    }

    const gradientKeys = ["info", "warning", "success", "primary", "error", "secondary", "dark", "info"];
    const resolve = (key) => {
      const { gradients, dark } = colorsTheme;
      if (gradients[key]) {
        return key === "info" ? gradients.info.main : gradients[key].state;
      }
      return dark.main;
    };
    const legendColors = labels.map((_, idx) => resolve(gradientKeys[idx % gradientKeys.length]));

    return {
      labels,
      colors: legendColors,
      datasets: {
        label: "Số HS",
        backgroundColors: gradientKeys.slice(0, labels.length),
        data: labels.map((label) => bucketCount.get(label) || 0),
      },
    };
  }, [students]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} position="relative" zIndex={3}>
        <ArgonBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h5" fontWeight="bold" color="white">Tổng quan trường</ArgonTypography>
        </ArgonBox>

        {errorMessage && (
          <ArgonBox mb={2}>
            <ArgonTypography color="error" variant="body2">
              {errorMessage}
            </ArgonTypography>
          </ArgonBox>
        )}

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
                <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', height: 420, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} gap={1}>
                    <ArgonTypography variant="h6">Tăng trưởng số lượng học sinh</ArgonTypography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Select value={growthView} size="small" onChange={(e) => setGrowthView(e.target.value)} sx={{ minWidth: 120 }}>
                        <MenuItem value="month">Theo tháng</MenuItem>
                        <MenuItem value="year">Theo năm</MenuItem>
                      </Select>
                      {growthView === 'month' ? (
                        <>
                          <Select
                            size="small"
                            value={monthStart}
                            onChange={(e) => setMonthStart(e.target.value)}
                            sx={{ minWidth: 120 }}
                            MenuProps={{
                              MenuListProps: {
                                sx: {
                                  maxHeight: 260, // ~8 items
                                },
                              },
                            }}
                          >
                            {availableMonths.map((m) => (
                              <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                          </Select>
                          <Select
                            size="small"
                            value={monthEnd}
                            onChange={(e) => setMonthEnd(e.target.value)}
                            sx={{ minWidth: 120 }}
                            MenuProps={{
                              MenuListProps: {
                                sx: {
                                  maxHeight: 260,
                                },
                              },
                            }}
                          >
                            {monthEndOptions.map((m) => (
                              <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                          </Select>
                        </>
                      ) : (
                        <>
                          <Select size="small" value={yearStart} onChange={(e) => setYearStart(e.target.value)} sx={{ minWidth: 100 }}>
                            {availableYears.map((y) => (
                              <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                          </Select>
                          <Select size="small" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} sx={{ minWidth: 100 }}>
                            {yearEndOptions.map((y) => (
                              <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                          </Select>
                        </>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <DefaultLineChart icon={{}} title="" description="" height={300} chart={studentsGrowthLine} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', height: 420, display: 'flex', flexDirection: 'column' }}>
                  <ArgonTypography variant="h6" mb={1}>Phân bố độ tuổi</ArgonTypography>
                  <Box sx={{ flexGrow: 1 }}>
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
