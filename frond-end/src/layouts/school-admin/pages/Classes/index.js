import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  Box,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import SettingsIcon from "@mui/icons-material/Settings";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import ClassIcon from "@mui/icons-material/Class";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import api from "services/api";
import { useNavigate } from "react-router-dom";
import ClassModal from "./ClassModal";
import ClassAgeManagementModal from "./ClassAgeManagementModal";

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [yearSelectOpen, setYearSelectOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isPromoteMode, setIsPromoteMode] = useState(false);
  const [ageManagementModalOpen, setAgeManagementModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/classes", true);
      if (res.success && res.data) {
        setClasses(res.data);
      } else {
        setClasses([]);
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách lớp:", e);
      setError(e.message || "Không thể tải danh sách lớp. Vui lòng thử lại.");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return classes.filter((c) => {
      const n = c.class_name || "";
      const t1 = c?.teacher_id?.user_id?.full_name || "";
      const t2 = c?.teacher_id2?.user_id?.full_name || "";
      
      const matchesSearch = !s || (
        n.toLowerCase().includes(s) ||
        t1.toLowerCase().includes(s) ||
        t2.toLowerCase().includes(s)
      );
      
      const matchesYear = filterYear === "" || c.academic_year === filterYear;
      
      return matchesSearch && matchesYear;
    });
  }, [classes, search, filterYear]);

  // Get unique academic years for filter
  const academicYears = useMemo(() => {
    const years = [...new Set(classes.map(c => c.academic_year).filter(Boolean))];
    return years.sort().reverse();
  }, [classes]);

  const goToDetail = (id) => {
    navigate(`/school-admin/classes/${id}`);
  };

  const handleCreate = () => {
    setSelectedClass(null);
    setIsPromoteMode(false);
    setModalOpen(true);
  };

  const handleEdit = (classData) => {
    setSelectedClass(classData);
    setIsPromoteMode(false);
    setModalOpen(true);
  };

  const handlePromote = (classData) => {
    setSelectedClass(classData);
    setIsPromoteMode(true);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedClass(null);
    setIsPromoteMode(false);
  };

  const handleSuccess = () => {
    fetchClasses(); // Refresh list
  };

  const handleDelete = async (id, className) => {
    if (!window.confirm(`Bạn có chắc muốn xóa lớp "${className}"?`)) return;
    try {
      await api.delete(`/classes/${id}`, true);
      // Refresh lại danh sách từ server thay vì chỉ filter local
      await fetchClasses();
    } catch (e) {
      console.error("Lỗi khi xóa lớp:", e);
      alert("Không thể xóa lớp. Vui lòng thử lại.");
    }
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
          <ArgonButton onClick={fetchClasses} color="info">
            Thử lại
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
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ClassIcon color="primary" />
                  <ArgonTypography
                    variant="h5"
                    fontWeight="bold"
                    letterSpacing={0.2}
                  >
                    Quản lý lớp học
                  </ArgonTypography>
                </Stack>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  Quản lý các lớp học và thông tin giáo viên
                </ArgonTypography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Chip
                  icon={<ClassIcon />}
                  color="primary"
                  variant="outlined"
                  label={`${filtered.length} lớp`}
                />
                <ArgonButton
                  color="warning"
                  size="medium"
                  onClick={() => setAgeManagementModalOpen(true)}
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  sx={{
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                  }}
                >
                  Quản lý khối tuổi
                </ArgonButton>
                <ArgonButton
                  color="info"
                  size="medium"
                  onClick={handleCreate}
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                  }}
                >
                  Tạo lớp mới
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
                placeholder="Tìm kiếm theo tên lớp hoặc giáo viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 200, maxWidth: 400,  
                  width: '100%',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    width: '100%',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    width: '100% !important',
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                size="small"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                sx={{
                  minWidth: 280,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    pl: 1,
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e0e0e0",
                    borderWidth: 1.5,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                    boxShadow: "0 2px 6px rgba(25, 118, 210, 0.15)",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused": {
                    boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.1)",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1976d2",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputBase-input": {
                    fontWeight: filterYear ? 600 : 400,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        size="small"
                        edge="start"
                        sx={{ color: "#1976d2" }}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        <FilterListIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => {
                    if (!value) return "Tất cả năm học";
                    return value;
                  },
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        mt: 1,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        "& .MuiMenuItem-root": {
                          borderRadius: 1,
                          mx: 0.5,
                          my: 0.25,
                          "&:hover": {
                            backgroundColor: "#e3f2fd",
                          },
                          "&.Mui-selected": {
                            backgroundColor: "#1976d2",
                            color: "#fff",
                            "&:hover": {
                              backgroundColor: "#1565c0",
                            },
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>Tất cả năm học</em>
                </MenuItem>
                {academicYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </TextField>
              {(search || filterYear) && (
                <ArgonButton
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setSearch("");
                    setFilterYear("");
                  }}
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

        {/* Classes List */}
        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
              Danh sách lớp học ({filtered.length} lớp)
            </ArgonTypography>

            {filtered.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                <ArgonTypography variant="body1" color="text">
                  {search || filterYear
                    ? "Không tìm thấy lớp học nào phù hợp"
                    : "Chưa có dữ liệu lớp học"}
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 2, border: (theme) => `1px solid ${theme.palette.info.light}` }}>
                <Table
                  sx={{
                    tableLayout: "fixed",
                    width: "100%",
                    "& .MuiTableHead-root": {
                      display: "table-header-group !important",
                      padding: 0,
                      backgroundColor: (theme) => theme.palette.info.main,
                      "& .MuiTableCell-root": {
                        fontWeight: 700,
                        color: "#ffffff",
                        borderBottom: (theme) => `2px solid ${theme.palette.info.dark}`,
                      },
                    },
                    "& .MuiTableCell-root": {
                      padding: "14px 16px",
                      verticalAlign: "middle",
                      borderBottom: (theme) => `1px solid ${theme.palette.info.light}`,
                    },
                    "& .MuiTableBody-root .MuiTableRow-root:hover": {
                      backgroundColor: (theme) => `${theme.palette.info.light}33`,
                    },
                  }}
                >
                  <colgroup>
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "11%" }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Tên lớp
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Khối tuổi
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Năm học
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Giáo viên chính
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Giáo viên phụ
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Thao tác
                        </ArgonTypography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length > 0 ? (
                      filtered.map((c) => (
                        <TableRow key={c._id} hover>
                          <TableCell>
                            <ArgonTypography variant="body2" fontWeight="600" color="#212121">
                              {c.class_name || "-"}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" color="#424242">
                              {c.class_age_id?.age_name || c.grade || "-"}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" color="#424242">
                              {c.academic_year || "-"}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" color="#424242">
                              {c?.teacher_id?.user_id?.full_name || "-"}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" color="#424242">
                              {c?.teacher_id2?.user_id?.full_name || "-"}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              title="Xem chi tiết"
                              onClick={() => goToDetail(c._id)}
                              sx={{
                                color: "#1976d2",
                                "&:hover": {
                                  backgroundColor: "#e3f2fd",
                                },
                                mr: 0.5,
                              }}
                            >
                              <ArrowForwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              title="Chỉnh sửa"
                              onClick={() => handleEdit(c)}
                              sx={{
                                color: "#1976d2",
                                "&:hover": {
                                  backgroundColor: "#e3f2fd",
                                },
                                mr: 0.5,
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              title="Lên lớp"
                              onClick={() => handlePromote(c)}
                              sx={{
                                color: "#2e7d32",
                                "&:hover": {
                                  backgroundColor: "#e8f5e9",
                                },
                                mr: 0.5,
                              }}
                            >
                              <TrendingUpIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              title="Xóa lớp"
                              onClick={() => handleDelete(c._id, c.class_name)}
                              sx={{
                                color: "#d32f2f",
                                "&:hover": {
                                  backgroundColor: "#ffebee",
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <ArgonTypography variant="body2" color="text">
                            {search || filterYear
                              ? "Không tìm thấy lớp học nào phù hợp"
                              : "Chưa có dữ liệu lớp học"}
                          </ArgonTypography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <ClassModal
          open={modalOpen}
          onClose={handleModalClose}
          classData={selectedClass}
          onSuccess={handleSuccess}
          isPromoteMode={isPromoteMode}
        />

        <ClassAgeManagementModal
          open={ageManagementModalOpen}
          onClose={() => setAgeManagementModalOpen(false)}
        />
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default ClassesPage;
