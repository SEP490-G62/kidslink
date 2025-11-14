import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Divider,
  IconButton,
  Grid,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EventIcon from "@mui/icons-material/Event";
import WarningIcon from "@mui/icons-material/Warning";
import SchoolIcon from "@mui/icons-material/School";
import GroupIcon from "@mui/icons-material/Group";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import schoolAdminService from "services/schoolAdminService";
import FeeModal from "./FeeModal";
import ClassPaymentModal from "./ClassPaymentModal";

const infoColor = "#11cdef";
const infoHoverColor = "rgba(17, 205, 239, 0.12)";

const FeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [classPaymentOpen, setClassPaymentOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    const fetchFee = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await schoolAdminService.getFeeById(id);
        if (res.success && res.data) {
          console.log("Fee data:", res.data); // Debug log
          setFee(res.data);
        } else {
          setError("Không tìm thấy thông tin phí");
        }
      } catch (e) {
        console.error("Lỗi khi tải thông tin phí:", e);
        setError(e.message || "Không thể tải thông tin phí. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFee();
    }
  }, [id]);

  const handleEdit = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleSuccess = () => {
    // Refresh fee data
    const fetchFee = async () => {
      try {
        const res = await schoolAdminService.getFeeById(id);
        if (res.success && res.data) {
          setFee(res.data);
        }
      } catch (e) {
        console.error("Lỗi khi tải thông tin phí:", e);
      }
    };
    fetchFee();
  };

  const handleClassOpen = (cls) => {
    setSelectedClass(cls);
    setClassPaymentOpen(true);
  };

  const handleClassModalClose = () => {
    setClassPaymentOpen(false);
    setSelectedClass(null);
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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
          <ArgonButton onClick={() => navigate("/school-admin/fees")} color="info">
            Quay lại danh sách
          </ArgonButton>
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (!fee) {
    return null;
  }

  const classes = Array.isArray(fee.classes) ? fee.classes : [];
  const totalClasses = classes.length;
  const overdueClasses = classes.filter(
    (cls) => cls.due_date && new Date(cls.due_date) < new Date()
  ).length;
  const upcomingSoonClasses = classes.filter((cls) => {
    if (!cls.due_date) return false;
    const diffDays = Math.ceil(
      (new Date(cls.due_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 0 && diffDays <= 7;
  }).length;

  return (
    <DashboardLayout>
      <DashboardNavbar 
        breadcrumbOverride={fee ? {
          route: ['school-admin', 'fees', fee.fee_name || id],
          title: fee.fee_name || 'Chi tiết phí'
        } : undefined}
      />
      <ArgonBox py={3}>
        {/* Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              display="flex"
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton
                  onClick={() => navigate("/school-admin/fees")}
                  sx={{
                    color: infoColor,
                    "&:hover": {
                      backgroundColor: infoHoverColor,
                    },
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AttachMoneyIcon sx={{ fontSize: 32, color: infoColor }} />
                    <ArgonTypography variant="h4" fontWeight="bold" letterSpacing={0.2}>
                      {fee.fee_name || "Chi tiết phí"}
                    </ArgonTypography>
                  </Stack>
                  <ArgonTypography variant="body2" color="text">
                    Quản lý khoản phí và các lớp áp dụng
                  </ArgonTypography>
                </Stack>
              </Stack>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Chip
                  icon={<GroupIcon sx={{ color: infoColor }} />}
                  label={`${totalClasses} lớp áp dụng`}
                  variant="outlined"
                  sx={{
                    borderColor: infoColor,
                    color: infoColor,
                    "& .MuiChip-icon": {
                      color: infoColor,
                    },
                  }}
                />
                <ArgonButton
                  color="info"
                  size="medium"
                  onClick={handleEdit}
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                  }}
                >
                  Chỉnh sửa
                </ArgonButton>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
                  Thông tin khoản phí
                </ArgonTypography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ArgonTypography variant="body2" color="text" fontWeight="bold" mb={0.5}>
                      Mô tả
                    </ArgonTypography>
                    <ArgonTypography variant="body1" color="#424242">
                      {fee.description || "-"}
                    </ArgonTypography>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="body2" color="text" fontWeight="bold">
                        Tên phí
                      </ArgonTypography>
                      <ArgonTypography variant="body1" color="#212121">
                        {fee.fee_name || "-"}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="body2" color="text" fontWeight="bold">
                        Số tiền
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold" color={infoColor}>
                        {formatCurrency(fee.amount)} VNĐ
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="body2" color="text" fontWeight="bold">
                        Ngày tạo
                      </ArgonTypography>
                      <ArgonTypography variant="body1" color="#424242">
                        {formatDate(fee.createdAt)}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="body2" color="text" fontWeight="bold">
                        Ngày cập nhật
                      </ArgonTypography>
                      <ArgonTypography variant="body1" color="#424242">
                        {formatDate(fee.updatedAt)}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
                  Thống kê nhanh
                </ArgonTypography>
                <Stack spacing={3}>
                  <Box>
                    <ArgonTypography variant="body2" color="text" fontWeight="bold" mb={0.5}>
                      Tổng số tiền
                    </ArgonTypography>
                    <ArgonTypography variant="h4" color={infoColor} fontWeight="bold">
                      {formatCurrency(fee.amount)} VNĐ
                    </ArgonTypography>
                  </Box>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <ArgonTypography variant="body2" color="text">
                        Lớp áp dụng
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold">
                        {totalClasses}
                      </ArgonTypography>
                    </Box>
                    <Chip
                      label="Đang áp dụng"
                      size="small"
                      sx={{
                        backgroundColor: infoHoverColor,
                        color: infoColor,
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <ArgonTypography variant="body2" color="text">
                        Quá hạn
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold" color="#d32f2f">
                        {overdueClasses}
                      </ArgonTypography>
                    </Box>
                    <Chip
                      label="Cần xử lý"
                      size="small"
                      sx={{
                        backgroundColor: "#fdecea",
                        color: "#d32f2f",
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <ArgonTypography variant="body2" color="text">
                        Sắp đến hạn (≤7 ngày)
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold" color="#ff9800">
                        {upcomingSoonClasses}
                      </ArgonTypography>
                    </Box>
                    <Chip
                      label="Theo dõi"
                      size="small"
                      sx={{
                        backgroundColor: "#fff3e0",
                        color: "#ff9800",
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Classes Information */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SchoolIcon sx={{ color: infoColor }} />
                <ArgonTypography variant="h6" fontWeight="bold">
                  Lớp học áp dụng ({totalClasses})
                </ArgonTypography>
              </Stack>
              <ArgonTypography variant="body2" color="text">
                Theo dõi hạn thanh toán của từng lớp
              </ArgonTypography>
            </Box>
            {classes.length > 0 ? (
              <Grid container spacing={2}>
                {classes.map((cls) => {
                  const dueDate = cls.due_date
                    ? new Date(cls.due_date).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : null;
                  const dueDateFull = cls.due_date
                    ? new Date(cls.due_date).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : null;
                  const isOverdue = cls.due_date && new Date(cls.due_date) < new Date();
                  const daysUntilDue = cls.due_date
                    ? Math.ceil((new Date(cls.due_date) - new Date()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={cls._id}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: "100%",
                          borderColor: isOverdue
                            ? "#f28b82"
                            : daysUntilDue !== null && daysUntilDue <= 7
                            ? "#ffb74d"
                            : infoHoverColor,
                          transition: "all .2s ease",
                          cursor: "pointer",
                          "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
                        }}
                        onClick={() => handleClassOpen(cls)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleClassOpen(cls);
                          }
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Chip
                              label={cls.class_name}
                              size="small"
                              sx={{
                                backgroundColor: isOverdue ? "#d32f2f" : infoColor,
                                color: "#ffffff",
                                fontWeight: 600,
                              }}
                            />
                            <ArgonTypography variant="caption" color="#757575">
                              {cls.academic_year}
                            </ArgonTypography>
                          </Stack>
                          <Divider sx={{ my: 1.5 }} />
                          <Stack spacing={1}>
                            <ArgonTypography variant="body2" color="text">
                              <strong>Hạn thanh toán:</strong>{" "}
                              {dueDate ? dueDate : "Chưa thiết lập"}
                            </ArgonTypography>
                            {dueDateFull && (
                              <ArgonTypography variant="caption" color="#9e9e9e">
                                {dueDateFull}
                              </ArgonTypography>
                            )}
                            {cls.due_date && (
                              <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                                {isOverdue ? (
                                  <WarningIcon sx={{ fontSize: 18, color: "#d32f2f" }} />
                                ) : (
                                  <EventIcon sx={{ fontSize: 18, color: infoColor }} />
                                )}
                                <Chip
                                  label={
                                    isOverdue
                                      ? "Quá hạn"
                                      : daysUntilDue !== null && daysUntilDue <= 7
                                      ? `Còn ${daysUntilDue} ngày`
                                      : "Trong hạn"
                                  }
                                  size="small"
                                  sx={{
                                    backgroundColor: isOverdue
                                      ? "#fdecea"
                                      : daysUntilDue !== null && daysUntilDue <= 7
                                      ? "#fff3e0"
                                      : infoHoverColor,
                                    color: isOverdue
                                      ? "#d32f2f"
                                      : daysUntilDue !== null && daysUntilDue <= 7
                                      ? "#ff9800"
                                      : infoColor,
                                    fontWeight: 600,
                                  }}
                                />
                              </Stack>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: "#fafafa",
                  border: "2px dashed #e0e0e0",
                  textAlign: "center",
                }}
              >
                <ArgonTypography variant="body1" color="#9e9e9e" fontStyle="italic">
                  Chưa áp dụng lớp nào
                </ArgonTypography>
              </Box>
            )}
          </CardContent>
        </Card>

        <FeeModal
          open={modalOpen}
          onClose={handleModalClose}
          feeData={fee}
          onSuccess={handleSuccess}
        />
        <ClassPaymentModal
          open={classPaymentOpen}
          onClose={handleClassModalClose}
          feeId={fee?._id || id}
          classInfo={selectedClass}
          feeName={fee?.fee_name}
        />
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default FeeDetail;

