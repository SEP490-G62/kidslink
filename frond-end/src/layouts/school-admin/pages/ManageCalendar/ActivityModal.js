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
      setActivities(response.data?.data || []);
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
        <ArgonTypography variant="h5" fontWeight="bold">
          Quản lý môn học / Hoạt động
        </ArgonTypography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
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
                <TextField
                  fullWidth
                  label="Tên môn học"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="VD: Toán học, Nghệ thuật, ..."
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Mô tả"
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
              {activities.length === 0 ? (
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
                              <i className="fas fa-edit" style={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleDelete(activity._id)}
                              sx={{ color: '#f44336' }}
                            >
                              <i className="fas fa-trash" style={{ fontSize: 14 }} />
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
                                    height: 18, 
                                    fontSize: '0.65rem',
                                    backgroundColor: '#81c784',
                                    color: '#fff'
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
