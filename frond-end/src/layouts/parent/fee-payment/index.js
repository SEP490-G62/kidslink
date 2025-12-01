/**
=========================================================
* KidsLink Parent Dashboard - Fee and Payment
=========================================================
*/

// React
import { useState, useEffect, useRef, useCallback } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// QR
import QRCode from "react-qr-code";

// Services
import parentService from "services/parentService";

function FeeAndPayment() {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedFees, setSelectedFees] = useState([]); // Array of selected fees
  const [studentsWithFees, setStudentsWithFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const pollingRef = useRef(null);
  const pollingAttemptsRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 30;

  const stopPaymentPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const resetPaymentState = () => {
    setPaymentResult(null);
    setPaymentError(null);
    setPaymentLoading(false);
    setCopySuccess(false);
    stopPaymentPolling();
  };

  const getSelectedPaymentFee = () => {
    if (selectedFees.length > 0) {
      return selectedFees[0];
    }
    return selectedFee;
  };

  const getQrImageSrc = (result) => {
    if (!result) return null;
    const rawQrUrl =
      result.qr_url ||
      result.payos?.qrCodeURL ||
      result.payos?.qrCodeUrl ||
      result.payos?.qrImage ||
      null;

    if (rawQrUrl) {
      return rawQrUrl;
    }

    const rawQrData =
      result.qr_code ||
      result.payos?.qrContent ||
      result.payos?.qrCode ||
      result.payos?.qrData ||
      null;

    if (!rawQrData) {
      return null;
    }

    if (
      rawQrData.startsWith('http') ||
      rawQrData.startsWith('data:image') ||
      rawQrData.startsWith('iVBOR')
    ) {
      return rawQrData;
    }

    return rawQrData;
  };

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await parentService.getStudentFees();
      
      if (result.success) {
        setStudentsWithFees(result.data || []);
      } else {
        setError(result.error || "Có lỗi xảy ra khi tải dữ liệu");
      }
    } catch (err) {
      console.error("Error fetching fees:", err);
      setError("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch fees data
  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    resetPaymentState();
    setPaymentDialogOpen(false);
    setSelectedFee(null);
    setSelectedFees([]);
  }, []);

  const startPaymentStatusPolling = useCallback((orderCode) => {
    if (!orderCode) return;
    stopPaymentPolling();
    pollingAttemptsRef.current = 0;

    pollingRef.current = setInterval(async () => {
      pollingAttemptsRef.current += 1;
      try {
        const statusRes = await parentService.checkPayOSPaymentStatus(orderCode);
        if (statusRes?.success && statusRes.data?.is_paid) {
          stopPaymentPolling();
          setPaymentResult(prev => ({
            ...(prev || {}),
            ...(statusRes.data || {}),
            is_paid: true
          }));
          await fetchFees();
          // Trigger refresh unpaid fees count in sidenav
          window.dispatchEvent(
            new CustomEvent("kidslink:refresh_unpaid_fees")
          );
          setTimeout(() => {
            handleClosePaymentDialog();
          }, 1200);
        } else if (pollingAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          stopPaymentPolling();
        }
      } catch (err) {
        console.error('Polling PayOS status error:', err);
        if (pollingAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          stopPaymentPolling();
        }
      }
    }, 5000);
  }, [fetchFees]);

  const formatCurrency = (amount, includeVND = false) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0';
    const formatted = new Intl.NumberFormat('vi-VN').format(numAmount);
    return includeVND ? `${formatted} VNĐ` : formatted;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const getFeeTotalAmount = (fee) => {
    if (!fee) return 0;
    if (fee.amount_with_late_fee !== undefined && fee.amount_with_late_fee !== null) {
      return Number(fee.amount_with_late_fee) || 0;
    }
    if (fee.total_amount_display !== undefined && fee.total_amount_display !== null) {
      return Number(fee.total_amount_display) || 0;
    }
    if (fee.invoice?.amount_due) {
      return Number(fee.invoice.amount_due) || 0;
    }
    return Number(fee.amount) || 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "error";
      case "overdue":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "paid":
        return "Đã thanh toán";
      case "pending":
        return "Chưa thanh toán";
      case "overdue":
        return "Quá hạn";
      default:
        return status;
    }
  };

  const handlePayment = (fee, studentData) => {
    const enrichedFee = {
      ...fee,
      student: studentData.student,
      student_class_id: fee.student_class_id || studentData.student_class_id,
      class_fee_id: fee.class_fee_id || fee._id,
      feeKey: `${fee._id}_${studentData.student._id}`
    };
    setSelectedFee(enrichedFee);
    setSelectedFees([enrichedFee]);
    resetPaymentState();
    setPaymentDialogOpen(true);
  };

  const handlePaymentMultiple = () => {
    if (selectedFees.length > 0) {
      resetPaymentState();
      setPaymentDialogOpen(true);
    }
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedFee(null);
    // Only clear selectedFees if we're closing after a single payment
    // For multiple payments, keep them selected until payment is confirmed
    if (selectedFee) {
      setSelectedFees([]);
    }
    resetPaymentState();
  };

  // Handle checkbox change for individual fee
  const handleFeeCheckboxChange = (fee, studentData) => (event) => {
    const student = studentData.student;
    const feeKey = `${fee._id}_${student._id}`;
    if (event.target.checked) {
      setSelectedFees([
        ...selectedFees,
        {
          ...fee,
          student,
          student_class_id: fee.student_class_id || studentData.student_class_id,
          class_fee_id: fee.class_fee_id || fee._id,
          feeKey
        }
      ]);
    } else {
      setSelectedFees(selectedFees.filter(f => f.feeKey !== feeKey));
    }
  };

  // Handle select all checkbox for a student
  const handleSelectAllForStudent = (studentData) => (event) => {
    const payableFees = studentData.fees.filter(fee => fee.status !== "paid");
    
    if (event.target.checked) {
      // Add all payable fees for this student
      const newFees = payableFees.map(fee => ({
        ...fee,
        student: studentData.student,
        student_class_id: fee.student_class_id || studentData.student_class_id,
        class_fee_id: fee.class_fee_id || fee._id,
        feeKey: `${fee._id}_${studentData.student._id}`
      }));
      
      // Remove any existing fees for this student and add new ones
      const otherFees = selectedFees.filter(
        f => f.student._id !== studentData.student._id
      );
      setSelectedFees([...otherFees, ...newFees]);
    } else {
      // Remove all fees for this student
      setSelectedFees(selectedFees.filter(
        f => f.student._id !== studentData.student._id
      ));
    }
  };

  // Handle select all checkbox for all students
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allPayableFees = [];
      filteredData.forEach((studentData) => {
        const payableFees = studentData.fees.filter(fee => fee.status !== "paid");
        payableFees.forEach(fee => {
          allPayableFees.push({
            ...fee,
            student: studentData.student,
            student_class_id: fee.student_class_id || studentData.student_class_id,
            class_fee_id: fee.class_fee_id || fee._id,
            feeKey: `${fee._id}_${studentData.student._id}`
          });
        });
      });
      setSelectedFees(allPayableFees);
    } else {
      setSelectedFees([]);
    }
  };

  const handleCreatePayOSPayment = async () => {
    const targetFees = selectedFees.length > 0 ? selectedFees : (selectedFee ? [selectedFee] : []);
    if (targetFees.length === 0) {
      setPaymentError('Vui lòng chọn ít nhất một khoản thu để thanh toán.');
      return;
    }

    const invalidFee = targetFees.find(fee =>
      !fee.student?._id ||
      !fee.student_class_id ||
      !(fee.class_fee_id || fee._id)
    );
    if (invalidFee) {
      setPaymentError('Thiếu thông tin cần thiết để tạo thanh toán.');
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);
    setPaymentResult(null);
    setCopySuccess(false);

    let payload;
    if (targetFees.length === 1) {
      const fee = targetFees[0];
      payload = {
        student_id: fee.student._id,
        student_class_id: fee.student_class_id,
        class_fee_id: fee.class_fee_id || fee._id
      };
      if (fee.invoice?._id) {
        payload.invoice_id = fee.invoice._id;
      }
    } else {
      payload = {
        fee_items: targetFees.map((fee) => ({
          student_id: fee.student._id,
          student_class_id: fee.student_class_id,
          class_fee_id: fee.class_fee_id || fee._id,
          invoice_id: fee.invoice?._id
        }))
      };
    }

    try {
      const response = await parentService.createPayOSPayment(payload);
      if (response?.success) {
        const paymentData = response.data || response;
        setPaymentResult(paymentData);
        if (paymentData?.order_code) {
          startPaymentStatusPolling(paymentData.order_code);
        }
      } else {
        setPaymentError(response?.message || response?.error || 'Không thể tạo yêu cầu thanh toán.');
      }
    } catch (error) {
      setPaymentError(error?.message || 'Không thể tạo yêu cầu thanh toán.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCopyCheckoutLink = async () => {
    if (!paymentResult?.checkout_url) return;
    try {
      await navigator.clipboard.writeText(paymentResult.checkout_url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy checkout url error:', error);
      setCopySuccess(false);
    }
  };

  // Check if a fee is selected
  const isFeeSelected = (fee, student) => {
    const feeKey = `${fee._id}_${student._id}`;
    return selectedFees.some(f => f.feeKey === feeKey);
  };

  // Check if all payable fees for a student are selected
  const areAllFeesSelectedForStudent = (studentData) => {
    const payableFees = studentData.fees.filter(fee => fee.status !== "paid");
    if (payableFees.length === 0) return false;
    
    return payableFees.every(fee => isFeeSelected(fee, studentData.student));
  };

  // Check if some (but not all) fees for a student are selected
  const areSomeFeesSelectedForStudent = (studentData) => {
    const payableFees = studentData.fees.filter(fee => fee.status !== "paid");
    if (payableFees.length === 0) return false;
    
    const selectedCount = payableFees.filter(fee => 
      isFeeSelected(fee, studentData.student)
    ).length;
    
    return selectedCount > 0 && selectedCount < payableFees.length;
  };

  // Check if all payable fees are selected
  const areAllFeesSelected = () => {
    const allPayableFees = filteredData.reduce((acc, studentData) => {
      return acc + studentData.fees.filter(fee => fee.status !== "paid").length;
    }, 0);
    
    if (allPayableFees === 0) return false;
    return selectedFees.length === allPayableFees;
  };

  // Check if some (but not all) fees are selected
  const areSomeFeesSelected = () => {
    const allPayableFees = filteredData.reduce((acc, studentData) => {
      return acc + studentData.fees.filter(fee => fee.status !== "paid").length;
    }, 0);
    
    return selectedFees.length > 0 && selectedFees.length < allPayableFees;
  };


  // Calculate summary statistics
  const calculateSummary = () => {
    let totalDebt = 0;
    let totalPaid = 0;
    let overdueCount = 0;

    studentsWithFees.forEach((studentData) => {
      studentData.fees?.forEach((fee) => {
        const baseAmount = parseFloat(fee.amount) || 0;
        const amountWithLateFee = fee.amount_with_late_fee
          ? parseFloat(fee.amount_with_late_fee)
          : baseAmount;

        if (fee.status === "paid") {
          totalPaid += amountWithLateFee;
        } else {
          totalDebt += amountWithLateFee;
          if (fee.status === "overdue") {
            overdueCount++;
          }
        }
      });
    });

    return { totalDebt, totalPaid, overdueCount };
  };

  // Filter fees
  const getFilteredFees = () => {
    return studentsWithFees.map((studentData) => {
      const filteredFees = studentData.fees?.filter((fee) => {
        const matchesSearch = searchTerm === "" || 
          fee.fee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fee.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || fee.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      });

      return {
        ...studentData,
        fees: filteredFees || []
      };
    }).filter((studentData) => studentData.fees.length > 0);
  };

  const summary = calculateSummary();
  const filteredData = getFilteredFees();
  const hasGlobalSelectableFees = filteredData.some((studentData) =>
    studentData.fees?.some((fee) => fee.status !== "paid")
  );

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox py={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
          <Alert severity="error">{error}</Alert>
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Học phí & Thanh toán
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Quản lý học phí và thanh toán cho con - Lớp có năm học lớn nhất
          </ArgonTypography>
        </ArgonBox>

        {/* Summary Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-money-coins"
                    color="error"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Tổng nợ
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="error">
                      {formatCurrency(summary.totalDebt)} VNĐ
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-check-bold"
                    color="success"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Đã thanh toán
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="success">
                      {formatCurrency(summary.totalPaid)} VNĐ
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-calendar-grid-58"
                    color="warning"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Quá hạn
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="warning">
                      {summary.overdueCount}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter and Search */}
        <ArgonBox mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm học phí..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <i className="ni ni-zoom-split-in" style={{ marginRight: 8 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select 
                  label="Trạng thái"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="pending">Chưa thanh toán</MenuItem>
                  <MenuItem value="paid">Đã thanh toán</MenuItem>
                  <MenuItem value="overdue">Quá hạn</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <ArgonBox display="flex" alignItems="center" gap={2}>
                {hasGlobalSelectableFees && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={areAllFeesSelected()}
                        indeterminate={areSomeFeesSelected()}
                        onChange={handleSelectAll}
                      />
                    }
                    label="Chọn tất cả"
                  />
                )}
                {selectedFees.length > 0 && hasGlobalSelectableFees && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePaymentMultiple}
                    startIcon={<i className="ni ni-credit-card" />}
                  >
                    Thanh toán ({selectedFees.length})
                  </Button>
                )}
              </ArgonBox>
            </Grid>
          </Grid>
        </ArgonBox>

        {/* Students with Fees */}
        {filteredData.length === 0 ? (
        <Card>
          <CardContent>
              <ArgonBox py={4} textAlign="center">
                <ArgonTypography variant="h6" color="text">
                  Không có khoản thu nào
                </ArgonTypography>
              </ArgonBox>
            </CardContent>
          </Card>
        ) : (
          filteredData.map((studentData) => {
            const hasSelectableFees = studentData.fees?.some((fee) => fee.status !== "paid");
            return (
            <Card key={studentData.student._id} sx={{ mb: 3, boxShadow: 3 }}>
              <CardContent>
                {/* Student Header */}
                <ArgonBox 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between"
                  mb={2}
                  pb={2}
                  sx={{ borderBottom: "2px solid #e0e0e0" }}
                >
                  <ArgonBox display="flex" alignItems="center" flex={1}>
                    <Avatar
                      src={studentData.student.avatar_url}
                      alt={studentData.student.full_name}
                      sx={{ mr: 2, width: 48, height: 48 }}
                    >
                      {studentData.student.full_name.charAt(0)}
                    </Avatar>
                    <ArgonBox>
                      <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                        {studentData.student.full_name}
                      </ArgonTypography>
                      {studentData.class ? (
                        <ArgonTypography variant="body2" color="text">
                          Lớp: {studentData.class.class_name} - Năm học: {studentData.class.academic_year}
                        </ArgonTypography>
                      ) : (
                        <ArgonTypography variant="body2" color="error">
                          {studentData.message || "Chưa được phân lớp"}
            </ArgonTypography>
                      )}
                    </ArgonBox>
                  </ArgonBox>
                  <Chip
                    label={`${studentData.fees?.length || 0} khoản thu`}
                    color="primary"
                    size="medium"
                    sx={{ fontWeight: 600 }}
                  />
                </ArgonBox>

                {/* Fees Table */}
                {studentData.fees && studentData.fees.length > 0 ? (
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      boxShadow: 2, 
                      border: (theme) => `1px solid ${theme.palette.info.light}` 
                    }}
                  >
                    <Table
                      sx={{
                        tableLayout: "fixed",
                        width: "100%",
                        "& .MuiTableHead-root": {
                          display: "table-header-group !important",
                          padding: 0,
                          backgroundColor: (theme) => theme.palette.info.main,
                          "& .MuiTableCell-root": {
                            fontWeight: 700,
                            color: "#ffffff",
                            borderBottom: (theme) => `2px solid ${theme.palette.info.dark}`,
                          },
                        },
                        "& .MuiTableCell-root": {
                          padding: "14px 16px",
                          verticalAlign: "middle",
                          borderBottom: (theme) => `1px solid ${theme.palette.info.light}`,
                        },
                        "& .MuiTableBody-root .MuiTableRow-root:hover": {
                          backgroundColor: (theme) => `${theme.palette.info.light}33`,
                        },
                      }}
                    >
                      <colgroup>
                        <col style={{ width: "5%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "10%" }} />
                      </colgroup>
                <TableHead>
                  <TableRow>
                          <TableCell padding="checkbox">
                            {hasSelectableFees && (
                              <Checkbox
                                checked={areAllFeesSelectedForStudent(studentData)}
                                indeterminate={areSomeFeesSelectedForStudent(studentData)}
                                onChange={handleSelectAllForStudent(studentData)}
                                sx={{
                                  color: "#ffffff",
                                  "&.Mui-checked": {
                                    color: "#ffffff",
                                  },
                                  "&.MuiCheckbox-indeterminate": {
                                    color: "#ffffff",
                                  },
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                              Tên học phí
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                              Số tiền
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                              Hạn thanh toán
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                              Trạng thái
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                              Mô tả
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                              Thao tác
                            </ArgonTypography>
                          </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                        {studentData.fees.map((fee) => (
                          <TableRow key={fee._id} hover>
                            <TableCell padding="checkbox">
                              {hasSelectableFees && (
                                <Checkbox
                                  checked={isFeeSelected(fee, studentData.student)}
                                  onChange={handleFeeCheckboxChange(fee, studentData)}
                                  disabled={fee.status === "paid"}
                                />
                              )}
                            </TableCell>
                      <TableCell>
                              <ArgonTypography variant="body2" fontWeight="600" color="#212121">
                                {fee.fee_name}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#1976d2" sx={{ fontSize: "0.95rem" }}>
                          {formatCurrency(fee.amount_with_late_fee || fee.amount)} VNĐ
                        </ArgonTypography>
                        <ArgonTypography variant="caption" color="#757575" display="block">
                          Phí gốc: {formatCurrency(fee.amount)} VNĐ
                        </ArgonTypography>
                        {fee.late_fee?.is_applied && (
                          <ArgonTypography variant="caption" color="warning.main" display="block">
                            + Phụ phí quá hạn: {formatCurrency(fee.late_fee?.applied_amount || 0)} VNĐ
                          </ArgonTypography>
                        )}
                        {!fee.late_fee?.is_applied && fee.late_fee?.is_applicable && fee.status !== "paid" && (
                          <ArgonTypography variant="caption" color="warning.main" display="block">
                            Phụ phí {fee.late_fee?.type === "percentage"
                              ? `${fee.late_fee?.value}%`
                              : `${formatCurrency(fee.late_fee?.value || 0)} VNĐ`} sẽ áp dụng khi quá hạn
                          </ArgonTypography>
                        )}
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontSize="0.875rem" color="#424242">
                          {formatDate(fee.effective_due_date || fee.due_date)}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <Chip
                                label={getStatusText(fee.status)}
                          color={getStatusColor(fee.status)}
                          size="small"
                                sx={{
                                  fontWeight: 500,
                                  "&.MuiChip-colorsuccess": {
                                    backgroundColor: "#c8e6c9",
                                    color: "#2e7d32",
                                    border: "1px solid #4caf50",
                                  },
                                  "&.MuiChip-colorerror": {
                                    backgroundColor: "#ffcdd2",
                                    color: "#c62828",
                                    border: "1px solid #f44336",
                                  },
                                  "&.MuiChip-colorwarning": {
                                    backgroundColor: "#ffe0b2",
                                    color: "#e65100",
                                    border: "1px solid #ff9800",
                                  },
                                }}
                        />
                      </TableCell>
                      <TableCell>
                              <ArgonTypography variant="body2" color="#424242">
                                {fee.description || "-"}
                        </ArgonTypography>
                        {fee.late_fee?.description && (
                          <ArgonTypography variant="caption" color="#757575" display="block">
                            Phụ phí: {fee.late_fee?.description}
                          </ArgonTypography>
                        )}
                      </TableCell>
                      <TableCell>
                              {fee.status !== "paid" && hasSelectableFees ? (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                                  onClick={() => handlePayment(fee, studentData)}
                                  sx={{
                                    textTransform: "none",
                                    fontWeight: 500,
                                    borderRadius: 1,
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    "&:hover": {
                                      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                                    },
                                  }}
                          >
                            Thanh toán
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                                  color="success"
                            size="small"
                            disabled
                                  sx={{
                                    textTransform: "none",
                                    fontWeight: 500,
                                    borderRadius: 1,
                                  }}
                          >
                            Đã thanh toán
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
                ) : (
                  <ArgonBox py={2} textAlign="center">
                    <ArgonTypography variant="body2" color="text">
                      Không có khoản thu nào
                    </ArgonTypography>
                  </ArgonBox>
                )}
          </CardContent>
        </Card>
            );
          })
        )}

        {/* Payment Dialog */}
        <Dialog
          open={paymentDialogOpen}
          onClose={handleClosePaymentDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
              {selectedFees.length > 1 ? `Thanh toán ${selectedFees.length} khoản thu` : "Thanh toán học phí"}
            </ArgonTypography>
          </DialogTitle>
          <DialogContent>
            {(selectedFee || selectedFees.length > 0) && (
              <ArgonBox>
                {/* Display selected fees */}
                <ArgonBox mb={3}>
                  <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
                    Các khoản thu được chọn:
                  </ArgonTypography>
                  
                  {selectedFees.length > 0 ? (
                    <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 2 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Học sinh</TableCell>
                            <TableCell>Tên học phí</TableCell>
                            <TableCell>Số tiền</TableCell>
                            <TableCell>Hạn thanh toán</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedFees.map((fee, index) => (
                            <TableRow key={fee.feeKey || index}>
                              <TableCell>
                                <ArgonTypography variant="body2" fontWeight="medium">
                                  {fee.student?.full_name || "N/A"}
                                </ArgonTypography>
                              </TableCell>
                              <TableCell>
                                <ArgonTypography variant="body2">
                                  {fee.fee_name}
                                </ArgonTypography>
                              </TableCell>
                              <TableCell>
                                <ArgonTypography variant="body2" fontWeight="bold">
                                  {formatCurrency(getFeeTotalAmount(fee))} VNĐ
                                </ArgonTypography>
                                {fee.late_fee?.is_applied && (
                                  <ArgonTypography variant="caption" color="warning.main" display="block">
                                    Bao gồm phụ phí: {formatCurrency(fee.late_fee?.applied_amount || 0)} VNĐ
                                  </ArgonTypography>
                                )}
                              </TableCell>
                              <TableCell>
                                <ArgonTypography variant="body2">
                                  {formatDate(fee.effective_due_date || fee.due_date)}
                                </ArgonTypography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : selectedFee && (
                    <ArgonBox mb={2}>
                  <ArgonTypography variant="h6" color="dark" mb={1}>
                        {selectedFee.fee_name}
                  </ArgonTypography>
                  <ArgonTypography variant="h4" fontWeight="bold" color="primary" mb={1}>
                        {formatCurrency(getFeeTotalAmount(selectedFee))} VNĐ
                      </ArgonTypography>
                      <ArgonTypography variant="body2" color="text" mb={0.5}>
                        Phí gốc: {formatCurrency(selectedFee.amount)} VNĐ
                      </ArgonTypography>
                      {selectedFee.late_fee?.is_applied && (
                        <ArgonTypography variant="body2" color="warning.main" mb={0.5}>
                          + Phụ phí quá hạn: {formatCurrency(selectedFee.late_fee?.applied_amount || 0)} VNĐ
                        </ArgonTypography>
                      )}
                      <ArgonTypography variant="body2" color="text" mb={1}>
                        Hạn thanh toán: {formatDate(selectedFee.due_date)}
                  </ArgonTypography>
                      {selectedFee.description && (
                  <ArgonTypography variant="body2" color="text">
                          Mô tả: {selectedFee.description}
                        </ArgonTypography>
                      )}
                      {selectedFee.student && (
                        <ArgonTypography variant="body2" color="text" mt={1}>
                          Học sinh: {selectedFee.student.full_name}
                        </ArgonTypography>
                      )}
                    </ArgonBox>
                  )}
                  
                  {/* Total amount */}
                  <ArgonBox mt={2} p={2} sx={{ backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 1 }}>
                    <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
                      <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                        Tổng tiền:
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold" color="primary">
                        {formatCurrency(
                          selectedFees.length > 0
                            ? selectedFees.reduce((sum, fee) => sum + getFeeTotalAmount(fee), 0)
                            : getFeeTotalAmount(selectedFee)
                        )} VNĐ
                  </ArgonTypography>
                    </ArgonBox>
                  </ArgonBox>
                </ArgonBox>

                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
                  Phương thức thanh toán
                </ArgonTypography>

                <ArgonBox
                  display="flex"
                  alignItems="center"
                  px={2}
                  py={1.5}
                  borderRadius={1}
                  sx={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                >
                  <i className="ni ni-credit-card" style={{ marginRight: 12 }} />
                  <ArgonBox>
                    <ArgonTypography variant="body1" fontWeight="bold" color="dark">
                      Online (PayOS)
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="text">
                      Hệ thống mặc định sử dụng PayOS để thanh toán trực tuyến.
                          </ArgonTypography>
                        </ArgonBox>
                </ArgonBox>

                {paymentError && (
                  <ArgonBox mt={2}>
                    <Alert severity="error">{paymentError}</Alert>
                  </ArgonBox>
                )}

                {paymentResult && (
                  <ArgonBox mt={3}>
                    <Card variant="outlined" sx={{ boxShadow: 3 }}>
                      <CardContent>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} md={5} textAlign="center">
                            {getQrImageSrc(paymentResult) ? (
                              typeof getQrImageSrc(paymentResult) === 'string' &&
                              (getQrImageSrc(paymentResult).startsWith('http') ||
                                getQrImageSrc(paymentResult).startsWith('data:image'))
                                ? (
                                  <img
                                    src={getQrImageSrc(paymentResult)}
                                    alt="PayOS QR"
                                    style={{ width: 220, height: 220 }}
                                  />
                                ) : (
                                  <QRCode
                                    value={getQrImageSrc(paymentResult)}
                                    size={220}
                                    bgColor="#ffffff"
                                    fgColor="#111111"
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                  />
                                )
                            ) : (
                              <ArgonTypography variant="body2" color="text">
                                Không có dữ liệu QR khả dụng
                              </ArgonTypography>
                            )}
                          </Grid>
                          <Grid item xs={12} md={7}>
                            <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={1}>
                              Quét mã QR để thanh toán
                            </ArgonTypography>
                            <ArgonTypography variant="body2" color="text">
                              Số tiền:{" "}
                              <strong>{formatCurrency(paymentResult.amount || 0, true)}</strong>
                            </ArgonTypography>
                            <ArgonTypography variant="body2" color="text">
                              Mã đơn PayOS: <strong>{paymentResult.order_code}</strong>
                            </ArgonTypography>
                            <ArgonTypography variant="body2" color="text">
                              Hạn QR: {formatDateTime(paymentResult.expired_at)}
                            </ArgonTypography>
                            {paymentResult.description && (
                              <ArgonTypography variant="body2" color="text">
                                Mô tả: {paymentResult.description}
                              </ArgonTypography>
                            )}
                            {paymentResult.checkout_url && (
                              <ArgonTypography variant="body2" color="text" mt={1}>
                                Link: <a href={paymentResult.checkout_url} target="_blank" rel="noreferrer">
                                  {paymentResult.checkout_url}
                                </a>
                              </ArgonTypography>
                            )}
                            <ArgonBox mt={2} display="flex" flexWrap="wrap" gap={1}>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                disabled={!paymentResult.checkout_url}
                                onClick={() => {
                                  if (paymentResult.checkout_url) {
                                    window.open(paymentResult.checkout_url, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                              >
                                Mở PayOS
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                disabled={!paymentResult.checkout_url}
                                onClick={handleCopyCheckoutLink}
                              >
                                {copySuccess ? 'Đã sao chép' : 'Sao chép link'}
                              </Button>
                            </ArgonBox>
                            {copySuccess && (
                              <ArgonTypography variant="caption" color="success" mt={1} display="block">
                                Đã sao chép link vào clipboard
                              </ArgonTypography>
                            )}
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                    {paymentResult?.is_paid && (
                      <ArgonBox mt={2}>
                        <Alert severity="success">
                          Thanh toán đã được xác nhận thành công. Dữ liệu sẽ tự động làm mới.
                        </Alert>
                      </ArgonBox>
                    )}
                    {paymentResult?.items?.length > 1 && (
                      <ArgonBox mt={3}>
                        <ArgonTypography variant="subtitle1" fontWeight="bold" color="dark" mb={1}>
                          Chi tiết khoản thu trong đơn:
                        </ArgonTypography>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Học sinh</TableCell>
                                <TableCell>Tên học phí</TableCell>
                                <TableCell align="right">Số tiền</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {paymentResult.items.map((item) => (
                                <TableRow key={item.invoice_id}>
                                  <TableCell>{item.student_name || 'N/A'}</TableCell>
                                  <TableCell>{item.fee_name || 'Khoản thu'}</TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(item.amount || 0, true)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </ArgonBox>
                    )}
                  </ArgonBox>
                )}
              </ArgonBox>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePaymentDialog}>
              Hủy
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              disabled={paymentLoading || (selectedFees.length === 0 && !selectedFee)}
              onClick={handleCreatePayOSPayment}
            >
              {paymentLoading ? 'Đang tạo mã QR...' : 'Tạo mã QR PayOS'}
            </Button>
          </DialogActions>
        </Dialog>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default FeeAndPayment;
