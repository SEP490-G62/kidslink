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
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import MedicationIcon from "@mui/icons-material/Medication";

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
      border: "1px solid #ffe0b2",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,243,224,0.98) 100%)",
      boxShadow: "0 12px 30px rgba(237,108,2,0.12)",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#ffe0b2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f57c00",
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
  surface: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
};

export default function StudentNotices() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payload, setPayload] = useState({ notice_time: '', symptoms: '', actions_taken: '', medications: '', note: '' });
  const [edit, setEdit] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [studentInfo, setStudentInfo] = useState(location.state?.student || null);
  const [classInfo, setClassInfo] = useState(location.state?.classInfo || null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await healthService.getHealthNotices(studentId);
      if (res.success) {
        setNotices(res.data || []);
      } else {
        setError(res.error || "Không thể tải danh sách thông báo y tế");
        setNotices([]);
      }
    } catch (e) {
      console.error("Lỗi khi tải thông báo y tế:", e);
      setError(e.message || "Không thể tải danh sách thông báo y tế. Vui lòng thử lại.");
      setNotices([]);
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
    if (!studentInfo && notices.length > 0) {
      setStudentInfo(notices[0].student_id || null);
    }
  }, [notices, studentInfo]);

  // Memoized values - must be before any early returns
  const studentName = useMemo(() => studentInfo?.full_name || "Học sinh", [studentInfo]);
  const classDisplayName = useMemo(() => {
    if (classInfo?.class_name) return `Lớp ${classInfo.class_name}`;
    return null;
  }, [classInfo]);

  const openCreate = () => {
    setEdit(null);
    setPayload({ notice_time: '', symptoms: '', actions_taken: '', medications: '', note: '' });
    setFormErrors({});
    setDialogOpen(true);
  };
  const openEdit = (n) => {
    setEdit(n);
    setPayload({
      notice_time: n.notice_time ? n.notice_time.replace('Z','').slice(0,16) : '',
      symptoms: n.symptoms || '',
      actions_taken: n.actions_taken || '',
      medications: n.medications || '',
      note: n.note || ''
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
    if (!payload.notice_time) {
      errors.notice_time = "Thời gian là bắt buộc";
    }
    if (!payload.symptoms?.trim()) {
      errors.symptoms = "Triệu chứng là bắt buộc";
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
        await healthService.updateHealthNotice(edit._id, payload);
      } else {
        await healthService.createHealthNotice({ ...payload, student_id: studentId });
      }
      setFormErrors({});
      setDialogOpen(false);
      await load();
    } catch (e) {
      console.error("Lỗi khi lưu thông báo y tế:", e);
      alert(`Lỗi ${edit ? "cập nhật" : "tạo"} thông báo y tế: ${e.message || "Vui lòng thử lại"}`);
    }
  };
  
  const remove = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa thông báo y tế này?")) return;
    try {
      await healthService.deleteHealthNotice(id);
      await load();
    } catch (e) {
      console.error("Lỗi khi xóa thông báo y tế:", e);
      alert(`Lỗi xóa thông báo y tế: ${e.message || "Vui lòng thử lại"}`);
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
                  <NotificationsActiveIcon color="warning" />
                  <ArgonTypography variant="h5" fontWeight="bold" letterSpacing={0.2}>
                    Thông báo y tế - {studentName}
                  </ArgonTypography>
                </Stack>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  {classDisplayName || "Ghi nhận nhanh các tình huống sức khỏe phát sinh của học sinh"}
                </ArgonTypography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Chip
                  icon={<NotificationsIcon />}
                  color="warning"
                  variant="outlined"
                  label={`${notices.length} thông báo`}
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
                    color="warning"
                    variant="contained"
                    onClick={openCreate}
                    startIcon={<AddIcon />}
                    sx={{
                      fontWeight: 600,
                      transition: "all 0.3s ease",
                    }}
                  >
                    Thêm thông báo
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
              Danh sách thông báo y tế - {studentName} ({notices.length} thông báo)
            </ArgonTypography>

            {notices.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                <ArgonTypography variant="body1" color="text">
                  Chưa có thông báo y tế nào
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <Grid container spacing={2}>
                {notices.map((n) => (
                  <Grid key={n._id} item xs={12} sm={6} md={4} lg={3}>
                    <Card
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: "1px solid #ffe0b2",
                        minHeight: 240,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: "0 8px 24px rgba(237,108,2,0.15)",
                          transform: "translateY(-4px)",
                          borderColor: "#ff9800",
                        },
                      }}
                    >
                      <Box>
                        <ArgonTypography
                          variant="h6"
                          fontWeight="bold"
                          color="#e65100"
                          mb={1}
                        >
                          {n.symptoms || "Triệu chứng chưa rõ"}
                        </ArgonTypography>
                        <Stack spacing={0.5} mb={1.5}>
                          <ArgonTypography fontSize={13} color="text">
                            <strong>Thời gian:</strong>{" "}
                            {n.notice_time
                              ? new Date(n.notice_time).toLocaleString("vi-VN")
                              : "—"}
                          </ArgonTypography>
                          <ArgonTypography fontSize={13} color="#37474f">
                            <strong>Hành động:</strong> {n.actions_taken || "—"}
                          </ArgonTypography>
                          <ArgonTypography fontSize={13} color="#37474f">
                            <strong>Thuốc đã dùng:</strong> {n.medications || "—"}
                          </ArgonTypography>
                          {n.note && (
                            <ArgonTypography fontSize={12} color="text" mt={1} sx={{ fontStyle: "italic" }}>
                              <strong>Ghi chú:</strong> {n.note}
                            </ArgonTypography>
                          )}
                        </Stack>
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Sửa">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(n)}
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
                            onClick={() => remove(n._id)}
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
            background: "linear-gradient(135deg, #ffffff 0%, #fff3e0 100%)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
            color: "#ffffff",
            py: 2.5,
            px: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <NotificationsActiveIcon sx={{ fontSize: 28 }} />
            <ArgonTypography variant="h5" fontWeight="bold" color="#ffffff">
              {edit ? "Sửa thông báo y tế" : "Thêm thông báo y tế"}
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
              icon={<AccessTimeIcon />}
              title="Thông tin thời gian"
              subtitle="Ghi nhận thời điểm phát hiện tình huống sức khỏe"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Thời gian <span style={{ color: "#d32f2f" }}>*</span>
                  </ArgonTypography>
                  <TextField
                    type="datetime-local"
                    name="notice_time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={payload.notice_time}
                    onChange={onChange}
                    error={!!formErrors.notice_time}
                    helperText={formErrors.notice_time}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "warning.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "warning.main",
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard
              icon={<LocalHospitalIcon />}
              title="Triệu chứng và xử lý"
              subtitle="Mô tả tình trạng và các biện pháp đã thực hiện"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Triệu chứng <span style={{ color: "#d32f2f" }}>*</span>
                  </ArgonTypography>
                  <TextField
                    name="symptoms"
                    fullWidth
                    placeholder="Nhập triệu chứng của học sinh..."
                    value={payload.symptoms}
                    onChange={onChange}
                    multiline
                    rows={3}
                    error={!!formErrors.symptoms}
                    helperText={formErrors.symptoms}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "warning.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "warning.main",
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Hành động đã thực hiện
                  </ArgonTypography>
                  <TextField
                    name="actions_taken"
                    fullWidth
                    placeholder="Ví dụ: Đưa đến phòng y tế, gọi phụ huynh..."
                    value={payload.actions_taken}
                    onChange={onChange}
                    multiline
                    rows={2}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "warning.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "warning.main",
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard
              icon={<MedicationIcon />}
              title="Thuốc và ghi chú"
              subtitle="Thông tin về thuốc đã sử dụng và các ghi chú bổ sung"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Thuốc đã dùng
                  </ArgonTypography>
                  <TextField
                    name="medications"
                    fullWidth
                    placeholder="Ví dụ: Paracetamol 500mg, 1 viên..."
                    value={payload.medications}
                    onChange={onChange}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "warning.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "warning.main",
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Ghi chú
                  </ArgonTypography>
                  <TextField
                    name="note"
                    fullWidth
                    placeholder="Nhập các ghi chú bổ sung (nếu có)..."
                    value={payload.note}
                    onChange={onChange}
                    multiline
                    rows={3}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "warning.main",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "warning.main",
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
            background: "linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)",
            borderTop: "1px solid #ffe0b2",
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
            color="warning"
            onClick={save}
            sx={{
              minWidth: 140,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(237, 108, 2, 0.3)",
              },
            }}
            startIcon={<NotificationsActiveIcon />}
          >
            {edit ? "Cập nhật" : "Tạo mới"}
          </ArgonButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
