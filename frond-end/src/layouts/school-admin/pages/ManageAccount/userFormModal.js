import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SchoolIcon from "@mui/icons-material/School";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";

const ROLE_OPTIONS = [
  { value: "teacher", label: "Giáo viên" },
  { value: "parent", label: "Phụ huynh" },
  { value: "health_care_staff", label: "Nhân viên y tế" },
  { value: "nutrition_staff", label: "Nhân viên dinh dưỡng" },
];

const initialTeacherProfile = {
  qualification: "",
  major: "",
  experience_years: "",
  note: "",
};

const initialHealthProfile = {
  qualification: "",
  major: "",
  experience_years: "",
  note: "",
};

const initialParentProfile = {
  student_id: "",
  relationship: "",
};

const SectionCard = ({ icon, title, subtitle, children }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      border: "1px solid #e3f2fd",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(243,248,255,0.98) 100%)",
      boxShadow: "0 10px 24px rgba(25,118,210,0.08)",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#e3f2fd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1976d2",
        }}
      >
        {icon}
      </Box>
      <Box>
        <ArgonTypography variant="subtitle1" fontWeight="bold" color="dark">
          {title}
        </ArgonTypography>
        {subtitle && (
          <ArgonTypography variant="caption" color="text" fontWeight="regular">
            {subtitle}
          </ArgonTypography>
        )}
      </Box>
    </Stack>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

SectionCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

  const fieldSx = {
  flex: 1,
  minWidth: 200,
  maxWidth: 400,
  width: "100%",
  borderRadius: 2,
  "& .MuiOutlinedInput-root": {
    width: "100%",
    borderRadius: 2,
    "&:hover fieldset": {
      borderColor: "primary.main",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
    },
  },
  "& .MuiInputBase-input": {
    width: "100% !important",
    padding: "9px 12px",
  },
  "& .MuiSelect-select": {
    padding: "9px 12px",
    minHeight: "unset",
    display: "flex",
    alignItems: "center",
  },
};

const labelSx = {
  position: "relative",
  transform: "none",
  mb: 0.5,
  fontWeight: 600,
};

  const getPasswordError = (password) => {
    if (!password) return "Vui lòng nhập mật khẩu";
    if (password.length < 8 || password.length > 16) {
      return "Mật khẩu phải có từ 8-16 ký tự";
    }
    if (!/[A-Z]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ hoa";
    }
    if (!/[a-z]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ thường";
    }
    if (!/[0-9]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 số";
    }
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)";
    }
    return "";
  };

