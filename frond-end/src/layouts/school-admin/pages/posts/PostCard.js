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
import Chip from "@mui/material/Chip";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Services
import parentService from "services/parentService";
import schoolAdminService from "services/schoolAdminService";

function PostCard({ 
  post, 
  currentUserId,
  onLike, 
  onComment, 
  onShowLikes, 
  onOpenGallery,
  onEditPost,
  onDeletePost,
  onApprovePost,
  isAdmin = false
}) {
  const [isLiked, setIsLiked] = useState(post.isLiked || post.is_liked);
  const [likesCount, setLikesCount] = useState(post.like_count || post.likes_count || post.likes || 0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isPending = post.status === "pending";

  // Check if current user owns this post
  const isOwnPost = currentUserId && post.authorId && post.authorId === currentUserId;
  const deleteActionLabel = isPending ? "Từ chối bài viết" : "Xóa bài viết";
  const deleteDialogTitle = isPending ? "Xác nhận từ chối bài viết" : "Xác nhận xóa bài viết";
  const deleteDialogActionText = isDeleting ? "Đang xử lý..." : deleteActionLabel;
  const renderDeleteIcon = () => {
    if (isPending) return null;
    return <i className="ni ni-fat-remove" style={{ fontSize: '18px', color: '#f44336' }} />;
  };

  const handleLike = async () => {
    if (isPending) {
      return;
    }
    try {
      if (isAdmin) {
        const response = await schoolAdminService.toggleLike(post.id);
        if (response.success) {
          let likeCount = likesCount;
          try {
            const likesResponse = await schoolAdminService.getLikes(post.id);
            const payload = likesResponse?.data?.data || likesResponse?.data || likesResponse;
            likeCount =
              payload?.total ??
              payload?.likes?.length ??
              likesCount;
          } catch (countError) {
            console.warn('Unable to refresh like count:', countError);
          }
          const nextIsLiked =
            typeof response.isLiked !== "undefined"
              ? response.isLiked
              : typeof response.data?.isLiked !== "undefined"
                ? response.data.isLiked
                : !isLiked;
          setIsLiked(nextIsLiked);
          setLikesCount(likeCount);
          onLike(post.id, nextIsLiked, likeCount);
        }
      } else {
        const response = await parentService.toggleLike(post.id);
        if (response.success) {
          const updatedIsLiked = response.data?.isLiked ?? response.isLiked;
          const updatedLikeCount = response.data?.likeCount ?? response.likeCount ?? likesCount;
          setIsLiked(updatedIsLiked);
          setLikesCount(updatedLikeCount);
          onLike(post.id, updatedIsLiked, updatedLikeCount);
        }
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
      if (onDeletePost) {
        // Gọi hàm xóa từ props (có thể là của parent hoặc admin)
        await onDeletePost(post.id);
        setDeleteDialogOpen(false);
      } else {
        // Fallback: gọi trực tiếp parentService nếu không có onDeletePost
        const response = await parentService.deletePost(post.id);
        if (response.success) {
          setDeleteDialogOpen(false);
        } else {
          alert('Có lỗi xảy ra khi xóa bài viết: ' + (response.error || 'Lỗi không xác định'));
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Có lỗi xảy ra khi xóa bài viết: ' + (error.message || 'Không có quyền truy cập'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    const imageContainerStyle = {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'opacity 0.2s ease',
      '&:hover': {
        opacity: 0.95
      }
    };

    const imageStyle = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    };

    // 1 ảnh: Hiển thị to, tự điều chỉnh theo tỷ lệ gốc
    if (post.images.length === 1) {
      return (
        <ArgonBox
          sx={{
            ...imageContainerStyle,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            maxHeight: { xs: '500px', sm: '600px', md: '700px' },
            borderRadius: '8px',
            backgroundColor: '#f0f0f0'
          }}
          onClick={() => onOpenGallery(post.images)}
        >
          <img
            src={post.images[0]}
            alt={post.title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '8px',
              display: 'block'
            }}
          />
        </ArgonBox>
      );
    }

    // 2 ảnh: Chia đôi, cùng chiều cao
    if (post.images.length === 2) {
      return (
        <ArgonBox display="flex" gap={0.5} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
          {post.images.map((image, index) => (
            <ArgonBox
              key={index}
              sx={{
                ...imageContainerStyle,
                width: '50%',
                aspectRatio: '1 / 1'
              }}
              onClick={() => onOpenGallery(post.images, index)}
            >
              <img
                src={image}
                alt={`${post.title} ${index + 1}`}
                style={imageStyle}
              />
            </ArgonBox>
          ))}
        </ArgonBox>
      );
    }

    // 3 ảnh: 1 ảnh lớn bên trái, 2 ảnh nhỏ bên phải
    if (post.images.length === 3) {
      return (
        <ArgonBox display="flex" gap={0.5} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
          <ArgonBox
            sx={{
              ...imageContainerStyle,
              width: '50%',
              aspectRatio: '1 / 1'
            }}
            onClick={() => onOpenGallery(post.images, 0)}
          >
            <img
              src={post.images[0]}
              alt={`${post.title} 1`}
              style={imageStyle}
            />
          </ArgonBox>
          <ArgonBox sx={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {post.images.slice(1, 3).map((image, index) => (
              <ArgonBox
                key={index}
                sx={{
                  ...imageContainerStyle,
                  width: '100%',
                  aspectRatio: '1 / 1',
                  flex: 1
                }}
                onClick={() => onOpenGallery(post.images, index + 1)}
              >
                <img
                  src={image}
                  alt={`${post.title} ${index + 2}`}
                  style={imageStyle}
                />
              </ArgonBox>
            ))}
          </ArgonBox>
        </ArgonBox>
      );
    }

    // 4 ảnh: Grid 2x2
    if (post.images.length === 4) {
      return (
        <ArgonBox sx={{ borderRadius: '8px', overflow: 'hidden' }}>
          <ArgonBox display="flex" gap={0.5} mb={0.5}>
            {post.images.slice(0, 2).map((image, index) => (
              <ArgonBox
                key={index}
                sx={{
                  ...imageContainerStyle,
                  width: '50%',
                  aspectRatio: '1 / 1'
                }}
                onClick={() => onOpenGallery(post.images, index)}
              >
                <img
                  src={image}
                  alt={`${post.title} ${index + 1}`}
                  style={imageStyle}
                />
              </ArgonBox>
            ))}
          </ArgonBox>
          <ArgonBox display="flex" gap={0.5}>
            {post.images.slice(2, 4).map((image, index) => (
              <ArgonBox
                key={index}
                sx={{
                  ...imageContainerStyle,
                  width: '50%',
                  aspectRatio: '1 / 1'
                }}
                onClick={() => onOpenGallery(post.images, index + 2)}
              >
                <img
                  src={image}
                  alt={`${post.title} ${index + 3}`}
                  style={imageStyle}
                />
              </ArgonBox>
            ))}
          </ArgonBox>
        </ArgonBox>
      );
    }

    // 5+ ảnh: Grid 2x2 với overlay hiển thị số ảnh còn lại
    return (
      <ArgonBox sx={{ borderRadius: '8px', overflow: 'hidden' }}>
        <ArgonBox display="flex" gap={0.5} mb={0.5}>
          {post.images.slice(0, 2).map((image, index) => (
            <ArgonBox
              key={index}
              sx={{
                ...imageContainerStyle,
                width: '50%',
                aspectRatio: '1 / 1'
              }}
              onClick={() => onOpenGallery(post.images, index)}
            >
              <img
                src={image}
                alt={`${post.title} ${index + 1}`}
                style={imageStyle}
              />
            </ArgonBox>
          ))}
        </ArgonBox>
        <ArgonBox display="flex" gap={0.5}>
          {post.images.slice(2, 4).map((image, index) => (
            <ArgonBox
              key={index}
              sx={{
                ...imageContainerStyle,
                width: '50%',
                aspectRatio: '1 / 1',
                position: 'relative'
              }}
              onClick={() => onOpenGallery(post.images, index + 2)}
            >
              <img
                src={image}
                alt={`${post.title} ${index + 3}`}
                style={imageStyle}
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
                  bgcolor="rgba(0,0,0,0.6)"
                  sx={{
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.7)'
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenGallery(post.images, 3);
                  }}
                >
                  <ArgonTypography
                    variant="h4"
                    color="white"
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: '28px', sm: '36px' },
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)'
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

  // Kiểm tra trạng thái post
  const isApproved = post.status === 'approved';

  return (
    <Card 
      sx={{ 
        mb: 3, 
        borderRadius: 3, 
        boxShadow: isPending 
          ? '0 4px 20px rgba(255, 152, 0, 0.15)' 
          : '0 4px 20px rgba(0,0,0,0.08)',
        border: isPending 
          ? '2px solid rgba(255, 152, 0, 0.3)' 
          : '1px solid rgba(0,0,0,0.05)',
        overflow: 'hidden',
        backgroundColor: isPending ? 'rgba(255, 152, 0, 0.02)' : 'white',
        opacity: isPending ? 0.95 : 1,
        '&:hover': { 
          boxShadow: isPending
            ? '0 8px 30px rgba(255, 152, 0, 0.25)'
            : '0 8px 30px rgba(0,0,0,0.12)',
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease-in-out'
        }
      }}
    >
      {/* Post Header */}
      <ArgonBox p={{ xs: 2, sm: 3 }} pb={2}>
        <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
          <ArgonBox display="flex" alignItems="center" sx={{ flex: 1 }}>
            <Avatar
              src={post.avatar}
              alt={post.author}
              sx={{ 
                width: { xs: 40, sm: 48 }, 
                height: { xs: 40, sm: 48 }, 
                mr: 2,
                border: isPending 
                  ? '2px solid rgba(255, 152, 0, 0.4)' 
                  : '2px solid #e3f2fd',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <ArgonBox sx={{ flex: 1 }}>
              <ArgonBox display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                <ArgonTypography 
                  variant="h6" 
                  fontWeight="bold" 
                  color="dark" 
                  sx={{ fontSize: { xs: '14px', sm: '16px' } }}
                >
                  {post.author}
                </ArgonTypography>
                {/* Status Badge */}
                {isPending && (
                  <Chip
                    icon={<i className="ni ni-time-alarm" style={{ fontSize: '12px' }} />}
                    label="Đang chờ duyệt"
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '10px',
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(255, 152, 0, 0.15)',
                      color: '#f57c00',
                      border: '1px solid rgba(255, 152, 0, 0.4)',
                      '& .MuiChip-icon': {
                        color: '#f57c00',
                        marginLeft: '6px'
                      },
                      '& .MuiChip-label': {
                        paddingLeft: '4px',
                        paddingRight: '8px'
                      }
                    }}
                  />
                )}
              </ArgonBox>
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
          {/* Action menu với bánh răng */}
          {(isOwnPost || onApprovePost || onDeletePost) && (
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
                {isPending && onApprovePost && (
                  <MenuItem 
                    onClick={() => { handleMenuClose(); onApprovePost(post); }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.08)'
                      }
                    }}
                  >
                    <ListItemText 
                      primary="Duyệt bài"
                      primaryTypographyProps={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#4caf50'
                      }}
                    />
                  </MenuItem>
                )}
                {isOwnPost && onEditPost && (
                  <>
                    {isPending && onApprovePost && <Divider sx={{ my: 0.5 }} />}
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
                  </>
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
                      {!isPending && (
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {renderDeleteIcon()}
                        </ListItemIcon>
                      )}
                      <ListItemText 
                        primary={deleteActionLabel}
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
              disabled={isPending}
              title={isPending ? "Bài viết đang chờ duyệt" : "Thích bài viết"}
              sx={{
                color: isLiked ? '#1976d2' : '#6c757d',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: { xs: 1.5, sm: 2 },
                py: 1,
                fontSize: { xs: '12px', sm: '14px' },
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.6 : 1,
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
            title={isPending ? "Bài viết đang chờ duyệt - chỉ xem bình luận" : "Bình luận về bài viết"}
            sx={{
              color: '#6c757d',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: { xs: 1.5, sm: 2 },
              py: 1,
              fontSize: { xs: '12px', sm: '14px' },
              cursor: 'pointer',
              opacity: isPending ? 0.85 : 1,
              '&:hover': {
                backgroundColor: 'rgba(108, 117, 125, 0.08)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Bình luận ({post.comment_count || post.comments_count || post.comments || 0})
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
            {!isPending && (
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
            )}
            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
              {deleteDialogTitle}
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
            startIcon={
              isDeleting
                ? <i className="ni ni-spinner" />
                : isPending
                  ? null
                  : <i className="ni ni-fat-remove" />
            }
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
            {deleteDialogActionText}
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
    like_count: PropTypes.number,
    likes_count: PropTypes.number,
    comments: PropTypes.number,
    comment_count: PropTypes.number,
    comments_count: PropTypes.number,
    isLiked: PropTypes.bool,
    is_liked: PropTypes.bool,
    status: PropTypes.string
  }).isRequired,
  currentUserId: PropTypes.string,
  onLike: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onShowLikes: PropTypes.func.isRequired,
  onOpenGallery: PropTypes.func.isRequired,
  onEditPost: PropTypes.func,
  onDeletePost: PropTypes.func,
  onApprovePost: PropTypes.func,
  isAdmin: PropTypes.bool
};

export default PostCard;
