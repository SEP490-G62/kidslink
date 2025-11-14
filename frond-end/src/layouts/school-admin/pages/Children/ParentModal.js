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
  Alert,
  Snackbar,
  Avatar,
  Box,
  IconButton,
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
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [accountData, setAccountData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [createAccount, setCreateAccount] = useState(false);
  const [serverError, setServerError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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
        const existingAvatar = parentData.user_id?.avatar_url || "";
        setAvatar(existingAvatar);
        setAvatarPreview(existingAvatar);
        setCreateAccount(false);
      } else {
        setFormData({
          full_name: "",
          phone: "",
          email: "",
          address: "",
          relationship: "father",
        });
        setAvatar("");
        setAvatarPreview("");
        setAccountData({
          username: "",
          password: "",
          confirmPassword: "",
        });
        setCreateAccount(false);
      }
      setErrors({});
      setServerError("");
    }
  }, [open, parentData, isEdit]);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
    if (serverError) {
      setServerError("");
    }
  };

  const handleAccountChange = (field) => (e) => {
    setAccountData({ ...accountData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
    if (serverError) {
      setServerError("");
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
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
    
    // Validate account fields if createAccount is checked
    if (createAccount) {
      if (!accountData.username.trim()) {
        newErrors.username = "Tên đăng nhập là bắt buộc";
      } else if (accountData.username.length < 4) {
        newErrors.username = "Tên đăng nhập phải có ít nhất 4 ký tự";
      }
      
      if (!accountData.password) {
        newErrors.password = "Mật khẩu là bắt buộc";
      } else {
        // Validate password: 8-16 characters, must have uppercase, lowercase, number, special char
        const password = accountData.password;
        
        if (password.length < 8 || password.length > 16) {
          newErrors.password = "Mật khẩu phải có từ 8-16 ký tự";
        } else if (!/[A-Z]/.test(password)) {
          newErrors.password = "Mật khẩu phải có ít nhất 1 chữ hoa";
        } else if (!/[a-z]/.test(password)) {
          newErrors.password = "Mật khẩu phải có ít nhất 1 chữ thường";
        } else if (!/[0-9]/.test(password)) {
          newErrors.password = "Mật khẩu phải có ít nhất 1 số";
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          newErrors.password = "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)";
        }
      }
      
      if (!accountData.confirmPassword) {
        newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      } else if (accountData.password !== accountData.confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setServerError("");
    
    try {
      const payload = {
        ...formData,
        student_id: studentId,
        createAccount,
      };
      // Nếu tạo account, thêm username/password
      if (createAccount) {
        payload.username = accountData.username;
        payload.password = accountData.password;
      }
      // Thêm avatar_url - nếu có upload thì dùng, không thì dùng default
      if (avatar) {
        payload.avatar_url = avatar;
      } else {
        payload.avatar_url = "https://ui-avatars.com/api/?name=" + encodeURIComponent(formData.full_name || "Parent") + "&background=random";
      }

      if (isEdit) {
        await api.put(`/parentcrud/${parentData._id}`, payload, true);
      } else {
        await api.post("/parentcrud", payload, true);
      }
      
      setSnackbar({
        open: true,
        message: `${isEdit ? "Cập nhật" : "Thêm"} phụ huynh thành công!`,
        severity: "success",
      });
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (e) {
      console.error("Lỗi lưu phụ huynh:", e);
      
      // Parse error message from backend
      let errorMessage = "Vui lòng thử lại";
      
      if (e.message) {
        errorMessage = e.message;
      }
      
      // Check for specific error patterns
      if (errorMessage.includes("duplicate") || errorMessage.includes("đã tồn tại")) {
        if (errorMessage.toLowerCase().includes("phone") || errorMessage.includes("số điện thoại")) {
          setErrors({ phone: "Số điện thoại đã được sử dụng" });
          errorMessage = "Số điện thoại này đã được đăng ký trong hệ thống";
        } else if (errorMessage.toLowerCase().includes("email")) {
          setErrors({ email: "Email đã được sử dụng" });
          errorMessage = "Email này đã được đăng ký trong hệ thống";
        } else if (errorMessage.toLowerCase().includes("username")) {
          setErrors({ username: "Tên đăng nhập đã được sử dụng" });
          errorMessage = "Tên đăng nhập này đã tồn tại trong hệ thống";
        }
      }
      
      // Check for validation errors
      if (errorMessage.includes("không hợp lệ")) {
        if (errorMessage.includes("email")) {
          setErrors({ email: "Email không hợp lệ" });
        }
        if (errorMessage.includes("phone") || errorMessage.includes("số điện thoại")) {
          setErrors({ phone: "Số điện thoại không hợp lệ (phải là số di động VN)" });
        }
      }
      
      setServerError(errorMessage);
      setSnackbar({
        open: true,
        message: `Lỗi: ${errorMessage}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <ArgonTypography variant="h5" fontWeight="bold">
            {isEdit ? "Chỉnh sửa phụ huynh" : "Thêm phụ huynh mới"}
          </ArgonTypography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setServerError("")}>
              {serverError}
            </Alert>
          )}
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
              
              {/* Account fields - only show when createAccount is checked */}
              {!isEdit && createAccount && (
                <>
                  <Grid item xs={12}>
                    <ArgonBox
                      sx={{
                        p: 2,
                        bgcolor: "info.main",
                        borderRadius: 1,
                        opacity: 0.1,
                      }}
                    />
                    <ArgonTypography
                      variant="h6"
                      fontWeight="medium"
                      color="info"
                      mt={1}
                      mb={1}
                    >
                      Thông tin tài khoản đăng nhập
                    </ArgonTypography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tên đăng nhập"
                      required
                      value={accountData.username}
                      onChange={handleAccountChange("username")}
                      error={!!errors.username}
                      helperText={errors.username || "Tên đăng nhập phụ huynh nhập vào sẽ được sử dụng"}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mật khẩu"
                      type="password"
                      required
                      value={accountData.password}
                      onChange={handleAccountChange("password")}
                      error={!!errors.password}
                      helperText={errors.password || "8-16 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Xác nhận mật khẩu"
                      type="password"
                      required
                      value={accountData.confirmPassword}
                      onChange={handleAccountChange("confirmPassword")}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <ArgonBox
                      sx={{
                        p: 2,
                        bgcolor: "warning.main",
                        borderRadius: 1,
                        opacity: 0.1,
                      }}
                    />
                    <ArgonTypography
                      variant="caption"
                      color="text"
                      display="block"
                    >
                      💡 Tên đăng nhập và mật khẩu bạn nhập vào sẽ được sử dụng để phụ huynh đăng nhập vào hệ thống
                    </ArgonTypography>
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <ArgonBox
                  sx={{
                    borderTop: createAccount ? "2px solid" : "none",
                    borderColor: "grey.300",
                    pt: createAccount ? 2 : 0,
                    mt: createAccount ? 1 : 0,
                  }}
                >
                  <ArgonTypography
                    variant="h6"
                    fontWeight="medium"
                    color="dark"
                    mb={1}
                  >
                    Thông tin phụ huynh
                  </ArgonTypography>
                </ArgonBox>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Họ tên"
                  required
                  value={formData.full_name}
                  onChange={handleChange("full_name")}
                  error={!!errors.full_name}
                  helperText={errors.full_name}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <ArgonBox>
                  <ArgonTypography variant="body2" fontWeight="medium" mb={1}>
                    Ảnh đại diện
                  </ArgonTypography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      src={avatarPreview}
                      sx={{ width: 80, height: 80 }}
                    >
                      {!avatarPreview && formData.full_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="avatar-upload"
                        type="file"
                        onChange={handleAvatarUpload}
                      />
                      <label htmlFor="avatar-upload">
                        <ArgonButton variant="outlined" color="info" component="span" size="small">
                          Chọn ảnh
                        </ArgonButton>
                      </label>
                      <ArgonTypography variant="caption" color="text" display="block" mt={0.5}>
                        Định dạng: JPG, PNG. Tối đa 5MB
                      </ArgonTypography>
                    </Box>
                  </Box>
                </ArgonBox>
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
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
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
      avatar_url: PropTypes.string,
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
