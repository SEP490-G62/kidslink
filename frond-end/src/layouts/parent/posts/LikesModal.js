/**
=========================================================
* KidsLink Parent Dashboard - Likes Modal Component
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
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Services
import parentService from "services/parentService";

function LikesModal({ 
  open, 
  onClose, 
  selectedPost 
}) {
  const [likes, setLikes] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);

  // Load likes when modal opens
  useEffect(() => {
    if (open && selectedPost) {
      loadLikes();
    }
  }, [open, selectedPost]);

  const loadLikes = async () => {
    try {
      setLikesLoading(true);
      const response = await parentService.getLikes(selectedPost.id);
      if (response.success) {
        setLikes(response.data.likes);
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    } finally {
      setLikesLoading(false);
    }
  };

  const handleClose = () => {
    setLikes([]);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
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
          <i className="ni ni-like-2" style={{ marginRight: '8px' }} />
          Người đã thích
        </ArgonTypography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {selectedPost && (
          <ArgonBox mb={3} p={2} bgcolor="rgba(102, 126, 234, 0.05)" borderRadius={2}>
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
        
        {/* Likes List */}
        <ArgonBox>
          <ArgonTypography variant="h6" fontWeight="bold" mb={3} color="dark">
            {likesLoading ? 'Đang tải...' : `Người đã thích (${likes.length})`}
          </ArgonTypography>
          
          {likesLoading ? (
            <ArgonBox display="flex" justifyContent="center" py={4}>
              <CircularProgress size={40} />
            </ArgonBox>
          ) : likes.length === 0 ? (
            <ArgonBox textAlign="center" py={6} bgcolor="rgba(0,0,0,0.02)" borderRadius={2}>
              <Icon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}>
                <i className="ni ni-like-2" />
              </Icon>
              <ArgonTypography variant="body1" color="text.secondary">
                Chưa có ai thích bài viết này
              </ArgonTypography>
            </ArgonBox>
          ) : (
            likes.map((like, index) => (
              <ArgonBox 
                key={index} 
                mb={2} 
                p={2} 
                bgcolor="rgba(248, 249, 250, 0.8)" 
                borderRadius={2}
                border="1px solid rgba(0,0,0,0.05)"
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(102, 126, 234, 0.05)',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <ArgonBox display="flex" alignItems="center">
                  <Avatar
                    src={like.user_id?.avatar_url}
                    alt={like.user_id?.full_name}
                    sx={{ 
                      width: 44, 
                      height: 44, 
                      mr: 2,
                      border: '2px solid #e3f2fd'
                    }}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="subtitle2" fontWeight="bold" color="dark">
                      {like.user_id?.full_name}
                    </ArgonTypography>
                    <ArgonTypography variant="caption" color="text.secondary">
                      @{like.user_id?.username}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </ArgonBox>
            ))
          )}
        </ArgonBox>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid #f0f0f0' }}>
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

LikesModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedPost: PropTypes.shape({
    id: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    author: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired
  })
};

export default LikesModal;
