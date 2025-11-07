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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import api from "services/api";

const ParentModal = ({ open, onClose, studentId, parentData, onSuccess }) => {
  const isEdit = !!parentData;
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    relationship: "father",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [createAccount, setCreateAccount] = useState(false);

  useEffect(() => {
    if (open) {
      if (isEdit && parentData) {
        setFormData({
          full_name: parentData.user_id?.full_name || "",
          phone: parentData.user_id?.phone_number || "", // adjust to schema
          email: parentData.user_id?.email || "",
          address: parentData.user_id?.address || "",
          relationship: parentData.relationship || "father",
        });
        setCreateAccount(false);
      } else {
        setFormData({
          full_name: "",
          phone: "",
          email: "",
          address: "",
          relationship: "father",
        });
        setCreateAccount(false);
      }
      setErrors({});
    }
  }, [open, parentData, isEdit]);

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
    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        student_id: studentId,
        createAccount,
      };

      if (isEdit) {
        await api.put(`/parentcrud/${parentData._id}`, payload, true);
      } else {
        await api.post("/parentcrud", payload, true);
      }
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Lỗi lưu phụ huynh:", e);
      alert(
        `Lỗi ${isEdit ? "cập nhật" : "thêm"} phụ huynh: ${
          e.message || "Vui lòng thử lại"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h5" fontWeight="bold">
          {isEdit ? "Chỉnh sửa phụ huynh" : "Thêm phụ huynh mới"}
        </ArgonTypography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <ArgonBox component="form">
          <Grid container spacing={2}>
            {!isEdit && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Tạo tài khoản đăng nhập cho phụ huynh này"
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Họ và tên"
                required
                value={formData.full_name}
                onChange={handleChange("full_name")}
                error={!!errors.full_name}
                helperText={errors.full_name}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số điện thoại"
                required
                value={formData.phone}
                onChange={handleChange("phone")}
                error={!!errors.phone}
                helperText={errors.phone}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                error={!!errors.email}
                helperText={errors.email}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
                <FormControl fullWidth>
                <InputLabel shrink>Quan hệ</InputLabel>
                <Select
                  value={formData.relationship}
                  onChange={handleChange("relationship")}
                  label="Quan hệ"
                  displayEmpty
                  notched
                >
                  <MenuItem value="">
                    <em>-- Chọn quan hệ --</em>
                  </MenuItem>
                  <MenuItem value="father">Bố</MenuItem>
                  <MenuItem value="mother">Mẹ</MenuItem>
                  <MenuItem value="guardian">Người giám hộ</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ"
                multiline
                rows={2}
                value={formData.address}
                onChange={handleChange("address")}
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

ParentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  studentId: PropTypes.string,
  parentData: PropTypes.shape({
    _id: PropTypes.string,
    user_id: PropTypes.shape({
      full_name: PropTypes.string,
      phone_number: PropTypes.string,
      email: PropTypes.string,
      address: PropTypes.string,
    }),
    relationship: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
};

ParentModal.defaultProps = {
  studentId: null,
  parentData: null,
};

export default ParentModal;
