import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Select, TextField, InputLabel, FormControl, Avatar, Stack, Typography } from "@mui/material";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import api from "services/api";
import { passwordHint, passwordRegex, validatePassword } from "utils/passwordPolicy";

const ROLES = [
  "school_admin",
  "teacher",
  "parent",
  "health_care_staff",
  "nutrition_staff",
];

const UserFormModal = ({ open, onClose, onSuccess, user, allowedRoles, defaultRole }) => {
  const isEdit = Boolean(user && user._id);
  const resolvedDefaultRole = defaultRole || (allowedRoles && allowedRoles.length > 0 ? allowedRoles[0] : "parent");
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    password: "",
    role: resolvedDefaultRole,
    email: "",
    phone_number: "",
    avatar_url: "",
    status: 1,
  });
  const [saving, setSaving] = useState(false);
  const fieldSx = {
    '& .MuiInputBase-root': { height: 40, borderRadius: 1 },
    '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1 },
    '& .MuiOutlinedInput-input': { padding: '9px 12px', lineHeight: 1.5 },
    '& .MuiInputBase-input': { padding: '9px 12px' },
    '& .MuiSelect-select': {
      padding: '9px 12px !important',
      minHeight: 'unset !important',
      display: 'flex',
      alignItems: 'center',
    },
  };
  const labelSx = { position: 'relative', transform: 'none', mb: 0.5, fontWeight: 600 };
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      setForm({
        full_name: user.full_name || "",
        username: user.username || "",
        password: "",
        role: user.role || "parent",
        email: user.email || "",
        phone_number: user.phone_number || "",
        avatar_url: user.avatar_url || "",
        status: user.status ?? 1,
      });
    } else {
      setForm({
        full_name: "",
        username: "",
        password: "",
        role: resolvedDefaultRole,
        email: "",
        phone_number: "",
        avatar_url: "",
        status: 1,
      });
    }
  }, [user, isEdit, resolvedDefaultRole]);

  const roleOptions = useMemo(() => {
    const base = (allowedRoles && allowedRoles.length > 0 ? allowedRoles : ROLES).slice();
    if (isEdit && user?.role && !base.includes(user.role)) {
      base.push(user.role);
    }
    return base;
  }, [allowedRoles, isEdit, user]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    if (field === 'phone_number') {
      // keep only digits
      const digits = String(value).replace(/\D/g, '');
      return setForm((f) => ({ ...f, [field]: digits }));
    }
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleFile = (evt) => {
    const f = evt.target.files && evt.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, avatar_url: reader.result }));
    reader.readAsDataURL(f);
  };

  const validate = () => {
    const e = {};
    const nameTrim = (form.full_name || '').trim();
    if (!nameTrim || nameTrim.length < 2) {
      e.full_name = "Họ tên tối thiểu 2 ký tự";
    } else if (nameTrim.length > 30) {
      e.full_name = "Họ tên không vượt quá 30 ký tự";
    } else if (/[0-9]/.test(nameTrim)) {
      e.full_name = "Họ tên không chứa chữ số";
    }
    const phoneRe = /^0[0-9]{9,10}$/;
    if (form.phone_number && !phoneRe.test(String(form.phone_number))) {
      e.phone_number = "SĐT không hợp lệ (10-11 số, bắt đầu bằng 0)";
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRe.test(String(form.email))) {
      e.email = "Email không hợp lệ";
    }
    if (!isEdit && !form.password) {
      e.password = "Vui lòng nhập mật khẩu";
    }
    if (form.password) {
      const passwordValidation = validatePassword(form.password);
      if (!passwordValidation.valid) {
        e.password = passwordValidation.message;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const checkAvailability = async () => {
    const payload = {
      username: form.username.trim() || undefined,
      email: form.email.trim() || undefined,
    };
    if (isEdit && user?._id) {
      payload.exclude_id = user._id;
    }
    if (!payload.username && !payload.email) return true;
    try {
      const res = await api.post("/users/check-availability", payload, true);
      const nextErrors = {};
      if (res?.usernameTaken) {
        nextErrors.username = "Username đã tồn tại";
      }
      if (res?.emailTaken) {
        nextErrors.email = "Email đã tồn tại";
      }
      if (Object.keys(nextErrors).length) {
        setErrors((prev) => ({ ...prev, ...nextErrors }));
        return false;
      }
      return true;
    } catch (err) {
      console.error("Check availability failed", err);
      return true;
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const available = await checkAvailability();
    if (!available) {
      setSaving(false);
      return;
    }
    try {
      if (isEdit) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${user._id}`, payload, true);
      } else {
        await api.post(`/users`, form, true);
      }
      onSuccess && onSuccess();
    } catch (e) {
      console.error("Save user failed", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h5" fontWeight="bold">
          {isEdit ? "Cập nhật tài khoản" : "Tạo tài khoản"}
        </ArgonTypography>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <Stack direction="column" alignItems="center" spacing={1}>
              <Avatar src={form.avatar_url} alt={form.full_name} sx={{ width: 72, height: 72 }} />
              <ArgonButton variant="outlined" color="info" size="small" component="label">
                Ảnh đại diện
                <input hidden accept="image/*" type="file" onChange={handleFile} />
              </ArgonButton>
            </Stack>
          </Grid>
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>Họ tên</InputLabel>
                <TextField size="small" placeholder="Nguyễn Văn A" inputProps={{ maxLength: 30 }} fullWidth value={form.full_name} onChange={handleChange("full_name")} error={!!errors.full_name} helperText={errors.full_name} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>Username</InputLabel>
                <TextField size="small" placeholder="username" fullWidth value={form.username} onChange={handleChange("username")} disabled={isEdit} sx={fieldSx} />
              </Grid>
              {!isEdit && (
                <Grid item xs={12} md={6}>
                  <InputLabel shrink sx={labelSx}>Mật khẩu</InputLabel>
                  <TextField size="small" type="password" placeholder="Bắt buộc" fullWidth value={form.password} onChange={handleChange("password")} error={!!errors.password} helperText={errors.password} sx={fieldSx} />
                </Grid>
              )}
              {isEdit && (
                <Grid item xs={12} md={6}>
                  <InputLabel shrink sx={labelSx}>Mật khẩu mới</InputLabel>
                  <TextField size="small" placeholder="Tuỳ chọn" type="password" fullWidth value={form.password} onChange={handleChange("password")} error={!!errors.password} helperText={errors.password} sx={fieldSx} />
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>Vai trò</InputLabel>
                <TextField
                  size="small"
                  select
                  fullWidth
                  value={form.role}
                  onChange={handleChange("role")}
                  SelectProps={{
                    displayEmpty: true,
                    MenuProps: {
                      PaperProps: {
                        style: { maxHeight: 200 },
                      },
                    },
                  }}
                  sx={{
                    ...fieldSx,
                    "& .MuiSelect-select": {
                      height: "1.4375em", // chiều cao text
                      padding: "6px 12px", // cho đồng đều với input thường
                      display: "flex",
                      alignItems: "center",
                    },
                  }}
                >
                  {roleOptions.map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>Email</InputLabel>
                <TextField size="small" placeholder="example@domain.com" fullWidth value={form.email} onChange={handleChange("email")} error={!!errors.email} helperText={errors.email} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>Số điện thoại</InputLabel>
                <TextField size="small" placeholder="0912345678" fullWidth value={form.phone_number} onChange={handleChange("phone_number")} error={!!errors.phone_number} helperText={errors.phone_number} sx={fieldSx} />
              </Grid>
              {!isEdit && (
                <Grid item xs={12} md={6}>
                  <InputLabel shrink sx={labelSx}>Trạng thái</InputLabel>
                  <TextField
                    size="small"
                    select
                    fullWidth
                    value={form.status}
                    onChange={handleChange("status")}
                    SelectProps={{ displayEmpty: true }}
                    sx={{
                      ...fieldSx,
                      "& .MuiSelect-select": {
                        height: "1.4375em",
                        padding: "7px 14px",
                        display: "flex",
                        alignItems: "center",
                      },
                    }}
                  >
                    <MenuItem value={1}>Hoạt động</MenuItem>
                    <MenuItem value={0}>Vô hiệu</MenuItem>
                  </TextField>

                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <ArgonButton color="secondary" onClick={onClose} disabled={saving}>Hủy</ArgonButton>
        <ArgonButton color="info" onClick={handleSubmit} disabled={saving}>{isEdit ? "Cập nhật" : "Tạo mới"}</ArgonButton>
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
  }),
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  defaultRole: PropTypes.string,
};

UserFormModal.defaultProps = {
  onSuccess: undefined,
  user: null,
  allowedRoles: ROLES,
  defaultRole: "parent",
};

export default UserFormModal;


