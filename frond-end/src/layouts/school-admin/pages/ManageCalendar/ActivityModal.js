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
  Chip
} from "@mui/material";
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

  useEffect(() => {
    if (open) {
      fetchActivities();
      resetForm();
    }
  }, [open]);

  const fetchActivities = async () => {
    try {
      const response = await schoolAdminService.getAllActivities();
      console.log("Activities response:", response);
      setActivities(response.data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      requireOutdoor: false
    });
    setEditingActivity(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      description: activity.description,
      requireOutdoor: activity.requireOutdoor === 1
    });
  };

  const handleDelete = async (activityId) => {
    if (!window.confirm("Bạn có chắc muốn xóa môn học này?")) return;

    try {
      await schoolAdminService.deleteActivity(activityId);
      fetchActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Lỗi khi xóa môn học: " + (error.message || "Vui lòng thử lại"));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description) {
      alert("Vui lòng điền đầy đủ tên và mô tả môn học");
      return;
    }

    setLoading(true);
    try {
      if (editingActivity) {
        await schoolAdminService.updateActivity(editingActivity._id, {
          name: formData.name,
          description: formData.description,
          requireOutdoor: formData.requireOutdoor ? 1 : 0
        });
      } else {
        await schoolAdminService.createActivity({
          name: formData.name,
          description: formData.description,
          requireOutdoor: formData.requireOutdoor ? 1 : 0
        });
      }
      fetchActivities();
      resetForm();
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("Lỗi khi lưu môn học: " + (error.message || "Vui lòng thử lại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h4" fontWeight="bold" color="primary.main">
          Quản lý môn học / Hoạt động
        </ArgonTypography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Form thêm/sửa */}
          <Grid item xs={12} md={5}>
            <ArgonBox 
              sx={{ 
                p: 2.5, 
                border: '2px dashed #dee2e6', 
                borderRadius: 2,
                backgroundColor: '#f8f9fa',
                height: '100%'
              }}
            >
              <ArgonTypography variant="h6" fontWeight="bold" mb={2} color="info">
                {editingActivity ? "Chỉnh sửa môn học" : "Thêm môn học mới"}
              </ArgonTypography>
              <ArgonBox>
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Tên môn học
                </ArgonTypography>
                <TextField
                  fullWidth
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="VD: Toán học, Nghệ thuật, ..."
                  sx={{ mb: 2 }}
                />
                <ArgonTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Mô tả
                </ArgonTypography>
                <TextField
                  fullWidth
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Mô tả ngắn về môn học"
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requireOutdoor}
                      onChange={(e) => handleChange('requireOutdoor', e.target.checked)}
                    />
                  }
                  label="Yêu cầu không gian ngoài trời"
                />
                <ArgonBox mt={2} display="flex" gap={1}>
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
          <Grid item xs={12} md={7}>
            <ArgonBox mb={2} display="flex" justifyContent="space-between" alignItems="center">
              <ArgonTypography variant="h6" fontWeight="bold">
                Danh sách môn học
              </ArgonTypography>
              <Chip 
                label={`${activities.length} môn`} 
                color="info" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </ArgonBox>
            <ArgonBox 
              sx={{ 
                maxHeight: 450, 
                overflowY: 'auto',
                border: '1px solid #dee2e6',
                borderRadius: 2,
                backgroundColor: '#fff'
              }}
            >
              {activities.length === 0 ? (
                <ArgonBox p={4} textAlign="center">
                  <ArgonTypography variant="body2" color="text">
                    Chưa có môn học nào. Hãy thêm môn học mới bên trái.
                  </ArgonTypography>
                </ArgonBox>
              ) : (
                <List sx={{ p: 0 }}>
                  {activities.map((activity, index) => (
                    <React.Fragment key={activity._id}>
                      <ListItem
                        sx={{ 
                          alignItems: 'flex-start', 
                          py: 2,
                          px: 2.5,
                          '&:hover': {
                            backgroundColor: '#f8f9fa'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <ArgonBox display="flex" alignItems="center" gap={1} mb={0.5}>
                              <ArgonTypography variant="body2" fontWeight="bold" color="dark">
                                {activity.name}
                              </ArgonTypography>
                              {activity.requireOutdoor === 1 && (
                                <Chip 
                                  label="Ngoài trời" 
                                  size="small" 
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.65rem',
                                    backgroundColor: '#81c784',
                                    color: '#fff',
                                    fontWeight: 600
                                  }} 
                                />
                              )}
                            </ArgonBox>
                          }
                          secondary={
                            <ArgonTypography variant="caption" color="text" sx={{ display: 'block', mt: 0.5 }}>
                              {activity.description}
                            </ArgonTypography>
                          }
                        />
                        <ArgonBox display="flex" gap={0.5} ml={2}>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleEdit(activity)}
                            sx={{ 
                              color: '#1976d2',
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.08)'
                              }
                            }}
                            title="Sửa"
                          >
                            <i className="fas fa-edit" style={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDelete(activity._id)}
                            sx={{ 
                              color: '#f44336',
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.08)'
                              }
                            }}
                            title="Xóa"
                          >
                            <i className="fas fa-trash" style={{ fontSize: 14 }} />
                          </IconButton>
                        </ArgonBox>
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
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <ArgonButton onClick={onClose} color="secondary" variant="outlined">
          Đóng
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

ActivityModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ActivityModal;
