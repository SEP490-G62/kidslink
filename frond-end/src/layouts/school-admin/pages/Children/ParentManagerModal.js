import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Autocomplete,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputLabel,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";

const RELATIONSHIP_OPTIONS = [
  { value: "father", label: "Bố" },
  { value: "mother", label: "Mẹ" },
  { value: "guardian", label: "Người giám hộ" },
  { value: "other", label: "Khác" },
];

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

const SectionCard = ({ icon, title, subtitle, children }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      border: "1px solid #e3f2fd",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(243,248,255,0.98) 100%)",
      boxShadow: "0 8px 20px rgba(25,118,210,0.08)",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <Stack
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#e3f2fd",
          alignItems: "center",
          justifyContent: "center",
          color: "#1976d2",
          display: "flex",
        }}
      >
        {icon}
      </Stack>
      <Box>
        <ArgonTypography variant="subtitle1" fontWeight="bold">
          {title}
        </ArgonTypography>
        {subtitle && (
          <ArgonTypography variant="caption" color="text">
            {subtitle}
          </ArgonTypography>
        )}
      </Box>
    </Stack>
    {children}
  </Paper>
);

SectionCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const ParentManagerModal = ({ open, studentId, onClose }) => {
  const [student, setStudent] = useState(null);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [availableParents, setAvailableParents] = useState([]);
  const [parentsLoading, setParentsLoading] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [existingRelationship, setExistingRelationship] = useState("father");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    relationship: "father",
    phone_number: "",
    email: "",
    address: "",
  });

  const canSubmit = useMemo(
    () =>
      form.full_name &&
      form.relationship &&
      (form.username || "").trim() &&
      (form.phone_number.trim() || form.email.trim()),
    [form]
  );

  const linkedParentIds = useMemo(
    () => new Set(parents.map((p) => String(p.parent_id || p._id))),
    [parents]
  );

  const selectableParents = useMemo(
    () =>
      availableParents.filter(
        (parent) => !linkedParentIds.has(String(parent._id))
      ),
    [availableParents, linkedParentIds]
  );

  const fetchStudentDetail = async () => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await schoolAdminService.getStudentDetail(studentId);
      const studentData = res.student || res;
      setStudent(studentData);
      setParents(res.parents || []);
    } catch (err) {
      console.error("ParentManager fetch error", err);
      setError(err.message || "Không thể tải thông tin phụ huynh.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableParents = async () => {
    try {
      setParentsLoading(true);
      const res = await schoolAdminService.getAllParents();
      const list = Array.isArray(res) ? res : res.data || [];
      setAvailableParents(list);
    } catch (err) {
      console.error("fetch parents error", err);
      setAvailableParents([]);
    } finally {
      setParentsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStudentDetail();
      fetchAvailableParents();
    } else {
      setForm({
        full_name: "",
        username: "",
        relationship: "father",
        phone_number: "",
        email: "",
        address: "",
      });
      setSelectedParentId("");
      setExistingRelationship("father");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    try {
      await schoolAdminService.addParentForStudent(studentId, form);
      await Promise.all([fetchStudentDetail(), fetchAvailableParents()]);
      setForm({
        full_name: "",
        username: "",
        relationship: "father",
        phone_number: "",
        email: "",
        address: "",
      });
    } catch (err) {
      console.error("add parent error", err);
      setError(err.message || "Không thể thêm phụ huynh.");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkExistingParent = async () => {
    if (!selectedParentId) return;
    setLinking(true);
    setError("");
    try {
      await schoolAdminService.linkExistingParent(
        selectedParentId,
        studentId,
        existingRelationship
      );
      setSelectedParentId("");
      setExistingRelationship("father");
      await Promise.all([fetchStudentDetail(), fetchAvailableParents()]);
    } catch (err) {
      console.error("link parent error", err);
      setError(err.message || "Không thể liên kết phụ huynh.");
    } finally {
      setLinking(false);
    }
  };

  const handleRemoveParent = async (parentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa phụ huynh khỏi học sinh này?")) return;
    try {
      await schoolAdminService.removeParentFromStudent(studentId, parentId);
      setParents((prev) => prev.filter((p) => String(p.parent_id) !== String(parentId)));
    } catch (err) {
      console.error("remove parent error", err);
      setError(err.message || "Không thể xóa phụ huynh.");
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
          <FamilyRestroomIcon />
          <ArgonTypography variant="h5" fontWeight="bold" color="#fff">
            Quản lý phụ huynh {student ? `- ${student.full_name}` : ""}
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={3}>
          <SectionCard
            icon={<FamilyRestroomIcon />}
            title="Danh sách phụ huynh"
            subtitle="Những phụ huynh đang được gán cho học sinh"
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight="bold">
                Tổng cộng: {parents.length}
              </Typography>
              <Tooltip title="Tải lại">
                <IconButton onClick={fetchStudentDetail}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
            {loading ? (
              <Stack alignItems="center" py={3}>
                <CircularProgress size={32} />
              </Stack>
            ) : parents.length === 0 ? (
              <Alert severity="info">Chưa có phụ huynh nào được gán.</Alert>
            ) : (
              <Stack spacing={1.5}>
                {parents.map((parent) => (
                  <Stack
                    key={parent.parent_id}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    p={2}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 2,
                      backgroundColor: "#fff",
                    }}
                  >
                    <Stack flex={1}>
                      <Typography fontWeight="bold">
                        {parent.user?.full_name || parent.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tên đăng nhập: {parent.user?.username || "Chưa có"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {parent.user?.email || parent.email || "Chưa có email"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {parent.user?.phone_number || parent.phone_number || "Chưa có số điện thoại"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={parent.relationship || "Không rõ"} color="primary" size="small" />
                      <Tooltip title="Xóa">
                        <IconButton color="error" onClick={() => handleRemoveParent(parent.parent_id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </SectionCard>

          <SectionCard
            icon={<LinkIcon />}
            title="Liên kết phụ huynh có sẵn"
            subtitle="Chọn phụ huynh đã có tài khoản"
          >
            <Typography variant="body2" color="text.secondary" mb={2}>
              Chọn phụ huynh đã có tài khoản để gán cho học sinh này.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Phụ huynh
                </InputLabel>
                <Autocomplete
                  options={selectableParents}
                  getOptionLabel={(option) =>
                    option.user_id?.full_name
                      ? `${option.user_id.full_name}${
                          option.user_id.phone_number ? ` - ${option.user_id.phone_number}` : ""
                        }`
                      : "Không tên"
                  }
                  loading={parentsLoading}
                  value={
                    selectableParents.find((p) => String(p._id) === String(selectedParentId)) || null
                  }
                  onChange={(_, newValue) => setSelectedParentId(newValue?._id || "")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder={parentsLoading ? "Đang tải..." : "Nhập để tìm phụ huynh"}
                      sx={fieldSx(260)}
                    />
                  )}
                  noOptionsText={parentsLoading ? "Đang tải..." : "Không còn phụ huynh có sẵn"}
                  disableClearable
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InputLabel shrink sx={labelSx}>
                  Quan hệ
                </InputLabel>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={RELATIONSHIP_OPTIONS.map((option) => option.label)}
                  value={existingRelationship}
                  onChange={(_, newValue) => setExistingRelationship(newValue || "")}
                  inputValue={existingRelationship}
                  onInputChange={(_, newInput) => setExistingRelationship(newInput)}
                  renderInput={(params) => (
                    <TextField {...params} sx={fieldSx(160)} placeholder="Nhập mối quan hệ" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Box display="flex" alignItems="flex-end" height="100%">
                  <ArgonButton
                    color="info"
                    fullWidth
                    disabled={!selectedParentId || linking}
                    onClick={handleLinkExistingParent}
                  >
                    Liên kết
                  </ArgonButton>
                </Box>
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard
            icon={<PersonAddIcon />}
            title="Thêm phụ huynh mới"
            subtitle="Hệ thống sẽ gửi thông tin đăng nhập qua email"
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Họ và tên phụ huynh
                </InputLabel>
                <TextField
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  fullWidth
                  size="small"
                  required
                  sx={fieldSx(240)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Quan hệ
                </InputLabel>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={RELATIONSHIP_OPTIONS.map((option) => option.label)}
                  value={form.relationship}
                  onChange={(_, newValue) =>
                    setForm((prev) => ({ ...prev, relationship: newValue || "" }))
                  }
                  inputValue={form.relationship}
                  onInputChange={(_, newInput) =>
                    setForm((prev) => ({ ...prev, relationship: newInput }))
                  }
                  renderInput={(params) => (
                    <TextField {...params} sx={fieldSx(200)} placeholder="Nhập mối quan hệ" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Tên đăng nhập
                </InputLabel>
                <TextField
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  fullWidth
                  size="small"
                  required
                  sx={fieldSx(220)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Số điện thoại
                </InputLabel>
                <TextField
                  value={form.phone_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                  fullWidth
                  size="small"
                  sx={fieldSx(220)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InputLabel shrink sx={labelSx}>
                  Email
                </InputLabel>
                <TextField
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  fullWidth
                  size="small"
                  sx={fieldSx(220)}
                />
              </Grid>
              <Grid item xs={12}>
                <InputLabel shrink sx={labelSx}>
                  Địa chỉ
                </InputLabel>
                <TextField
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  fullWidth
                  size="small"
                  sx={fieldSx(260)}
                />
              </Grid>
            </Grid>
          </SectionCard>
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
        <ArgonButton color="secondary" variant="outlined" onClick={onClose}>
          Đóng
        </ArgonButton>
        <ArgonButton color="info" onClick={handleSubmit} disabled={!canSubmit || saving}>
          {saving ? "Đang lưu..." : "Thêm phụ huynh"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

ParentManagerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  studentId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ParentManagerModal;

