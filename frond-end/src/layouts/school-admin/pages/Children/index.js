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
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("classId");
    setClassId(cid);
    // Fetch tất cả học sinh nếu không có classId, hoặc fetch theo classId
    if (cid) {
      fetchStudents(cid);
    } else {
      fetchAllStudents();
    }
  }, []);

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
    if (!classId) {
      alert("Vui lòng chọn lớp học trước khi thêm học sinh. Hãy truy cập từ trang Quản lý lớp học.");
      return;
    }
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
                },
              }}
            >
              <colgroup>
                <col style={{ width: "25%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "15%" }} />
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
                {students.map((s) => (
                  <TableRow key={s._id || s.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          src={s?.avatar || ""}
                          sx={{ width: 32, height: 32, mr: 2 }}
                        >
                          {s?.full_name ? s.full_name.charAt(0) : "?"}
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
                    <TableCell>
                      {s.parents && s.parents.length > 0 ? (
                        <Stack spacing={0.5}>
                          {s.parents.map((parent) => (
                            <Box key={parent._id} display="flex" alignItems="center" gap={1}>
                              <ArgonTypography variant="body2" fontSize="0.875rem">
                                {parent.user_id?.full_name || "-"} ({parent.relationship || "-"})
                              </ArgonTypography>
                              <IconButton
                                size="small"
                                onClick={() => handleEditParent(s, parent)}
                                sx={{ p: 0.5 }}
                              >
                                <ArgonTypography variant="caption" color="info">
                                  Sửa
                                </ArgonTypography>
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteParent(parent._id, s._id)}
                                sx={{ p: 0.5 }}
                              >
                                <ArgonTypography variant="caption" color="error">
                                  Xóa
                                </ArgonTypography>
                              </IconButton>
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
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <ArgonTypography variant="body2" color="text">
                        Không có dữ liệu
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
