/**
=========================================================
* KidsLink Parent Dashboard - Comment Modal Component
=========================================================
*/

import { useState, useEffect } from "react";
import PropTypes from "prop-types";

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Services
import parentService from "services/parentService";
import schoolAdminService from "services/schoolAdminService";

// Auth context
import { useAuth } from "context/AuthContext";

// Components
import CommentItem from "./CommentItem";

function CommentModal({ 
  open, 
  onClose, 
  selectedPost, 
  onUpdateCommentCount,
  isAdmin = false
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const isReadOnly = selectedPost?.status === 'pending';
  
  // Reply comment state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  
  // Track comment IDs that should show replies after reload (vừa được reply vào)
  const [shouldShowRepliesFor, setShouldShowRepliesFor] = useState(new Set());
  
  // Reset shouldShowRepliesFor khi mở modal mới
  useEffect(() => {
    if (open) {
      setShouldShowRepliesFor(new Set());
    }
  }, [open]);

  // Load comments when modal opens
  useEffect(() => {
    if (open && selectedPost) {
      loadComments();
    }
  }, [open, selectedPost]);

  const loadComments = async () => {
    if (!selectedPost?.id) {
      console.log('❌ No post id:', selectedPost);
      return;
    }
    
    console.log('🔍 Loading comments for post:', selectedPost.id);
    try {
      const service = isAdmin ? schoolAdminService : parentService;
      // Load all comments by using a very large limit
      const response = await service.getComments(selectedPost.id, 1, 10000);
      console.log('✅ Comments response:', response);
      console.log('📝 Comments array:', response.data?.comments);
      console.log('📊 Comments count:', response.data?.comments?.length);
      if (response.success) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error('❌ Error loading comments:', error);
    }
  };

  // Helper function để tính tổng số comment (bao gồm replies và nested replies)
  const getTotalCommentCount = (comments) => {
    return comments.reduce((total, comment) => {
      let commentTotal = 1; // Main comment
      
      // Đếm replies
      if (comment.replies && Array.isArray(comment.replies)) {
        commentTotal += comment.replies.length;
        
        // Đếm nested replies (replies của replies)
        comment.replies.forEach(reply => {
          if (reply.replies && Array.isArray(reply.replies)) {
            commentTotal += reply.replies.length;
          }
        });
      }
      
      return total + commentTotal;
    }, 0);
  };

  const handleSubmitComment = async () => {
    if (isReadOnly || !newComment.trim() || !selectedPost?.id) return;
    
    try {
      setCommentLoading(true);
      const service = isAdmin ? schoolAdminService : parentService;
      const response = await service.createComment(selectedPost.id, newComment);
      if (response.success) {
        setNewComment('');
        
        // Update comment count in parent component
        onUpdateCommentCount(selectedPost?.id, 1);
        
        // Reload comments from backend to get the correct structure
        await loadComments();
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleStartReply = (comment) => {
    if (isReadOnly) return;
    setReplyingTo(comment);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const handleReplyComment = async (parentCommentId) => {
    if (isReadOnly || !replyText.trim()) return;
    
    try {
      setReplyLoading(true);
      const service = isAdmin ? schoolAdminService : parentService;
      const response = await service.createComment(selectedPost.id, replyText, parentCommentId);
      
      if (response.success) {
        setReplyText('');
        setReplyingTo(null);
        
        // Update comment count in parent component
        onUpdateCommentCount(selectedPost?.id, 1);
        
        // Add new reply to comments list immediately
        const newReply = {
          ...response.data,
          user_id: {
            full_name: "Bạn", // Tạm thời, có thể lấy từ user context
            username: "you",
            avatar_url: null
          },
          isNew: true
        };
        
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment._id === parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), { ...newReply, isNew: true }]
              };
            }
            // Kiểm tra nếu reply cho reply (nested reply)
            if (comment.replies) {
              const updatedReplies = comment.replies.map(reply => {
                if (reply._id === parentCommentId) {
                  return {
                    ...reply,
                    replies: [...(reply.replies || []), { ...newReply, isNew: true }]
                  };
                }
                return reply;
              });
              
              if (updatedReplies.some(reply => reply.replies)) {
                return {
                  ...comment,
                  replies: updatedReplies
                };
              }
            }
            return comment;
          })
        );

        // Remove isNew flag after 3 seconds
        setTimeout(() => {
          setComments(prevComments => 
            prevComments.map(comment => {
              if (comment._id === parentCommentId) {
                return {
                  ...comment,
                  replies: comment.replies.map(reply => 
                    reply._id === newReply._id ? { ...reply, isNew: false } : reply
                  )
                };
              }
              return comment;
            })
          );
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setReplyLoading(false);
    }
  };

  // Hàm đệ quy để tìm tất cả parent comment IDs của một comment
  const findAllParentIds = (comments, targetId, currentPath = []) => {
    for (const comment of comments) {
      if (comment._id === targetId) {
        // Tìm thấy target, trả về tất cả parents trong path
        return currentPath;
      }
      if (comment.replies && Array.isArray(comment.replies)) {
        // Thêm comment hiện tại vào path và tìm tiếp trong replies
        const found = findAllParentIds(comment.replies, targetId, [...currentPath, comment._id]);
        if (found !== null) {
          return found;
        }
      }
    }
    return null;
  };
  
  const handleReplySuccess = async (newReply, parentCommentId) => {
    // Update comment count in parent component
    onUpdateCommentCount(selectedPost?.id, 1);
    
    // Tìm tất cả parent comment IDs để tự động hiển thị replies
    const parentIds = findAllParentIds(comments, parentCommentId);
    const idsToShow = new Set([parentCommentId, ...(parentIds || [])]);
    setShouldShowRepliesFor(idsToShow);
    
    // Reload comments from backend to get the correct nested structure
    try {
      await loadComments();
    } catch (error) {
      console.error('Error reloading comments after reply:', error);
    }
  };

  const handleCommentUpdate = (commentId, newContent) => {
    setComments(prevComments => 
      prevComments.map(comment => {
        if (comment._id === commentId) {
          return { ...comment, contents: newContent };
        }
        // Update nested replies
        if (comment.replies) {
          const updateReplies = (replies) => {
            return replies.map(reply => {
              if (reply._id === commentId) {
                return { ...reply, contents: newContent };
              }
              if (reply.replies) {
                return { ...reply, replies: updateReplies(reply.replies) };
              }
              return reply;
            });
          };
          return { ...comment, replies: updateReplies(comment.replies) };
        }
        return comment;
      })
    );
  };

  const handleCommentDelete = (commentId) => {
    setComments(prevComments => {
      const promoteAndDelete = (nodes, parentId = null) => {
        const result = [];
        for (const node of nodes) {
          if (node._id === commentId) {
            // Promote this node's replies to this level
            if (Array.isArray(node.replies) && node.replies.length > 0) {
              // Push all children (they become siblings at this level)
              for (const child of node.replies) {
                result.push({ ...child });
              }
            }
            // Skip the node itself (deleted)
            continue;
          }
          let newNode = { ...node };
          if (Array.isArray(node.replies) && node.replies.length > 0) {
            newNode.replies = promoteAndDelete(node.replies, node._id);
          }
          result.push(newNode);
        }
        return result;
      };
      return promoteAndDelete(prevComments);
    });
    
    // Update comment count in parent component
    onUpdateCommentCount(selectedPost?.id, -1);
  };

  // Don't render if selectedPost is null
  if (!selectedPost) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
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
      <DialogTitle sx={{ 
        borderBottom: '1px solid #f0f0f0',
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #5e72e4 0%, #4c63d2 100%)',
        color: 'white'
      }}>
        <ArgonBox display="flex" alignItems="center" gap={2}>
          <ArgonBox
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="ni ni-chat-round" style={{ fontSize: '20px', color: 'white' }} />
          </ArgonBox>
          <ArgonTypography 
            variant="h6" 
            fontWeight="bold" 
            sx={{
              color: 'white !important'
            }}
          >
            Bình luận
          </ArgonTypography>
        </ArgonBox>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <i className="ni ni-fat-remove" style={{ fontSize: '20px' }} />
        </IconButton>
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
          sx={{ overflow: 'hidden' }}
        >
          {/* Scrollable Content - Post + Comments */}
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
            {/* Post Content */}
            <ArgonBox 
              p={3} 
              borderBottom="1px solid #f0f0f0"
              bgcolor="rgba(248, 249, 250, 0.5)"
            >
              <ArgonBox display="flex" alignItems="flex-start" mb={2}>
                <Avatar
                  src={selectedPost?.avatar}
                  alt={selectedPost?.author}
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    mr: 2,
                    border: '2px solid #e3f2fd'
                  }}
                />
                <ArgonBox flex={1}>
                  <ArgonBox display="flex" alignItems="center" mb={1}>
                    <ArgonTypography variant="subtitle1" fontWeight="bold" color="dark" fontSize="14px">
                      {selectedPost?.author}
                    </ArgonTypography>
                    <ArgonTypography variant="caption" color="text.secondary" fontSize="12px" ml={2}>
                      {selectedPost?.date} • {selectedPost?.time}
                  </ArgonTypography>
                  </ArgonBox>
                  <ArgonTypography 
                    variant="body2" 
                    color="text" 
                    sx={{ 
                      lineHeight: 1.6, 
                      fontSize: '14px',
                      fontWeight: 400,
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}
                  >
                    {selectedPost?.content}
                  </ArgonTypography>
                </ArgonBox>
              </ArgonBox>
            </ArgonBox>
          
            {/* Comments List */}
            <ArgonBox p={2.5}>
            <ArgonTypography variant="h6" fontWeight="bold" mb={2} color="dark">
              Bình luận ({getTotalCommentCount(comments)})
            </ArgonTypography>
            
            {comments.map((comment, index) => (
                <CommentItem
                  key={comment._id || index}
                  comment={comment}
                  depth={0}
                  onReplySuccess={handleReplySuccess}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  replyLoading={replyLoading}
                  setReplyLoading={setReplyLoading}
                  postId={selectedPost?.id}
                  currentUserId={user?.id}
                  onCommentUpdate={handleCommentUpdate}
                  onCommentDelete={handleCommentDelete}
                  forceShowReplies={shouldShowRepliesFor.has(comment._id)}
                  isAdmin={isAdmin}
                  isReadOnly={isReadOnly}
                />
              ))}
                                  </ArgonBox>
          </ArgonBox>
        </ArgonBox>
      </DialogContent>
      
      {/* Fixed Comment Input - Luôn cố định ở dưới */}
      <ArgonBox 
        p={2.5} 
        borderTop="1px solid #f0f0f0" 
        bgcolor="rgba(248, 249, 250, 0.95)"
        sx={{ 
          flexShrink: 0,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <ArgonBox display="flex" alignItems="flex-end" gap={2} width="100%">
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={8}
              placeholder="Viết bình luận..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              variant="outlined"
              size="small"
              disabled={isReadOnly || commentLoading}
              sx={{ 
                flex: 1,
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '25px',
                  backgroundColor: 'white',
                  width: '100%',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }
                },
                '& .MuiInputBase-input': {
                  width: '100% !important',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word'
                }
              }}
            />
          <Button 
            onClick={handleSubmitComment}
            variant="contained"
            disabled={isReadOnly || !newComment.trim() || commentLoading}
            startIcon={commentLoading ? <CircularProgress size={16} color="inherit" /> : <i className="ni ni-send" />}
            sx={{
              minWidth: 'auto',
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '14px',
              color: 'white !important',
              background: 'linear-gradient(135deg, #5e72e4 0%, #4c63d2 100%)',
              boxShadow: '0 4px 12px rgba(94, 114, 228, 0.3)',
              borderRadius: '25px',
              '&:hover': {
                background: 'linear-gradient(135deg, #4c63d2 0%, #3f51b5 100%)',
                color: 'white !important',
                boxShadow: '0 6px 16px rgba(94, 114, 228, 0.4)'
              },
              '&:disabled': {
                background: 'rgba(94, 114, 228, 0.3)',
                color: 'rgba(255, 255, 255, 0.7) !important',
                boxShadow: 'none'
              },
              '& .MuiSvgIcon-root': {
                color: 'white !important'
              },
              '& .ni': {
                color: 'white !important'
              },
              '& .MuiButton-startIcon': {
                color: 'white !important'
              }
            }}
          >
            {commentLoading ? 'Đang gửi...' : 'Gửi'}
          </Button>
        </ArgonBox>
        {isReadOnly && (
          <ArgonTypography variant="caption" color="text.secondary" mt={1} display="block">
            Bài viết đang chờ duyệt. Bạn chỉ có thể xem các bình luận hiện có.
          </ArgonTypography>
        )}
      </ArgonBox>
    </Dialog>
  );
}

CommentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedPost: PropTypes.shape({
    id: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    author: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    status: PropTypes.string
  }),
  onUpdateCommentCount: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool
};

export default CommentModal;
