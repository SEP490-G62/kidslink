/**
=========================================================
* KidsLink Parent Dashboard - Post Card Component
=========================================================
*/

import { useState } from "react";
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Services
import parentService from "services/parentService";

function PostCard({ 
  post, 
  currentUserId,
  onLike, 
  onComment, 
  onShowLikes, 
  onOpenGallery,
  onEditPost,
  onDeletePost
}) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user owns this post
  const isOwnPost = currentUserId && post.authorId && post.authorId === currentUserId;

  const handleLike = async () => {
    try {
      const response = await parentService.toggleLike(post.id);
      if (response.success) {
        setIsLiked(response.data.isLiked);
        setLikesCount(response.data.likeCount);
        onLike(post.id, response.data.isLiked, response.data.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    onEditPost(post);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await parentService.deletePost(post.id);
      if (response.success) {
        onDeletePost(post.id);
        setDeleteDialogOpen(false);
      } else {
        alert('Có lỗi xảy ra khi xóa bài viết: ' + (response.error || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Có lỗi xảy ra khi xóa bài viết');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    if (post.images.length === 1) {
      return (
        <img
          src={post.images[0]}
          alt={post.title}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: window.innerWidth < 600 ? '300px' : '450px',
            objectFit: 'cover',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }}
          onClick={() => onOpenGallery(post.images)}
        />
      );
    }

    if (post.images.length === 2) {
      return (
        <ArgonBox display="flex" gap={1}>
          {post.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${post.title} ${index + 1}`}
              style={{
                width: '50%',
                height: 'auto',
                maxHeight: window.innerWidth < 600 ? '200px' : '300px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                cursor: 'pointer'
              }}
              onClick={() => onOpenGallery(post.images, index)}
            />
          ))}
        </ArgonBox>
      );
    }

    if (post.images.length === 3) {
      return (
        <ArgonBox>
          <ArgonBox display="flex" gap={1} mb={1}>
            {post.images.slice(0, 2).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${post.title} ${index + 1}`}
                style={{
                  width: '50%',
                  height: 'auto',
                  maxHeight: window.innerWidth < 600 ? '150px' : '200px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => onOpenGallery(post.images, index)}
              />
            ))}
          </ArgonBox>
          <img
            src={post.images[2]}
            alt={`${post.title} 3`}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: window.innerWidth < 600 ? '150px' : '200px',
              objectFit: 'cover',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
            onClick={() => onOpenGallery(post.images, 2)}
          />
        </ArgonBox>
      );
    }

    // Four or more images: 2x2 grid with "more" indicator
    return (
      <ArgonBox>
        <ArgonBox display="flex" gap={1} mb={1}>
          {post.images.slice(0, 2).map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${post.title} ${index + 1}`}
              style={{
                width: '50%',
                height: 'auto',
                maxHeight: window.innerWidth < 600 ? '150px' : '200px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                cursor: 'pointer'
              }}
              onClick={() => onOpenGallery(post.images, index)}
            />
          ))}
        </ArgonBox>
        <ArgonBox display="flex" gap={1}>
          {post.images.slice(2, 4).map((image, index) => (
            <ArgonBox key={index} position="relative" width="50%">
              <img
                src={image}
                alt={`${post.title} ${index + 3}`}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: window.innerWidth < 600 ? '150px' : '200px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => onOpenGallery(post.images, index + 2)}
              />
              {index === 1 && post.images.length > 4 && (
                <ArgonBox
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bgcolor="rgba(0,0,0,0.7)"
                  borderRadius="12px"
                  sx={{ 
                    cursor: 'pointer',
                    backdropFilter: 'blur(2px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.8)',
                      transform: 'scale(1.02)'
                    }
                  }}
                  onClick={() => onOpenGallery(post.images, 3)}
                >
                  <ArgonTypography 
                    variant="h4" 
                    color="white" 
                    fontWeight="bold"
                    sx={{
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      fontSize: { xs: '24px', sm: '32px' }
                    }}
                  >
                    +{post.images.length - 4}
                  </ArgonTypography>
                </ArgonBox>
              )}
            </ArgonBox>
          ))}
        </ArgonBox>
      </ArgonBox>
    );
  };

  return (
    <Card 
      sx={{ 
        mb: 3, 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)',
        overflow: 'hidden',
        '&:hover': { 
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease-in-out'
        }
      }}
    >
      {/* Post Header */}
      <ArgonBox p={{ xs: 2, sm: 3 }} pb={2}>
        <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
          <ArgonBox display="flex" alignItems="center">
            <Avatar
              src={post.avatar}
              alt={post.author}
              sx={{ 
                width: { xs: 40, sm: 48 }, 
                height: { xs: 40, sm: 48 }, 
                mr: 2,
                border: '2px solid #e3f2fd',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <ArgonBox>
              <ArgonTypography 
                variant="h6" 
                fontWeight="bold" 
                color="dark" 
                mb={0.5}
                sx={{ fontSize: { xs: '14px', sm: '16px' } }}
              >
                {post.author}
              </ArgonTypography>
              <ArgonBox display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <ArgonTypography 
                  variant="caption" 
                  color="text" 
                  fontWeight="medium"
                  sx={{ fontSize: { xs: '10px', sm: '11px' } }}
                >
                  {post.date} lúc {post.time}
                </ArgonTypography>
              </ArgonBox>
            </ArgonBox>
          </ArgonBox>
          {/* Action menu for own posts */}
          {isOwnPost && (
            <>
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    color: 'primary.main'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <i className="ni ni-settings-gear-65" style={{ fontSize: '20px' }} />
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    minWidth: 180,
                    mt: 1,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {onEditPost && (
                  <MenuItem 
                    onClick={handleEditClick}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(94, 114, 228, 0.08)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <i className="ni ni-settings-gear-65" style={{ fontSize: '18px', color: '#5e72e4' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chỉnh sửa"
                      primaryTypographyProps={{
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    />
                  </MenuItem>
                )}
                
                {onDeletePost && (
                  <>
                    {onEditPost && <Divider sx={{ my: 0.5 }} />}
                    <MenuItem 
                      onClick={handleDeleteClick}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.08)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <i className="ni ni-fat-remove" style={{ fontSize: '18px', color: '#f44336' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Xóa bài viết"
                        primaryTypographyProps={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#f44336'
                        }}
                      />
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          )}
        </ArgonBox>
      </ArgonBox>

      {/* Post Content */}
      <ArgonBox px={{ xs: 2, sm: 3 }} pb={2}>
        <ArgonTypography 
          variant="body1" 
          color="dark" 
          mb={2} 
          sx={{ 
            lineHeight: 1.7,
            fontSize: { xs: '14px', sm: '15px' },
            fontWeight: 400
          }}
        >
          {post.content}
        </ArgonTypography>
      </ArgonBox>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <ArgonBox px={{ xs: 2, sm: 3 }} pb={2}>
          {renderImages()}
        </ArgonBox>
      )}

      {/* Post Actions */}
      <ArgonBox 
        px={{ xs: 2, sm: 3 }} 
        py={2} 
        borderTop="1px solid #f0f0f0"
        bgcolor="rgba(248, 249, 250, 0.5)"
      >
        <ArgonBox 
          display="flex" 
          justifyContent={{ xs: 'space-between', sm: 'space-around' }} 
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <ArgonBox display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }}>
            <Button
              startIcon={<i className="ni ni-like-2" />}
              onClick={handleLike}
              sx={{
                color: isLiked ? '#1976d2' : '#6c757d',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: { xs: 1.5, sm: 2 },
                py: 1,
                fontSize: { xs: '12px', sm: '14px' },
                '&:hover': {
                  backgroundColor: isLiked ? 'rgba(25, 118, 210, 0.08)' : 'rgba(108, 117, 125, 0.08)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Thích
            </Button>
            <Button
              onClick={() => onShowLikes(post.id)}
              sx={{
                color: '#6c757d',
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 'auto',
                px: { xs: 1, sm: 1.5 },
                py: 1,
                borderRadius: 2,
                fontSize: { xs: '12px', sm: '14px' },
                '&:hover': {
                  backgroundColor: 'rgba(108, 117, 125, 0.08)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              ({likesCount || 0})
            </Button>
          </ArgonBox>
          
          <Button
            startIcon={<i className="ni ni-chat-round" />}
            onClick={() => onComment(post.id)}
            sx={{
              color: '#6c757d',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: { xs: 1.5, sm: 2 },
              py: 1,
              fontSize: { xs: '12px', sm: '14px' },
              '&:hover': {
                backgroundColor: 'rgba(108, 117, 125, 0.08)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Bình luận ({post.comments || 0})
          </Button>
        </ArgonBox>
      </ArgonBox>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle>
          <ArgonBox display="flex" alignItems="center" gap={2}>
            <ArgonBox
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="ni ni-fat-remove" style={{ fontSize: '24px', color: '#f44336' }} />
            </ArgonBox>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
              Xác nhận xóa bài viết
            </ArgonTypography>
          </ArgonBox>
        </DialogTitle>
        
        <DialogContent>
          <ArgonTypography variant="body1" color="text" mb={2}>
            Bạn có chắc chắn muốn xóa bài viết này không?
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text.secondary">
            Hành động này không thể hoàn tác. Bài viết và tất cả dữ liệu liên quan (hình ảnh, bình luận, lượt thích) sẽ bị xóa vĩnh viễn.
          </ArgonTypography>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={isDeleting}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 'bold',
              border: '1px solid #e0e0e0',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            variant="contained"
            color="error"
            startIcon={isDeleting ? <i className="ni ni-spinner" /> : <i className="ni ni-fat-remove" />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 'bold',
              color: 'white !important',
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                color: 'white !important'
              },
              '&:disabled': {
                background: 'rgba(244, 67, 54, 0.3)',
                color: 'rgba(255, 255, 255, 0.7) !important'
              },
              '& .MuiButton-label': {
                color: 'white !important'
              }
            }}
          >
            {isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    authorId: PropTypes.string,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    images: PropTypes.array,
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    likes: PropTypes.number,
    comments: PropTypes.number,
    isLiked: PropTypes.bool
  }).isRequired,
  currentUserId: PropTypes.string,
  onLike: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onShowLikes: PropTypes.func.isRequired,
  onOpenGallery: PropTypes.func.isRequired,
  onEditPost: PropTypes.func,
  onDeletePost: PropTypes.func
};

export default PostCard;
