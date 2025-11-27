import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Avatar,
  Box,
  Button,
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
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import CloseIcon from "@mui/icons-material/Close";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";

const GENDER_OPTIONS = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "father", label: "Bố" },
  { value: "mother", label: "Mẹ" },
  { value: "guardian", label: "Người giám hộ" },
  { value: "other", label: "Khác" },
];

const emptyParent = () => ({
  full_name: "",
  username: "",
  phone_number: "",
  email: "",
  address: "",
  relationship: "father",
});

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

const fieldSx = (minWidth = 200) => ({
  flex: 1,
  minWidth,
  maxWidth: "100%",
  width: "100%",
  borderRadius: 2,
  "& .MuiOutlinedInput-root": {
    width: "100%",
    "&:hover fieldset": {
      borderColor: "primary.main",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
    },
  },
  "& .MuiInputBase-input": {
    width: "100% !important",
  },
});

const labelSx = {
  position: "relative",
  transform: "none",
  mb: 0.5,
  fontWeight: 600,
};

const StudentFormModal = ({
  open,
  onClose,
  classes = [],
  initialData = null,
  onSubmit,
}) => {
  const isEdit = Boolean(initialData);
  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    class_id: "",
    gender: "male",
    medical_condition: "",
    avatar_url: "",
  });
  const [parentForms, setParentForms] = useState([emptyParent()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          full_name: initialData.full_name || "",
          date_of_birth: initialData.dob
            ? new Date(initialData.dob).toISOString().substring(0, 10)
            : "",
          class_id: initialData.class_id?._id || initialData.class_id || "",
          gender: initialData.gender === 1 || initialData.gender === "female" ? "female" : "male",
          medical_condition: initialData.allergy || "",
          avatar_url: initialData.avatar_url || "",
        });
        setParentForms([emptyParent()]);
        setAvatarPreview(initialData.avatar_url || "");
      } else {
        setForm({
          full_name: "",
          date_of_birth: "",
          class_id: "",
          gender: "male",
          medical_condition: "",
          avatar_url: "",
        });
        setParentForms([emptyParent()]);
        setAvatarPreview("");
      }
      setError("");
    }
  }, [open, initialData]);

  const filledParents = useMemo(
    () =>
      parentForms
        .map((parent) => ({
          ...parent,
          username: parent.username?.trim(),
          phone_number: parent.phone_number?.trim(),
          email: parent.email?.trim(),
        }))
        .filter(
          (parent) =>
            parent.full_name &&
            parent.relationship &&
            parent.username &&
            (parent.phone_number || parent.email)
        ),
    [parentForms]
  );

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setForm((prev) => ({ ...prev, avatar_url: result }));
        setAvatarPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleParentChange = (index, field, value) => {
    setParentForms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddParent = () => {
    setParentForms((prev) => [...prev, emptyParent()]);
  };

  const handleRemoveParent = (index) => {
    setParentForms((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.date_of_birth || !form.class_id) {
      setError("Vui lòng nhập đầy đủ tên, ngày sinh và lớp học.");
      return;
    }

    if (!isEdit && filledParents.length === 0) {
      setError("Vui lòng nhập ít nhất một phụ huynh bao gồm tên đăng nhập và thông tin liên hệ.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        full_name: form.full_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        medical_condition: form.medical_condition,
        avatar: form.avatar_url,
        class_id: form.class_id,
      };
      if (!isEdit) {
        payload.parents = filledParents;
      }

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("StudentFormModal submit error", err);
      setError(err.message || "Không thể lưu học sinh, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
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
          <ChildCareIcon />
          <ArgonTypography variant="h5" fontWeight="bold" color="#fff">
            {isEdit ? "Cập nhật học sinh" : "Thêm học sinh mới"}
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
          disabled={submitting}
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={3}>
          <SectionCard
            icon={<ChildCareIcon />}
            title="Thông tin học sinh"
            subtitle="Quản lý hồ sơ và lớp học"
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Họ và tên
                </InputLabel>
                <TextField
                  size="small"
                  placeholder="Nguyễn Văn A"
                  value={form.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  fullWidth
                  required
                  sx={fieldSx(240)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InputLabel shrink sx={labelSx}>
                  Ngày sinh
                </InputLabel>
                <TextField
                  size="small"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                  sx={fieldSx(160)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InputLabel shrink sx={labelSx}>
                  Giới tính
                </InputLabel>
                <TextField
                  size="small"
                  select
                  value={form.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  fullWidth
                  sx={fieldSx(140)}
                >
                  {GENDER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Lớp
                </InputLabel>
                <TextField
                  size="small"
                  select
                  value={form.class_id}
                  onChange={(e) => handleInputChange("class_id", e.target.value)}
                  fullWidth
                  required
                  sx={fieldSx(240)}
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls._id || cls.id} value={cls._id || cls.id}>
                      {cls.class_name} - {cls.academic_year}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Ảnh đại diện
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={avatarPreview || undefined}
                      alt={form.full_name || "Student avatar"}
                      sx={{ width: 72, height: 72 }}
                    >
                      {form.full_name?.[0] || "S"}
                    </Avatar>
                    <Button variant="outlined" component="label">
                      Chọn ảnh
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleAvatarFileChange}
                      />
                    </Button>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Chỉ nhận file ảnh (jpeg/png/webp).
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <InputLabel shrink sx={labelSx}>
                  Dị ứng/Ghi chú y tế
                </InputLabel>
                <TextField
                  size="small"
                  value={form.medical_condition}
                  onChange={(e) => handleInputChange("medical_condition", e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  sx={fieldSx(260)}
                />
              </Grid>
            </Grid>
          </SectionCard>
          {isEdit ? (
            <Alert severity="info">
              Vui lòng sử dụng &quot;Quản lý phụ huynh&quot; để thêm hoặc cập nhật phụ huynh sau khi lưu thông tin học
              sinh.
            </Alert>
          ) : (
            <SectionCard
              icon={<FamilyRestroomIcon />}
              title="Thông tin phụ huynh"
              subtitle="Tạo tài khoản phụ huynh đi kèm"
            >
              <Typography variant="body2" color="text.secondary" mb={2}>
                Thông tin tài khoản phụ huynh sẽ được tạo tự động và gửi qua email.
              </Typography>
              {parentForms.map((parent, index) => (
                <Stack key={`parent-${index}`} spacing={2} mb={index === parentForms.length - 1 ? 0 : 2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <InputLabel shrink sx={labelSx}>
                        Họ và tên phụ huynh
                      </InputLabel>
                      <TextField
                        size="small"
                        placeholder="Nguyễn Văn A"
                        value={parent.full_name}
                        onChange={(e) => handleParentChange(index, "full_name", e.target.value)}
                        fullWidth
                        required
                        sx={fieldSx(240)}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <InputLabel shrink sx={labelSx}>
                        Quan hệ
                      </InputLabel>
                      <TextField
                        size="small"
                        select
                        value={parent.relationship}
                        onChange={(e) => handleParentChange(index, "relationship", e.target.value)}
                        fullWidth
                        sx={fieldSx(140)}
                      >
                        {RELATIONSHIP_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton
                          color="error"
                          disabled={parentForms.length === 1}
                          onClick={() => handleRemoveParent(index)}
                        >
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                        {index === parentForms.length - 1 && (
                          <IconButton color="primary" onClick={handleAddParent}>
                            <AddCircleOutlineIcon />
                          </IconButton>
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <InputLabel shrink sx={labelSx}>
                        Tên đăng nhập
                      </InputLabel>
                      <TextField
                        size="small"
                        value={parent.username}
                        onChange={(e) => handleParentChange(index, "username", e.target.value)}
                        fullWidth
                        required
                        sx={fieldSx(200)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <InputLabel shrink sx={labelSx}>
                        Số điện thoại
                      </InputLabel>
                      <TextField
                        size="small"
                        value={parent.phone_number}
                        onChange={(e) => handleParentChange(index, "phone_number", e.target.value)}
                        fullWidth
                        sx={fieldSx(200)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <InputLabel shrink sx={labelSx}>
                        Email
                      </InputLabel>
                      <TextField
                        size="small"
                        value={parent.email}
                        onChange={(e) => handleParentChange(index, "email", e.target.value)}
                        fullWidth
                        sx={fieldSx(200)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <InputLabel shrink sx={labelSx}>
                        Địa chỉ
                      </InputLabel>
                      <TextField
                        size="small"
                        value={parent.address}
                        onChange={(e) => handleParentChange(index, "address", e.target.value)}
                        fullWidth
                        sx={fieldSx(200)}
                      />
                    </Grid>
                  </Grid>
                  {index < parentForms.length - 1 && <Divider />}
                </Stack>
              ))}
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
        <ArgonButton color="secondary" variant="outlined" onClick={onClose} disabled={submitting}>
          Huỷ
        </ArgonButton>
        <ArgonButton color="info" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo học sinh"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

StudentFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  classes: PropTypes.arrayOf(PropTypes.object),
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};

export default StudentFormModal;