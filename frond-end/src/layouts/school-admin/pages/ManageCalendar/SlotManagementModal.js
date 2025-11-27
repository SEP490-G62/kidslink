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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import schoolAdminService from "services/schoolAdminService";

const SlotManagementModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    slotName: "",
    startTime: "",
    endTime: ""
  });
  const [errors, setErrors] = useState({});
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", severity: "error" });

  useEffect(() => {
    if (open) {
      fetchSlots();
      resetForm();
    }
  }, [open]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await schoolAdminService.getAllSlots();
      const slotsData = response.data || [];
      setSlots(slotsData);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAlertInfo({
        show: true,
        message: "Không thể tải danh sách tiết học",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      slotName: "",
      startTime: "",
      endTime: ""
    });
    setEditingSlot(null);
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.slotName || formData.slotName.trim() === '') {
      newErrors.slotName = "Tên tiết học là bắt buộc";
    }
    
    if (!formData.startTime) {
      newErrors.startTime = "Giờ bắt đầu là bắt buộc";
    }
    
    if (!formData.endTime) {
      newErrors.endTime = "Giờ kết thúc là bắt buộc";
    }
    
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = "Giờ kết thúc phải sau giờ bắt đầu";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    setFormData({
      slotName: slot.slotName || "",
      startTime: slot.startTime || "",
      endTime: slot.endTime || ""
    });
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tiết học này?")) return;

    try {
      setLoading(true);
      await schoolAdminService.deleteSlot(slotId);
      setAlertInfo({
        show: true,
        message: "Đã xóa tiết học thành công",
        severity: "success"
      });
      fetchSlots();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error deleting slot:", error);
      setAlertInfo({
        show: true,
        message: error.message || "Không thể xóa tiết học này vì đang được sử dụng trong lịch học",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const slotData = {
        slotName: formData.slotName,
        startTime: formData.startTime,
        endTime: formData.endTime
      };

      if (editingSlot) {
        // Update existing slot (bao gồm cả slotName)
        await schoolAdminService.updateSlot(editingSlot._id, slotData);
        setAlertInfo({
          show: true,
          message: "Đã cập nhật tiết học thành công",
          severity: "success"
        });
      } else {
        // Create new slot
        await schoolAdminService.createSlot(slotData);
        setAlertInfo({
          show: true,
          message: "Đã thêm tiết học mới thành công",
          severity: "success"
        });
      }
      
      resetForm();
      fetchSlots();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving slot:", error);
      const errorMessage = error.message || "Vui lòng thử lại";
      
      if (errorMessage.includes("trùng") || errorMessage.includes("overlapping")) {
        setAlertInfo({
          show: true,
          message: "Khung giờ này bị trùng với tiết học đã có. Vui lòng chọn khoảng thời gian khác.",
          severity: "warning"
        });
      } else {
        setAlertInfo({
          show: true,
          message: "Lỗi khi lưu tiết học: " + errorMessage,
          severity: "error"
        });
      }
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
            Quản lý tiết học
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
                  {editingSlot ? "Chỉnh sửa tiết học" : "Thêm tiết học mới"}
                </ArgonTypography>
                <ArgonBox>
                  <ArgonBox mb={2}>
                    <ArgonTypography variant="body2" fontWeight="medium" mb={1}>
                      Tên tiết học *
                    </ArgonTypography>
                    <TextField
                      value={formData.slotName}
                      onChange={(e) => handleChange('slotName', e.target.value)}
                      placeholder="VD: Tiết 1, Tiết 2, ..."
                      error={!!errors.slotName}
                      helperText={errors.slotName || "Nhập tên tiết học"}
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
                      Giờ bắt đầu *
                    </ArgonTypography>
                    <TextField
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleChange('startTime', e.target.value)}
                      error={!!errors.startTime}
                      helperText={errors.startTime || "Chọn giờ bắt đầu tiết học"}
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
                      Giờ kết thúc *
                    </ArgonTypography>
                    <TextField
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleChange('endTime', e.target.value)}
                      error={!!errors.endTime}
                      helperText={errors.endTime || "Chọn giờ kết thúc tiết học"}
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
                  <ArgonBox display="flex" gap={1}>
                    <ArgonButton 
                      onClick={handleSubmit} 
                      color="info" 
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={20} color="inherit" /> : (editingSlot ? "Cập nhật" : "Thêm mới")}
                    </ArgonButton>
                    {editingSlot && (
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

            {/* Danh sách tiết học */}
            <Grid item xs={12} md={6}>
              <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
                Danh sách tiết học ({slots.length})
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
                {loading && slots.length === 0 ? (
                  <ArgonBox p={3} textAlign="center">
                    <CircularProgress size={24} />
                  </ArgonBox>
                ) : slots.length === 0 ? (
                  <ArgonBox p={3} textAlign="center">
                    <ArgonTypography variant="body2" color="text">
                      Chưa có tiết học nào
                    </ArgonTypography>
                  </ArgonBox>
                ) : (
                  <List>
                    {slots.map((slot, index) => (
                      <React.Fragment key={slot._id}>
                        <ListItem
                          secondaryAction={
                            <ArgonBox display="flex" gap={0.5}>
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleEdit(slot)}
                                sx={{ color: '#1976d2' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleDelete(slot._id)}
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
                                  {slot.slotName || `Tiết ${index + 1}`}
                                </ArgonTypography>
                                <Chip 
                                  label={`${slot.startTime || ''} - ${slot.endTime || ''}`}
                                  size="small" 
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.7rem',
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2',
                                    fontWeight: 600
                                  }} 
                                />
                              </ArgonBox>
                            }
                            secondary={
                              <ArgonTypography variant="caption" color="text">
                                Khung giờ: {slot.startTime || '00:00'} - {slot.endTime || '00:00'}
                              </ArgonTypography>
                            }
                          />
                        </ListItem>
                        {index < slots.length - 1 && <Divider />}
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

SlotManagementModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};

export default SlotManagementModal;

