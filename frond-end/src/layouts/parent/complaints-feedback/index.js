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
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";

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
          >
            Gửi đơn mới
          </Button>
        </ArgonBox>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
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
            <Card>
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
            <Card>
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
            <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                Danh sách đơn của tôi
              </ArgonTypography>
              {loadingComplaints && <CircularProgress size={24} />}
            </ArgonBox>

            {loadingComplaints ? (
              <ArgonBox display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </ArgonBox>
            ) : complaints.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                <ArgonTypography variant="body2" color="text">
                  Bạn chưa có đơn nào. Hãy tạo đơn mới!
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <List>
                {complaints.map((complaint, index) => (
                  <React.Fragment key={complaint._id || complaint.id}>
                    <ListItem sx={{ px: 0, mb: 2, flexDirection: "column", alignItems: "stretch" }}>
                      <ArgonBox display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
                        <ArgonBox flex={1}>
                          <ArgonBox display="flex" alignItems="center" gap={1} mb={1}>
                            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                              {complaint.complaint_type_id?.name || "Không xác định"}
                            </ArgonTypography>
                            <Chip
                              label={getStatusLabel(complaint.status)}
                              color={getStatusColor(complaint.status)}
                              size="small"
                            />
                          </ArgonBox>
                          <ArgonTypography variant="body2" color="text" mb={1}>
                            {complaint.reason}
                          </ArgonTypography>
                          {complaint.image && (
                            <ArgonBox mt={1} mb={1}>
                              <img
                                src={complaint.image}
                                alt="Complaint"
                                style={{
                                  maxWidth: "300px",
                                  maxHeight: "200px",
                                  borderRadius: "8px",
                                  objectFit: "cover",
                                }}
                              />
                            </ArgonBox>
                          )}
                          <ArgonTypography variant="caption" color="text">
                            📅 Gửi lúc: {formatDate(complaint.createdAt)}
                          </ArgonTypography>
                          {complaint.response && (
                            <ArgonBox mt={2} p={2} sx={{ backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                              <ArgonTypography variant="body2" fontWeight="medium" color="dark" mb={1}>
                                Phản hồi từ nhà trường:
                              </ArgonTypography>
                              <ArgonTypography variant="body2" color="text">
                                {complaint.response}
                              </ArgonTypography>
                              {complaint.updatedAt && (
                                <ArgonTypography variant="caption" color="text" mt={1} display="block">
                                  📅 Phản hồi lúc: {formatDate(complaint.updatedAt)}
                                </ArgonTypography>
                              )}
                            </ArgonBox>
                          )}
                        </ArgonBox>
                      </ArgonBox>
                    </ListItem>
                    {index < complaints.length - 1 && <Divider />}
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
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <ArgonBox display="flex" alignItems="center" gap={1}>
              <ArgonBox
                component="i"
                className="ni ni-fat-add"
                color="primary"
                fontSize="24px"
              />
              <ArgonTypography variant="h5" fontWeight="bold" color="dark">
                Gửi đơn mới
              </ArgonTypography>
            </ArgonBox>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
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

            {/* Loại đơn */}
            <ArgonBox mb={3}>
              <ArgonBox display="flex" alignItems="center" gap={1} mb={1.5}>
                <ArgonBox
                  component="i"
                  className="ni ni-bullet-list-67"
                  color="primary"
                  fontSize="18px"
                />
                <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                  Loại đơn <span style={{ color: "#d32f2f" }}>*</span>
                </ArgonTypography>
              </ArgonBox>
              <FormControl fullWidth>
                <Select
                  value={selectedComplaintType}
                  onChange={(e) => setSelectedComplaintType(e.target.value)}
                  disabled={loadingTypes || loading}
                  displayEmpty
                  sx={{
                    borderRadius: 1,
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

            {/* Lý do / Nội dung */}
            <ArgonBox mb={3}>
              <ArgonBox display="flex" alignItems="center" gap={1} mb={1.5}>
                <ArgonBox
                  component="i"
                  className="ni ni-single-copy-04"
                  color="primary"
                  fontSize="18px"
                />
                <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                  Lý do / Nội dung <span style={{ color: "#d32f2f" }}>*</span>
                </ArgonTypography>
              </ArgonBox>
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
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              />
              <ArgonTypography variant="caption" color="text" mt={0.5} display="block">
                Vui lòng mô tả chi tiết để nhà trường có thể xử lý tốt hơn
              </ArgonTypography>
            </ArgonBox>

            {/* Image Upload */}
            <ArgonBox mb={2}>
              <ArgonBox display="flex" alignItems="center" gap={1} mb={1.5}>
                <ArgonBox
                  component="i"
                  className="ni ni-image"
                  color="primary"
                  fontSize="18px"
                />
                <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                  Hình ảnh đính kèm
                </ArgonTypography>
                <Chip
                  label="Tùy chọn"
                  size="small"
                  color="default"
                  sx={{ height: 20, fontSize: "0.65rem" }}
                />
              </ArgonBox>
              
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
                      py: 1.5,
                      borderRadius: 1,
                      borderStyle: "dashed",
                      borderWidth: 2,
                      borderColor: "#d2d6da",
                      color: "#67748e",
                      "&:hover": {
                        borderColor: "#5e72e4",
                        backgroundColor: "rgba(94, 114, 228, 0.04)",
                      },
                    }}
                  >
                    <ArgonBox>
                      <ArgonTypography variant="body2" fontWeight="medium">
                        Chọn ảnh để tải lên
                      </ArgonTypography>
                      <ArgonTypography variant="caption" color="text">
                        JPG, PNG hoặc GIF (tối đa 5MB)
                      </ArgonTypography>
                    </ArgonBox>
                  </Button>
                </label>
              ) : (
                <ArgonBox>
                  <ArgonBox
                    position="relative"
                    display="inline-block"
                    sx={{
                      border: "2px solid #e9ecef",
                      borderRadius: 2,
                      overflow: "hidden",
                      p: 1,
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "300px",
                        borderRadius: "8px",
                        objectFit: "contain",
                        display: "block",
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
                        backgroundColor: "rgba(211, 47, 47, 0.9)",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#d32f2f",
                        },
                      }}
                    >
                      <i className="ni ni-fat-remove" style={{ fontSize: "18px" }} />
                    </IconButton>
                  </ArgonBox>
                  <ArgonBox mt={1}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleRemoveImage}
                      disabled={loading}
                      startIcon={<i className="ni ni-fat-remove" />}
                      sx={{ color: "#d32f2f" }}
                    >
                      Xóa ảnh
                    </Button>
                  </ArgonBox>
                </ArgonBox>
              )}
            </ArgonBox>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={handleCloseDialog}
              disabled={loading}
              sx={{
                color: "#67748e",
                fontWeight: 500,
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
                py: 1,
                borderRadius: 1,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "0 4px 6px rgba(94, 114, 228, 0.25)",
                "&:hover": {
                  boxShadow: "0 6px 10px rgba(94, 114, 228, 0.35)",
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
