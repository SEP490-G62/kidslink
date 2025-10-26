/**
=========================================================
* KidsLink Parent Dashboard - Recursive Comment Item Component
=========================================================
*/

import { useState } from "react";
import PropTypes from "prop-types";

// @mui material components
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
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

function CommentItem({ 
  comment, 
  depth = 0, 
  onReplySuccess,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  replyLoading,
  setReplyLoading,
  postId,
  currentUserId,
  onCommentUpdate,
  onCommentDelete
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.contents);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Số lượng replies hiển thị ban đầu (giống Facebook)
  const INITIAL_REPLIES_COUNT = 0;
  const hasMoreReplies = comment.replies && comment.replies.length > INITIAL_REPLIES_COUNT;
  const visibleReplies = showReplies 
    ? comment.replies 
    : (comment.replies || []).slice(0, INITIAL_REPLIES_COUNT);

  const handleStartReply = (commentToReply) => {
    setReplyingTo(commentToReply);
    setShowReplyForm(true);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
    setShowReplyForm(false);
  };

  const handleReplyComment = async (parentCommentId) => {
    if (!replyText.trim() || !postId) return;
    
    try {
      setReplyLoading(true);
      const response = await parentService.createComment(
        postId,
        replyText,
        parentCommentId
      );
      
      if (response.success) {
        setReplyText('');
        setShowReplyForm(false);
        setReplyingTo(null);
        
        // Callback để update parent component
        if (onReplySuccess) {
          onReplySuccess(response.data, parentCommentId);
        }
      }
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setReplyLoading(false);
    }
  };

  // Check if current user owns this comment
  const isOwnComment = currentUserId && comment.user_id?._id && comment.user_id._id === currentUserId;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    setIsEditing(true);
    setEditText(comment.contents);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editText.trim()) return;
    
    try {
      setIsUpdating(true);
      const response = await parentService.updateComment(comment._id, editText);
      if (response.success) {
        setIsEditing(false);
        if (onCommentUpdate) {
          onCommentUpdate(comment._id, editText);
        }
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText(comment.contents);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const response = await parentService.deleteComment(comment._id);
      if (response.success) {
        setDeleteDialogOpen(false);
        if (onCommentDelete) {
          onCommentDelete(comment._id);
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Tính toán margin left dựa trên depth
  const getMarginLeft = (depth) => {
    if (depth === 0) return 0;
    if (depth === 1) return 4;
    if (depth === 2) return 6;
    return Math.min(6 + (depth - 2) * 1, 8); // Max margin để tránh quá sâu
  };

  // Tính toán kích thước avatar dựa trên depth
  const getAvatarSize = (depth) => {
    if (depth === 0) return { width: 32, height: 32 };
    if (depth === 1) return { width: 28, height: 28 };
    return { width: 24, height: 24 };
  };

  // Tính toán padding dựa trên depth
  const getPadding = (depth) => {
    if (depth === 0) return 1.5;
    if (depth === 1) return 1.5;
    return 1;
  };

  return (
    <ArgonBox 
      mb={depth === 0 ? 2 : 1} 
      p={getPadding(depth)} 
      bgcolor={comment.isNew ? "rgba(102, 126, 234, 0.1)" : "#f0f2f5"} 
      sx={{
        borderRadius: '8px',
        backgroundColor: comment.isNew ? 'rgba(102, 126, 234, 0.1) !important' : '#f0f2f5 !important',
        animation: comment.isNew ? 'fadeInUp 0.5s ease-out' : 'none',
        '@keyframes fadeInUp': {
          '0%': {
            opacity: 0,
            transform: 'translateY(10px)',
            backgroundColor: 'rgba(102, 126, 234, 0.2)'
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
            backgroundColor: comment.isNew ? 'rgba(102, 126, 234, 0.1)' : '#f0f2f5'
          }
        }
      }}
    >
      <ArgonBox display="flex" alignItems="flex-start" mb={0.5}>
        <Avatar
          src={comment.user_id?.avatar_url}
          alt={comment.user_id?.full_name}
          sx={{ 
            ...getAvatarSize(depth),
            mr: 1.5,
            border: '1px solid #e3f2fd'
          }}
        />
        <ArgonBox flex={1}>
          <ArgonBox display="flex" alignItems="center" justifyContent="space-between" mb={0.25}>
            <ArgonBox display="flex" alignItems="center">
              <ArgonTypography variant="caption" fontWeight="bold" color="dark" fontSize="13px">
                {comment.user_id?.full_name}
              </ArgonTypography>
              <ArgonTypography variant="caption" color="text.secondary" fontSize="11px" ml={1}>
                {new Date(comment.create_at).toLocaleString('vi-VN')}
              </ArgonTypography>
            </ArgonBox>
            
            {/* Action menu for own comments */}
            {isOwnComment && (
              <>
                <IconButton
                  size="small"
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
                  <i className="ni ni-settings-gear-65" style={{ fontSize: '14px' }} />
                </IconButton>
                
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      minWidth: 140,
                      mt: 1,
                      borderRadius: 2,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      border: '1px solid rgba(0,0,0,0.05)'
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem 
                    onClick={handleEditClick}
                    sx={{
                      py: 1,
                      px: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(94, 114, 228, 0.08)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <i className="ni ni-settings-gear-65" style={{ fontSize: '16px', color: '#5e72e4' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chỉnh sửa"
                      primaryTypographyProps={{
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    />
                  </MenuItem>
                  
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem 
                    onClick={handleDeleteClick}
                    sx={{
                      py: 1,
                      px: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(244, 67, 54, 0.08)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <i className="ni ni-fat-remove" style={{ fontSize: '16px', color: '#f44336' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Xóa"
                      primaryTypographyProps={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#f44336'
                      }}
                    />
                  </MenuItem>
                </Menu>
              </>
            )}
          </ArgonBox>
          
          {/* Comment content or edit form */}
          {isEditing ? (
            <ArgonBox mb={1}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '13px',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#4c63d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4c63d2',
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '13px',
                    padding: '8px 12px',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word'
                  }
                }}
              />
              <ArgonBox display="flex" gap={1} mt={1}>
                <Button 
                  onClick={handleEditSave}
                  variant="contained"
                  disabled={!editText.trim() || isUpdating}
                  startIcon={isUpdating ? <CircularProgress size={14} color="inherit" /> : <i className="ni ni-check-bold" />}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    px: 2,
                    py: 0.5,
                    background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                    },
                    '&:disabled': {
                      background: 'rgba(76, 175, 80, 0.3)',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                >
                  {isUpdating ? 'Đang lưu...' : 'Lưu'}
                </Button>
                <Button 
                  onClick={handleEditCancel}
                  size="small"
                  sx={{
                    color: '#6c757d',
                    textTransform: 'none',
                    fontSize: '12px',
                    px: 2,
                    py: 0.5
                  }}
                >
                  Hủy
                </Button>
              </ArgonBox>
            </ArgonBox>
          ) : (
            <ArgonTypography variant="body2" color="text" sx={{ 
              lineHeight: 1.5, 
              fontSize: '13px',
              fontWeight: 400,
              mb: 0.75
            }}>
              {comment.contents}
            </ArgonTypography>
          )}
          
          {!isEditing && (
            <Button
              size="small"
              onClick={() => handleStartReply(comment)}
              sx={{
                color: '#65676b',
                textTransform: 'none',
                fontSize: '12px',
                fontWeight: '600',
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                backgroundColor: '#e4e6ea',
                borderRadius: '6px'
              }}
            >
              Trả lời
            </Button>
          )}
        </ArgonBox>
      </ArgonBox>

      {/* Reply Form */}
      {showReplyForm && replyingTo && replyingTo._id === comment._id && (
        <ArgonBox ml={getMarginLeft(depth) + 3} mt={1}>
          <ArgonBox display="flex" alignItems="flex-end" gap={1}>
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={4}
              placeholder={`Trả lời ${comment.user_id?.full_name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '12px',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#4c63d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4c63d2',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '12px',
                  padding: '8px 12px',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word'
                }
              }}
            />
            <Button 
              onClick={() => handleReplyComment(comment._id)}
              variant="contained"
              disabled={!replyText.trim() || replyLoading}
              startIcon={replyLoading ? <CircularProgress size={16} color="inherit" /> : <i className="ni ni-send" />}
              sx={{
                minWidth: 'auto',
                px: 2,
                py: 1,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '12px',
                color: 'white !important',
                background: 'linear-gradient(135deg, #4c63d2 0%, #5a4fcf 100%)',
                boxShadow: '0 3px 8px rgba(76, 99, 210, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3d52c4 0%, #4a3fc7 100%)',
                  color: 'white !important',
                  boxShadow: '0 4px 12px rgba(76, 99, 210, 0.4)'
                },
                '&:disabled': {
                  background: '#e0e0e0',
                  color: '#9e9e9e !important',
                  boxShadow: 'none'
                }
              }}
            >
              {replyLoading ? 'Gửi...' : 'Gửi'}
            </Button>
            <Button 
              onClick={handleCancelReply}
              size="small"
              sx={{
                color: '#6c757d',
                textTransform: 'none',
                minWidth: 'auto',
                px: 0.5,
                fontSize: '10px'
              }}
            >
              Hủy
            </Button>
          </ArgonBox>
        </ArgonBox>
      )}

      {/* Recursive Replies */}
      {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <ArgonBox ml={getMarginLeft(depth)} mt={1}>
          {visibleReplies.map((reply, replyIndex) => (
            <CommentItem
              key={reply._id || replyIndex}
              comment={reply}
              depth={depth + 1}
              onReplySuccess={onReplySuccess}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              replyLoading={replyLoading}
              setReplyLoading={setReplyLoading}
              postId={postId}
            />
          ))}
          
          {/* Xem thêm replies */}
          {hasMoreReplies && (
            <ArgonBox 
              ml={getMarginLeft(depth + 1)} 
              mt={1.5}
              sx={{
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '-12px',
                  top: '50%',
                  width: '2px',
                  height: '20px',
                  backgroundColor: '#e4e6ea',
                  transform: 'translateY(-50%)'
                }
              }}
            >
              <Button
                size="small"
                onClick={() => setShowReplies(!showReplies)}
                startIcon={
                  <i 
                    className={`ni ${showReplies ? 'ni-bold-up' : 'ni-bold-down'}`}
                    style={{ fontSize: '10px' }}
                  />
                }
                sx={{
                  color: '#4c63d2',
                  textTransform: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  minWidth: 'auto',
                  px: 2,
                  py: 0.8,
                  backgroundColor: 'rgba(76, 99, 210, 0.08)',
                  borderRadius: '20px',
                  border: '1px solid rgba(76, 99, 210, 0.2)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 99, 210, 0.15)',
                    color: '#3d4db8',
                    borderColor: 'rgba(76, 99, 210, 0.3)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(76, 99, 210, 0.2)'
                  },
                  '&:active': {
                    transform: 'translateY(0px)'
                  }
                }}
              >
                {showReplies 
                  ? `Ẩn ${comment.replies.length - INITIAL_REPLIES_COUNT} trả lời` 
                  : `Xem ${comment.replies.length} trả lời`
                }
              </Button>
            </ArgonBox>
          )}
        </ArgonBox>
      )}

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
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="ni ni-fat-remove" style={{ fontSize: '20px', color: '#f44336' }} />
            </ArgonBox>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
              Xác nhận xóa bình luận
            </ArgonTypography>
          </ArgonBox>
        </DialogTitle>
        
        <DialogContent>
          <ArgonTypography variant="body1" color="text" mb={2}>
            Bạn có chắc chắn muốn xóa bình luận này không?
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text.secondary">
            Hành động này không thể hoàn tác. Bình luận và tất cả phản hồi sẽ bị xóa vĩnh viễn.
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
            {isDeleting ? 'Đang xóa...' : 'Xóa bình luận'}
          </Button>
        </DialogActions>
      </Dialog>
    </ArgonBox>
  );
}

CommentItem.propTypes = {
  comment: PropTypes.object.isRequired,
  depth: PropTypes.number,
  onReplySuccess: PropTypes.func,
  replyingTo: PropTypes.object,
  setReplyingTo: PropTypes.func,
  replyText: PropTypes.string,
  setReplyText: PropTypes.func,
  replyLoading: PropTypes.bool,
  setReplyLoading: PropTypes.func,
  postId: PropTypes.string,
  currentUserId: PropTypes.string,
  onCommentUpdate: PropTypes.func,
  onCommentDelete: PropTypes.func
};

export default CommentItem;