const UserFormModal = ({ open, onClose, onSuccess, user, students }) => {
  const isEdit = Boolean(user?._id);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    password: "",
    role: "teacher",
    email: "",
    phone_number: "",
    avatar_url: "",
    status: 1,
    address: "",
  });
  const [teacherProfile, setTeacherProfile] = useState(initialTeacherProfile);
  const [healthProfile, setHealthProfile] = useState(initialHealthProfile);
  const [parentProfile, setParentProfile] = useState(initialParentProfile);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const isTeacher = form.role === "teacher";
  const isHealth = form.role === "health_care_staff";
  const isParent = form.role === "parent";

  const selectedStudent = useMemo(
    () => students.find((s) => s._id === parentProfile.student_id) || null,
    [students, parentProfile.student_id]
  );

  const formatDate = (value) => {
    if (!value) return "Chưa cập nhật";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
    return date.toLocaleDateString("vi-VN");
  };

  useEffect(() => {
    if (!open) return;
    if (isEdit && user) {
      setForm({
        full_name: user.full_name || "",
        username: user.username || "",
        password: "",
        role: user.role || "teacher",
        email: user.email || "",
        phone_number: user.phone_number || "",
        avatar_url: user.avatar_url || "",
        status: user.status ?? 1,
        address: user.address || "",
      });
      setTeacherProfile({
        qualification: user.teacher_profile?.qualification || "",
        major: user.teacher_profile?.major || "",
        experience_years:
          user.teacher_profile?.experience_years !== undefined
            ? user.teacher_profile.experience_years
            : "",
        note: user.teacher_profile?.note || "",
      });
      setHealthProfile({
        qualification: user.health_care_profile?.qualification || "",
        major: user.health_care_profile?.major || "",
        experience_years:
          user.health_care_profile?.experience_years !== undefined
            ? user.health_care_profile.experience_years
            : "",
        note: user.health_care_profile?.note || "",
      });
      setParentProfile({
        student_id: user.parent_profile?.student_id || "",
        relationship: user.parent_profile?.relationship || "",
      });
    } else {
      setForm({
        full_name: "",
        username: "",
        password: "",
        role: "teacher",
        email: "",
        phone_number: "",
        avatar_url: "",
        status: 1,
        address: "",
      });
      setTeacherProfile(initialTeacherProfile);
      setHealthProfile(initialHealthProfile);
      setParentProfile(initialParentProfile);
    }
    setErrors({});
    setServerError("");
  }, [open, isEdit, user]);

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    if (field === "phone_number") {
      value = value.replace(/\D/g, "");
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileChange = (setter) => (field) => (event) => {
    setter((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, avatar_url: reader.result }));
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const nextErrors = {};
    const trimmedName = (form.full_name || "").trim();
    if (!trimmedName) {
      nextErrors.full_name = "Vui lòng nhập họ tên";
    }
    if (!form.username && !isEdit) {
      nextErrors.username = "Vui lòng nhập username";
    }
    if (!isEdit && !form.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu";
    } else if (form.password) {
      const pwdError = getPasswordError(form.password);
      if (pwdError) nextErrors.password = pwdError;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Email không hợp lệ";
    }
    if (form.phone_number && !/^0[0-9]{9,10}$/.test(form.phone_number)) {
      nextErrors.phone_number = "SĐT không hợp lệ (10-11 số, bắt đầu bằng 0)";
    }
    if (isParent) {
      if (!form.email) {
        nextErrors.email = "Phụ huynh cần có email để nhận thông tin";
      }
      if (!parentProfile.student_id) {
        nextErrors["parent_profile.student_id"] = "Vui lòng chọn học sinh";
      }
      if (!parentProfile.relationship.trim()) {
        nextErrors["parent_profile.relationship"] = "Vui lòng nhập mối quan hệ";
      }
    }
    if (isTeacher) {
      if (!teacherProfile.qualification.trim()) {
        nextErrors["teacher_profile.qualification"] = "Vui lòng nhập trình độ";
      }
      if (!teacherProfile.major.trim()) {
        nextErrors["teacher_profile.major"] = "Vui lòng nhập chuyên ngành";
      }
      if (teacherProfile.experience_years === "" || Number(teacherProfile.experience_years) < 0) {
        nextErrors["teacher_profile.experience_years"] = "Kinh nghiệm phải là số không âm";
      }
      if (!teacherProfile.note.trim()) {
        nextErrors["teacher_profile.note"] = "Vui lòng nhập ghi chú";
      }
    }
    if (isHealth) {
      if (!healthProfile.qualification.trim()) {
        nextErrors["health_profile.qualification"] = "Vui lòng nhập trình độ";
      }
      if (!healthProfile.major.trim()) {
        nextErrors["health_profile.major"] = "Vui lòng nhập chuyên ngành";
      }
      if (healthProfile.experience_years === "" || Number(healthProfile.experience_years) < 0) {
        nextErrors["health_profile.experience_years"] = "Kinh nghiệm phải là số không âm";
      }
      if (!healthProfile.note.trim()) {
        nextErrors["health_profile.note"] = "Vui lòng nhập ghi chú";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => {
    const payload = {
      full_name: form.full_name?.trim(),
      username: form.username?.trim(),
      role: form.role,
      email: form.email?.trim(),
      phone_number: form.phone_number?.trim(),
      avatar_url: form.avatar_url,
      status: Number(form.status),
      address: form.address?.trim(),
    };
    if (form.password) {
      payload.password = form.password;
    }
    if (isTeacher) {
      payload.teacher_profile = {
        qualification: teacherProfile.qualification.trim(),
        major: teacherProfile.major.trim(),
        experience_years: Number(teacherProfile.experience_years),
        note: teacherProfile.note.trim(),
      };
    }
    if (isHealth) {
      payload.health_care_profile = {
        qualification: healthProfile.qualification.trim(),
        major: healthProfile.major.trim(),
        experience_years: Number(healthProfile.experience_years),
        note: healthProfile.note.trim(),
      };
    }
    if (isParent) {
      payload.parent_profile = {
        student_id: parentProfile.student_id,
        relationship: parentProfile.relationship.trim(),
      };
    }
    return payload;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setServerError("");
    try {
      const payload = buildPayload();
      if (isEdit && user?._id) {
        await schoolAdminService.updateUser(user._id, payload);
      } else {
        await schoolAdminService.createUser(payload);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Save user failed", err);
      setServerError(err.message || "Không thể lưu thông tin. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.25)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
          color: "#fff",
          py: 2,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <PersonIcon />
          <ArgonTypography variant="h5" fontWeight="bold" color="#fff">
          {isEdit ? "Cập nhật tài khoản" : "Tạo tài khoản"}
        </ArgonTypography>
        </Stack>
        <IconButton
          size="small"
          sx={{
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.3)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
          }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          py: 3,
          px: 3,
          background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)",
        }}
      >
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}
        <Stack spacing={3}>
          <SectionCard
            icon={<PersonIcon />}
            title="Thông tin tài khoản"
            subtitle="Thiết lập thông tin và quyền truy cập"
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Avatar src={form.avatar_url} alt={form.full_name} sx={{ width: 72, height: 72 }}>
                    {form.full_name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box>
              <ArgonButton variant="outlined" color="info" size="small" component="label">
                      Chọn ảnh
                <input hidden accept="image/*" type="file" onChange={handleFile} />
              </ArgonButton>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Nên sử dụng ảnh vuông ≥ 300px
                    </Typography>
                  </Box>
            </Stack>
          </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Họ tên
                </InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nguyễn Văn A"
                  value={form.full_name}
                  onChange={handleChange("full_name")}
                  error={!!errors.full_name}
                  helperText={errors.full_name}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Username
                </InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="username"
                  value={form.username}
                  onChange={handleChange("username")}
                  error={!!errors.username}
                  helperText={errors.username}
                  disabled={isEdit}
                  sx={fieldSx}
                />
              </Grid>
                <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>{isEdit ? "Mật khẩu mới" : "Mật khẩu"}</InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  placeholder={isEdit ? "Để trống nếu không đổi" : "Bắt buộc"}
                  value={form.password}
                  onChange={handleChange("password")}
                  error={!!errors.password}
                  helperText={errors.password || "8-16 ký tự, gồm chữ hoa/thường, số, ký tự đặc biệt"}
                  sx={fieldSx}
                />
                </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Vai trò
                </InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  select
                  value={form.role}
                  onChange={handleChange("role")}
                  disabled={isEdit}
                  sx={fieldSx}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Trạng thái
                </InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  select
                  value={form.status}
                  onChange={handleChange("status")}
                  sx={fieldSx}
                >
                  <MenuItem value={1}>Hoạt động</MenuItem>
                  <MenuItem value={0}>Vô hiệu</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard
            icon={<ContactMailIcon />}
            title="Thông tin liên hệ"
            subtitle="Dùng để gửi thông báo và hỗ trợ"
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Email
                </InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="example@domain.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Số điện thoại
                </InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="0912345678"
                  value={form.phone_number}
                  onChange={handleChange("phone_number")}
                  error={!!errors.phone_number}
                  helperText={errors.phone_number}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12}>
                <InputLabel shrink sx={labelSx}>
                  Địa chỉ
                </InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Số nhà, đường..."
                  value={form.address}
                  onChange={handleChange("address")}
                  sx={fieldSx}
                />
              </Grid>
            </Grid>
          </SectionCard>

          {isTeacher && (
            <SectionCard
              icon={<SchoolIcon />}
              title="Hồ sơ giáo viên"
              subtitle="Thông tin chuyên môn và kinh nghiệm"
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <InputLabel shrink sx={labelSx}>
                    Trình độ
                  </InputLabel>
                  <TextField
                    fullWidth
                    size="small"
                    value={teacherProfile.qualification}
                    onChange={handleProfileChange(setTeacherProfile)("qualification")}
                    error={!!errors["teacher_profile.qualification"]}
                    helperText={errors["teacher_profile.qualification"]}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InputLabel shrink sx={labelSx}>
                    Chuyên ngành
                  </InputLabel>
                  <TextField
                    fullWidth
                    size="small"
                    value={teacherProfile.major}
                    onChange={handleProfileChange(setTeacherProfile)("major")}
                    error={!!errors["teacher_profile.major"]}
                    helperText={errors["teacher_profile.major"]}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InputLabel shrink sx={labelSx}>
                    Số năm kinh nghiệm
                  </InputLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={teacherProfile.experience_years}
                    onChange={handleProfileChange(setTeacherProfile)("experience_years")}
                    error={!!errors["teacher_profile.experience_years"]}
                    helperText={errors["teacher_profile.experience_years"]}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel shrink sx={labelSx}>
                    Ghi chú
                  </InputLabel>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={teacherProfile.note}
                    onChange={handleProfileChange(setTeacherProfile)("note")}
                    error={!!errors["teacher_profile.note"]}
                    helperText={errors["teacher_profile.note"]}
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
            </SectionCard>
          )}

          {isHealth && (
            <SectionCard
              icon={<HealthAndSafetyIcon />}
              title="Hồ sơ nhân viên y tế"
              subtitle="Thông tin chứng chỉ và kinh nghiệm"
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <InputLabel shrink sx={labelSx}>
                    Trình độ
                  </InputLabel>
                  <TextField
                    fullWidth
                    size="small"
                    value={healthProfile.qualification}
                    onChange={handleProfileChange(setHealthProfile)("qualification")}
                    error={!!errors["health_profile.qualification"]}
                    helperText={errors["health_profile.qualification"]}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InputLabel shrink sx={labelSx}>
                    Chuyên ngành
                  </InputLabel>
                  <TextField
                    fullWidth
                    size="small"
                    value={healthProfile.major}
                    onChange={handleProfileChange(setHealthProfile)("major")}
                    error={!!errors["health_profile.major"]}
                    helperText={errors["health_profile.major"]}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InputLabel shrink sx={labelSx}>
                    Số năm kinh nghiệm
                  </InputLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={healthProfile.experience_years}
                    onChange={handleProfileChange(setHealthProfile)("experience_years")}
                    error={!!errors["health_profile.experience_years"]}
                    helperText={errors["health_profile.experience_years"]}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel shrink sx={labelSx}>
                    Ghi chú
                  </InputLabel>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={healthProfile.note}
                    onChange={handleProfileChange(setHealthProfile)("note")}
                    error={!!errors["health_profile.note"]}
                    helperText={errors["health_profile.note"]}
                    sx={fieldSx}
                  />
            </Grid>
          </Grid>
            </SectionCard>
          )}

          {isParent && (
            <SectionCard
              icon={<FamilyRestroomIcon />}
              title="Thông tin phụ huynh"
              subtitle="Liên kết với học sinh và quan hệ"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <InputLabel shrink sx={labelSx}>
                    Chọn học sinh
                  </InputLabel>
                <Autocomplete
                    options={students}
                    getOptionLabel={(option) => option.full_name || "Không tên"}
                    value={selectedStudent}
                    onChange={(_, newValue) =>
                      setParentProfile((prev) => ({ ...prev, student_id: newValue?._id || "" }))
                    }
                    renderOption={(props, option) => (
                      <Box
                        component="li"
                        {...props}
                        key={option._id}
                        sx={{ display: "flex", gap: 1.5, alignItems: "center" }}
                      >
                        <Avatar
                          src={option.avatar_url}
                          alt={option.full_name}
                          sx={{ width: 40, height: 40 }}
                        >
                          {option.full_name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <ArgonTypography variant="body2" fontWeight="600">
                            {option.full_name || "Không tên"}
                          </ArgonTypography>
                          <ArgonTypography variant="caption" color="text.secondary">
                            {(option.class_id?.class_name
                              ? `${option.class_id.class_name} (${option.class_id.academic_year || "N/A"})`
                              : "Chưa có lớp") + " • " + formatDate(option.dob)}
                          </ArgonTypography>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        error={!!errors["parent_profile.student_id"]}
                        helperText={errors["parent_profile.student_id"]}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel shrink sx={labelSx}>
                    Mối quan hệ
                  </InputLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Ví dụ: mẹ, bố, ông, bà..."
                    value={parentProfile.relationship}
                    onChange={(event) =>
                      setParentProfile((prev) => ({ ...prev, relationship: event.target.value }))
                    }
                    error={!!errors["parent_profile.relationship"]}
                    helperText={errors["parent_profile.relationship"]}
                    sx={fieldSx}
                  />
                </Grid>
                {selectedStudent && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid #e3f2fd",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        backgroundColor: "#f8fbff",
                      }}
                    >
                      <Avatar src={selectedStudent.avatar_url} alt={selectedStudent.full_name}>
                        {selectedStudent.full_name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <ArgonTypography variant="subtitle2" fontWeight="bold">
                          {selectedStudent.full_name}
                        </ArgonTypography>
                        <ArgonTypography variant="caption" color="text.secondary" display="block">
                          {selectedStudent.class_id?.class_name
                            ? `${selectedStudent.class_id.class_name} (${selectedStudent.class_id.academic_year || "N/A"})`
                            : "Chưa có lớp"}
                        </ArgonTypography>
                        <ArgonTypography variant="caption" color="text.secondary" display="block">
                          Ngày sinh: {formatDate(selectedStudent.dob)}
                        </ArgonTypography>
                      </Box>
                    </Box>
                  </Grid>
                )}
        </Grid>
            </SectionCard>
          )}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid #e3f2fd",
          background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)",
        }}
      >
        <ArgonButton color="secondary" variant="outlined" onClick={onClose} disabled={saving}>
          Huỷ
        </ArgonButton>
        <ArgonButton
          color="info"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : <InfoOutlinedIcon />
          }
        >
          {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

UserFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  user: PropTypes.shape({
    _id: PropTypes.string,
    full_name: PropTypes.string,
    username: PropTypes.string,
    role: PropTypes.string,
    email: PropTypes.string,
    phone_number: PropTypes.string,
    avatar_url: PropTypes.string,
    status: PropTypes.number,
    address: PropTypes.string,
    teacher_profile: PropTypes.object,
    health_care_profile: PropTypes.object,
    parent_profile: PropTypes.object,
  }),
  students: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      full_name: PropTypes.string,
    })
  ),
};

UserFormModal.defaultProps = {
  onSuccess: undefined,
  user: null,
  students: [],
};

export default UserFormModal;


