import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import api from "services/api";

const StudentModal = ({ open, onClose, studentData, classId, onSuccess }) => {
  const isEdit = !!studentData;
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "male",
    address: "",
    avatar: "",
    medical_condition: "",
    class_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      fetchClasses();
      if (isEdit && studentData) {
        setFormData({
          full_name: studentData.full_name || "",
          date_of_birth: studentData.date_of_birth
            ? new Date(studentData.date_of_birth).toISOString().split("T")[0]
            : "",
          gender: studentData.gender || "male",
          address: studentData.address || "",
          avatar: studentData.avatar || "",
          medical_condition: studentData.medical_condition || "",
          class_id: studentData.class_id?._id || studentData.class_id || "",
        });
      } else {
        setFormData({
          full_name: "",
          date_of_birth: "",
          gender: "male",
          address: "",
          avatar: "",
          medical_condition: "",
          class_id: classId || "",
        });
      }
      setErrors({});
    }
  }, [open, studentData, isEdit, classId]);

  const fetchClasses = async () => {
    try {
      const response = await api.get("/classes", true);
      const list = Array.isArray(response) ? response : (response.data || response.classes || []);
      setClasses(list);
    } catch (e) {
      console.error("Lỗi tải danh sách lớp:", e);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Họ tên là bắt buộc";
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "Ngày sinh là bắt buộc";
    }
    if (!formData.class_id) {
      newErrors.class_id = "Lớp học là bắt buộc";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/student/${studentData._id}`, formData, true);
      } else {
        await api.post("/student", formData, true);
      }
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Lỗi lưu học sinh:", e);
      alert(
        `Lỗi ${isEdit ? "cập nhật" : "thêm"} học sinh: ${
          e.message || "Vui lòng thử lại"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h4" fontWeight="bold" color="primary.main">
          {isEdit ? "Chỉnh sửa học sinh" : "Thêm học sinh mới"}
        </ArgonTypography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <ArgonBox component="form">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                Họ và tên
              </ArgonTypography>
              <TextField
                fullWidth
                // label="Họ và tên"
                required
                value={formData.full_name}
                onChange={handleChange("full_name")}
                error={!!errors.full_name}
                helperText={errors.full_name}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                Ngày sinh
              </ArgonTypography>
              <TextField
                fullWidth
                // label="Ngày sinh"
                type="date"
                required
                value={formData.date_of_birth}
                onChange={handleChange("date_of_birth")}
                error={!!errors.date_of_birth}
                helperText={errors.date_of_birth}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                Giới tính
              </ArgonTypography>
              <FormControl fullWidth error={!!errors.gender}>
                {/* <InputLabel shrink>Giới tính</InputLabel> */}
                <Select
                  value={formData.gender}
                  onChange={handleChange("gender")}
                  // label="Giới tính"
                  displayEmpty
                  notched
                >
                  <MenuItem value="">
                    <em>-- Chọn giới tính --</em>
                  </MenuItem>
                  <MenuItem value="male">Nam</MenuItem>
                  <MenuItem value="female">Nữ</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                Lớp học
              </ArgonTypography>
              <FormControl fullWidth error={!!errors.class_id}>
                {/* <InputLabel shrink>Lớp học *</InputLabel> */}
                <Select
                  value={formData.class_id}
                  onChange={handleChange("class_id")}
                  // label="Lớp học *"
                  displayEmpty
                  notched
                  disabled={!isEdit && classId}
                >
                  <MenuItem value="">
                    <em>-- Chọn lớp học --</em>
                  </MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.class_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.class_id && (
                  <ArgonTypography variant="caption" color="error">
                    {errors.class_id}
                  </ArgonTypography>
                )}
                {!isEdit && classId && (
                  <ArgonTypography variant="caption" color="info" mt={0.5}>
                    Học sinh sẽ được thêm vào lớp hiện tại
                  </ArgonTypography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                Địa chỉ
              </ArgonTypography>
              <TextField
                fullWidth
                // label="Địa chỉ"
                value={formData.address}
                onChange={handleChange("address")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                URL Avatar
              </ArgonTypography>
              <TextField
                fullWidth
                // label="URL Avatar"
                value={formData.avatar}
                onChange={handleChange("avatar")}
                placeholder="https://example.com/avatar.jpg"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                Tình trạng sức khỏe
              </ArgonTypography>
              <TextField
                fullWidth
                // label="Tình trạng sức khỏe"
                multiline
                rows={3}
                value={formData.medical_condition}
                onChange={handleChange("medical_condition")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </ArgonBox>
      </DialogContent>
      <DialogActions>
        <ArgonButton onClick={onClose} color="secondary" disabled={loading}>
          Hủy
        </ArgonButton>
        <ArgonButton onClick={handleSubmit} color="info" disabled={loading}>
          {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm mới"}
         </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

StudentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  studentData: PropTypes.shape({
    _id: PropTypes.string,
    full_name: PropTypes.string,
    date_of_birth: PropTypes.string,
    gender: PropTypes.string,
    address: PropTypes.string,
    avatar: PropTypes.string,
    medical_condition: PropTypes.string,
    class_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string,
      }),
    ]),
  }),
  classId: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
};

StudentModal.defaultProps = {
  studentData: null,
  classId: null,
};

export default StudentModal;
