import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import InputLabel from "@mui/material/InputLabel";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import RefreshIcon from "@mui/icons-material/Refresh";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import StudentFormModal from "./StudentFormModal";
import ParentManagerModal from "./ParentManagerModal";
import schoolAdminService from "services/schoolAdminService";

const STATUS_META = {
  1: { label: "Đang học", color: "success" },
  0: { label: "Ngưng học", color: "warning" },
};

const filterFieldSx = (minWidth = 220) => ({
  flex: 1,
  minWidth,
  maxWidth: "100%",
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
});

const labelSx = {
  position: "relative",
  transform: "none",
  mb: 0.5,
  fontWeight: 600,
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch (err) {
    return "-";
  }
};

// Helper function to parse academic year and get start year
const parseAcademicYear = (academicYear) => {
  if (!academicYear || typeof academicYear !== 'string') return -Infinity;
  const parts = academicYear.split('-');
  const startYear = parseInt(parts[0], 10);
  return Number.isFinite(startYear) ? startYear : -Infinity;
};

// Helper function to normalize class ID for comparison
const normalizeClassId = (classId) => {
  if (!classId) return null;
  if (typeof classId === 'object') {
    if (classId._id !== undefined && classId._id !== null) {
      return String(classId._id);
    } else if (classId.toString && typeof classId.toString === 'function') {
      return String(classId);
    }
  } else if (typeof classId === 'string') {
    return String(classId);
  }
  return null;
};

