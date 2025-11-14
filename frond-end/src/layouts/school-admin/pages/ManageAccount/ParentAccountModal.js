import React, { useEffect, useMemo, useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import api from "services/api";
import { passwordRegex, passwordHint, validatePassword } from "utils/passwordPolicy";

const relationshipOptions = [
  { value: "father", label: "Bố" },
  { value: "mother", label: "Mẹ" },
  { value: "guardian", label: "Người giám hộ" },
];

const ParentAccountModal = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    username: "",
    email: "",
    relationship: "father",
    student_id: "",
    password: "",
    avatar_url: "",
    status: 1,
  });
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [filterClass, setFilterClass] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      full_name: "",
      phone: "",
      username: "",
      email: "",
      relationship: "father",
      student_id: "",
      password: "",
      avatar_url: "",
      status: 1,
    });
    setSearch("");
    setErrors({});
    fetchStudents();
    setShowPassword(false);
    setFilterClass("");
    setSubmitError("");
  }, [open]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await api.get("/student/all", true);
      const list = Array.isArray(res) ? res : res?.students || [];
      setStudents(list);
    } catch (e) {
      console.error("Fetch students failed", e);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const classOptions = useMemo(() => {
    const map = new Map();
    let hasNoClass = false;
    students.forEach((student) => {
      const cls = student.class || student.class_id;
      if (!cls) {
        hasNoClass = true;
        return;
      }
      const id = String(cls._id || cls.id || cls.class_id || cls.name || cls.class_name || "");
      const label = cls.name || cls.class_name || cls.label || cls.code || "Chưa đặt tên";
      if (id) {
        map.set(id, { id, label });
      }
    });
    const sorted = Array.from(map.values()).sort((a, b) =>
      String(a.label || "").localeCompare(String(b.label || ""), "vi", { sensitivity: "base" })
    );
    if (hasNoClass) {
      sorted.push({ id: "no_class", label: "Chưa có lớp" });
    }
    return sorted;
  }, [students]);

  useEffect(() => {
    if (!filterClass && classOptions.length > 0) {
      setFilterClass(classOptions[0].id);
    }
  }, [classOptions, filterClass]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (filterClass) {
      list = list.filter((student) => {
        const cls = student.class || student.class_id;
        if (filterClass === "no_class") {
          return !cls;
        }
        if (!cls) return false;
        const id = String(cls._id || cls.id || cls.class_id || cls.name || cls.class_name || "");
        return id === filterClass;
      });
    }
    if (!search) return list;
    const keyword = search.trim().toLowerCase();
    return list.filter((student) =>
      [student.full_name, student.class?.name, student.class_id?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [students, search, filterClass]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const fileInputRef = useRef(null);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, avatar_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSelectStudent = (studentId) => {
    setForm((prev) => ({ ...prev, student_id: studentId }));
    if (errors.student_id) {
      setErrors((prev) => ({ ...prev, student_id: "" }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.full_name.trim()) {
      nextErrors.full_name = "Họ tên phụ huynh là bắt buộc";
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Số điện thoại là bắt buộc";
    }
    if (!form.username.trim()) {
      nextErrors.username = "Vui lòng nhập username";
    } else if (!/^[a-z0-9._-]{4,30}$/i.test(form.username.trim())) {
      nextErrors.username = "Username 4-30 ký tự, không dấu, gồm chữ, số hoặc ._-";
    }
    const phoneRe = /^0[0-9]{9,10}$/;
    if (form.phone && !phoneRe.test(String(form.phone))) {
      nextErrors.phone = "SĐT không hợp lệ (10-11 số, bắt đầu bằng 0)";
    }
    if (form.email) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(String(form.email))) {
        nextErrors.email = "Email không hợp lệ";
      }
    }
    if (!form.student_id) {
      nextErrors.student_id = "Vui lòng chọn học sinh";
    }
    if (!form.relationship) {
      nextErrors.relationship = "Vui lòng chọn quan hệ";
    }
    if (!form.password.trim()) {
      nextErrors.password = "Vui lòng nhập mật khẩu";
    } else {
      const passwordValidation = validatePassword(form.password.trim());
      if (!passwordValidation.valid) {
        nextErrors.password = passwordValidation.message;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const checkAvailability = async () => {
    const payload = {
      username: form.username.trim() || undefined,
      email: form.email.trim() || undefined,
    };
    if (!payload.username && !payload.email) return true;
    try {
      const res = await api.post(
        "/users/check-availability",
        payload,
        true
      );
      const usernameTaken = res?.usernameTaken;
      const emailTaken = res?.emailTaken;
      if (usernameTaken || emailTaken) {
        setErrors((prev) => ({
          ...prev,
          ...(usernameTaken ? { username: "Username đã tồn tại" } : {}),
          ...(emailTaken ? { email: "Email đã tồn tại" } : {}),
        }));
        return false;
      }
      return true;
    } catch (error) {
      console.error("Check username/email availability failed", error);
      return true;
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError("");
    setSaving(true);
    const available = await checkAvailability();
    if (!available) {
      setSaving(false);
      return;
    }
    try {
      await api.post(
        "/parentcrud",
        {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          username: form.username.trim(),
          email: form.email.trim() || undefined,
          relationship: form.relationship,
          student_id: form.student_id,
          createAccount: true,
          password: form.password.trim(),
          avatar_url: form.avatar_url || undefined,
          status: form.status,
        },
        true
      );
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error("Create parent account failed", e);
      const msg = e?.response?.data?.message || e?.message || "Không thể tạo tài khoản, vui lòng thử lại";
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <FamilyRestroomIcon color="primary" />
        <ArgonTypography variant="h5" fontWeight="bold">
          Tạo tài khoản phụ huynh
        </ArgonTypography>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <ArgonTypography variant="subtitle2" fontWeight="bold" mb={1}>
              Thông tin phụ huynh
            </ArgonTypography>
            <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
              <Box textAlign="center">
                <Avatar src={form.avatar_url} alt={form.full_name} sx={{ width: 64, height: 64, margin: "0 auto" }}>
                  {form.full_name?.[0]?.toUpperCase() || "P"}
                </Avatar>
                <ArgonButton
                  variant="outlined"
                  color="info"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Ảnh đại diện
                </ArgonButton>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ArgonTypography variant="caption" fontWeight="bold" color="text.main" mb={0.5} display="block">
                  Họ và tên phụ huynh
                </ArgonTypography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nhập họ và tên"
                  value={form.full_name}
                  onChange={handleChange("full_name")}
                  error={!!errors.full_name}
                  helperText={errors.full_name}
                />
              </Grid>
              <Grid item xs={12}>
                <ArgonTypography variant="caption" fontWeight="bold" color="text.main" mb={0.5} display="block">
                  Số điện thoại
                </ArgonTypography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="0912345678"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  error={!!errors.phone}
                  helperText={errors.phone}
                />
              </Grid>
              <Grid item xs={12}>
                <ArgonTypography variant="caption" fontWeight="bold" color="text.main" mb={0.5} display="block">
                  Username đăng nhập
                </ArgonTypography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="phuhuynh.nguyen"
                  value={form.username}
                  onChange={handleChange("username")}
                  error={!!errors.username}
                  helperText={errors.username}
                />
              </Grid>
              <Grid item xs={12}>
                <ArgonTypography variant="caption" fontWeight="bold" color="text.main" mb={0.5} display="block">
                  Email
                </ArgonTypography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="example@domain.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <ArgonTypography variant="caption" fontWeight="bold" color="text.main" mb={0.5} display="block">
                  Mật khẩu đăng nhập
                </ArgonTypography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nhập mật khẩu mạnh"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  error={!!errors.password}
                  helperText={errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <ArgonTypography variant="caption" fontWeight="bold" color="text.main" mb={0.5} display="block">
                  Quan hệ với học sinh
                </ArgonTypography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={form.relationship}
                  onChange={handleChange("relationship")}
                  error={!!errors.relationship}
                  helperText={errors.relationship}
                >
                  {relationshipOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <ArgonTypography variant="caption" fontWeight="bold" color="text.main" mb={0.5} display="block">
                  Trạng thái
                </ArgonTypography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={form.status}
                  onChange={handleChange("status")}
                >
                  <MenuItem value={1}>Hoạt động</MenuItem>
                  <MenuItem value={0}>Vô hiệu</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={7}>
            <ArgonTypography variant="subtitle2" fontWeight="bold" mb={1}>
              Chọn học sinh
            </ArgonTypography>
            <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
              <Box flex={1} minWidth={240}>
                <ArgonTypography variant="caption" fontWeight="bold" color="text.main" mb={0.5} display="block">
                  Tìm kiếm học sinh
                </ArgonTypography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nhập tên học sinh..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box width={200} minWidth={180}>
                <ArgonTypography variant="caption" fontWeight="bold" color="text.main" mb={0.5} display="block">
                  Lọc theo lớp
                </ArgonTypography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                >
                  {!classOptions.length && (
                    <MenuItem value="">
                      Không có lớp
                    </MenuItem>
                  )}
                  {classOptions.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Hiển thị {filteredStudents.length} / {students.length} học sinh
            </Typography>
            <Box
              sx={{
                border: "1px solid",
                borderColor: errors.student_id ? "error.main" : "divider",
                borderRadius: 1,
                height: 320,
                overflow: "hidden",
                position: "relative",
                backgroundColor: "background.paper",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { width: 6 },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "grey.400",
                    borderRadius: 3,
                  },
                }}
              >
                {loadingStudents ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Đang tải danh sách học sinh...
                    </Typography>
                  </Box>
                ) : filteredStudents.length > 0 ? (
                  <List disablePadding>
                    {filteredStudents.map((student) => {
                      const selected = form.student_id === student._id;
                      const classInfo = student.class || student.class_id || null;
                      const className = classInfo?.name || classInfo?.class_name || "Chưa có";
                      return (
                        <ListItemButton
                          key={student._id}
                          onClick={() => handleSelectStudent(student._id)}
                          selected={selected}
                          sx={{
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            alignItems: "flex-start",
                            py: 1.5,
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              src={student.avatar_url}
                              alt={student.full_name}
                              sx={{ width: 40, height: 40 }}
                            >
                              {student.full_name?.[0]?.toUpperCase() || "S"}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight={600}>
                                {student.full_name}
                              </Typography>
                            }
                            secondary={
                              <Box component="span" sx={{ display: "block", mt: 0.5 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  component="span"
                                  sx={{ display: "block", mt: 0.25 }}
                                >
                                  Lớp: {className}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      px: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" align="center">
                      {students.length === 0
                        ? "Chưa có dữ liệu học sinh. Vui lòng kiểm tra lại."
                        : "Không tìm thấy học sinh phù hợp với từ khóa tìm kiếm."}
                    </Typography>
                  </Box>
                )}
              </Box>
              {errors.student_id && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ position: "absolute", bottom: 8, left: 16 }}
                >
                  {errors.student_id}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ alignItems: "flex-start" }}>
        {submitError && (
          <ArgonTypography variant="caption" color="error" sx={{ mr: "auto", pt: 1 }}>
            {submitError}
          </ArgonTypography>
        )}
        <ArgonButton color="secondary" onClick={onClose} disabled={saving}>
          Hủy
        </ArgonButton>
        <ArgonButton color="info" onClick={handleSubmit} disabled={saving}>
          {saving ? "Đang tạo..." : "Tạo tài khoản"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

ParentAccountModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

ParentAccountModal.defaultProps = {
  onSuccess: undefined,
};

export default ParentAccountModal;


