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
import schoolAdminService from "services/schoolAdminService";

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
  onCommentDelete,
  forceShowReplies = false,
  isAdmin = false
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(forceShowReplies || false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.contents);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Số lượng replies hiển thị ban đầu (giống Facebook)
  const INITIAL_REPLIES_COUNT = 0;
  
  // Hàm đệ quy để đếm tổng số replies (bao gồm nested) từ level 2 trở đi
  const countAllReplies = (replies) => {
    if (!replies || !Array.isArray(replies)) return 0;
    let total = replies.length;
    replies.forEach(reply => {
      if (reply.replies && Array.isArray(reply.replies)) {
        total += countAllReplies(reply.replies);
      }
    });
    return total;
  };
  
  const totalRepliesCount = depth >= 0
    ? countAllReplies(comment.replies)
    : (comment.replies ? comment.replies.length : 0);
  
  const hasMoreReplies = totalRepliesCount > INITIAL_REPLIES_COUNT;
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
        
        // Khi vừa reply xong, tự động hiển thị replies để thấy reply mới
        if (parentCommentId === comment._id) {
          setShowReplies(true);
        }
        
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

  const isOwnComment = currentUserId && comment.user_id?._id && comment.user_id._id === currentUserId;
  const canEditComment = isOwnComment;
  const canDeleteComment = isAdmin || isOwnComment;

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
      const service = isAdmin ? schoolAdminService : parentService;
      const response = await service.updateComment(comment._id, editText);
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
      const service = isAdmin ? schoolAdminService : parentService;
      const response = await service.deleteComment(comment._id);
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

  const getMarginLeft = (depth) => {
    if (depth === 0) return 0;
    if (depth === 1) return 4;
    return 6;
  };

  const getAvatarSize = (depth) => {
    if (depth === 0) return { width: 32, height: 32 };
    if (depth === 1) return { width: 28, height: 28 };
    return { width: 24, height: 24 };
  };

  // Tính toán padding dựa trên depth
  // Từ depth >= 2, giảm padding để thẳng hàng
  const getPadding = (depth) => {
    if (depth === 0) return 1.5;
    if (depth === 1) return 1.5;
    // Từ depth >= 2, padding nhỏ nhất để thẳng hàng
    return 0.5;
  };

  return (
    <ArgonBox 
      mb={depth === 0 ? 2 : depth >= 2 ? 0 : 1} // Từ level 2 trở đi không có margin bottom để nút không bị đẩy xa
      p={getPadding(depth)} 
      sx={{
        animation: comment.isNew ? 'fadeInUp 0.4s ease-out' : 'none',
        '@keyframes fadeInUp': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
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
          <ArgonBox
            sx={{
              display: 'inline-block',
              maxWidth: '100%',
              backgroundColor: '#f0f2f5',
              borderRadius: '18px',
              padding: '8px 12px',
            }}
          >
            <ArgonBox display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
              <ArgonTypography variant="caption" fontWeight="bold" color="dark" fontSize="13px">
                {comment.user_id?.full_name}
              </ArgonTypography>
              {/* Hiển thị tên người được reply (giống Facebook) */}
              {comment.parent_comment_id && comment.parent_comment_id.user_id && (
                <>
                  <ArgonTypography variant="caption" color="text.secondary" fontSize="12px">
                    Trả lời
                  </ArgonTypography>
                  <ArgonTypography 
                    variant="caption" 
                    fontWeight="bold" 
                    color="info" 
                    fontSize="12px"
                    sx={{ 
                      '&:hover': { 
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      } 
                    }}
                  >
                    @{comment.parent_comment_id.user_id.full_name}
                  </ArgonTypography>
                </>
              )}
            </ArgonBox>
            {isEditing ? (
              <ArgonBox mt={0.5}>
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
                    mt: 0.5,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '13px',
                      backgroundColor: 'white',
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
                    sx={{ textTransform: 'none', fontSize: '12px', px: 2, py: 0.5 }}
                  >
                    {isUpdating ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                  <Button 
                    onClick={handleEditCancel}
                    size="small"
                    sx={{ color: '#65676b', textTransform: 'none', fontSize: '12px', px: 1.5, py: 0.5 }}
                  >
                    Hủy
                  </Button>
                </ArgonBox>
              </ArgonBox>
            ) : (
              <ArgonTypography variant="body2" color="text" sx={{ lineHeight: 1.5, fontSize: '13px', fontWeight: 400, mt: 0.5 }}>
                {comment.contents}
              </ArgonTypography>
            )}
          </ArgonBox>

          {/* Actions row: like, reply, timestamp, menu */}
          <ArgonBox display="flex" alignItems="center" gap={1.5} mt={0.75} ml={0.5}>
            {!isEditing && (
              <Button
                size="small"
                onClick={() => handleStartReply(comment)}
                sx={{
                  color: '#65676b',
                  textTransform: 'none',
                  fontSize: '12px',
                  minWidth: 'auto',
                  px: 0,
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Trả lời
              </Button>
            )}
            <ArgonTypography variant="caption" color="text.secondary" fontSize="11px">
              {new Date(comment.create_at).toLocaleString('vi-VN')}
            </ArgonTypography>
            {(canEditComment || canDeleteComment) && (
              <>
                <IconButton size="small" onClick={handleMenuOpen} sx={{ color: 'text.secondary' }}>
                  <i className="ni ni-settings-gear-65" style={{ fontSize: '14px' }} />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{ sx: { minWidth: 140, mt: 1, borderRadius: 2 } }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  {canEditComment && (
                    <>
                      <MenuItem onClick={handleEditClick} sx={{ py: 1, px: 2 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <i className="ni ni-settings-gear-65" style={{ fontSize: '16px', color: '#5e72e4' }} />
                        </ListItemIcon>
                        <ListItemText primary="Chỉnh sửa" primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }} />
                      </MenuItem>
                      {canDeleteComment && <Divider sx={{ my: 0.5 }} />}
                    </>
                  )}
                  {canDeleteComment && (
                    <MenuItem onClick={handleDeleteClick} sx={{ py: 1, px: 2 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <i className="ni ni-fat-remove" style={{ fontSize: '16px', color: '#f44336' }} />
                      </ListItemIcon>
                      <ListItemText primary="Xóa" primaryTypographyProps={{ fontSize: '13px', fontWeight: 500, color: '#f44336' }} />
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
          </ArgonBox>
        </ArgonBox>
      </ArgonBox>

      {/* Reply Form */}
      {showReplyForm && replyingTo && replyingTo._id === comment._id && (
        <ArgonBox ml={depth >= 2 ? 6 : getMarginLeft(depth) + 3} mt={1}>
          <ArgonBox display="flex" alignItems="flex-end" gap={1}>
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={4}
              placeholder={`Trả lời @${comment.user_id?.full_name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '12px',
                  backgroundColor: '#f8f9fa',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#4c63d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4c63d2',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '12px',
                  padding: '8px 12px',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  width: '100% !important',
                  minWidth: '0 !important',
                  maxWidth: 'none !important',
                  overflow: 'visible !important',
                  textOverflow: 'unset !important',
                  boxSizing: 'border-box !important',
                },
                '& .MuiOutlinedInput-input': {
                  width: '100% !important',
                  minWidth: '0 !important',
                  maxWidth: 'none !important',
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

      {/* Recursive Replies - Từ level 2 trở đi hiển thị thẳng hàng */}
      {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <ArgonBox 
          ml={depth >= 2 ? 0 : getMarginLeft(depth)} // Từ depth >= 2, container không có margin để tránh cộng dồn
          mt={depth >= 2 ? 0 : 1} // Từ level 2 trở đi không có margin top để nút không bị đẩy xa
          sx={{ 
            borderLeft: depth < 2 ? '1px solid #e4e6eb' : 'none', // Không hiển thị border từ level 2 trở đi
            pl: depth < 2 ? 2 : 0 // Không padding từ level 2 trở đi để thẳng hàng
          }}
        >
          {visibleReplies.map((reply, replyIndex) => {
            // Tính depth cho reply: từ level 2 trở đi, tất cả đều có depth = 2 để hiển thị cùng cấp
            // Level 0 → Level 1: depth = 0 + 1 = 1
            // Level 1 → Level 2: depth = 1 + 1 = 2
            // Level 2 → Level 3, 4, 5...: depth = 2 (không tăng, tất cả cùng cấp)
            const replyDepth = depth >= 1 ? 2 : depth + 1;
            
            return (
              <CommentItem
                key={reply._id || replyIndex}
                comment={reply}
                depth={replyDepth}
                onReplySuccess={onReplySuccess}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                replyLoading={replyLoading}
                setReplyLoading={setReplyLoading}
                postId={postId}
                currentUserId={currentUserId}
                onCommentUpdate={onCommentUpdate}
                onCommentDelete={onCommentDelete}
                // Từ level 2 trở đi, nếu parent hiển thị replies thì con cũng phải hiển thị
                // Hoặc nếu comment này nằm trong danh sách cần hiển thị (vừa được reply vào)
                forceShowReplies={forceShowReplies || (depth >= 1 && showReplies)}
                isAdmin={isAdmin}
              />
            );
          })}
          
          {/* Xem thêm replies - Từ level 2 trở đi chỉ hiển thị 1 nút duy nhất */}
          {/* Ở level 0, 1 (depth = 0, 1): hiển thị nút bình thường */}
          {/* Ở level 2 (depth = 1 khi render): hiển thị nút để ẩn/hiện tất cả replies (level 3, 4, 5...) */}
          {/* Từ level 3 trở đi (depth = 2 khi render): không hiển thị nút nữa (vì đã có nút ở level 2) */}
          {hasMoreReplies && depth <= 1 && (
            <ArgonBox 
              ml={0} // Không có margin riêng, vì đã có margin từ container replies
              mt={0} // Không có margin top, nút nằm sát replies
              sx={{
                position: 'relative',
                '&::before': depth < 2 ? { // Chỉ hiển thị đường line khi depth < 2
                  content: '""',
                  position: 'absolute',
                  left: '-12px',
                  top: '50%',
                  width: '2px',
                  height: '20px',
                  backgroundColor: '#e4e6ea',
                  transform: 'translateY(-50%)'
                } : {}
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
                  ? `Ẩn ${totalRepliesCount - INITIAL_REPLIES_COUNT} trả lời` 
                  : `Xem ${totalRepliesCount} trả lời`
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
  onCommentDelete: PropTypes.func,
  forceShowReplies: PropTypes.bool,
  isAdmin: PropTypes.bool
};

export default CommentItem;