const ChildrenPage = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [parentModalStudent, setParentModalStudent] = useState(null);

  useEffect(() => {
    const fetchInit = async () => {
      setLoading(true);
      await Promise.all([loadStudents(), loadClasses()]);
      setLoading(false);
    };
    fetchInit();
  }, []);

  const normalizeStudents = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.students)) return payload.students;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const loadStudents = async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await schoolAdminService.getStudents();
      const studentsList = normalizeStudents(res);
      console.log("Loaded students:", studentsList.length);
      // Debug: log first student with class to see structure
      const studentWithClass = studentsList.find(s => s.class_id);
      if (studentWithClass) {
        console.log("Sample student with class:", {
          studentId: studentWithClass._id,
          className: studentWithClass.full_name,
          class_id: studentWithClass.class_id,
          class_id_type: typeof studentWithClass.class_id,
          class_id_id: studentWithClass.class_id?._id,
          class_id_id_type: typeof studentWithClass.class_id?._id
        });
      }
      setStudents(studentsList);
    } catch (err) {
      console.error("loadStudents error", err);
      setError(err.message || "Không thể tải danh sách học sinh.");
      setStudents([]);
    } finally {
      setRefreshing(false);
    }
  };

  const loadClasses = async () => {
    try {
      // Load only classes from latest academic year
      const res = await schoolAdminService.getClasses(true);
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      console.log("Loaded classes (latest year):", list.length, list);
      setClasses(list);
    } catch (err) {
      console.error("loadClasses error", err);
      setClasses([]);
    }
  };

  const handleOpenCreate = () => {
    setSelectedStudent(null);
    setFormOpen(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setFormOpen(true);
  };

  const handleSubmitStudent = async (payload) => {
    if (selectedStudent) {
      await schoolAdminService.updateStudent(selectedStudent._id, payload);
    } else {
      await schoolAdminService.createStudent(payload);
    }
    await loadStudents();
  };

  const handleToggleStatus = async (student) => {
    const nextStatus = student.status === 1 ? 0 : 1;
    const confirmText =
      nextStatus === 1
        ? `Kích hoạt học sinh "${student.full_name}"?`
        : `Vô hiệu hóa học sinh "${student.full_name}"?`;
    if (!window.confirm(confirmText)) return;
    try {
      await schoolAdminService.updateStudentStatus(student._id, nextStatus);
      setStudents((prev) =>
        prev.map((item) =>
          item._id === student._id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      alert(err.message || "Không thể cập nhật trạng thái học sinh.");
    }
  };

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesStatus =
        statusFilter === "" || Number(student.status) === Number(statusFilter);
      
      // Get student's class ID using helper function
      const studentClassId = normalizeClassId(student.class_id);
      
      // If filtering by class, only show students in that class
      if (classFilter) {
        const normalizedClassFilter = normalizeClassId(classFilter);
        const matchesClass = studentClassId === normalizedClassFilter;
        
        // Debug log (can be removed later)
        if (!matchesClass && studentClassId) {
          console.log('Filter mismatch:', {
            studentClassId,
            classFilter: normalizedClassFilter,
            originalClassFilter: classFilter,
            studentName: student.full_name,
            classIdType: typeof student.class_id,
            classIdValue: student.class_id
          });
        }
        
        if (!matchesClass) return false;
      }
      
      // Check if student has class in latest academic year (for display purposes)
      const hasClassInLatestYear = studentClassId && classes.length > 0 &&
        classes.some(cls => {
          const clsId = String(cls._id || cls.id);
          return clsId === studentClassId;
        });
      
      const matchesKeyword =
        !keyword ||
        student.full_name?.toLowerCase().includes(keyword);
      return matchesStatus && matchesKeyword;
    });
  }, [students, search, statusFilter, classFilter, classes]);

  const handleManageParents = (student) => {
    setParentModalStudent(student);
  };

  const hasActiveFilters = useMemo(
    () => Boolean(search.trim() || classFilter || statusFilter !== ""),
    [search, classFilter, statusFilter]
  );

  const handleResetFilters = () => {
    setSearch("");
    setClassFilter("");
    setStatusFilter("");
  };

  // Get latest academic year from classes
  const latestAcademicYear = useMemo(() => {
    if (classes.length === 0) return null;
    const years = [...new Set(classes.map(c => c.academic_year).filter(Boolean))];
    if (years.length === 0) return null;
    // Sort by start year (parse academic year to get start year)
    const sortedYears = years.sort((a, b) => {
      const yearA = parseAcademicYear(a);
      const yearB = parseAcademicYear(b);
      return yearB - yearA; // Descending order (newest first)
    });
    return sortedYears[0]; // Get the newest year
  }, [classes]);

  // Get unique academic years from classes
  const academicYears = useMemo(() => {
    const years = [...new Set(classes.map(c => c.academic_year).filter(Boolean))];
    // Sort by start year (parse academic year to get start year)
    return years.sort((a, b) => {
      const yearA = parseAcademicYear(a);
      const yearB = parseAcademicYear(b);
      return yearB - yearA; // Descending order (newest first)
    });
  }, [classes]);

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 1).length;
  const inactiveStudents = totalStudents - activeStudents;

  const renderStatusChip = (status) => {
    const meta = STATUS_META[status] || { label: "Không rõ", color: "default" };
    return <Chip label={meta.label} color={meta.color} size="small" />;
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <Card
          sx={{
            mb: 3,
            background: "linear-gradient(120deg, #f5f7fb, #ffffff)",
            border: "1px solid #e3f2fd",
          }}
        >
          <CardContent>
            <Box
              display="flex"
              flexDirection={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              gap={2}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ChildCareIcon color="primary" />
                  <ArgonTypography variant="h5" fontWeight="bold">
                    Quản lý học sinh
                  </ArgonTypography>
                </Stack>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  Theo dõi và quản lý thông tin học sinh
                </ArgonTypography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <ArgonButton
                  color="secondary"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadStudents}
                >
                  Làm mới
                </ArgonButton>
                <ArgonButton
                  color="info"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreate}
                >
                  Thêm học sinh
                </ArgonButton>
              </Stack>
            </Box>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              mt={3}
              flexWrap="wrap"
            >
              <Card sx={{ flex: 1, minWidth: 220, border: "1px solid #e0f2f1", boxShadow: "none" }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <PeopleIcon color="primary" />
                    <Box>
                      <ArgonTypography variant="caption" color="text" textTransform="uppercase">
                        Tổng học sinh
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold">
                        {totalStudents}
                      </ArgonTypography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 220, border: "1px solid #e3f2fd", boxShadow: "none" }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SchoolIcon color="success" />
                      <Box>
                      <ArgonTypography variant="caption" color="text" textTransform="uppercase">
                        Đang học
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold">
                        {activeStudents}
                      </ArgonTypography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 220, border: "1px solid #ffebee", boxShadow: "none" }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SchoolIcon color="error" />
                    <Box>
                      <ArgonTypography variant="caption" color="text" textTransform="uppercase">
                        Ngưng học
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold">
                        {inactiveStudents}
                      </ArgonTypography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            mb: 3,
            background: "linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)",
            border: "1px solid #e3f2fd",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Box sx={{ flex: 1, minWidth: 260 }}>
                <InputLabel shrink sx={labelSx}>
                  Tìm kiếm học sinh
                </InputLabel>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Nhập tên học sinh..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={filterFieldSx(260)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#1976d2" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 240 }}>
                <InputLabel shrink sx={labelSx}>
                  Lọc theo lớp
                </InputLabel>
                <TextField
                  select
                  size="small"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  sx={filterFieldSx(240)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterListIcon fontSize="small" sx={{ color: "#1976d2" }} />
                      </InputAdornment>
                    ),
                  }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (value) => {
                      if (!value) return "Tất cả lớp học";
                      const cls = classes.find((c) => String(c._id || c.id) === String(value));
                      return cls ? `${cls.class_name} (${cls.academic_year})` : value;
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Tất cả lớp học</em>
                  </MenuItem>
                  {classes.map((cls) => {
                    const clsId = String(cls._id || cls.id);
                    return (
                      <MenuItem key={clsId} value={clsId}>
                        {cls.class_name} - {cls.academic_year}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Box>
              <Box sx={{ minWidth: 200 }}>
                <InputLabel shrink sx={labelSx}>
                  Trạng thái
                </InputLabel>
                <TextField
                  select
                  size="small"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={filterFieldSx(200)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterListIcon fontSize="small" sx={{ color: "#1976d2" }} />
                      </InputAdornment>
                    ),
                  }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (value) => {
                      if (value === "") return "Trạng thái bất kỳ";
                      return Number(value) === 1 ? "Đang học" : "Ngưng học";
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Trạng thái bất kỳ</em>
                  </MenuItem>
                  <MenuItem value={1}>Đang học</MenuItem>
                  <MenuItem value={0}>Ngưng học</MenuItem>
                </TextField>
              </Box>
              {hasActiveFilters && (
                <ArgonButton
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleResetFilters}
                >
                  Xóa lọc
                </ArgonButton>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
              Danh sách học sinh ({filteredStudents.length})
            </ArgonTypography>
            {loading ? (
              <Stack alignItems="center" py={4}>
                <CircularProgress />
              </Stack>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 2,
                  border: (theme) => `1px solid ${theme.palette.info.light}`,
                  boxShadow: 3,
                }}
              >
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
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "16%" }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      <TableCell>Học sinh</TableCell>
                      <TableCell>Ngày sinh</TableCell>
                      <TableCell>Giới tính</TableCell>
                      <TableCell>Lớp</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Không có học sinh phù hợp.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              src={student.avatar_url}
                              alt={student.full_name}
                              sx={{ width: 42, height: 42 }}
                            >
                              {student.full_name?.[0] || "S"}
                            </Avatar>
                            <Box>
                              <ArgonTypography variant="button" fontWeight="medium">
                                {student.full_name}
                              </ArgonTypography>
                              <ArgonTypography variant="caption" color="text">
                                {student.allergy || "Không có ghi chú"}
                              </ArgonTypography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{formatDate(student.dob)}</TableCell>
                        <TableCell>
                          {student.gender === 1 || student.gender === "female"
                            ? "Nữ"
                            : "Nam"}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Get student's class ID using helper function
                            const studentClassId = normalizeClassId(student.class_id);
                            
                            // Check if student has a class in the latest academic year
                            // by checking if their class_id exists in the classes list (which only contains latest year classes)
                            const hasClassInLatestYear = studentClassId && classes.length > 0 &&
                              classes.some(cls => {
                                const clsId = normalizeClassId(cls._id || cls.id);
                                const matches = clsId === studentClassId;
                                // Debug log for first few comparisons
                                if (studentClassId && classes.indexOf(cls) < 3) {
                                  console.log("Class ID comparison:", {
                                    studentClassId,
                                    clsId,
                                    cls_id: cls._id,
                                    cls_id_type: typeof cls._id,
                                    matches,
                                    studentName: student.full_name
                                  });
                                }
                                return matches;
                              });
                            
                            if (hasClassInLatestYear) {
                              // Find the class object from classes list (latest year)
                              const studentClass = classes.find(cls => {
                                const clsId = String(cls._id || cls.id);
                                return clsId === studentClassId;
                              });
                              
                              if (studentClass) {
                                return `${studentClass.class_name || "Chưa gán"}${
                                  studentClass.academic_year
                                    ? ` (${studentClass.academic_year})`
                                    : ""
                                }`;
                              }
                            }
                            
                            // If student has no class or class is from older academic year
                            // Show "Chưa có lớp trong năm học này" if latest academic year exists
                            if (latestAcademicYear) {
                              return (
                                <Chip 
                                  label="Chưa có lớp trong năm học này" 
                                  color="warning" 
                                  size="small" 
                                  variant="outlined"
                                />
                              );
                            }
                            
                            // Fallback: show class info if available (for cases where latestAcademicYear is null)
                            if (student.class_id && typeof student.class_id === "object") {
                              return `${student.class_id.class_name || "Chưa gán"}${
                                student.class_id.academic_year
                                  ? ` (${student.class_id.academic_year})`
                                  : ""
                              }`;
                            }
                            
                            return "Chưa gán";
                          })()}
                        </TableCell>
                        <TableCell>{renderStatusChip(student.status)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Quản lý phụ huynh">
                            <IconButton onClick={() => handleManageParents(student)}>
                              <ManageAccountsIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa học sinh">
                            <IconButton onClick={() => handleEditStudent(student)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={student.status === 1 ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            <IconButton onClick={() => handleToggleStatus(student)}>
                              {student.status === 1 ? (
                                <LockIcon color="error" />
                              ) : (
                                <LockOpenIcon color="success" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {refreshing && (
              <ArgonTypography variant="caption" color="text" display="block" mt={1}>
                Đang đồng bộ dữ liệu mới...
              </ArgonTypography>
            )}
          </CardContent>
        </Card>
      </ArgonBox>
      <Footer />

      <StudentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        classes={classes}
        initialData={selectedStudent}
        onSubmit={handleSubmitStudent}
      />
      <ParentManagerModal
        open={Boolean(parentModalStudent)}
        studentId={parentModalStudent?._id}
        onClose={() => setParentModalStudent(null)}
      />
    </DashboardLayout>
  );
};

export default ChildrenPage;

