import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import api from "services/api";
import ClassAgeModal from "./ClassAgeModal";

const ClassAgeManagementModal = ({ open, onClose }) => {
  const [classAges, setClassAges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ageModalOpen, setAgeModalOpen] = useState(false);
  const [selectedClassAge, setSelectedClassAge] = useState(null);

  useEffect(() => {
    if (open) {
      fetchClassAges();
    }
  }, [open]);

  const fetchClassAges = async () => {
    try {
      setLoading(true);
      const res = await api.get("/class-ages", true);
      const list = res.classAges || [];
      setClassAges(list);
    } catch (e) {
      console.error("Lỗi khi tải danh sách khối tuổi:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedClassAge(null);
    setAgeModalOpen(true);
  };

  const handleEdit = (classAgeData) => {
    setSelectedClassAge(classAgeData);
    setAgeModalOpen(true);
  };

  const handleAgeModalClose = () => {
    setAgeModalOpen(false);
    setSelectedClassAge(null);
  };

  const handleAgeSuccess = () => {
    fetchClassAges();
  };

  const handleDelete = async (id, ageName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khối tuổi "${ageName}"?`)) return;
    try {
      await api.delete(`/class-ages/${id}`, true);
      await fetchClassAges();
    } catch (e) {
      console.error("Lỗi khi xóa khối tuổi:", e);
      alert(e.message || "Không thể xóa khối tuổi. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
            <ArgonTypography variant="h5" fontWeight="bold">
              Quản lý khối tuổi
            </ArgonTypography>
            <ArgonButton
              color="info"
              size="small"
              onClick={handleCreate}
              variant="gradient"
            >
              + Tạo mới
            </ArgonButton>
          </ArgonBox>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {loading ? (
            <ArgonBox p={3} textAlign="center">
              <ArgonTypography variant="body2">
                Đang tải dữ liệu...
              </ArgonTypography>
            </ArgonBox>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>STT</strong></TableCell>
                    <TableCell><strong>Tuổi</strong></TableCell>
                    <TableCell><strong>Tên khối tuổi</strong></TableCell>
                    <TableCell><strong>Thao tác</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classAges.length > 0 ? (
                    classAges.map((age, index) => (
                      <TableRow key={age._id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <ArgonTypography variant="body2" fontWeight="medium">
                            {age.age}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell>
                          <ArgonTypography variant="body2">
                            {age.age_name}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            title="Chỉnh sửa"
                            onClick={() => handleEdit(age)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            title="Xóa khối tuổi"
                            onClick={() => handleDelete(age._id, age.age_name)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <ArgonTypography variant="body2" color="text">
                          Chưa có dữ liệu khối tuổi
                        </ArgonTypography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <ArgonButton onClick={onClose} color="secondary">
            Đóng
          </ArgonButton>
        </DialogActions>
      </Dialog>

      {/* Modal tạo/sửa khối tuổi */}
      <ClassAgeModal
        open={ageModalOpen}
        onClose={handleAgeModalClose}
        classAgeData={selectedClassAge}
        onSuccess={handleAgeSuccess}
      />
    </>
  );
};

ClassAgeManagementModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ClassAgeManagementModal;

