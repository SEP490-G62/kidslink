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
  Chip,
  Box,
  Switch,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import api from "services/api";
import { useNavigate } from "react-router-dom";
import ClassModal from "./ClassModal";

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const navigate = useNavigate();

  const StatusSwitch = React.useMemo(
    () =>
      styled(Switch)(({ theme }) => ({
        width: 44,
        height: 24,
        padding: 0,
        display: "inline-flex",
        "& .MuiSwitch-switchBase": {
          padding: 2,
          top: 0,
          left: 0,
          transform: "translateX(2px)",
          "&.Mui-checked": {
            transform: "translateX(20px)",
            "& + .MuiSwitch-track": {
              backgroundColor: "#22c55e !important",
              opacity: 1,
            },
          },
        },
        "& .MuiSwitch-thumb": {
          width: 20,
          height: 20,
          boxShadow: "none",
          backgroundColor: "#fff",
        },
        "& .MuiSwitch-track": {
          borderRadius: 12,
          backgroundColor: "#e5e7eb !important",
          opacity: 1,
        },
      })),
    []
  );

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/classes", true);
      const rows = Array.isArray(res) ? res : res.data || [];
      setClasses(rows);
    } catch (e) {
      console.error("Lỗi khi tải danh sách lớp:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return classes;
    return classes.filter((c) => {
      const n = c.class_name || "";
      const t1 = c?.teacher_id?.user_id?.full_name || "";
      const t2 = c?.teacher_id2?.user_id?.full_name || "";
      return (
        n.toLowerCase().includes(s) ||
        t1.toLowerCase().includes(s) ||
        t2.toLowerCase().includes(s)
      );
    });
  }, [classes, search]);

  const goChildren = (id) => {
    navigate(`/school-admin/children?classId=${id}`);
  };

  const handleCreate = () => {
    setSelectedClass(null);
    setModalOpen(true);
  };

  const handleEdit = (classData) => {
    setSelectedClass(classData);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedClass(null);
  };

  const handleSuccess = () => {
    fetchClasses(); // Refresh list
  };

  const handleDelete = async (id, className) => {
    if (!window.confirm(`Bạn có chắc muốn xóa lớp "${className}"?`)) return;
    try {
      await api.delete(`/classes/${id}`, true);
      setClasses((prev) => prev.filter((c) => c._id !== id));
    } catch (e) {
      console.error("Lỗi khi xóa lớp:", e);
      alert("Không thể xóa lớp. Vui lòng thử lại.");
    }
  };

  const handleToggleStatus = async (classRow) => {
    const newStatus = classRow.status === 1 ? 0 : 1;
    setClasses((prev) => prev.map((c) => (c._id === classRow._id ? { ...c, status: newStatus } : c)));
    try {
      await api.put(`/classes/${classRow._id}`, { status: newStatus }, true);
    } catch (e) {
      console.error("Lỗi khi cập nhật trạng thái lớp:", e);
      setClasses((prev) => prev.map((c) => (c._id === classRow._id ? { ...c, status: classRow.status } : c)));
    }
  };

  return (
    <DashboardLayout>
      <ArgonBox py={3} position="relative" zIndex={3}>
        <ArgonBox
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <ArgonTypography variant="h5" fontWeight="bold" color="white">
            Quản lý lớp học
          </ArgonTypography>
          <ArgonButton
            color="info"
            size="medium"
            onClick={handleCreate}
            variant="gradient"
          >
            + Tạo lớp mới
          </ArgonButton>
        </ArgonBox>

        <ArgonBox mb={2}>
          <TextField
            size="small"
            placeholder="Tìm kiếm theo tên lớp hoặc giáo viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              maxWidth: 480,
              width: "100%",
              backgroundColor: "white",
              borderRadius: 1,
            }}
          />
        </ArgonBox>

        {loading ? (
          <ArgonBox p={3} bgcolor="white" borderRadius={2}>
            <ArgonTypography variant="body2">
              Đang tải dữ liệu...
            </ArgonTypography>
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
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Tên lớp</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Khối tuổi</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Năm học</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Giáo viên chính</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Giáo viên phụ</strong>
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
                {filtered.length > 0 ? (
                  filtered.map((c) => (
                    <TableRow key={c._id} hover>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="medium">
                          {c.class_name || "-"}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2">
                          {c.class_age_id?.age_name || c.grade || "-"}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2">
                          {c.academic_year || "-"}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2">
                          {c?.teacher_id?.user_id?.full_name || "-"}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2">
                          {c?.teacher_id2?.user_id?.full_name || "-"}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                          <ArgonTypography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                            {c.status === 1 ? "Hoạt động" : "Không hoạt động"}
                          </ArgonTypography>
                          <StatusSwitch
                            size="small"
                            checked={c.status === 1}
                            onChange={() => handleToggleStatus(c)}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="primary"
                          title="Chỉnh sửa"
                          onClick={() => handleEdit(c)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          title="Xóa lớp"
                          onClick={() => handleDelete(c._id, c.class_name)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="default"
                          title="Xem học sinh"
                          onClick={() => goChildren(c._id)}
                        >
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <ArgonTypography variant="body2" color="text">
                        {search
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

        <ClassModal
          open={modalOpen}
          onClose={handleModalClose}
          classData={selectedClass}
          onSuccess={handleSuccess}
        />
      </ArgonBox>
    </DashboardLayout>
  );
};

export default ClassesPage;
