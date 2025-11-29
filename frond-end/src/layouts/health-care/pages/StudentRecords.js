import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Box,
  Alert,
  Paper,
} from "@mui/material";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HeightIcon from "@mui/icons-material/Height";
import NoteIcon from "@mui/icons-material/Note";

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";
import healthService from "services/healthService";

const SectionCard = ({ icon, title, subtitle, children }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      border: "1px solid #c8e6c9",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(232,245,233,0.98) 100%)",
      boxShadow: "0 12px 30px rgba(46,125,50,0.12)",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#c8e6c9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#2e7d32",
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

const INFO_COLORS = {
  main: "#1976d2",
  dark: "#0f4c9b",
  light: "#e3f2fd",
};

export default function StudentRecords() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payload, setPayload] = useState({ checkup_date: '', height_cm: '', weight_kg: '', note: '' });
  const [edit, setEdit] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [studentInfo, setStudentInfo] = useState(location.state?.student || null);
  const [classInfo, setClassInfo] = useState(location.state?.classInfo || null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await healthService.getHealthRecords(studentId);
      if (res.success) {
        setRecords(res.data || []);
      } else {
        setError(res.error || "Không thể tải danh sách sổ sức khỏe");
        setRecords([]);
      }
    } catch (e) {
      console.error("Lỗi khi tải sổ sức khỏe:", e);
      setError(e.message || "Không thể tải danh sách sổ sức khỏe. Vui lòng thử lại.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [studentId]);

  useEffect(() => {
    if (location.state?.student && !studentInfo) {
      setStudentInfo(location.state.student);
    }
    if (location.state?.classInfo && !classInfo) {
      setClassInfo(location.state.classInfo);
    }
  }, [classInfo, location.state, studentInfo]);

  useEffect(() => {
    if (!studentInfo && records.length > 0) {
      setStudentInfo(records[0].student_id || null);
    }
  }, [records, studentInfo]);

  // Memoized values - must be before any early returns
  const studentName = useMemo(() => studentInfo?.full_name || "Học sinh", [studentInfo]);
  const classDisplayName = useMemo(() => {
    if (classInfo?.class_name) {
      return `Lớp ${classInfo.class_name}`;
    }
    return null;
  }, [classInfo]);

  const openCreate = () => {
    setEdit(null);
    setPayload({ checkup_date: '', height_cm: '', weight_kg: '', note: '' });
    setFormErrors({});
    setDialogOpen(true);
  };
  const openEdit = (r) => {
    setEdit(r);
    setPayload({
      checkup_date: r.checkup_date ? r.checkup_date.slice(0,10) : '',
      height_cm: r.height_cm?.$numberDecimal || r.height_cm || '',
      weight_kg: r.weight_kg?.$numberDecimal || r.weight_kg || '',
      note: r.note || ''
    });
    setFormErrors({});
    setDialogOpen(true);
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormErrors({});
  };
  const onChange = (e) => {
    const { name, value } = e.target;
    setPayload((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!payload.checkup_date) {
      errors.checkup_date = "Ngày khám là bắt buộc";
    }
    const height = parseFloat(payload.height_cm);
    if (payload.height_cm === "" || Number.isNaN(height) || height <= 0) {
      errors.height_cm = "Chiều cao phải lớn hơn 0";
    }
    const weight = parseFloat(payload.weight_kg);
    if (payload.weight_kg === "" || Number.isNaN(weight) || weight <= 0) {
      errors.weight_kg = "Cân nặng phải lớn hơn 0";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      alert("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return false;
    }
    return true;
  };

  const save = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      if (edit) {
        await healthService.updateHealthRecord(edit._id, payload);
      } else {
        await healthService.createHealthRecord({ ...payload, student_id: studentId });
      }
      setFormErrors({});
      setDialogOpen(false);
      await load();
    } catch (e) {
      console.error("Lỗi khi lưu sổ sức khỏe:", e);
      alert(`Lỗi ${edit ? "cập nhật" : "tạo"} sổ sức khỏe: ${e.message || "Vui lòng thử lại"}`);
    }
  };
  
  const remove = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa ghi nhận sức khỏe này?")) return;
    try {
      await healthService.deleteHealthRecord(id);
      await load();
    } catch (e) {
      console.error("Lỗi khi xóa sổ sức khỏe:", e);
      alert(`Lỗi xóa sổ sức khỏe: ${e.message || "Vui lòng thử lại"}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox
          py={3}
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox py={3}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <ArgonButton onClick={() => navigate(-1)} color="info">
            Quay lại
          </ArgonButton>
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <MedicalServicesIcon color="success" />
                  <ArgonTypography variant="h5" fontWeight="bold" letterSpacing={0.2}>
                    Sổ sức khỏe - {studentName}
                  </ArgonTypography>
                </Stack>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  {classDisplayName || "Theo dõi định kỳ chiều cao, cân nặng và ghi chú chăm sóc sức khỏe"}
                </ArgonTypography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Chip
                  icon={<HealthAndSafetyIcon />}
                  color="success"
                  variant="outlined"
                  label={`${records.length} lần khám`}
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  color="primary"
                  variant="outlined"
                  label={studentName}
                  sx={{ fontWeight: 600 }}
                />
                <Stack direction="row" spacing={1}>
                  <ArgonButton
                    color="secondary"
                    variant="outlined"
                    onClick={() => navigate(-1)}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      fontWeight: 600,
                      transition: "all 0.3s ease",
                    }}
                  >
                    Quay lại
                  </ArgonButton>
                  <ArgonButton
                    color="success"
                    variant="contained"
                    onClick={openCreate}
                    startIcon={<AddIcon />}
                    sx={{
                      fontWeight: 600,
                      transition: "all 0.3s ease",
                    }}
                  >
                    Thêm ghi nhận
                  </ArgonButton>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
              Danh sách ghi nhận sức khỏe - {studentName} ({records.length} lần khám)
            </ArgonTypography>

            {records.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                <ArgonTypography variant="body1" color="text">
                  Chưa có ghi nhận sức khỏe nào
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <Grid container spacing={2}>
                {records.map((r) => (
                  <Grid key={r._id} item xs={12} sm={6} md={4} lg={3}>
                    <Card
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: "1px solid #c8e6c9",
                        minHeight: 220,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: "0 8px 24px rgba(46,125,50,0.15)",
                          transform: "translateY(-4px)",
                          borderColor: "#4caf50",
                        },
                      }}
                    >
                      <Box>
                        <ArgonTypography
                          variant="h6"
                          fontWeight="bold"
                          color="#1b5e20"
                          mb={1}
                        >
                          {r.checkup_date
                            ? new Date(r.checkup_date).toLocaleDateString("vi-VN")
                            : "Ngày khám ?"}
                        </ArgonTypography>
                        <Stack spacing={0.5} mb={1.5}>
                          <ArgonTypography fontSize={14} color="text">
                            <strong>Chiều cao:</strong>{" "}
                            {r.height_cm?.$numberDecimal || r.height_cm || "--"} cm
                          </ArgonTypography>
                          <ArgonTypography fontSize={14} color="text">
                            <strong>Cân nặng:</strong>{" "}
                            {r.weight_kg?.$numberDecimal || r.weight_kg || "--"} kg
                          </ArgonTypography>
                          {r.note && (
                            <ArgonTypography fontSize={13} color="#37474f" mt={1} sx={{ fontStyle: "italic" }}>
                              <strong>Ghi chú:</strong> {r.note}
                            </ArgonTypography>
                          )}
                        </Stack>
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Sửa">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(r)}
                            sx={{
                              color: "#1976d2",
                              "&:hover": {
                                backgroundColor: "#e3f2fd",
                              },
                            }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            onClick={() => remove(r._id)}
                            sx={{
                              color: "#d32f2f",
                              "&:hover": {
                                backgroundColor: "#ffebee",
                              },
                            }}
                          >
                            <DeleteForeverOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </ArgonBox>
      <Footer />

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            background: "linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            color: "#ffffff",
            py: 2.5,
            px: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <MedicalServicesIcon sx={{ fontSize: 28 }} />
            <ArgonTypography variant="h5" fontWeight="bold" color="#ffffff">
              {edit ? "Sửa sổ sức khỏe" : "Thêm sổ sức khỏe"}
            </ArgonTypography>
          </Stack>
          <ArgonButton
            onClick={handleDialogClose}
            sx={{
              minWidth: "auto",
              width: 40,
              height: 40,
              borderRadius: "50%",
              p: 0,
              color: "#ffffff",
              backgroundColor: "rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.3)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.3)",
                borderColor: "rgba(255,255,255,0.5)",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <CloseIcon sx={{ fontSize: 22 }} />
          </ArgonButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <SectionCard
              icon={<CalendarTodayIcon />}
              title="Thông tin khám sức khỏe"
              subtitle="Ghi nhận ngày khám và các chỉ số cơ bản"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Ngày khám <span style={{ color: "#d32f2f" }}>*</span>
                  </ArgonTypography>
                  <TextField
                    type="date"
                    name="checkup_date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={payload.checkup_date}
                    onChange={onChange}
                    error={!!formErrors.checkup_date}
                    helperText={formErrors.checkup_date}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "success.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "success.main",
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard
              icon={<HeightIcon />}
              title="Chỉ số cơ thể"
              subtitle="Theo dõi chiều cao và cân nặng của học sinh"
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Chiều cao (cm)
                  </ArgonTypography>
                  <TextField
                    type="number"
                    name="height_cm"
                    fullWidth
                    placeholder="Nhập chiều cao..."
                    value={payload.height_cm}
                    onChange={onChange}
                    inputProps={{ min: 0, step: 0.1 }}
                    InputProps={{
                      endAdornment: (
                        <ArgonTypography variant="body2" color="#757575" sx={{ mr: 1 }}>
                          cm
                        </ArgonTypography>
                      ),
                    }}
                    error={!!formErrors.height_cm}
                    helperText={formErrors.height_cm}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "success.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "success.main",
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Cân nặng (kg)
                  </ArgonTypography>
                  <TextField
                    type="number"
                    name="weight_kg"
                    fullWidth
                    placeholder="Nhập cân nặng..."
                    value={payload.weight_kg}
                    onChange={onChange}
                    inputProps={{ min: 0, step: 0.1 }}
                    InputProps={{
                      endAdornment: (
                        <ArgonTypography variant="body2" color="#757575" sx={{ mr: 1 }}>
                          kg
                        </ArgonTypography>
                      ),
                    }}
                    error={!!formErrors.weight_kg}
                    helperText={formErrors.weight_kg}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "success.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "success.main",
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard
              icon={<NoteIcon />}
              title="Ghi chú"
              subtitle="Thông tin bổ sung về tình trạng sức khỏe"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Ghi chú
                  </ArgonTypography>
                  <TextField
                    name="note"
                    fullWidth
                    placeholder="Nhập các ghi chú về tình trạng sức khỏe, lời khuyên..."
                    value={payload.note}
                    onChange={onChange}
                    multiline
                    rows={4}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "success.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "success.main",
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </SectionCard>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            background: "linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)",
            borderTop: "1px solid #c8e6c9",
          }}
        >
          <ArgonButton
            onClick={handleDialogClose}
            variant="outlined"
            color="secondary"
            sx={{
              minWidth: 120,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              borderWidth: 1.5,
              "&:hover": {
                borderWidth: 1.5,
                transform: "translateY(-1px)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Hủy
          </ArgonButton>
          <ArgonButton
            variant="contained"
            color="success"
            onClick={save}
            sx={{
              minWidth: 140,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
              },
            }}
            startIcon={<HealthAndSafetyIcon />}
          >
            {edit ? "Cập nhật" : "Tạo mới"}
          </ArgonButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
