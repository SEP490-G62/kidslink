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
  postId
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);

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
          <ArgonBox display="flex" alignItems="center" mb={0.25}>
            <ArgonTypography variant="caption" fontWeight="bold" color="dark" fontSize="13px">
              {comment.user_id?.full_name}
            </ArgonTypography>
            <ArgonTypography variant="caption" color="text.secondary" fontSize="11px" ml={1}>
              {new Date(comment.create_at).toLocaleString('vi-VN')}
            </ArgonTypography>
          </ArgonBox>
          <ArgonTypography variant="body2" color="text" sx={{ 
            lineHeight: 1.5, 
            fontSize: '13px',
            fontWeight: 400,
            mb: 0.75
          }}>
            {comment.contents}
          </ArgonTypography>
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
          {comment.replies.map((reply, replyIndex) => (
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
        </ArgonBox>
      )}
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
  postId: PropTypes.string
};

export default CommentItem;
