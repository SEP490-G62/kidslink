import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Box,
  Stack,
  Chip,
  Avatar,
  Grid,
  Divider,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import PaymentIcon from "@mui/icons-material/Payment";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import schoolAdminService from "services/schoolAdminService";
const statusStyles = {
  paid: {
    label: "Đã thanh toán",
    color: "#2e7d32",
    background: "rgba(46, 125, 50, 0.12)",
  },
  pending: {
    label: "Chưa thanh toán",
    color: "#0288d1",
    background: "rgba(2, 136, 209, 0.12)",
  },
  overdue: {
    label: "Quá hạn",
    color: "#d32f2f",
    background: "rgba(211, 47, 47, 0.12)",
  },
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getPaymentMethodLabel = (method) => {
  if (method === 0) return "Thanh toán trực tiếp";
  if (method === 1) return "Thanh toán trực tuyến";
  return "Không xác định";
};

const SummaryCard = ({ title, value, subtitle, icon }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      border: "1px solid #e0e0e0",
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
    }}
  >
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <ArgonTypography variant="body2" color="text">
        {title}
      </ArgonTypography>
    </Stack>
    <ArgonTypography variant="h5" fontWeight="bold">
      {value}
    </ArgonTypography>
    {subtitle && (
      <ArgonTypography variant="caption" color="text">
        {subtitle}
      </ArgonTypography>
    )}
  </Box>
);

const ClassPaymentModal = ({ open, onClose, feeId, classInfo, feeName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const classTitle = useMemo(() => {
    if (!classInfo) return "Thông tin thanh toán";
    return `${classInfo.class_name || "Lớp"} (${classInfo.academic_year || "-"})`;
  }, [classInfo]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!open || !feeId || !classInfo?.class_fee_id) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await schoolAdminService.getClassFeePayments(
          feeId,
          classInfo.class_fee_id
        );
        if (res.success && res.data) {
          setPaymentData(res.data);
        } else {
          setError(res.message || "Không thể tải dữ liệu thanh toán.");
        }
      } catch (err) {
        setError(err.message || "Không thể tải dữ liệu thanh toán.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();

    if (!open) {
      setPaymentData(null);
      setError(null);
    }
  }, [open, feeId, classInfo]);

  const summary = paymentData?.summary || null;
  const students = paymentData?.students || [];

  const renderStudents = () => {
    if (students.length === 0) {
      return (
        <ArgonTypography variant="body2" color="text" textAlign="center">
          Lớp chưa có học sinh nào.
        </ArgonTypography>
      );
    }

    return (
      <Stack spacing={2}>
        {students.map((item) => {
          const statusConfig = statusStyles[item.status] || statusStyles.pending;
          const paymentInfo = item.invoice?.payment;

          return (
            <Box
              key={item.student_class_id}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                p: 2,
                transition: "box-shadow 0.2s ease",
                "&:hover": { boxShadow: 6 },
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                gap={2}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={item.student?.avatar_url}
                    alt={item.student?.full_name}
                    sx={{ width: 48, height: 48 }}
                  />
                  <Box>
                    <ArgonTypography variant="subtitle1" fontWeight="bold">
                      {item.student?.full_name || "Học sinh"}
                    </ArgonTypography>
                    <ArgonTypography variant="caption" color="text">
                      Giảm học phí: {item.discount || 0}%
                    </ArgonTypography>
                  </Box>
                </Stack>
                <Chip
                  label={statusConfig.label}
                  sx={{
                    backgroundColor: statusConfig.background,
                    color: statusConfig.color,
                    fontWeight: 600,
                  }}
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <ArgonTypography variant="body2" color="text">
                    <strong>Số tiền:</strong>{" "}
                    {formatCurrency(item.amount_due)} VNĐ
                  </ArgonTypography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <ArgonTypography variant="body2" color="text">
                    <strong>Hạn thanh toán:</strong> {formatDate(item.due_date)}
                  </ArgonTypography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <ArgonTypography variant="body2" color="text">
                    <strong>Trạng thái:</strong> {item.status_text}
                  </ArgonTypography>
                </Grid>
                {paymentInfo && (
                  <Grid item xs={12}>
                    <Tooltip
                      title={`Phương thức: ${getPaymentMethodLabel(
                        paymentInfo.payment_method
                      )}`}
                    >
                      <ArgonTypography variant="body2" color="text">
                        <strong>Thanh toán:</strong>{" "}
                        {paymentInfo.payment_time || "Không xác định"}
                      </ArgonTypography>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
            </Box>
          );
        })}
      </Stack>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack spacing={0.5}>
          <ArgonTypography variant="h6" fontWeight="bold">
            {classTitle}
          </ArgonTypography>
          <ArgonTypography variant="caption" color="text">
            Khoản phí: {feeName || paymentData?.fee?.fee_name || "-"}
          </ArgonTypography>
        </Stack>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <ArgonBox py={3} display="flex" justifyContent="center">
            <CircularProgress />
          </ArgonBox>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && paymentData && (
          <Stack spacing={3}>
            {summary && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <SummaryCard
                    title="Sĩ số lớp"
                    value={summary.totalStudents}
                    subtitle="Tổng học sinh"
                    icon={<HourglassBottomIcon color="action" />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SummaryCard
                    title="Đã thu"
                    value={`${formatCurrency(summary.totalPaidAmount)} VNĐ`}
                    subtitle={`${summary.paid} học sinh`}
                    icon={<PaymentIcon color="success" />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SummaryCard
                    title="Còn phải thu"
                    value={`${formatCurrency(summary.totalPendingAmount)} VNĐ`}
                    subtitle={`${summary.pending} học sinh chờ thanh toán`}
                    icon={<EventIcon color="warning" />}
                  />
                </Grid>
              </Grid>
            )}

            {renderStudents()}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <ArgonButton color="secondary" variant="outlined" onClick={onClose}>
          Đóng
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.node,
};

ClassPaymentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  feeId: PropTypes.string,
  classInfo: PropTypes.shape({
    class_fee_id: PropTypes.string,
    class_name: PropTypes.string,
    academic_year: PropTypes.string,
  }),
  feeName: PropTypes.string,
};

export default ClassPaymentModal;

