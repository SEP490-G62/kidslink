import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import SearchIcon from "@mui/icons-material/Search";
import ClassIcon from "@mui/icons-material/Class";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearIcon from "@mui/icons-material/Clear";

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
  surface: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
};

export default function ClassesList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await healthService.getClasses();
      setClasses(res.success ? res.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredClasses = normalizedQuery
    ? classes.filter((cls) => cls.class_name?.toLowerCase().includes(normalizedQuery))
    : classes;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonTypography component="div" sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
        <ArgonTypography component="div" sx={{ flexGrow: 1 }}>
          {/* Header */}
          <Card sx={{ mb: 3, borderRadius: 4, boxShadow: 3 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "16px",
                      backgroundColor: INFO_COLORS.light,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: INFO_COLORS.main,
                    }}
                  >
                    <ClassIcon fontSize="medium" />
                  </Box>
                  <Box>
                    <ArgonTypography variant="h5" fontWeight="bold">
                      Danh sách lớp y tế
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="text">
                      Theo dõi các lớp đang phụ trách và nhanh chóng truy cập danh sách học sinh
                    </ArgonTypography>
                  </Box>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                  <Chip
                    icon={<ClassIcon />}
                    label={`${filteredClasses.length} lớp`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                  <ArgonButton
                    color="info"
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadClasses}
                    sx={{ fontWeight: 600 }}
                  >
                    Làm mới
                  </ArgonButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Filter */}
          <Card
            sx={{
              mb: 3,
              background: INFO_COLORS.surface,
              border: "1px solid #e3f2fd",
              boxShadow: "0 2px 12px rgba(25,118,210,0.12)",
              borderRadius: 4,
            }}
          >
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  size="medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên lớp..."
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#fff",
                      borderRadius: 2.5,
                      "&:hover fieldset": {
                        borderColor: INFO_COLORS.main,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: INFO_COLORS.main,
                        borderWidth: 2,
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: INFO_COLORS.main }} />
                      </InputAdornment>
                    ),
                  }}
                />
                {searchQuery && (
                  <IconButton
                    color="error"
                    onClick={() => setSearchQuery("")}
                    sx={{ border: "1px solid", borderColor: "error.main" }}
                  >
                    <ClearIcon />
                  </IconButton>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Content */}
          <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
            <CardContent>
              {loading ? (
                <Grid container justifyContent="center" py={4}>
                  <CircularProgress />
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  {filteredClasses.map((cls) => (
                    <Grid key={cls._id} item xs={12} sm={6} md={4} lg={3}>
                      <Card
                        onClick={() =>
                          navigate(`/health-care/classes/${cls._id}/students`, {
                            state: { classInfo: cls },
                          })
                        }
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          cursor: "pointer",
                          border: "1px solid #e8eaf6",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            boxShadow: "0 8px 24px rgba(25,118,210,0.15)",
                            transform: "translateY(-4px)",
                          },
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: INFO_COLORS.light,
                              color: INFO_COLORS.main,
                              width: 48,
                              height: 48,
                            }}
                          >
                            {cls.class_name?.[0]?.toUpperCase() || "?"}
                          </Avatar>
                          <Box>
                            <ArgonTypography fontWeight="bold" color="#1a237e">
                              Lớp {cls.class_name}
                            </ArgonTypography>
                            <ArgonTypography variant="caption" color="text">
                              {cls.school_id?.school_name || "Không có tên trường"}
                            </ArgonTypography>
                          </Box>
                        </Stack>
                        <Divider sx={{ my: 2 }} />
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            size="small"
                            label={cls.academic_year || "Năm học ?"}
                            sx={{
                              backgroundColor: INFO_COLORS.light,
                              color: INFO_COLORS.main,
                              fontWeight: 600,
                            }}
                          />
                          {cls.class_age_id?.age_name && (
                            <Chip
                              size="small"
                              label={cls.class_age_id.age_name}
                              variant="outlined"
                              sx={{ borderColor: INFO_COLORS.main, color: INFO_COLORS.main }}
                            />
                          )}
                        </Stack>
                      </Card>
                    </Grid>
                  ))}
                  {!filteredClasses.length && !loading && (
                    <Grid item xs={12}>
                      <ArgonTypography align="center" color="text">
                        {classes.length ? "Không tìm thấy lớp phù hợp" : "Chưa có lớp nào"}
                      </ArgonTypography>
                    </Grid>
                  )}
                </Grid>
              )}
            </CardContent>
          </Card>
        </ArgonTypography>
        <Footer />
      </ArgonTypography>
    </DashboardLayout>
  );
}
