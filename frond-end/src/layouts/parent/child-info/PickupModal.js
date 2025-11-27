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
  const [fieldErrors, setFieldErrors] = useState({
    full_name: '',
    relationship: '',
    id_card_number: '',
    phone: ''
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);

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
    setFieldErrors({
      full_name: '',
      relationship: '',
      id_card_number: '',
      phone: ''
    });
    setHasSubmitted(false);
  }, [pickup, open]);

  // Validation functions
  const validateFullName = (value) => {
    if (!value) return 'Họ và tên là bắt buộc';
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) {
      return 'Họ và tên chỉ được nhập chữ cái';
    }
    return '';
  };

  const validateRelationship = (value) => {
    if (!value) return 'Quan hệ là bắt buộc';
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) {
      return 'Quan hệ chỉ được nhập chữ cái';
    }
    return '';
  };

  const validateIdCard = (value) => {
    if (!value) return 'Số CMND/CCCD là bắt buộc';
    // Loại bỏ khoảng trắng và ký tự đặc biệt
    const cleaned = value.replace(/\s+/g, '');
    if (!/^\d+$/.test(cleaned)) {
      return 'Số CMND/CCCD chỉ được nhập số';
    }
    if (cleaned.length !== 12) {
      return 'Số CMND/CCCD phải có đúng 12 số';
    }
    return '';
  };

  const validatePhone = (value) => {
    if (!value) return 'Số điện thoại là bắt buộc';
    // Loại bỏ khoảng trắng, dấu + và ký tự đặc biệt
    const cleaned = value.replace(/[\s\+\-\(\)]/g, '');
    if (!/^\d+$/.test(cleaned)) {
      return 'Số điện thoại chỉ được nhập số';
    }
    // Nếu bắt đầu bằng 84 (mã quốc gia), loại bỏ để kiểm tra số thực tế
    let phoneNumber = cleaned;
    if (cleaned.startsWith('84') && cleaned.length > 10) {
      phoneNumber = cleaned.substring(2);
    }
    // Kiểm tra độ dài (10 hoặc 11 số)
    if (phoneNumber.length === 10 || phoneNumber.length === 11) {
      return '';
    }
    return 'Số điện thoại phải có 10 hoặc 11 số';
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    
    // Cho phép nhập tự do cho tất cả các trường
    // Chỉ validate khi submit

    setFormData({
      ...formData,
      [field]: value
    });

    // Chỉ validate nếu đã submit trước đó
    if (hasSubmitted) {
      let errorMessage = '';
      if (field === 'full_name') {
        errorMessage = validateFullName(value);
      } else if (field === 'relationship') {
        errorMessage = validateRelationship(value);
      } else if (field === 'id_card_number') {
        errorMessage = validateIdCard(value);
      } else if (field === 'phone') {
        errorMessage = validatePhone(value);
      }

      setFieldErrors({
        ...fieldErrors,
        [field]: errorMessage
      });
    }
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
    setHasSubmitted(true);
    
    // Validate all fields
    const errors = {
      full_name: validateFullName(formData.full_name),
      relationship: validateRelationship(formData.relationship),
      id_card_number: validateIdCard(formData.id_card_number),
      phone: validatePhone(formData.phone)
    };

    setFieldErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      setError('Vui lòng kiểm tra lại thông tin đã nhập');
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
    setFieldErrors({
      full_name: '',
      relationship: '',
      id_card_number: '',
      phone: ''
    });
    setHasSubmitted(false);
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
                  onClick={handleRemoveAvatar}
                  startIcon={<i className="ni ni-fat-remove" />}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    border: '2px solid',
                    borderColor: '#f44336',
                    color: '#f44336',
                    '&:hover': {
                      borderColor: '#d32f2f',
                      color: '#d32f2f',
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                      borderWidth: '2px'
                    }
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
              error={!!fieldErrors.full_name}
              helperText={fieldErrors.full_name}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa',
                  '&:hover fieldset': {
                    borderColor: fieldErrors.full_name ? 'error.main' : 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: fieldErrors.full_name ? 'error.main' : 'primary.main',
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
              error={!!fieldErrors.relationship}
              helperText={fieldErrors.relationship || 'Ví dụ: Bố, Mẹ, Ông Nội, Bà Nội, Cô, Chú'}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa',
                  '&:hover fieldset': {
                    borderColor: fieldErrors.relationship ? 'error.main' : 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: fieldErrors.relationship ? 'error.main' : 'primary.main',
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
              error={!!fieldErrors.id_card_number}
              helperText={fieldErrors.id_card_number || 'Nhập đúng 12 số'}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa',
                  '&:hover fieldset': {
                    borderColor: fieldErrors.id_card_number ? 'error.main' : 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: fieldErrors.id_card_number ? 'error.main' : 'primary.main',
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
              placeholder="VD: 0900123456 hoặc 0912345678"
              error={!!fieldErrors.phone}
              helperText={fieldErrors.phone || 'Nhập 10 hoặc 11 số (VD: 0900123456)'}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa',
                  '&:hover fieldset': {
                    borderColor: fieldErrors.phone ? 'error.main' : 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: fieldErrors.phone ? 'error.main' : 'primary.main',
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

