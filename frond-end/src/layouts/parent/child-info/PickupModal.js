import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Alert,
  Avatar,
  Box,
} from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';

function PickupModal({ open, onClose, pickup, studentId, onSubmit, onDelete }) {
  const [formData, setFormData] = useState({
    full_name: '',
    relationship: '',
    id_card_number: '',
    phone: '',
    avatar_url: ''
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!pickup;

  useEffect(() => {
    if (pickup) {
      setFormData({
        full_name: pickup.full_name || '',
        relationship: pickup.relationship || '',
        id_card_number: pickup.id_card_number || '',
        phone: pickup.phone || '',
        avatar_url: pickup.avatar_url || ''
      });
      setAvatarPreview(pickup.avatar_url || null);
    } else {
      setFormData({
        full_name: '',
        relationship: '',
        id_card_number: '',
        phone: '',
        avatar_url: ''
      });
      setAvatarPreview(null);
    }
    setError('');
  }, [pickup, open]);

  const handleChange = (field) => (e) => {
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setAvatarPreview(base64Image);
        setFormData({
          ...formData,
          avatar_url: base64Image
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setFormData({
      ...formData,
      avatar_url: ''
    });
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (!formData.full_name || !formData.relationship || !formData.id_card_number || !formData.phone) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFormData({
      full_name: '',
      relationship: '',
      id_card_number: '',
      phone: '',
      avatar_url: ''
    });
    setAvatarPreview(null);
    onClose();
  };

  const handleDeleteClick = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người đón này?')) {
      setLoading(true);
      try {
        await onDelete();
        handleClose();
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi xóa');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 2.5
      }}>
        <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h5" fontWeight="bold" color="white">
            {isEditMode ? '✏️ Chỉnh sửa người đón' : '➕ Thêm người đón mới'}
          </ArgonTypography>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <i className="ni ni-fat-remove" style={{ fontSize: '24px' }} />
          </IconButton>
        </ArgonBox>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          💡 Lưu ý: Người đón này sẽ được áp dụng cho tất cả các con đang học của bạn
        </Alert>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <ArgonBox display="flex" flexDirection="column" gap={2.5}>
          {/* Avatar Upload Section */}
          <ArgonBox display="flex" flexDirection="column" alignItems="center" gap={2} mb={2}>
            <Avatar
              src={avatarPreview}
              alt="Avatar preview"
              sx={{ 
                width: 100, 
                height: 100,
                border: '3px solid',
                borderColor: 'primary.main'
              }}
            >
              {formData.full_name?.charAt(0) || 'P'}
            </Avatar>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                component="label"
                startIcon={<i className="ni ni-image" />}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Tải ảnh
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              {avatarPreview && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveAvatar}
                  startIcon={<i className="ni ni-fat-remove" />}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Xóa ảnh
                </Button>
              )}
            </Box>
          </ArgonBox>

          <ArgonBox>
            <ArgonTypography variant="body2" fontWeight="medium" color="dark" mb={1}>
              Họ và tên
            </ArgonTypography>
            <TextField
              fullWidth
              required
              value={formData.full_name}
              onChange={handleChange('full_name')}
              variant="outlined"
              placeholder="Nhập họ và tên"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa',
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  width: '100% !important',
                  minWidth: '0 !important',
                  maxWidth: 'none !important',
                  overflow: 'visible !important',
                  textOverflow: 'unset !important',
                  whiteSpace: 'nowrap !important',
                  boxSizing: 'border-box !important',
                },
                '& .MuiOutlinedInput-input': {
                  width: '100% !important',
                  minWidth: '0 !important',
                  maxWidth: 'none !important',
                },
              }}
            />
          </ArgonBox>

          <ArgonBox>
            <ArgonTypography variant="body2" fontWeight="medium" color="dark" mb={1}>
              Quan hệ với học sinh
            </ArgonTypography>
            <TextField
              fullWidth
              required
              value={formData.relationship}
              onChange={handleChange('relationship')}
              variant="outlined"
              placeholder="VD: Bố, Mẹ, Ông, Bà, Cô, Chú, Anh, Chị..."
              helperText="Ví dụ: Bố, Mẹ, Ông Nội, Bà Nội, Cô, Chú"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa',
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  width: '100% !important',
                  minWidth: '0 !important',
                  maxWidth: 'none !important',
                  overflow: 'visible !important',
                  textOverflow: 'unset !important',
                  whiteSpace: 'nowrap !important',
                  boxSizing: 'border-box !important',
                },
                '& .MuiOutlinedInput-input': {
                  width: '100% !important',
                  minWidth: '0 !important',
                  maxWidth: 'none !important',
                },
              }}
            />
          </ArgonBox>

          <ArgonBox>
            <ArgonTypography variant="body2" fontWeight="medium" color="dark" mb={1}>
              Số CMND/CCCD
            </ArgonTypography>
            <TextField
              fullWidth
              required
              value={formData.id_card_number}
              onChange={handleChange('id_card_number')}
              variant="outlined"
              placeholder="Nhập số CMND/CCCD"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa',
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  width: '100% !important',
                  minWidth: '0 !important',
                  maxWidth: 'none !important',
                  overflow: 'visible !important',
                  textOverflow: 'unset !important',
                  whiteSpace: 'nowrap !important',
                  boxSizing: 'border-box !important',
                },
                '& .MuiOutlinedInput-input': {
                  width: '100% !important',
                  minWidth: '0 !important',
                  maxWidth: 'none !important',
                },
              }}
            />
          </ArgonBox>

          <ArgonBox>
            <ArgonTypography variant="body2" fontWeight="medium" color="dark" mb={1}>
              Số điện thoại
            </ArgonTypography>
            <TextField
              fullWidth
              required
              value={formData.phone}
              onChange={handleChange('phone')}
              variant="outlined"
              placeholder="VD: +84 900 123 456 hoặc 0900 123 456"
              helperText="Ví dụ: +84 900 123 456 hoặc 0900 123 456"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa',
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  width: '100% !important',
                  minWidth: '0 !important',
                  maxWidth: 'none !important',
                  overflow: 'visible !important',
                  textOverflow: 'unset !important',
                  whiteSpace: 'nowrap !important',
                  boxSizing: 'border-box !important',
                },
                '& .MuiOutlinedInput-input': {
                  width: '100% !important',
                  minWidth: '0 !important',
                  maxWidth: 'none !important',
                },
              }}
            />
          </ArgonBox>
        </ArgonBox>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {/* {isEditMode && (
          <Button
            onClick={handleDeleteClick}
            color="error"
            variant="outlined"
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 'bold',
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            🗑️ Xóa
          </Button>
        )} */}
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 'bold',
            border: '2px solid',
            borderColor: 'grey.300',
            '&:hover': {
              borderWidth: 2
            }
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1,
            textTransform: 'none',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: 3,
            color: 'white !important',
            '&:hover': {
              boxShadow: 5,
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              color: 'white !important'
            },
            '&:disabled': {
              background: '#ccc',
              color: 'white !important'
            }
          }}
        >
          {loading ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật' : 'Thêm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PickupModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pickup: PropTypes.object,
  studentId: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default PickupModal;

