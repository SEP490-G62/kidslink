import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";

const ActivityModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    requireOutdoor: false
  });
  const [errors, setErrors] = useState({});
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", severity: "error" });

  useEffect(() => {
    if (open) {
      fetchActivities();
      resetForm();
    }
  }, [open]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await schoolAdminService.getAllActivities();
      // Backend: { success: true, data: [...] }
      let list = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          list = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          list = response.data.data;
        }
      }
      setActivities(list);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setAlertInfo({
        show: true,
        message: "Không thể tải danh sách môn học",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      requireOutdoor: false
    });
    setEditingActivity(null);
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name || "",
      description: activity.description || "",
      requireOutdoor: activity.requireOutdoor === 1 || activity.requireOutdoor === true
    });
  };

  const handleDelete = async (activityId) => {
    if (!window.confirm("Bạn có chắc muốn xóa môn học này?")) return;

    try {
      setLoading(true);
      await schoolAdminService.deleteActivity(activityId);
      setAlertInfo({
        show: true,
        message: "Đã xóa môn học thành công",
        severity: "success"
      });
      fetchActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
      setAlertInfo({
        show: true,
        message: error.message || "Không thể xóa môn học này",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = "Tên môn học là bắt buộc";
    }
    
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = "Mô tả là bắt buộc";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const activityData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        requireOutdoor: formData.requireOutdoor ? 1 : 0
      };

      if (editingActivity) {
        // Update existing activity
        await schoolAdminService.updateActivity(editingActivity._id, activityData);
        setAlertInfo({
          show: true,
          message: "Đã cập nhật môn học thành công",
          severity: "success"
        });
      } else {
        // Create new activity
        await schoolAdminService.createActivity(activityData);
        setAlertInfo({
          show: true,
          message: "Đã thêm môn học mới thành công",
          severity: "success"
        });
      }
      
      resetForm();
      fetchActivities();
    } catch (error) {
      console.error("Error saving activity:", error);
      const errorMessage = error.message || "Vui lòng thử lại";
      setAlertInfo({
        show: true,
        message: "Lỗi khi lưu môn học: " + errorMessage,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          <ArgonTypography variant="h5" fontWeight="bold" color="#fff">
          Quản lý môn học / Hoạt động
        </ArgonTypography>
          <IconButton
            size="small"
            sx={{
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
            }}
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
      </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            pb: 2.5,
            px: 3,
            background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)",
          }}
        >

        <Grid container spacing={3}>
          {/* Form thêm/sửa */}
          <Grid item xs={12} md={6}>
            <ArgonBox 
              sx={{ 
                p: 2, 
                border: '2px dashed #dee2e6', 
                borderRadius: 2,
                backgroundColor: '#f8f9fa'
              }}
            >
              <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
                {editingActivity ? "Chỉnh sửa môn học" : "Thêm môn học mới"}
              </ArgonTypography>
              <ArgonBox>
                  <ArgonBox mb={2}>
                    <ArgonTypography variant="body2" fontWeight="medium" mb={1}>
                      Tên môn học *
                    </ArgonTypography>
                <TextField
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="VD: Toán học, Nghệ thuật, ..."
                      error={!!errors.name}
                      helperText={errors.name || "Nhập tên môn học"}
                      required
                      sx={{ 
                        flex: 1, 
                        minWidth: 200, 
                        maxWidth: '100%',
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
                  </ArgonBox>
                  <ArgonBox mb={2}>
                    <ArgonTypography variant="body2" fontWeight="medium" mb={1}>
                      Mô tả *
                    </ArgonTypography>
                <TextField
                      multiline
                      rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Mô tả ngắn về môn học"
                      error={!!errors.description}
                      helperText={errors.description || "Nhập mô tả môn học"}
                      required
                      sx={{ 
                        flex: 1, 
                        minWidth: 200, 
                        maxWidth: '100%',
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
                  </ArgonBox>
                  <ArgonBox mb={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requireOutdoor}
                      onChange={(e) => handleChange('requireOutdoor', e.target.checked)}
                          sx={{
                            color: "#1976d2",
                            "&.Mui-checked": {
                              color: "#1976d2",
                            },
                          }}
                        />
                      }
                      label={
                        <ArgonTypography variant="body2" fontWeight={500}>
                          Yêu cầu không gian ngoài trời
                        </ArgonTypography>
                      }
                    />
                  </ArgonBox>
                  <ArgonBox display="flex" gap={1}>
                  <ArgonButton 
                    onClick={handleSubmit} 
                    color="info" 
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : (editingActivity ? "Cập nhật" : "Thêm mới")}
                  </ArgonButton>
                  {editingActivity && (
                    <ArgonButton 
                      onClick={resetForm} 
                      color="secondary"
                      variant="outlined"
                    >
                      Hủy
                    </ArgonButton>
                  )}
                </ArgonBox>
              </ArgonBox>
            </ArgonBox>
          </Grid>

          {/* Danh sách môn học */}
          <Grid item xs={12} md={6}>
            <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
              Danh sách môn học ({activities.length})
            </ArgonTypography>
            <ArgonBox 
              sx={{ 
                maxHeight: 400, 
                overflowY: 'auto',
                border: '1px solid #dee2e6',
                borderRadius: 2,
                backgroundColor: '#fff'
              }}
            >
                {loading && activities.length === 0 ? (
                  <ArgonBox p={3} textAlign="center">
                    <CircularProgress size={24} />
                  </ArgonBox>
                ) : activities.length === 0 ? (
                <ArgonBox p={3} textAlign="center">
                  <ArgonTypography variant="body2" color="text">
                    Chưa có môn học nào
                  </ArgonTypography>
                </ArgonBox>
              ) : (
                <List>
                  {activities.map((activity, index) => (
                    <React.Fragment key={activity._id}>
                      <ListItem
                        secondaryAction={
                          <ArgonBox display="flex" gap={0.5}>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleEdit(activity)}
                              sx={{ color: '#1976d2' }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleDelete(activity._id)}
                              sx={{ color: '#f44336' }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ArgonBox>
                        }
                        sx={{ alignItems: 'flex-start', py: 2 }}
                      >
                        <ListItemText
                          primary={
                            <ArgonBox display="flex" alignItems="center" gap={1}>
                              <ArgonTypography variant="body2" fontWeight="bold">
                                {activity.name}
                              </ArgonTypography>
                              {activity.requireOutdoor === 1 && (
                                <Chip 
                                  label="Ngoài trời" 
                                  size="small" 
                                  sx={{ 
                                      height: 20, 
                                      fontSize: '0.7rem',
                                    backgroundColor: '#81c784',
                                      color: '#fff',
                                      fontWeight: 600
                                  }} 
                                />
                              )}
                            </ArgonBox>
                          }
                          secondary={
                            <ArgonTypography variant="caption" color="text">
                              {activity.description}
                            </ArgonTypography>
                          }
                        />
                      </ListItem>
                      {index < activities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </ArgonBox>
          </Grid>
        </Grid>
      </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #e3f2fd",
            background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)",
          }}
        >
        <ArgonButton onClick={onClose} color="secondary" variant="outlined">
          Đóng
        </ArgonButton>
      </DialogActions>
    </Dialog>

      {/* Snackbar thông báo */}
      <Snackbar
        open={alertInfo.show}
        autoHideDuration={4000}
        onClose={() => setAlertInfo({ ...alertInfo, show: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlertInfo({ ...alertInfo, show: false })} 
          severity={alertInfo.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </>
  );
};

ActivityModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ActivityModal;