import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  Divider,
  Button,
  Stack,
  Box,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import ClassIcon from "@mui/icons-material/Class";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import NotificationsIcon from "@mui/icons-material/Notifications";

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import healthService from "services/healthService";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";

const INFO_COLORS = {
  main: "#1976d2",
  dark: "#0f4c9b",
  light: "#e3f2fd",
};

export default function StudentsByClass() {
  const { classId } = useParams();
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(location.state?.classInfo || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.classInfo) {
      setClassInfo(location.state.classInfo);
    }
  }, [location.state]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await healthService.getStudentsByClass(classId);
        if (res.success) {
          setStudents(res.data || []);
        } else {
          setError(res.error || "Không thể tải danh sách học sinh");
          setStudents([]);
        }
      } catch (e) {
        console.error("Lỗi khi tải danh sách học sinh:", e);
        setError(e.message || "Không thể tải danh sách học sinh. Vui lòng thử lại.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    if (classId) {
      load();
    }
  }, [classId]);

  useEffect(() => {
    if (classInfo || !classId) return;
    let ignore = false;

    const fetchClassInfo = async () => {
      const response = await healthService.getClasses();
      if (!ignore && response.success) {
        const found = response.data.find((cls) => cls._id === classId);
        if (found) {
          setClassInfo(found);
        }
      }
    };

    fetchClassInfo();
    return () => {
      ignore = true;
    };
  }, [classId, classInfo]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredStudents = normalizedQuery
    ? students.filter((s) => s.full_name?.toLowerCase().includes(normalizedQuery))
    : students;

  const classDisplayName = useMemo(() => {
    if (classInfo?.class_name) {
      return `Lớp ${classInfo.class_name}`;
    }
    return "Lớp học";
  }, [classInfo]);

  const classMeta = useMemo(() => {
    const chips = [];
    if (classInfo?.class_age_id?.age_name) {
      chips.push(classInfo.class_age_id.age_name);
    }
    if (classInfo?.academic_year) {
      chips.push(classInfo.academic_year);
    }
    return chips;
  }, [classInfo]);

  const goToStudentPage = (student, page) => {
    navigate(`/health-care/students/${student._id}/${page}`, {
      state: { student, classInfo },
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox
          py={3}
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox py={3}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <ArgonButton onClick={() => navigate(-1)} color="info">
            Quay lại
          </ArgonButton>
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <ClassIcon color="primary" />
                  <ArgonTypography variant="h5" fontWeight="bold" letterSpacing={0.2}>
                    Học sinh - {classDisplayName}
                  </ArgonTypography>
                </Stack>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  {classInfo?.school_id?.school_name
                    ? `Trường ${classInfo.school_id.school_name}`
                    : "Danh sách học sinh và lối tắt truy cập hồ sơ sức khỏe"}
                </ArgonTypography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    icon={<PersonIcon />}
                    color="primary"
                    variant="outlined"
                    label={`${filteredStudents.length} học sinh`}
                    sx={{ fontWeight: 600 }}
                  />
                  {classMeta.map((label) => (
                    <Chip key={label} variant="outlined" label={label} sx={{ fontWeight: 600 }} />
                  ))}
                </Stack>
                <ArgonButton
                  color="secondary"
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                  }}
                >
                  Quay lại
                </ArgonButton>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Filter Section */}
        <Card
          sx={{
            mb: 3,
            background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
            border: "1px solid #e3f2fd",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <CardContent>
            <ArgonBox
              display="flex"
              gap={2}
              flexWrap="wrap"
              alignItems="center"
            >
              <TextField
                size="small"
                placeholder="Tìm kiếm theo tên học sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  maxWidth: 400,
                  width: "100%",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
                    width: "100%",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputBase-input": {
                    width: "100% !important",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
              {searchQuery && (
                <ArgonButton
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => setSearchQuery("")}
                  startIcon={<ClearIcon />}
                  sx={{
                    minWidth: 120,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 500,
                    borderWidth: 1.5,
                    "&:hover": {
                      borderWidth: 1.5,
                      backgroundColor: "#ffebee",
                      transform: "translateY(-1px)",
                      boxShadow: "0 2px 6px rgba(211, 47, 47, 0.2)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Xóa bộ lọc
                </ArgonButton>
              )}
            </ArgonBox>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
              Danh sách học sinh - {classDisplayName} ({filteredStudents.length} học sinh)
            </ArgonTypography>

            {filteredStudents.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                <ArgonTypography variant="body1" color="text">
                  {searchQuery
                    ? "Không tìm thấy học sinh nào phù hợp"
                    : "Lớp học chưa có học sinh nào"}
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <Grid container spacing={2}>
                {filteredStudents.map((s) => (
                  <Grid key={s._id} item xs={12} sm={6} md={4} lg={3}>
                    <Card
                      sx={{
                        p: 2.5,
                        textAlign: "center",
                        borderRadius: 3,
                        border: "1px solid #e3f2fd",
                        transition: "all 0.3s ease",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        "&:hover": {
                          boxShadow: "0 8px 24px rgba(25,118,210,0.15)",
                          transform: "translateY(-4px)",
                          borderColor: "#1976d2",
                        },
                      }}
                    >
                      <Avatar
                        src={s.avatar_url}
                        alt={s.full_name}
                        sx={{
                          width: 72,
                          height: 72,
                          mx: "auto",
                          mb: 1.5,
                          bgcolor: INFO_COLORS.light,
                          color: INFO_COLORS.main,
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          border: `2px solid ${INFO_COLORS.main}`,
                        }}
                      >
                        {s.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </Avatar>
                      <ArgonTypography
                        variant="h6"
                        fontWeight="bold"
                        color="#1a237e"
                        mb={0.5}
                      >
                        {s.full_name || "Chưa có tên"}
                      </ArgonTypography>
                      <Divider sx={{ my: 1.5 }} />
                      <Stack
                        direction="column"
                        spacing={1}
                        justifyContent="center"
                        sx={{ mt: "auto" }}
                      >
                        <Button
                          fullWidth
                          size="medium"
                          variant="contained"
                          color="success"
                          onClick={() => goToStudentPage(s, "records")}
                          startIcon={<HealthAndSafetyIcon />}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                            py: 1,
                            boxShadow: "0 2px 8px rgba(46,125,50,0.2)",
                            "&:hover": {
                              boxShadow: "0 4px 12px rgba(46,125,50,0.3)",
                              backgroundColor: "#2e7d32",
                            },
                          }}
                        >
                          Sổ sức khỏe
                        </Button>
                        <Button
                          fullWidth
                          size="medium"
                          variant="contained"
                          color="warning"
                          onClick={() => goToStudentPage(s, "notices")}
                          startIcon={<NotificationsIcon />}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                            py: 1,
                            boxShadow: "0 2px 8px rgba(237,108,2,0.2)",
                            "&:hover": {
                              boxShadow: "0 4px 12px rgba(237,108,2,0.3)",
                              backgroundColor: "#ed6c02",
                            },
                          }}
                        >
                          Thông báo y tế
                        </Button>
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}
