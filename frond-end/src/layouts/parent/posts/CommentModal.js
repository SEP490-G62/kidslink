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

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Services
import parentService from "services/parentService";

function CommentModal({ 
  open, 
  onClose, 
  selectedPost, 
  onUpdateCommentCount 
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Reply comment state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Load comments when modal opens
  useEffect(() => {
    if (open && selectedPost) {
      loadComments();
    }
  }, [open, selectedPost]);

  const loadComments = async () => {
    try {
      const response = await parentService.getComments(selectedPost.id);
      if (response.success) {
        console.log('Loaded comments from API:', response.data.comments);
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
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
    if (!newComment.trim() || !selectedPost) return;
    
    try {
      setCommentLoading(true);
      const response = await parentService.createComment(selectedPost.id, newComment);
      if (response.success) {
        setNewComment('');
        
        // Update comment count in parent component
        onUpdateCommentCount(selectedPost.id, 1);
        
        // Add new comment to comments list immediately
        const newCommentData = {
          ...response.data,
          user_id: {
            full_name: "Bạn", // Tạm thời, có thể lấy từ user context
            username: "you",
            avatar_url: null
          },
          isNew: true
        };
        
        setComments(prevComments => [newCommentData, ...prevComments]);
        
        // Remove isNew flag sau 3 giây
        setTimeout(() => {
          setComments(prevComments =>
            prevComments.map(comment =>
              comment._id === newCommentData._id ? { ...comment, isNew: false } : comment
            )
          );
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReplyComment = async (parentCommentId) => {
    if (!replyText.trim() || !selectedPost) return;
    
    try {
      setReplyLoading(true);
      const response = await parentService.createComment(selectedPost.id, replyText, parentCommentId);
      if (response.success) {
        // Tạo reply object mới
        const newReply = {
          _id: response.data._id,
          contents: replyText,
          create_at: new Date().toISOString(),
          user_id: {
            full_name: "Bạn", // Tạm thời, có thể lấy từ user context
            username: "you",
            avatar_url: null
          }
        };

        // Cập nhật comments state để thêm reply ngay lập tức
        setComments(prevComments => 
          prevComments.map(comment => {
            // Kiểm tra nếu reply cho main comment
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

        // Remove isNew flag sau 3 giây
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

        setReplyText('');
        setReplyingTo(null);
        
        // Update comment count in parent component
        onUpdateCommentCount(selectedPost.id, 1);
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleStartReply = (comment) => {
    setReplyingTo(comment);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const handleClose = () => {
    setComments([]);
    setNewComment('');
    setReplyingTo(null);
    setReplyText('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #f0f0f0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <ArgonTypography variant="h5" fontWeight="bold" color="white">
          <i className="ni ni-chat-round" style={{ marginRight: '8px' }} />
          Bình luận
        </ArgonTypography>
      </DialogTitle>
      
      <DialogContent sx={{ 
        flex: 1, 
        overflow: 'hidden',
        p: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Scrollable Content Container */}
        <ArgonBox flex={1} overflow="auto" display="flex" flexDirection="column">
          {selectedPost && (
            <ArgonBox p={3} borderBottom="1px solid #f0f0f0" bgcolor="rgba(102, 126, 234, 0.05)" flexShrink={0}>
              <ArgonBox display="flex" alignItems="center" mb={2}>
                <Avatar
                  src={selectedPost.avatar}
                  alt={selectedPost.author}
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    mr: 2,
                    border: '2px solid #667eea'
                  }}
                />
                <ArgonBox>
                  <ArgonTypography variant="subtitle2" fontWeight="bold" color="dark">
                    {selectedPost.author}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" color="text">
                    {selectedPost.date} lúc {selectedPost.time}
                  </ArgonTypography>
                </ArgonBox>
              </ArgonBox>
              <ArgonTypography variant="body2" color="text" sx={{ lineHeight: 1.6 }}>
                {selectedPost.content}
              </ArgonTypography>
            </ArgonBox>
          )}
          
          {/* Comments List - Scrollable */}
          <ArgonBox flex={1} p={3}>
            <ArgonTypography variant="h6" fontWeight="bold" mb={3} color="dark">
              Bình luận ({getTotalCommentCount(comments)})
            </ArgonTypography>
            
            {comments.map((comment, index) => (
              <ArgonBox key={index} mb={2}>
                {/* Main Comment */}
                <ArgonBox 
                  p={2} 
                  bgcolor="#f0f2f5" 
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: '#f0f2f5 !important'
                  }}
                >
                  <ArgonBox display="flex" alignItems="flex-start" mb={1}>
                    <Avatar
                      src={comment.user_id?.avatar_url}
                      alt={comment.user_id?.full_name}
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 2,
                        border: '1px solid #e3f2fd'
                      }}
                    />
                    <ArgonBox flex={1}>
                      <ArgonBox display="flex" alignItems="center" mb={0.5}>
                        <ArgonTypography variant="subtitle2" fontWeight="bold" color="dark" fontSize="13px">
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
                        mb: 1
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
                </ArgonBox>

                {/* Reply Input */}
                {replyingTo && replyingTo._id === comment._id && (
                  <ArgonBox 
                    ml={4} 
                    mt={1} 
                    p={2} 
                    bgcolor="rgba(102, 126, 234, 0.05)"
                  >
                    <ArgonBox display="flex" alignItems="center" mb={1}>
                      <ArgonBox 
                        width={1.5} 
                        height={1.5} 
                        bgcolor="#667eea" 
                        mr={1}
                      />
                      <ArgonTypography variant="caption" color="text.secondary" fontSize="11px" fontWeight="600">
                        Trả lời {comment.user_id?.full_name}:
                      </ArgonTypography>
                    </ArgonBox>
                    <ArgonBox display="flex" alignItems="flex-end" gap={1} width="100%">
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={6}
                        placeholder="Viết trả lời..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          flex: 1,
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            fontSize: '13px',
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
                        {replyLoading ? 'Đang gửi...' : 'Gửi'}
                      </Button>
                      <Button 
                        onClick={handleCancelReply}
                        size="small"
                        sx={{
                          color: '#6c757d',
                          textTransform: 'none',
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          fontSize: '11px',
                          '&:hover': {
                            color: '#d32f2f',
                            backgroundColor: 'rgba(211, 47, 47, 0.08)'
                          }
                        }}
                      >
                        Hủy
                      </Button>
                    </ArgonBox>
                  </ArgonBox>
                )}

                {/* Nested Replies */}
                {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
                  <ArgonBox ml={4} mt={1}>
                    {comment.replies.map((reply, replyIndex) => (
                      <ArgonBox 
                        key={reply._id || replyIndex} 
                        mb={1} 
                        p={1.5} 
                        bgcolor={reply.isNew ? "rgba(102, 126, 234, 0.1)" : "#f0f2f5"} 
                        sx={{
                          borderRadius: '8px',
                          backgroundColor: reply.isNew ? 'rgba(102, 126, 234, 0.1) !important' : '#f0f2f5 !important',
                          animation: reply.isNew ? 'fadeInUp 0.5s ease-out' : 'none',
                          '@keyframes fadeInUp': {
                            '0%': {
                              opacity: 0,
                              transform: 'translateY(10px)',
                              backgroundColor: 'rgba(102, 126, 234, 0.2)'
                            },
                            '50%': {
                              backgroundColor: 'rgba(102, 126, 234, 0.15)'
                            },
                            '100%': {
                              opacity: 1,
                              transform: 'translateY(0)',
                              backgroundColor: 'rgba(102, 126, 234, 0.1)'
                            }
                          }
                        }}
                      >
                        <ArgonBox display="flex" alignItems="flex-start" mb={0.5}>
                          <Avatar
                            src={reply.user_id?.avatar_url}
                            alt={reply.user_id?.full_name}
                            sx={{ 
                              width: 28, 
                              height: 28, 
                              mr: 1.5,
                              border: '1px solid #e3f2fd'
                            }}
                          />
                          <ArgonBox flex={1}>
                            <ArgonBox display="flex" alignItems="center" mb={0.25}>
                              <ArgonTypography variant="caption" fontWeight="bold" color="dark" fontSize="13px">
                                {reply.user_id?.full_name}
                              </ArgonTypography>
                              <ArgonTypography variant="caption" color="text.secondary" fontSize="11px" ml={1}>
                                {new Date(reply.create_at).toLocaleString('vi-VN')}
                              </ArgonTypography>
                            </ArgonBox>
                            <ArgonTypography variant="body2" color="text" sx={{ 
                              lineHeight: 1.5, 
                              fontSize: '13px',
                              fontWeight: 400,
                              mb: 0.75
                            }}>
                              {reply.contents}
                            </ArgonTypography>
                            <Button
                              size="small"
                              onClick={() => handleStartReply(reply)}
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

                        {/* Nested Replies (replies của replies) */}
                        {reply.replies && Array.isArray(reply.replies) && reply.replies.length > 0 && (
                          <ArgonBox ml={3} mt={1}>
                            {reply.replies.map((nestedReply, nestedIndex) => (
                              <ArgonBox 
                                key={nestedReply._id || nestedIndex} 
                                mb={0.75} 
                                p={1} 
                                bgcolor={nestedReply.isNew ? "rgba(102, 126, 234, 0.08)" : "#f0f2f5"} 
                                sx={{
                                  borderRadius: '8px',
                                  backgroundColor: nestedReply.isNew ? 'rgba(102, 126, 234, 0.08) !important' : '#f0f2f5 !important',
                                  animation: nestedReply.isNew ? 'fadeInUp 0.5s ease-out' : 'none',
                                  '@keyframes fadeInUp': {
                                    '0%': {
                                      opacity: 0,
                                      transform: 'translateY(5px)',
                                      backgroundColor: 'rgba(102, 126, 234, 0.2)'
                                    },
                                    '100%': {
                                      opacity: 1,
                                      transform: 'translateY(0)',
                                      backgroundColor: 'rgba(102, 126, 234, 0.08)'
                                    }
                                  }
                                }}
                              >
                                <ArgonBox display="flex" alignItems="flex-start" mb={0.25}>
                                  <Avatar
                                    src={nestedReply.user_id?.avatar_url}
                                    alt={nestedReply.user_id?.full_name}
                                    sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      mr: 1,
                                      border: '1px solid #e3f2fd'
                                    }}
                                  />
                                  <ArgonBox flex={1}>
                                    <ArgonBox display="flex" alignItems="center" mb={0.25}>
                                      <ArgonTypography variant="caption" fontWeight="bold" color="dark" fontSize="13px">
                                        {nestedReply.user_id?.full_name}
                                      </ArgonTypography>
                                      <ArgonTypography variant="caption" color="text.secondary" fontSize="11px" ml={1}>
                                        {new Date(nestedReply.create_at).toLocaleString('vi-VN')}
                                      </ArgonTypography>
                                    </ArgonBox>
                                    <ArgonTypography variant="body2" color="text" sx={{ 
                                      lineHeight: 1.5, 
                                      fontSize: '13px',
                                      fontWeight: 400,
                                      mb: 0.5
                                    }}>
                                      {nestedReply.contents}
                                    </ArgonTypography>
                                    <Button
                                      size="small"
                                      onClick={() => handleStartReply(nestedReply)}
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
                              </ArgonBox>
                            ))}
                          </ArgonBox>
                        )}

                        {/* Reply Input cho nested replies */}
                        {replyingTo && replyingTo._id === reply._id && (
                          <ArgonBox 
                            ml={3} 
                            mt={1} 
                            p={1.5} 
                            bgcolor="rgba(102, 126, 234, 0.05)" 
                            borderRadius={1.5}
                            border="1px solid rgba(102, 126, 234, 0.2)"
                          >
                            <ArgonTypography variant="caption" color="text.secondary" mb={0.5} fontSize="10px">
                              Trả lời {reply.user_id?.full_name}:
                            </ArgonTypography>
                            <ArgonBox display="flex" alignItems="flex-end" gap={0.5} width="100%">
                              <TextField
                                fullWidth
                                multiline
                                minRows={1}
                                maxRows={4}
                                placeholder="Viết trả lời..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                variant="outlined"
                                size="small"
                                sx={{ 
                                  flex: 1,
                                  width: '100%',
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '15px',
                                    backgroundColor: 'white',
                                    fontSize: '12px',
                                    width: '100%'
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
                                onClick={() => handleReplyComment(reply._id)}
                                variant="contained"
                                disabled={!replyText.trim() || replyLoading}
                                startIcon={replyLoading ? <CircularProgress size={12} /> : <i className="ni ni-send" />}
                                sx={{
                                  borderRadius: '15px',
                                  minWidth: 'auto',
                                  px: 1.5,
                                  py: 0.5,
                                  textTransform: 'none',
                                  fontWeight: 'bold',
                                  fontSize: '10px',
                                  color: 'white !important',
                                  background: 'linear-gradient(135deg, #4c63d2 0%, #5a4fcf 100%)',
                                  boxShadow: '0 2px 6px rgba(76, 99, 210, 0.3)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #3d52c4 0%, #4a3fc7 100%)',
                                    color: 'white !important',
                                    boxShadow: '0 3px 8px rgba(76, 99, 210, 0.4)'
                                  },
                                  '&:disabled': {
                                    background: '#e0e0e0',
                                    color: '#9e9e9e !important',
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
                      </ArgonBox>
                    ))}
                  </ArgonBox>
                )}
              </ArgonBox>
            ))}
          </ArgonBox>
        </ArgonBox>
      </DialogContent>
      
      {/* Fixed Comment Input - Luôn cố định ở dưới */}
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
            disabled={!newComment.trim() || commentLoading}
            startIcon={commentLoading ? <CircularProgress size={16} color="inherit" /> : <i className="ni ni-send" />}
            sx={{
              borderRadius: '25px',
              minWidth: 'auto',
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 'bold',
              color: 'white !important',
              background: 'linear-gradient(135deg, #4c63d2 0%, #5a4fcf 100%)',
              boxShadow: '0 4px 12px rgba(76, 99, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #3d52c4 0%, #4a3fc7 100%)',
                color: 'white !important',
                transform: 'scale(1.05)',
                boxShadow: '0 6px 16px rgba(76, 99, 210, 0.4)'
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#9e9e9e !important',
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
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {commentLoading ? 'Đang gửi...' : 'Gửi'}
          </Button>
        </ArgonBox>
      </ArgonBox>
      
      <DialogActions sx={{ 
        borderTop: '1px solid #f0f0f0',
        p: 3,
        bgcolor: 'rgba(248, 249, 250, 0.5)'
      }}>
        <Button 
          onClick={handleClose}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Đóng
        </Button>
      </DialogActions>
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
    content: PropTypes.string.isRequired
  }),
  onUpdateCommentCount: PropTypes.func.isRequired
};

export default CommentModal;
