import React, { useEffect, useState } from "react";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  TextField,
  InputAdornment,
  Select,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import api from "services/api";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import StudentModal from "./StudentModal";
import ParentModal from "./ParentModal";

const getStatusColor = (status) => {
  switch (status) {
    case 1:
    case "present":
      return "success";
    case 0:
    case "absent":
      return "error";
    case "late":
      return "warning";
    default:
      return "default";
  }
};

const getStatusText = (status) => {
  if (status === 1) return "Hoạt động";
  if (status === 0) return "Không hoạt động";
  switch (status) {
    case "present":
      return "Có mặt";
    case "absent":
      return "Vắng mặt";
    case "late":
      return "Đi muộn";
    default:
      return "Không xác định";
  }
};

const ChildrenPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classId, setClassId] = useState(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuStudent, setMenuStudent] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [classes, setClasses] = useState([]);
  const [classSelectOpen, setClassSelectOpen] = useState(false);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("classId");
    setClassId(cid);
    
    // Fetch classes for filter
    fetchClasses();
    
    // Fetch tất cả học sinh nếu không có classId, hoặc fetch theo classId
    if (cid) {
      fetchStudents(cid);
    } else {
      fetchAllStudents();
    }
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes', true);
      const classList = Array.isArray(res) ? res : (res.data || []);
      setClasses(classList);
    } catch (e) {
      console.error('Error fetching classes:', e);
    }
  };

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/all', true);
      const list = Array.isArray(res) ? res : (res.students || []);
      setStudents(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (cid) => {
    try {
      setLoading(true);
      const res = await api.get(`/student/class/${cid}`, true);
      const list = Array.isArray(res) ? res : (res.students || []);
      setStudents(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = () => {
    // Cho phép thêm từ trang "Tất cả học sinh" - modal sẽ yêu cầu chọn lớp
    setSelectedStudent(null);
    setStudentModalOpen(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setStudentModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Bạn có chắc muốn xóa học sinh "${student.full_name}"?`)) return;
    try {
      await api.delete(`/student/${student._id}`, true);
      if (classId) {
        fetchStudents(classId);
      } else {
        fetchAllStudents();
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi xóa học sinh");
    }
    handleMenuClose();
  };

  const handleAddParent = (student) => {
    setSelectedStudent(student);
    setSelectedParent(null);
    setParentModalOpen(true);
    handleMenuClose();
  };

  const handleEditParent = (student, parent) => {
    setSelectedStudent(student);
    setSelectedParent(parent);
    setParentModalOpen(true);
  };

  const handleDeleteParent = async (parentId, studentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa phụ huynh này khỏi học sinh?")) return;
    try {
      await api.delete(`/parentcrud/${parentId}?student_id=${studentId}`, true);
      if (classId) {
        fetchStudents(classId);
      } else {
        fetchAllStudents();
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi xóa phụ huynh");
    }
  };

  const handleMenuOpen = (event, student) => {
    setAnchorEl(event.currentTarget);
    setMenuStudent(student);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuStudent(null);
  };

  const handleStudentSuccess = () => {
    if (classId) {
      fetchStudents(classId);
    } else {
      fetchAllStudents();
    }
  };

  const handleParentSuccess = () => {
    if (classId) {
      fetchStudents(classId);
    } else {
      fetchAllStudents();
    }
  };

  // Filter students based on search query, class, and status
  const filteredStudents = students.filter((student) => {
    const matchesSearch = searchQuery === "" || 
      (student.full_name && student.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const studentClass = student.class_name || student.class?.class_name || student.class_id?.class_name || "";
    const matchesClass = filterClass === "" || studentClass === filterClass;
    
    const matchesStatus = filterStatus === "" || student.status === Number(filterStatus);
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} position="relative" zIndex={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <ArgonTypography variant="h5" fontWeight="bold" color="white">
            Danh sách học sinh
          </ArgonTypography>
          <ArgonButton 
            color="success" 
            variant="gradient"
            onClick={handleCreateStudent} 
            startIcon={<PersonAddIcon />}
          >
            Thêm học sinh
          </ArgonButton>
        </Box>

        {/* Filter Section */}
        <ArgonBox display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            placeholder="Tìm kiếm tên học sinh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 300, bgcolor: 'white', borderRadius: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Select
            size="small"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            displayEmpty
            onOpen={() => setClassSelectOpen(true)}
            onClose={() => setClassSelectOpen(false)}
            IconComponent={classSelectOpen ? KeyboardArrowUp : KeyboardArrowDown}
            sx={{ width: 200, bgcolor: 'white', borderRadius: 1 }}
          >
            <MenuItem value="">Tất cả lớp</MenuItem>
            {classes.map((cls) => (
              <MenuItem key={cls._id} value={cls.class_name}>
                {cls.class_name}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            displayEmpty
            onOpen={() => setStatusSelectOpen(true)}
            onClose={() => setStatusSelectOpen(false)}
            IconComponent={statusSelectOpen ? KeyboardArrowUp : KeyboardArrowDown}
            sx={{ width: 180, bgcolor: 'white', borderRadius: 1 }}
          >
            <MenuItem value="">Tất cả trạng thái</MenuItem>
            <MenuItem value="1">Hoạt động</MenuItem>
            <MenuItem value="0">Không hoạt động</MenuItem>
          </Select>
          <ArgonTypography variant="caption" color="white" ml={2}>
            Tìm thấy: {filteredStudents.length} học sinh
          </ArgonTypography>
        </ArgonBox>

        {loading ? (
          <ArgonBox p={3} bgcolor="white" borderRadius={2}>
            <ArgonTypography variant="body2">Đang tải…</ArgonTypography>
          </ArgonBox>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
            <Table
              sx={{
                tableLayout: "fixed",
                width: "100%",
                "& .MuiTableHead-root": {
                  display: "table-header-group !important",
                  padding: 0,
                },
                "& .MuiTableCell-root": {
                  padding: "12px 16px",
                  verticalAlign: "middle",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              }}
            >
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "35%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Học sinh</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Lớp</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Phụ huynh</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Trạng thái</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Thao tác</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((s) => (
                  <TableRow key={s._id || s.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          src={s?.avatar_url || s?.avatar || ""}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        >
                          {s?.full_name ? s.full_name.charAt(0).toUpperCase() : "?"}
                        </Avatar>
                        <ArgonTypography variant="body2" fontWeight="medium">
                          {s.full_name || "-"}
                        </ArgonTypography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <ArgonTypography variant="body2">
                        {s.class_name ||
                          s.class?.class_name ||
                          s.class_id?.class_name ||
                          "-"}
                      </ArgonTypography>
                    </TableCell>
                    <TableCell sx={{ overflow: "visible" }}>
                      {s.parents && s.parents.length > 0 ? (
                        <Stack spacing={0.5}>
                          {s.parents.map((parent) => (
                            <Box key={parent._id} display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                              <ArgonTypography variant="body2" fontSize="0.8rem" sx={{ flex: "1 1 auto", minWidth: "120px" }}>
                                {parent.user_id?.full_name || "-"} ({parent.relationship || "-"})
                              </ArgonTypography>
                              <Box display="flex" gap={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditParent(s, parent)}
                                  sx={{ p: 0.3 }}
                                >
                                  <ArgonTypography variant="caption" color="info" fontSize="0.7rem">
                                    Sửa
                                  </ArgonTypography>
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteParent(parent._id, s._id)}
                                  sx={{ p: 0.3 }}
                                >
                                  <ArgonTypography variant="caption" color="error" fontSize="0.7rem">
                                    Xóa
                                  </ArgonTypography>
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <ArgonTypography variant="body2" color="text">
                          Chưa có
                        </ArgonTypography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(s.status)}
                        color={getStatusColor(s.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, s)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <ArgonTypography variant="body2" color="text">
                        {searchQuery || filterClass || filterStatus ? "Không tìm thấy học sinh phù hợp" : "Không có dữ liệu"}
                      </ArgonTypography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </ArgonBox>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditStudent(menuStudent)}>
          Chỉnh sửa
        </MenuItem>
        <MenuItem onClick={() => handleAddParent(menuStudent)}>
          Thêm phụ huynh
        </MenuItem>
        <MenuItem onClick={() => handleDeleteStudent(menuStudent)}>
          Xóa học sinh
        </MenuItem>
      </Menu>

      <StudentModal
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        studentData={selectedStudent}
        classId={classId}
        onSuccess={handleStudentSuccess}
      />

      <ParentModal
        open={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        studentId={selectedStudent?._id}
        parentData={selectedParent}
        onSuccess={handleParentSuccess}
      />
    </DashboardLayout>
  );
};

export default ChildrenPage;
