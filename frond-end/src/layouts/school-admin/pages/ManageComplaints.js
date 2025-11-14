/**
=========================================================
* KidsLink School Admin - Manage Complaints
=========================================================
*/

// React
import React, { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Services
import schoolAdminService from "services/schoolAdminService";

function ManageComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [allStats, setAllStats] = useState({ all: {}, teacher: {}, parent: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState(0); // 0: all, 1: teacher, 2: parent
  const [selectedStatusTab, setSelectedStatusTab] = useState(0); // 0: all, 1: pending, 2: approved, 3: rejected
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [typeFormData, setTypeFormData] = useState({ name: "", description: "", category: [] });
  const [typeLoading, setTypeLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadComplaintTypes();
  }, [selectedCategoryTab]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const category = selectedCategoryTab === 1 ? 'teacher' : selectedCategoryTab === 2 ? 'parent' : null;
      
      const [complaintsRes, statsRes] = await Promise.all([
        schoolAdminService.getAllComplaints(category),
        schoolAdminService.getComplaintStats()
      ]);

      if (complaintsRes.success) {
        setComplaints(complaintsRes.data || []);
      } else {
        setError(complaintsRes.error || "Không thể tải danh sách đơn");
      }

      if (statsRes.success) {
        setAllStats(statsRes.data || { all: {}, teacher: {}, parent: {} });
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải dữ liệu");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadComplaintTypes = async () => {
    try {
      const result = await schoolAdminService.getAllComplaintTypes();
      if (result.success) {
        setComplaintTypes(result.data || []);
      }
    } catch (err) {
      console.error("Error loading complaint types:", err);
    }
  };

  const handleCategoryTabChange = (event, newValue) => {
    setSelectedCategoryTab(newValue);
    setSelectedStatusTab(0); // Reset status tab when changing category
  };


  // Get current stats based on selected category
  const getCurrentStats = () => {
    if (selectedCategoryTab === 1) {
      return allStats.teacher || { total: 0, pending: 0, approved: 0, rejected: 0 };
    } else if (selectedCategoryTab === 2) {
      return allStats.parent || { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
    return allStats.all || { total: 0, pending: 0, approved: 0, rejected: 0 };
  };

  const getFilteredComplaints = () => {
    let filtered = complaints;
    
    // Filter by status
    switch (selectedStatusTab) {
      case 1:
        filtered = filtered.filter(c => c.status === "pending");
        break;
      case 2:
        filtered = filtered.filter(c => c.status === "approve");
        break;
      case 3:
        filtered = filtered.filter(c => c.status === "reject");
        break;
      default:
        // All statuses
        break;
    }
    
    return filtered;
  };

  const handleRowClick = (complaint) => {
    setSelectedComplaint(complaint);
    setResponseText(complaint.response || "");
    setDetailDialogOpen(true);
    setError("");
    setSuccess("");
  };

  const handleCloseDetailDialog = () => {
    setSelectedComplaint(null);
    setDetailDialogOpen(false);
    setResponseText("");
    setError("");
    setSuccess("");
  };

  const handleSaveComplaintType = async () => {
    if (!typeFormData.name.trim()) {
      setError("Vui lòng nhập tên loại đơn");
      return;
    }

    if (!typeFormData.category || typeFormData.category.length === 0) {
      setError("Vui lòng chọn ít nhất một loại người dùng");
      return;
    }

    setTypeLoading(true);
    setError("");
    setSuccess("");

    try {
      let result;
      if (selectedType) {
        result = await schoolAdminService.updateComplaintType(selectedType._id, typeFormData);
      } else {
        result = await schoolAdminService.createComplaintType(typeFormData);
      }

      if (result.success) {
        setSuccess(selectedType ? "Cập nhật loại đơn thành công!" : "Tạo loại đơn thành công!");
        setTypeDialogOpen(false);
        setTimeout(() => {
          loadComplaintTypes();
          setSuccess("");
        }, 1000);
      } else {
        setError(result.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại");
      console.error("Error saving complaint type:", err);
    } finally {
      setTypeLoading(false);
    }
  };

  const handleDeleteComplaintType = async (typeId) => {
    if (!window.confirm("Bạn có chắc muốn xóa loại đơn này?")) return;

    setTypeLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await schoolAdminService.deleteComplaintType(typeId);
      if (result.success) {
        setSuccess("Xóa loại đơn thành công!");
        setTimeout(() => {
          loadComplaintTypes();
          setSuccess("");
        }, 1000);
      } else {
        setError(result.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại");
      console.error("Error deleting complaint type:", err);
    } finally {
      setTypeLoading(false);
    }
  };

  const handleEditComplaintType = (type) => {
    setSelectedType(type);
    setTypeFormData({
      name: type.name,
      description: type.description || "",
      category: Array.isArray(type.category) ? type.category : [type.category]
    });
    setTypeDialogOpen(true);
  };

  const handleProcessComplaint = async (action) => {
    if (!selectedComplaint) return;
    const trimmedResponse = responseText.trim();
    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      let result;
      if (action === "approve") {
        result = await schoolAdminService.approveComplaint(
          selectedComplaint._id,
          trimmedResponse
        );
      } else {
        result = await schoolAdminService.rejectComplaint(
          selectedComplaint._id,
          trimmedResponse
        );
      }

      if (result.success) {
        setSuccess(
          action === "approve" ? "Duyệt đơn thành công!" : "Từ chối đơn thành công!"
        );
        setDetailDialogOpen(false);
        setSelectedComplaint(null);
        setResponseText("");
        setTimeout(() => {
          loadData();
          setSuccess("");
        }, 1000);
      } else {
        setError(result.error || "Có lỗi xảy ra khi xử lý đơn");
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại");
      console.error("Error processing complaint:", err);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approve":
        return "success";
      case "pending":
        return "warning";
      case "reject":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "approve":
        return "Đã duyệt";
      case "pending":
        return "Đang chờ";
      case "reject":
        return "Từ chối";
      default:
        return status;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "teacher":
        return "Giáo viên";
      case "parent":
        return "Phụ huynh";
      default:
        return role;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredComplaints = getFilteredComplaints();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <ArgonBox>
            <ArgonTypography variant="h4" fontWeight="bold" color="dark">
              Quản lý đơn khiếu nại
            </ArgonTypography>
            <ArgonTypography variant="body2" color="text" fontWeight="regular">
              Xem và xử lý đơn khiếu nại từ giáo viên và phụ huynh
            </ArgonTypography>
          </ArgonBox>
          <Button
            variant="contained"
            color="primary"
            startIcon={<i className="ni ni-fat-add" />}
            onClick={() => {
              setSelectedType(null);
              setTypeFormData({ name: "", description: "", category: [] });
              setTypeDialogOpen(true);
            }}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Quản lý loại đơn
          </Button>
        </ArgonBox>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {/* Category Tabs */}
        <Card sx={{ mb: 2 }}>
          <Tabs
            value={selectedCategoryTab}
            onChange={handleCategoryTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab 
              label={`Tất cả (${allStats.all?.total || 0})`}
              icon={<i className="ni ni-collection" />}
              iconPosition="start"
            />
            <Tab 
              label={`Giáo viên (${allStats.teacher?.total || 0})`}
              icon={<i className="ni ni-single-02" />}
              iconPosition="start"
            />
            <Tab 
              label={`Phụ huynh (${allStats.parent?.total || 0})`}
              icon={<i className="ni ni-single-02" />}
              iconPosition="start"
            />
          </Tabs>
        </Card>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => setSelectedStatusTab(0)}
              sx={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: selectedStatusTab === 0 ? "2px solid #5e72e4" : "1px solid #e9ecef",
                boxShadow: selectedStatusTab === 0 
                  ? "0 4px 20px rgba(94, 114, 228, 0.2)" 
                  : "0 2px 10px rgba(0, 0, 0, 0.05)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
                }
              }}
            >
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-notification-70"
                    color="error"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Tổng số
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="error">
                      {getCurrentStats().total}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => setSelectedStatusTab(1)}
              sx={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: selectedStatusTab === 1 ? "2px solid #ffc107" : "1px solid #e9ecef",
                boxShadow: selectedStatusTab === 1 
                  ? "0 4px 20px rgba(255, 193, 7, 0.2)" 
                  : "0 2px 10px rgba(0, 0, 0, 0.05)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
                }
              }}
            >
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-time"
                    color="warning"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Đang chờ
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="warning">
                      {getCurrentStats().pending}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => setSelectedStatusTab(2)}
              sx={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: selectedStatusTab === 2 ? "2px solid #2dce89" : "1px solid #e9ecef",
                boxShadow: selectedStatusTab === 2 
                  ? "0 4px 20px rgba(45, 206, 137, 0.2)" 
                  : "0 2px 10px rgba(0, 0, 0, 0.05)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
                }
              }}
            >
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
                      Đã duyệt
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="success">
                      {getCurrentStats().approved}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => setSelectedStatusTab(3)}
              sx={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: selectedStatusTab === 3 ? "2px solid #f5365c" : "1px solid #e9ecef",
                boxShadow: selectedStatusTab === 3 
                  ? "0 4px 20px rgba(245, 54, 92, 0.2)" 
                  : "0 2px 10px rgba(0, 0, 0, 0.05)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
                }
              }}
            >
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-circle-08"
                    color="error"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Từ chối
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="error">
                      {getCurrentStats().rejected}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Complaints Table */}
        <Card>
          <CardContent>
            <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                Danh sách đơn ({filteredComplaints.length})
              </ArgonTypography>
              {loading && <CircularProgress size={24} />}
            </ArgonBox>

            {loading ? (
              <ArgonBox display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </ArgonBox>
            ) : filteredComplaints.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                <ArgonTypography variant="body2" color="text">
                  Không có đơn nào.
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableBody>
                    <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Loại đơn</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Người gửi</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Ngày gửi</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }} align="center">Trạng thái</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }} align="center">Thao tác</TableCell>
                    </TableRow>
                    {filteredComplaints.map((complaint) => (
                      <TableRow
                        key={complaint._id || complaint.id}
                        onClick={() => handleRowClick(complaint)}
                        sx={{
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "#f8f9fa",
                          },
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                            {complaint.complaintTypeName || "Không xác định"}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <ArgonBox display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                              src={complaint.user_id?.avatar_url}
                              alt={complaint.user_id?.full_name}
                              sx={{ width: 32, height: 32 }}
                            >
                              {complaint.user_id?.full_name?.charAt(0) || "U"}
                            </Avatar>
                            <ArgonBox>
                              <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                                {complaint.user_id?.full_name || "Người dùng"}
                              </ArgonTypography>
                              <Chip
                                label={getRoleLabel(complaint.user_id?.role)}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.65rem",
                                  backgroundColor: complaint.user_id?.role === "teacher" 
                                    ? "rgba(94, 114, 228, 0.1)" 
                                    : "rgba(45, 206, 137, 0.1)",
                                  color: complaint.user_id?.role === "teacher" 
                                    ? "#5e72e4" 
                                    : "#2dce89",
                                  fontWeight: 600,
                                  mt: 0.5
                                }}
                              />
                            </ArgonBox>
                          </ArgonBox>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <ArgonTypography variant="body2" color="text">
                            {formatDate(complaint.createdAt)}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Chip
                            label={getStatusLabel(complaint.status)}
                            color={getStatusColor(complaint.status)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(complaint);
                            }}
                            sx={{ color: "#5e72e4" }}
                          >
                            <i className="ni ni-bullet-list-67" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={handleCloseDetailDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
              <ArgonBox display="flex" alignItems="center" gap={1}>
                <ArgonBox
                  component="i"
                  className="ni ni-paper-diploma"
                  color="primary"
                  fontSize="24px"
                />
                <ArgonTypography variant="h5" fontWeight="bold" color="dark">
                  Chi tiết đơn
                </ArgonTypography>
              </ArgonBox>
              {selectedComplaint && (
                <Chip
                  label={getStatusLabel(selectedComplaint.status)}
                  color={getStatusColor(selectedComplaint.status)}
                  size="medium"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </ArgonBox>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {selectedComplaint && (
              <>
                {/* User Info */}
                <ArgonBox display="flex" alignItems="center" gap={2} mb={3} p={2} sx={{ backgroundColor: "#f8f9fa", borderRadius: 1 }}>
                  <Avatar
                    src={selectedComplaint.user_id?.avatar_url}
                    alt={selectedComplaint.user_id?.full_name}
                    sx={{ width: 56, height: 56 }}
                  >
                    {selectedComplaint.user_id?.full_name?.charAt(0) || "U"}
                  </Avatar>
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      {selectedComplaint.user_id?.full_name || "Người dùng"}
                    </ArgonTypography>
                    <ArgonBox display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Chip
                        label={getRoleLabel(selectedComplaint.user_id?.role)}
                        size="small"
                        sx={{
                          backgroundColor: selectedComplaint.user_id?.role === "teacher" 
                            ? "rgba(94, 114, 228, 0.1)" 
                            : "rgba(45, 206, 137, 0.1)",
                          color: selectedComplaint.user_id?.role === "teacher" 
                            ? "#5e72e4" 
                            : "#2dce89",
                          fontWeight: 600
                        }}
                      />
                      <ArgonTypography variant="caption" color="text">
                        • {formatDate(selectedComplaint.createdAt)}
                      </ArgonTypography>
                    </ArgonBox>
                  </ArgonBox>
                </ArgonBox>

                {/* Complaint Type */}
                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                    Loại đơn:
                  </ArgonTypography>
                  <ArgonTypography variant="body1" color="text">
                    {selectedComplaint.complaintTypeName || "Không xác định"}
                  </ArgonTypography>
                </ArgonBox>

                {/* Reason */}
                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                    Nội dung:
                  </ArgonTypography>
                  <ArgonBox p={2} sx={{ backgroundColor: "#f8f9fa", borderRadius: 1 }}>
                    <ArgonTypography variant="body2" color="text" sx={{ lineHeight: 1.8 }}>
                      {selectedComplaint.reason}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>

                {/* Image */}
                {selectedComplaint.image && (
                  <ArgonBox mb={2}>
                    <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                      Hình ảnh đính kèm:
                    </ArgonTypography>
                    <img
                      src={selectedComplaint.image}
                      alt="Complaint"
                      style={{
                        width: "100%",
                        maxWidth: "500px",
                        maxHeight: "300px",
                        borderRadius: "8px",
                        objectFit: "cover",
                        border: "1px solid #e9ecef",
                        cursor: "pointer"
                      }}
                      onClick={() => window.open(selectedComplaint.image, '_blank')}
                    />
                  </ArgonBox>
                )}

                {/* Response */}
                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                    Phản hồi tới người gửi:
                  </ArgonTypography>
                  {selectedComplaint.status !== "pending" && selectedComplaint.response ? (
                    <ArgonBox p={2} sx={{ backgroundColor: "#e3f2fd", borderRadius: 1, borderLeft: "4px solid #5e72e4" }}>
                      <ArgonTypography variant="body2" color="text" sx={{ lineHeight: 1.8 }}>
                        {selectedComplaint.response}
                      </ArgonTypography>
                      {selectedComplaint.updatedAt && (
                        <ArgonTypography variant="caption" color="text" mt={1} display="block">
                          📅 Phản hồi lúc: {formatDate(selectedComplaint.updatedAt)}
                        </ArgonTypography>
                      )}
                    </ArgonBox>
                  ) : (
                    <TextField
                      fullWidth
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      variant="outlined"
                      multiline
                      rows={4}
                      placeholder="Nhập phản hồi (tùy chọn)..."
                      disabled={processing || selectedComplaint.status !== "pending"}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                        },
                      }}
                    />
                  )}
                </ArgonBox>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={handleCloseDetailDialog}
              sx={{
                color: "#67748e",
                fontWeight: 500,
              }}
            >
              Đóng
            </Button>
            {selectedComplaint && selectedComplaint.status === "pending" && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleProcessComplaint("approve")}
                  startIcon={
                    processing ? (
                      <CircularProgress size={16} sx={{ color: "white" }} />
                    ) : (
                      <i className="ni ni-check-bold" />
                    )
                  }
                  disabled={processing}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 1,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  {processing ? "Đang xử lý..." : "Duyệt đơn"}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleProcessComplaint("reject")}
                  startIcon={
                    processing ? (
                      <CircularProgress size={16} sx={{ color: "white" }} />
                    ) : (
                      <i className="ni ni-fat-remove" />
                    )
                  }
                  disabled={processing}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 1,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  {processing ? "Đang xử lý..." : "Từ chối"}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Complaint Type Management Dialog */}
        <Dialog
          open={typeDialogOpen}
          onClose={() => {
            setTypeDialogOpen(false);
            setSelectedType(null);
            setTypeFormData({ name: "", description: "", category: [] });
            setError("");
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <ArgonBox display="flex" alignItems="center" gap={1}>
              <ArgonBox
                component="i"
                className="ni ni-paper-diploma"
                color="primary"
                fontSize="24px"
              />
              <ArgonTypography variant="h5" fontWeight="bold" color="dark">
                {selectedType ? "Chỉnh sửa loại đơn" : "Tạo loại đơn mới"}
              </ArgonTypography>
            </ArgonBox>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <ArgonBox mb={3}>
              <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                Loại người dùng <span style={{ color: "#d32f2f" }}>*</span>
              </ArgonTypography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={typeFormData.category.includes("parent")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTypeFormData({
                            ...typeFormData,
                            category: [...typeFormData.category, "parent"]
                          });
                        } else {
                          setTypeFormData({
                            ...typeFormData,
                            category: typeFormData.category.filter(c => c !== "parent")
                          });
                        }
                      }}
                      disabled={typeLoading}
                    />
                  }
                  label="Phụ huynh"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={typeFormData.category.includes("teacher")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTypeFormData({
                            ...typeFormData,
                            category: [...typeFormData.category, "teacher"]
                          });
                        } else {
                          setTypeFormData({
                            ...typeFormData,
                            category: typeFormData.category.filter(c => c !== "teacher")
                          });
                        }
                      }}
                      disabled={typeLoading}
                    />
                  }
                  label="Giáo viên"
                />
              </FormGroup>
              {typeFormData.category.length === 0 && (
                <ArgonTypography variant="caption" color="error" mt={0.5} display="block">
                  Vui lòng chọn ít nhất một loại người dùng
                </ArgonTypography>
              )}
            </ArgonBox>

            <ArgonBox mb={3}>
              <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                Tên loại đơn <span style={{ color: "#d32f2f" }}>*</span>
              </ArgonTypography>
              <TextField
                fullWidth
                value={typeFormData.name}
                onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                placeholder="Nhập tên loại đơn"
                disabled={typeLoading}
              />
            </ArgonBox>

            <ArgonBox mb={2}>
              <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                Mô tả
              </ArgonTypography>
              <TextField
                fullWidth
                value={typeFormData.description}
                onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                placeholder="Nhập mô tả (tùy chọn)"
                multiline
                rows={3}
                disabled={typeLoading}
              />
            </ArgonBox>

            {/* List of existing types */}
            <ArgonBox mt={4}>
              <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
                Danh sách loại đơn hiện có
              </ArgonTypography>
              {complaintTypes.length === 0 ? (
                <ArgonTypography variant="body2" color="text">
                  Chưa có loại đơn nào
                </ArgonTypography>
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: "none", maxHeight: 300 }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Loại người dùng</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Tên loại đơn</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Mô tả</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5 }} align="center">Thao tác</TableCell>
                      </TableRow>
                      {complaintTypes.map((type) => (
                        <TableRow key={type._id}>
                          <TableCell>
                            <ArgonBox display="flex" gap={0.5} flexWrap="wrap">
                              {Array.isArray(type.category) ? type.category.map((cat) => (
                                <Chip
                                  key={cat}
                                  label={cat === "teacher" ? "Giáo viên" : "Phụ huynh"}
                                  size="small"
                                  sx={{
                                    backgroundColor: cat === "teacher" 
                                      ? "rgba(94, 114, 228, 0.1)" 
                                      : "rgba(45, 206, 137, 0.1)",
                                    color: cat === "teacher" ? "#5e72e4" : "#2dce89",
                                    fontWeight: 600
                                  }}
                                />
                              )) : (
                                <Chip
                                  label={type.category === "teacher" ? "Giáo viên" : "Phụ huynh"}
                                  size="small"
                                  sx={{
                                    backgroundColor: type.category === "teacher" 
                                      ? "rgba(94, 114, 228, 0.1)" 
                                      : "rgba(45, 206, 137, 0.1)",
                                    color: type.category === "teacher" ? "#5e72e4" : "#2dce89",
                                    fontWeight: 600
                                  }}
                                />
                              )}
                            </ArgonBox>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                              {type.name}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" color="text">
                              {type.description || "-"}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleEditComplaintType(type)}
                              sx={{ color: "#5e72e4", mr: 1 }}
                            >
                              <i className="ni ni-ruler-pencil" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteComplaintType(type._id)}
                              sx={{ color: "#f5365c" }}
                            >
                              <i className="ni ni-fat-remove" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </ArgonBox>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={() => {
                setTypeDialogOpen(false);
                setSelectedType(null);
                setTypeFormData({ name: "", description: "", category: [] });
                setError("");
              }}
              disabled={typeLoading}
              sx={{
                color: "#67748e",
                fontWeight: 500,
              }}
            >
              Đóng
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveComplaintType}
              disabled={typeLoading || !typeFormData.name.trim() || typeFormData.category.length === 0}
              startIcon={
                typeLoading ? (
                  <CircularProgress size={16} sx={{ color: "white" }} />
                ) : (
                  <i className="ni ni-check-bold" />
                )
              }
              sx={{
                px: 3,
                py: 1,
                borderRadius: 1,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              {typeLoading ? "Đang xử lý..." : selectedType ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogActions>
        </Dialog>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ManageComplaints;

