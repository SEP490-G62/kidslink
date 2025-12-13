import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Stack,
  Chip,
  Autocomplete,
} from "@mui/material";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import api from "services/api";

const AddStudentModal = ({ open, onClose, classId, onSuccess }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [latestAcademicYear, setLatestAcademicYear] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && classId) {
      fetchEligibleStudents();
    }
  }, [open, classId]);

  const fetchEligibleStudents = async () => {
    try {
      setDataLoading(true);
      const res = await api.get(`/classes/${classId}/eligible-students`, true);
      const list = res.data || [];
      setStudents(list);
      setLatestAcademicYear(res.metadata?.latestAcademicYear || "");
      setSelectedStudent(null);
    } catch (error) {
      console.error("Lỗi khi tải danh sách học sinh:", error);
      alert(error?.message || "Không thể tải danh sách học sinh đủ điều kiện");
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent?._id) {
      alert("Vui lòng chọn học sinh");
      return;
    }

    setLoading(true);
    try {
      await api.post(
        `/classes/${classId}/students`,
        { student_id: selectedStudent._id },
        true
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi khi thêm học sinh vào lớp:", error);
      alert(error?.message || "Không thể thêm học sinh vào lớp. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h5" fontWeight="bold">
          Thêm học sinh vào lớp
        </ArgonTypography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {dataLoading ? (
          <ArgonBox p={3} textAlign="center">
            <ArgonTypography variant="body2">Đang tải dữ liệu...</ArgonTypography>
          </ArgonBox>
        ) : (
          <ArgonBox>
            <Stack direction="row" spacing={1} mb={2} alignItems="center">
              <Chip
                label={
                  latestAcademicYear
                    ? `Năm học mới nhất: ${latestAcademicYear}`
                    : "Chưa có năm học"
                }
                color="info"
                variant="outlined"
              />
              <Chip
                label={`${students.length} học sinh khả dụng`}
                color="primary"
                variant="outlined"
              />
            </Stack>
            <ArgonTypography
              component="label"
              htmlFor="add-student-search"
              variant="caption"
              fontWeight="medium"
              color="text"
              sx={{ mb: 1, display: "block", cursor: "pointer" }}
            >
              Chọn học sinh <span style={{ color: "red" }}>*</span>
            </ArgonTypography>
            <Autocomplete
              id="add-student-search"
              options={students}
              value={selectedStudent}
              onChange={(event, newValue) => setSelectedStudent(newValue)}
              getOptionLabel={(option) => option?.full_name || ""}
              renderOption={(props, option) => (
                <li {...props} key={option._id}>
                  <Stack direction="row" spacing={2} alignItems="center" width="100%">
                    <Avatar src={option.avatar_url} sx={{ width: 32, height: 32 }}>
                      {option.full_name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Stack spacing={0}>
                      <ArgonTypography variant="body2" fontWeight="600">
                        {option.full_name}
                      </ArgonTypography>
                      <ArgonTypography variant="caption" color="text.secondary">
                        {option.gender === 1 ? "Nữ" : "Nam"} |{" "}
                        {option.dob ? new Date(option.dob).toLocaleDateString("vi-VN") : "-"}
                      </ArgonTypography>
                    </Stack>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Nhập tên học sinh..."
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    autoComplete: "new-password",
                  }}
                />
              )}
              noOptionsText="Không tìm thấy học sinh phù hợp"
              fullWidth
            />
            {students.length === 0 && (
              <ArgonTypography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Không có học sinh nào đủ điều kiện (chưa thuộc lớp trong năm học mới nhất)
              </ArgonTypography>
            )}
          </ArgonBox>
        )}
      </DialogContent>
      <DialogActions>
        <ArgonButton onClick={onClose} color="secondary" disabled={loading}>
          Hủy
        </ArgonButton>
        <ArgonButton
          onClick={handleSubmit}
          color="info"
          disabled={
            loading || dataLoading || !selectedStudent?._id || students.length === 0
          }
        >
          {loading ? "Đang thêm..." : "Thêm vào lớp"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

AddStudentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  classId: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
};

AddStudentModal.defaultProps = {
  classId: "",
};

export default AddStudentModal;

