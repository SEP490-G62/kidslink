/**
=========================================================
* KidsLink Teacher Dashboard - Create Post Modal Component
=========================================================
*/

import React, { useState } from "react";
import PropTypes from "prop-types";

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Services
import teacherService from "services/teacherService";
import { useAuth } from "context/AuthContext";

function CreatePostModal({ open, onClose, onPostCreated, post = null }) {
  const { user } = useAuth();
  const isEditMode = !!post;
  
  // Initialize state from post prop or empty
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update state when post changes (for editing)
  React.useEffect(() => {
    if (post) {
      setContent(post.content || "");
      const postImages = post.images || [];
      setImages(postImages);
      setImagePreviews(postImages);
    } else {
      setContent("");
      setImages([]);
      setImagePreviews([]);
    }
    setError("");
  }, [post]);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);

    const fileReaders = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileReaders).then((results) => {
      const newImages = [...images, ...results];
      const newPreviews = [...imagePreviews, ...results];
      setImages(newImages);
      setImagePreviews(newPreviews);
    });
  };

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Vui lòng nhập nội dung bài viết");
      return;
    }

    // Removed image limit - allow unlimited images

    setLoading(true);

    try {
      if (isEditMode) {
        const result = await teacherService.updatePost(post._id, content, images);
        if (result.success) {
          onPostCreated(result.data);
          handleCloseModal();
        } else {
          setError(result.error || "Có lỗi xảy ra khi cập nhật bài viết");
        }
      } else {
        // Teacher không cần selectedChild, backend sẽ tự động lấy lớp của giáo viên
        const result = await teacherService.createPost(content, images);
        if (result.success) {
          onPostCreated(result.data);
          handleCloseModal();
        } else {
          setError(result.error || "Có lỗi xảy ra khi tạo bài viết");
        }
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setContent("");
    setImages([]);
    setImagePreviews([]);
    setError("");
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCloseModal}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '800px',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle>
        <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
          <ArgonBox display="flex" alignItems="center" gap={2}>
            <ArgonBox
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: isEditMode 
                  ? 'rgba(94, 114, 228, 0.1)' 
                  : 'rgba(76, 175, 80, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i 
                className={isEditMode ? "ni ni-settings-gear-65" : "ni ni-fat-add"} 
                style={{ 
                  fontSize: '24px', 
                  color: isEditMode ? '#5e72e4' : '#4caf50' 
                }} 
              />
            </ArgonBox>
            <ArgonBox>
              <ArgonTypography variant="h5" fontWeight="bold" color="dark">
                {isEditMode ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
              </ArgonTypography>
              <ArgonTypography variant="body2" color="text.secondary">
                {isEditMode 
                  ? "Cập nhật nội dung và hình ảnh của bài viết" 
                  : "Chia sẻ điều gì đó với cộng đồng"
                }
              </ArgonTypography>
            </ArgonBox>
          </ArgonBox>
          <IconButton 
            onClick={handleCloseModal}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: 'error.main'
              }
            }}
          >
            <i className="ni ni-fat-remove" style={{ fontSize: '24px' }} />
          </IconButton>
        </ArgonBox>
      </DialogTitle>
      
      <DialogContent sx={{ 
        flex: 1, 
        overflow: 'hidden',
        p: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <ArgonBox 
          display="flex" 
          flexDirection="column" 
          height="100%"
          sx={{ overflow: 'hidden', p: 3 }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Scrollable Content */}
          <ArgonBox 
            flex={1}
            sx={{
              overflowY: 'auto',
              overflowX: 'hidden',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '3px',
                '&:hover': {
                  background: '#a8a8a8',
                },
              },
            }}
          >
            {/* Content */}
            <ArgonBox mb={2}>
              <ArgonTypography variant="body2" fontWeight="bold" mb={1}>
                Nội dung bài viết
              </ArgonTypography>
              <TextField
                fullWidth
                multiline
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isEditMode ? "Cập nhật nội dung bài viết..." : "Chia sẻ điều gì đó với cộng đồng..."}
                error={!!error}
                helperText={error || (isEditMode ? "Chỉnh sửa nội dung bài viết của bạn" : "Viết nội dung bài viết mới")}
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
            </ArgonBox>

            {/* Image Upload */}
            <ArgonBox mb={2}>
              <ArgonTypography variant="body2" fontWeight="bold" mb={1}>
                Thêm ảnh ({images.length})
              </ArgonTypography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<i className="ni ni-image" />}
                sx={{ 
                  borderRadius: 2, 
                  py: 1.5,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark'
                  }
                }}
              >
                Chọn ảnh
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
            </ArgonBox>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <ArgonBox mb={2}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {imagePreviews.map((preview, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 100,
                        height: 100,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '2px solid #e0e0e0'
                      }}
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <IconButton
                        onClick={() => handleRemoveImage(index)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.7)'
                          }
                        }}
                        size="small"
                      >
                        <i className="ni ni-fat-remove" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </ArgonBox>
            )}
          </ArgonBox>

          </form>
        </ArgonBox>
      </DialogContent>
      
      {/* Fixed Submit Button - Luôn cố định ở dưới */}
      <ArgonBox 
        p={3} 
        borderTop="1px solid #f0f0f0" 
        bgcolor="rgba(248, 249, 250, 0.95)"
        sx={{ 
          flexShrink: 0,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <ArgonBox display="flex" gap={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={handleCloseModal}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 'bold',
              border: '1px solid #e0e0e0',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderColor: 'text.secondary'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            onClick={handleSubmit}
            startIcon={loading ? <CircularProgress size={20} /> : (isEditMode ? <i className="ni ni-settings-gear-65" /> : <i className="ni ni-fat-add" />)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 'bold',
              color: 'white !important',
              background: isEditMode 
                ? 'linear-gradient(135deg, #5e72e4 0%, #4c63d2 100%)'
                : 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
              '&:hover': {
                background: isEditMode 
                  ? 'linear-gradient(135deg, #4c63d2 0%, #3f51b5 100%)'
                  : 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                color: 'white !important'
              },
              '&:disabled': {
                background: isEditMode 
                  ? 'rgba(94, 114, 228, 0.3)'
                  : 'rgba(76, 175, 80, 0.3)',
                color: 'rgba(255, 255, 255, 0.7) !important'
              },
              '& .MuiButton-label': {
                color: 'white !important'
              }
            }}
          >
            {loading 
              ? (isEditMode ? "Đang cập nhật..." : "Đang đăng...") 
              : (isEditMode ? "Cập nhật bài viết" : "Đăng bài viết")
            }
          </Button>
        </ArgonBox>
      </ArgonBox>
    </Dialog>
  );
}

CreatePostModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPostCreated: PropTypes.func.isRequired,
  post: PropTypes.object
};

export default CreatePostModal;

