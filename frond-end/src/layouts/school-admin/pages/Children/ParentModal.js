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
  Radio,
  RadioGroup,
  FormLabel,
  Autocomplete,
} from "@mui/material";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import api from "services/api";

const ParentModal = ({ open, onClose, studentId, parentData, onSuccess }) => {
  const isEdit = !!parentData;
  const [mode, setMode] = useState("new"); // "new" or "existing"
  const [existingParents, setExistingParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
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
  const [serverError, setServerError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (open) {
      if (isEdit && parentData) {
        setMode("new"); // Edit mode always uses form
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
      } else {
        // Add mode - fetch existing parents
        fetchExistingParents();
        setMode("new");
        setSelectedParent(null);
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
      }
      setErrors({});
      setServerError("");
    }
  }, [open, parentData, isEdit]);

  const fetchExistingParents = async () => {
    try {
      const response = await api.get("/parentcrud", true);
      console.log("Response from /parentcrud:", response);
      const list = Array.isArray(response) ? response : (response.data || response.parents || []);
      console.log("Processed parent list:", list);
      setExistingParents(list);
    } catch (e) {
      console.error("Lỗi tải danh sách phụ huynh:", e);
      setExistingParents([]);
    }
  };

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
    
    if (mode === "existing") {
      // Validate existing parent selection
      if (!selectedParent) {
        newErrors.selectedParent = "Vui lòng chọn phụ huynh";
      }
      if (!formData.relationship) {
        newErrors.relationship = "Vui lòng chọn quan hệ";
      }
    } else {
      // Validate new parent form
      if (!formData.full_name.trim()) {
        newErrors.full_name = "Họ tên là bắt buộc";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Số điện thoại là bắt buộc";
      }
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email không hợp lệ";
      }
      
      // Validate account fields - luôn bắt buộc khi tạo mới (không edit)
      if (!isEdit) {
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
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setServerError("");
    
    try {
      let payload;
      
      if (mode === "existing") {
        // Link existing parent to student
        payload = {
          parent_id: selectedParent._id,
          student_id: studentId,
          relationship: formData.relationship,
        };
        await api.post("/parentcrud/link", payload, true);
      } else {
        // Create new parent
        payload = {
          ...formData,
          student_id: studentId,
          createAccount: true, // Luôn tạo account
        };
        // Thêm username/password
        payload.username = accountData.username;
        payload.password = accountData.password;
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
      }
      
      setSnackbar({
        open: true,
        message: `${isEdit ? "Cập nhật" : mode === "existing" ? "Liên kết" : "Thêm"} phụ huynh thành công!`,
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
          <ArgonTypography variant="h4" fontWeight="bold" color="primary.main">
            {isEdit ? "Chỉnh sửa phụ huynh" : "Thêm phụ huynh mới"}
          </ArgonTypography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setServerError("")}> {serverError} </Alert>
          )}
          <ArgonBox component="form">
            <Grid container spacing={2}>
              {!isEdit && (
                <>
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">
                        <ArgonTypography variant="body2" fontWeight="medium">
                          Chọn cách thêm phụ huynh
                        </ArgonTypography>
                      </FormLabel>
                      <RadioGroup
                        row
                        value={mode}
                        onChange={(e) => {
                          setMode(e.target.value);
                          setErrors({});
                          setServerError("");
                        }}
                      >
                        <FormControlLabel
                          value="new"
                          control={<Radio />}
                          label="Tạo phụ huynh mới"
                        />
                        <FormControlLabel
                          value="existing"
                          control={<Radio />}
                          label="Chọn phụ huynh có sẵn"
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  {mode === "existing" && (
                    <>
                      <Grid item xs={12}>
                        <Autocomplete
                          options={existingParents}
                          getOptionLabel={(option) => 
                            `${option.user_id?.full_name || "N/A"} - ${option.user_id?.phone_number || "N/A"}`
                          }
                          value={selectedParent}
                          onChange={(event, newValue) => {
                            setSelectedParent(newValue);
                            if (errors.selectedParent) {
                              setErrors({ ...errors, selectedParent: "" });
                            }
                          }}
                          renderOption={(props, option) => (
                            <Box component="li" {...props}>
                              <Avatar
                                src={option.user_id?.avatar_url}
                                sx={{ width: 32, height: 32, mr: 2 }}
                              >
                                {option.user_id?.full_name?.charAt(0)?.toUpperCase()}
                              </Avatar>
                              <Box>
                                <ArgonTypography variant="body2" fontWeight="medium">
                                  {option.user_id?.full_name || "N/A"}
                                </ArgonTypography>
                                <ArgonTypography variant="caption" color="text">
                                  {option.user_id?.phone_number || "N/A"} • {option.user_id?.email || "N/A"}
                                </ArgonTypography>
                              </Box>
                            </Box>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Chọn phụ huynh"
                              required
                              error={!!errors.selectedParent}
                              helperText={errors.selectedParent || "Tìm kiếm theo tên hoặc số điện thoại"}
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                        />
                      </Grid>

                      {selectedParent && (
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              p: 2,
                              border: 1,
                              borderColor: "grey.300",
                              borderRadius: 1,
                              bgcolor: "grey.50",
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                              <Avatar
                                src={selectedParent.user_id?.avatar_url}
                                sx={{ width: 60, height: 60 }}
                              >
                                {selectedParent.user_id?.full_name?.charAt(0)?.toUpperCase()}
                              </Avatar>
                              <Box>
                                <ArgonTypography variant="h6" fontWeight="bold">
                                  {selectedParent.user_id?.full_name}
                                </ArgonTypography>
                                <ArgonTypography variant="body2" color="text">
                                  📞 {selectedParent.user_id?.phone_number}
                                </ArgonTypography>
                                {selectedParent.user_id?.email && (
                                  <ArgonTypography variant="body2" color="text">
                                    ✉️ {selectedParent.user_id?.email}
                                  </ArgonTypography>
                                )}
                              </Box>
                            </Box>
                            {selectedParent.user_id?.address && (
                              <ArgonTypography variant="caption" color="text">
                                📍 {selectedParent.user_id?.address}
                              </ArgonTypography>
                            )}
                          </Box>
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        <FormControl fullWidth error={!!errors.relationship}>
                          <InputLabel shrink>Quan hệ với học sinh *</InputLabel>
                          <Select
                            value={formData.relationship}
                            onChange={handleChange("relationship")}
                            label="Quan hệ với học sinh *"
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
                          {errors.relationship && (
                            <ArgonTypography variant="caption" color="error" mt={0.5}>
                              {errors.relationship}
                            </ArgonTypography>
                          )}
                        </FormControl>
                      </Grid>
                    </>
                  )}
                </>
              )}

              {(isEdit || mode === "new") && (
              <>
              {/* Account fields - luôn hiển thị khi tạo mới */}
              {!isEdit && (
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
                    borderTop: !isEdit ? "2px solid" : "none",
                    borderColor: "grey.300",
                    pt: !isEdit ? 2 : 0,
                    mt: !isEdit ? 1 : 0,
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
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Họ tên
                </ArgonTypography>
                <TextField
                  fullWidth
                  // label="Họ tên"
                  required
                  value={formData.full_name}
                  onChange={handleChange("full_name")}
                  error={!!errors.full_name}
                  helperText={errors.full_name}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
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
              </Grid>

              <Grid item xs={12} sm={6}>
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Số điện thoại
                </ArgonTypography>
                <TextField
                  fullWidth
                  // label="Số điện thoại"
                  required
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Email
                </ArgonTypography>
                <TextField
                  fullWidth
                  // label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Quan hệ
                </ArgonTypography>
                <FormControl fullWidth>
                  {/* <InputLabel shrink>Quan hệ</InputLabel> */}
                  <Select
                    value={formData.relationship}
                    onChange={handleChange("relationship")}
                    // label="Quan hệ"
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
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Địa chỉ
                </ArgonTypography>
                <TextField
                  fullWidth
                  // label="Địa chỉ"
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleChange("address")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              </>
              )}
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
