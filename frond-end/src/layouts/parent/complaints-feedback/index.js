/**
=========================================================
* KidsLink Parent Dashboard - Complaints and Feedback
=========================================================
*/

// React
import React, { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";

// Services
import parentService from "services/parentService";

function ComplaintsAndFeedback() {
  const [newComplaintDialogOpen, setNewComplaintDialogOpen] = useState(false);
  const [selectedComplaintType, setSelectedComplaintType] = useState("");
  const [reason, setReason] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data states
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Load complaint types on mount
  useEffect(() => {
    loadComplaintTypes();
    loadComplaints();
  }, []);

  const loadComplaintTypes = async () => {
    setLoadingTypes(true);
    try {
      const result = await parentService.getComplaintTypes();
      if (result.success) {
        setComplaintTypes(result.data || []);
      } else {
        setError(result.error || "Không thể tải danh sách loại đơn");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải danh sách loại đơn");
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const result = await parentService.getMyComplaints();
      if (result.success) {
        setComplaints(result.data || []);
      } else {
        setError(result.error || "Không thể tải danh sách đơn");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải danh sách đơn");
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setImage(base64String);
      setImagePreview(base64String);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmitComplaint = async () => {
    setError("");
    setSuccess("");

    // Validation
    if (!selectedComplaintType) {
      setError("Vui lòng chọn loại đơn");
      return;
    }

    if (!reason.trim()) {
      setError("Vui lòng nhập lý do hoặc nội dung");
      return;
    }

    setLoading(true);

    try {
      const result = await parentService.createComplaint(
        selectedComplaintType,
        reason.trim(),
        image
      );

      if (result.success) {
        setSuccess("Gửi đơn thành công!");
        // Reset form
        setSelectedComplaintType("");
        setReason("");
        setImage(null);
        setImagePreview(null);
        // Reload complaints list
        await loadComplaints();
        // Close dialog after a short delay
        setTimeout(() => {
          setNewComplaintDialogOpen(false);
          setSuccess("");
        }, 1500);
      } else {
        setError(result.error || "Có lỗi xảy ra khi gửi đơn");
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedComplaintType("");
    setReason("");
    setImage(null);
    setImagePreview(null);
    setError("");
    setSuccess("");
    setNewComplaintDialogOpen(false);
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

  // Statistics
  const totalComplaints = complaints.length;
  const approvedComplaints = complaints.filter((c) => c.status === "approve").length;
  const pendingComplaints = complaints.filter((c) => c.status === "pending").length;
  const rejectedComplaints = complaints.filter((c) => c.status === "reject").length;

  const filteredComplaints =
    selectedFilter === "all"
      ? complaints
      : complaints.filter((c) => c.status === selectedFilter);

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
  };

  const getFilterCardStyles = (filter, activeColor) => {
    const isActive = selectedFilter === filter;
    return {
      cursor: "pointer",
      transition: "all 0.3s ease",
      border: isActive ? `2px solid ${activeColor}` : "1px solid #e9ecef",
      boxShadow: isActive
        ? `0 4px 20px ${activeColor}33`
        : "0 2px 10px rgba(0, 0, 0, 0.05)",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: `0 8px 30px ${activeColor}33`,
      },
    };
  };

  const getCurrentFilterLabel = () => {
    switch (selectedFilter) {
      case "approve":
        return "Đã duyệt";
      case "pending":
        return "Đang chờ";
      case "reject":
        return "Từ chối";
      default:
        return "Tất cả";
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Khiếu nại & Góp ý
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Gửi khiếu nại và góp ý cho nhà trường
          </ArgonTypography>
        </ArgonBox>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        <ArgonBox mb={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<i className="ni ni-fat-add" />}
            onClick={() => setNewComplaintDialogOpen(true)}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: "999px",
              fontWeight: "bold",
              textTransform: "none",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
              backgroundColor: "#ffffff",
              color: "#111111",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              "&:hover": {
                backgroundColor: "#f7f7f7",
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)",
              },
            }}
          >
            Gửi đơn mới
          </Button>
        </ArgonBox>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card onClick={() => handleFilterSelect("all")} sx={getFilterCardStyles("all", "#5e72e4")}>
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
                      {totalComplaints}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card onClick={() => handleFilterSelect("approve")} sx={getFilterCardStyles("approve", "#2dce89")}>
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
                      {approvedComplaints}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card onClick={() => handleFilterSelect("pending")} sx={getFilterCardStyles("pending", "#ffc107")}>
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
                      {pendingComplaints}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card onClick={() => handleFilterSelect("reject")} sx={getFilterCardStyles("reject", "#f5365c")}>
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
                      {rejectedComplaints}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Complaints List */}
        <Card>
          <CardContent>
            <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
              <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                Danh sách đơn của tôi
              </ArgonTypography>
              {loadingComplaints && <CircularProgress size={24} />}
            </ArgonBox>
            <ArgonTypography variant="body2" color="text" mb={3}>
              Đang hiển thị: <strong>{getCurrentFilterLabel()}</strong> ({filteredComplaints.length} đơn)
            </ArgonTypography>

            {loadingComplaints ? (
              <ArgonBox display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </ArgonBox>
            ) : filteredComplaints.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                {complaints.length === 0 ? (
                  <ArgonTypography variant="body2" color="text">
                    Bạn chưa có đơn nào. Hãy tạo đơn mới!
                  </ArgonTypography>
                ) : (
                  <ArgonTypography variant="body2" color="text">
                    Không tìm thấy đơn nào cho bộ lọc {getCurrentFilterLabel()}.
                  </ArgonTypography>
                )}
              </ArgonBox>
            ) : (
              <List disablePadding>
                {filteredComplaints.map((complaint, index) => (
                  <React.Fragment key={complaint._id || complaint.id}>
                    <ListItem sx={{ px: 0, py: 0 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          width: "100%",
                          p: 3,
                          borderRadius: 2,
                          border: "1px solid #e9ecef",
                          backgroundColor: "#fdfdfd",
                        }}
                      >
                        <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                          <ArgonBox>
                            <ArgonTypography variant="caption" color="text" textTransform="uppercase" letterSpacing={1}>
                              Loại đơn
                            </ArgonTypography>
                            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                              {complaint.complaintTypeName || "Không xác định"}
                            </ArgonTypography>
                          </ArgonBox>
                          <Chip
                            label={getStatusLabel(complaint.status)}
                            color={getStatusColor(complaint.status)}
                            size="medium"
                            sx={{ fontWeight: 600 }}
                          />
                        </ArgonBox>

                        <ArgonTypography variant="body2" color="text" mb={2} sx={{ lineHeight: 1.7 }}>
                          {complaint.reason}
                        </ArgonTypography>

                        <ArgonBox display="flex" flexWrap="wrap" gap={2} mb={complaint.image ? 2 : 0}>
                          <ArgonTypography variant="caption" color="text">
                            <strong>📅</strong> Gửi lúc: {formatDate(complaint.createdAt)}
                          </ArgonTypography>
                          <ArgonTypography variant="caption" color="text">
                            <strong>🆔</strong> Mã đơn: {complaint.code || complaint._id?.slice(-6) || "N/A"}
                          </ArgonTypography>
                        </ArgonBox>

                        {complaint.image && (
                          <ArgonBox mb={2}>
                            <img
                              src={complaint.image}
                              alt="Complaint"
                              style={{
                                width: "100%",
                                maxWidth: "360px",
                                maxHeight: "240px",
                                borderRadius: "10px",
                                objectFit: "cover",
                                border: "1px solid #e0e0e0",
                              }}
                            />
                          </ArgonBox>
                        )}

                        {complaint.response && (
                          <ArgonBox p={2} sx={{ backgroundColor: "#f5f8ff", borderRadius: 2, borderLeft: "4px solid #5e72e4" }}>
                            <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                              Phản hồi từ nhà trường
                            </ArgonTypography>
                            <ArgonTypography variant="body2" color="text" mb={0.5}>
                              {complaint.response}
                            </ArgonTypography>
                            {complaint.updatedAt && (
                              <ArgonTypography variant="caption" color="text">
                                📅 Phản hồi lúc: {formatDate(complaint.updatedAt)}
                              </ArgonTypography>
                            )}
                          </ArgonBox>
                        )}
                      </Paper>
                    </ListItem>
                    {index < filteredComplaints.length - 1 && <Divider sx={{ my: 2 }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* New Complaint Dialog */}
        <Dialog
          open={newComplaintDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.25)",
            }
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)",
              color: "white",
              py: 2.5,
              px: 3,
            }}
          >
            <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
              <ArgonBox display="flex" alignItems="center" gap={1.5}>
                <ArgonBox
                  component="i"
                  className="ni ni-fat-add"
                  color="white"
                  fontSize="24px"
                />
                <ArgonTypography variant="h5" fontWeight="bold" color="white">
                  Gửi đơn khiếu nại / góp ý
                </ArgonTypography>
              </ArgonBox>
              <IconButton onClick={handleCloseDialog} sx={{ color: "white" }}>
                <i className="ni ni-fat-remove" style={{ fontSize: "20px" }} />
              </IconButton>
            </ArgonBox>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 3 }}>
            {success && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
                {success}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {/* Step 1 */}
            <ArgonBox mb={3}>
              <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={0.75}>
                1. Chọn loại đơn <span style={{ color: "#d32f2f" }}>*</span>
              </ArgonTypography>
              <ArgonTypography variant="caption" color="text" mb={1.5} display="block">
                Hãy chọn loại đơn phù hợp để nhà trường xử lý nhanh hơn.
              </ArgonTypography>
              <FormControl fullWidth>
                <Select
                  value={selectedComplaintType}
                  onChange={(e) => setSelectedComplaintType(e.target.value)}
                  disabled={loadingTypes || loading}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#d2d6da",
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <ArgonTypography variant="body2" color="text">
                      Chọn loại đơn
                    </ArgonTypography>
                  </MenuItem>
                  {loadingTypes ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <ArgonTypography variant="body2" color="text">
                        Đang tải...
                      </ArgonTypography>
                    </MenuItem>
                  ) : (
                    complaintTypes.map((type) => (
                      <MenuItem key={type._id} value={type._id}>
                        <ArgonBox>
                          <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                            {type.name}
                          </ArgonTypography>
                          {type.description && (
                            <ArgonTypography variant="caption" color="text" display="block">
                              {type.description}
                            </ArgonTypography>
                          )}
                        </ArgonBox>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </ArgonBox>

            {/* Step 2 */}
            <ArgonBox mb={3}>
              <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={0.75}>
                2. Nội dung chi tiết <span style={{ color: "#d32f2f" }}>*</span>
              </ArgonTypography>
              <ArgonTypography variant="caption" color="text" mb={1.5} display="block">
                Mô tả rõ ràng vấn đề bạn gặp phải để nhà trường có đủ thông tin phản hồi.
              </ArgonTypography>
              <TextField
                fullWidth
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                variant="outlined"
                multiline
                rows={5}
                placeholder="Nhập nội dung khiếu nại hoặc góp ý của bạn..."
                disabled={loading}
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    width: '100%',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    width: '100% !important',
                  }
                }}
              />
              <ArgonTypography variant="caption" color="text" mt={0.75} display="block">
                Vui lòng mô tả cụ thể thời gian, địa điểm hoặc các thông tin liên quan.
              </ArgonTypography>
            </ArgonBox>

            {/* Step 3 */}
            <ArgonBox>
              <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={0.75}>
                3. Hình ảnh minh hoạ (không bắt buộc)
              </ArgonTypography>
              <ArgonTypography variant="caption" color="text" mb={1.5} display="block">
                Bạn có thể đính kèm ảnh chứng minh để nhà trường nắm rõ tình huống.
              </ArgonTypography>

              <input
                accept="image/*"
                style={{ display: "none" }}
                id="complaint-image-upload"
                type="file"
                onChange={handleImageUpload}
                disabled={loading}
              />

              {!imagePreview ? (
                <label htmlFor="complaint-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<i className="ni ni-image" />}
                    disabled={loading}
                    fullWidth
                    sx={{
                      py: 1.8,
                      borderRadius: 2,
                      borderStyle: "dashed",
                      borderWidth: 2,
                      borderColor: "#d2d6da",
                      color: "#67748e",
                      "&:hover": {
                        borderColor: "#5e72e4",
                        backgroundColor: "rgba(94, 114, 228, 0.05)",
                      },
                    }}
                  >
                    <ArgonBox textAlign="left">
                      <ArgonTypography variant="body2" fontWeight="medium">
                        Chọn ảnh để tải lên
                      </ArgonTypography>
                      <ArgonTypography variant="caption" color="text">
                        Hỗ trợ JPG, PNG, GIF (tối đa 5MB)
                      </ArgonTypography>
                    </ArgonBox>
                  </Button>
                </label>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    p: 2,
                    backgroundColor: "#f8f9fe",
                  }}
                >
                  <ArgonBox position="relative" textAlign="center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxHeight: "320px",
                        borderRadius: "12px",
                        objectFit: "cover",
                        border: "1px solid #e0e0e0",
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleRemoveImage}
                      disabled={loading}
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        backgroundColor: "rgba(18, 38, 63, 0.8)",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "rgba(18, 38, 63, 1)",
                        },
                      }}
                    >
                      <i className="ni ni-fat-remove" style={{ fontSize: "18px" }} />
                    </IconButton>
                  </ArgonBox>
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleRemoveImage}
                    disabled={loading}
                    startIcon={<i className="ni ni-fat-remove" />}
                    sx={{ color: "#d32f2f", fontWeight: 600, mt: 1 }}
                  >
                    Xóa ảnh
                  </Button>
                </Paper>
              )}
            </ArgonBox>

            <Alert severity="info" sx={{ borderRadius: 2, mt: 3 }}>
              Nhà trường sẽ phản hồi trong mục “Danh sách đơn của tôi”. Vui lòng kiểm tra thường xuyên để nhận thông báo mới.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 3, pt: 1, justifyContent: "flex-end", gap: 1.5 }}>
            <Button
              onClick={handleCloseDialog}
              disabled={loading}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: "bold",
                border: "2px solid",
                borderColor: "grey.300",
                color: "#67748e",
                "&:hover": { borderWidth: 2 }
              }}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitComplaint}
              disabled={!selectedComplaintType || !reason.trim() || loading}
              startIcon={
                loading ? (
                  <CircularProgress size={16} sx={{ color: "white" }} />
                ) : (
                  <i className="ni ni-send" />
                )
              }
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "0 6px 16px rgba(94, 114, 228, 0.4)",
                "&:hover": {
                  boxShadow: "0 10px 24px rgba(94, 114, 228, 0.45)",
                },
              }}
            >
              {loading ? "Đang gửi..." : "Gửi đơn"}
            </Button>
          </DialogActions>
        </Dialog>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ComplaintsAndFeedback;
