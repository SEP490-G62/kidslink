import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from "@mui/material";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import api from "services/api";

const ClassAgeModal = ({ open, onClose, classAgeData, onSuccess }) => {
  const isEdit = !!classAgeData;
  const [formData, setFormData] = useState({
    age: "",
    age_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (isEdit && classAgeData) {
        setFormData({
          age: classAgeData.age || "",
          age_name: classAgeData.age_name || "",
        });
      } else {
        setFormData({
          age: "",
          age_name: "",
        });
      }
      setErrors({});
    }
  }, [open, classAgeData, isEdit]);

  const handleChange = (field) => (e) => {
    const value = field === "age" ? parseInt(e.target.value) || "" : e.target.value;
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.age && formData.age !== 0) {
      newErrors.age = "Tuổi là bắt buộc";
    } else if (formData.age < 0) {
      newErrors.age = "Tuổi phải lớn hơn hoặc bằng 0";
    }
    if (!formData.age_name.trim()) {
      newErrors.age_name = "Tên khối tuổi là bắt buộc";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/class-ages/${classAgeData._id}`, formData, true);
      } else {
        await api.post("/class-ages", formData, true);
      }
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Lỗi lưu khối tuổi:", e);
      alert(
        `Lỗi ${isEdit ? "cập nhật" : "tạo"} khối tuổi: ${e.message || "Vui lòng thử lại"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h5" fontWeight="bold">
          {isEdit ? "Chỉnh sửa khối tuổi" : "Tạo khối tuổi mới"}
        </ArgonTypography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <ArgonBox component="form">
          <Grid container spacing={3}>
            {/* Tuổi */}
            <Grid item xs={12} sm={6}>
              <ArgonBox mb={1}>
                <ArgonTypography variant="caption" fontWeight="medium" color="text">
                  Tuổi <span style={{ color: "red" }}>*</span>
                </ArgonTypography>
              </ArgonBox>
              <TextField
                fullWidth
                type="number"
                placeholder="Nhập tuổi (ví dụ: 3, 4, 5...)"
                value={formData.age}
                onChange={handleChange("age")}
                error={!!errors.age}
                helperText={errors.age}
                size="small"
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Tên khối tuổi */}
            <Grid item xs={12} sm={6}>
              <ArgonBox mb={1}>
                <ArgonTypography variant="caption" fontWeight="medium" color="text">
                  Tên khối tuổi <span style={{ color: "red" }}>*</span>
                </ArgonTypography>
              </ArgonBox>
              <TextField
                fullWidth
                placeholder="Nhập tên khối tuổi (ví dụ: Mầm, Chồi, Lá...)"
                value={formData.age_name}
                onChange={handleChange("age_name")}
                error={!!errors.age_name}
                helperText={errors.age_name}
                size="small"
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
          {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

ClassAgeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  classAgeData: PropTypes.shape({
    _id: PropTypes.string,
    age: PropTypes.number,
    age_name: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
};

ClassAgeModal.defaultProps = {
  classAgeData: null,
};

export default ClassAgeModal;

