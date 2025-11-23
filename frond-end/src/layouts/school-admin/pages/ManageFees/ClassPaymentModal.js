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
  TextField,
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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

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

  const handleStudentClick = async (student) => {
    // Only allow payment for non-paid students
    if (student.status === 'paid') {
      return;
    }
    
    setPaymentLoading(true);
    setPaymentError(null);
    
    try {
      let invoiceId = student.invoice?._id;
      let finalAmount = student.amount_due || "";
      
      // Auto-create invoice if not exists
      if (!invoiceId) {
        const createRes = await schoolAdminService.createOrGetInvoice(
          feeId,
          classInfo.class_fee_id,
          student.student_class_id
        );
        
        if (createRes.success && createRes.data) {
          invoiceId = createRes.data.invoice_id;
          finalAmount = createRes.data.total_amount;
          
          // Update student object with new invoice info
          student.invoice = {
            _id: invoiceId,
            amount_due: finalAmount,
            due_date: createRes.data.due_date,
            status: createRes.data.status,
          };
          student.amount_due = finalAmount;
          student.late_fee_info = {
            is_applied: createRes.data.is_late_fee_applied,
            amount: createRes.data.late_fee_amount,
            base_amount: createRes.data.base_amount,
          };
          
          // Refresh payment data to get updated invoice
          const refreshRes = await schoolAdminService.getClassFeePayments(
            feeId,
            classInfo.class_fee_id
          );
          if (refreshRes.success && refreshRes.data) {
            setPaymentData(refreshRes.data);
            // Find updated student in refreshed data
            const updatedStudent = refreshRes.data.students?.find(
              s => s.student_class_id === student.student_class_id
            );
            if (updatedStudent) {
              student = updatedStudent;
            }
          }
        } else {
          setPaymentError(createRes.message || "Không thể tạo hóa đơn");
          setPaymentLoading(false);
          return;
        }
      }
      
      setSelectedStudent(student);
      setPaymentAmount(finalAmount);
      setPaymentDialogOpen(true);
    } catch (err) {
      setPaymentError(err.message || "Không thể tạo hóa đơn");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedStudent || !selectedStudent.invoice?._id) {
      setPaymentError("Không tìm thấy thông tin hóa đơn");
      return;
    }

    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
      setPaymentError("Số tiền phải là số hợp lệ và > 0");
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const res = await schoolAdminService.markInvoicePaidOffline(
        feeId,
        classInfo.class_fee_id,
        selectedStudent.invoice._id,
        parseFloat(paymentAmount)
      );

      if (res.success) {
        // Close payment dialog
        setPaymentDialogOpen(false);
        setSelectedStudent(null);
        setPaymentAmount("");
        
        // Refresh payment data
        const refreshRes = await schoolAdminService.getClassFeePayments(
          feeId,
          classInfo.class_fee_id
        );
        if (refreshRes.success && refreshRes.data) {
          setPaymentData(refreshRes.data);
        }
      } else {
        setPaymentError(res.message || "Không thể thực hiện thanh toán");
      }
    } catch (err) {
      setPaymentError(err.message || "Không thể thực hiện thanh toán");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentDialogClose = () => {
    setPaymentDialogOpen(false);
    setSelectedStudent(null);
    setPaymentAmount("");
    setPaymentError(null);
  };

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

          const isPaid = item.status === 'paid';
          const canClick = !isPaid;

          return (
            <Box
              key={item.student_class_id}
              onClick={() => {
                if (canClick) {
                  handleStudentClick(item);
                }
              }}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                p: 2,
                transition: "box-shadow 0.2s ease",
                cursor: canClick ? "pointer" : "default",
                position: "relative",
                "&:hover": { 
                  boxShadow: canClick ? 6 : 0,
                  bgcolor: canClick ? "#f5f5f5" : "transparent",
                },
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                gap={2}
                sx={{ position: "relative" }}
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
        {(loading || paymentLoading) && (
          <ArgonBox py={3} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
            <CircularProgress />
            {paymentLoading && (
              <ArgonTypography variant="body2" color="text">
                Đang tạo hóa đơn và tính phụ phí...
              </ArgonTypography>
            )}
          </ArgonBox>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !paymentLoading && !error && paymentData && (
          <Stack spacing={3}>
            {summary && (
              <Box sx={{ px: { xs: 0, sm: 1.5 } }}>
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
              </Box>
            )}

            {renderStudents()}
            
            {students.length > 0 && students.some(s => s.status !== 'paid') && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <ArgonTypography variant="body2">
                  💡 <strong>Lưu ý:</strong> Click vào học sinh chưa thanh toán để nhập số tiền và xác nhận thanh toán trực tiếp.
                </ArgonTypography>
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <ArgonButton color="secondary" variant="outlined" onClick={onClose}>
          Đóng
        </ArgonButton>
      </DialogActions>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={handlePaymentDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <PaymentIcon color="primary" />
            <ArgonTypography variant="h6" fontWeight="bold">
              Thanh toán trực tiếp
            </ArgonTypography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <ArgonTypography variant="body2" color="text" mb={0.5}>
                  Học sinh:
                </ArgonTypography>
                <ArgonTypography variant="body1" fontWeight="bold">
                  {selectedStudent.student?.full_name || "Học sinh"}
                </ArgonTypography>
              </Box>
              
              <Box>
                <ArgonTypography variant="body2" color="text" mb={0.5}>
                  Số tiền cần thanh toán:
                </ArgonTypography>
                <ArgonTypography variant="h6" color="primary" fontWeight="bold">
                  {formatCurrency(selectedStudent.amount_due)} VNĐ
                </ArgonTypography>
                {selectedStudent.late_fee_info?.is_applied && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: "#fff3e0", borderRadius: 1, border: "1px solid #ffb74d" }}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="caption" color="text">
                        Phí gốc: {formatCurrency(selectedStudent.late_fee_info.base_amount)} VNĐ
                      </ArgonTypography>
                      <ArgonTypography variant="caption" color="warning.main" fontWeight="bold">
                        + Phụ phí quá hạn: {formatCurrency(selectedStudent.late_fee_info.amount)} VNĐ
                      </ArgonTypography>
                      <ArgonTypography variant="caption" color="text" fontWeight="bold">
                        = Tổng cộng: {formatCurrency(selectedStudent.amount_due)} VNĐ
                      </ArgonTypography>
                    </Stack>
                  </Box>
                )}
              </Box>

              {paymentError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {paymentError}
                </Alert>
              )}

              <TextField
                label="Số tiền thanh toán"
                type="number"
                fullWidth
                value={paymentAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d.]/g, "");
                  if (value === "" || value === ".") {
                    setPaymentAmount("");
                    return;
                  }
                  const parts = value.split(".");
                  if (parts.length > 2) return;
                  if (parts[1] && parts[1].length > 2) return;
                  setPaymentAmount(value);
                }}
                InputProps={{
                  endAdornment: (
                    <ArgonTypography variant="body2" color="text" sx={{ mr: 1 }}>
                      VNĐ
                    </ArgonTypography>
                  ),
                }}
                helperText="Nhập số tiền đã nhận từ phụ huynh"
                sx={{ mt: 2 }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <ArgonButton 
            color="secondary" 
            variant="outlined" 
            onClick={handlePaymentDialogClose}
            disabled={paymentLoading}
          >
            Hủy
          </ArgonButton>
          <ArgonButton
            color="primary"
            variant="contained"
            onClick={handlePaymentSubmit}
            disabled={paymentLoading || !paymentAmount || parseFloat(paymentAmount) <= 0}
            startIcon={paymentLoading ? <CircularProgress size={16} /> : <PaymentIcon />}
          >
            {paymentLoading ? "Đang xử lý..." : "Xác nhận thanh toán"}
          </ArgonButton>
        </DialogActions>
      </Dialog>
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

