/**
=========================================================
* KidsLink Parent Dashboard - Posts Feed Component
=========================================================
*/

import { useState, useEffect } from "react";
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Post components
import PostCard from "./PostCard";
import CommentModal from "./CommentModal";
import LikesModal from "./LikesModal";
import GalleryModal from "./GalleryModal";

// Services
import parentService from "services/parentService";

function PostsFeed({ 
  activeTab, 
  tabs, 
  posts: propPosts,
  onUpdateCommentCount 
}) {
  const [posts, setPosts] = useState(propPosts || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update posts when propPosts changes
  useEffect(() => {
    if (propPosts) {
      setPosts(propPosts);
    }
  }, [propPosts]);
  
  // Modal states
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Posts are now passed as props from parent component

  const getFilteredPosts = () => {
    let filtered = posts;
    
    // Filter by tab
    if (activeTab > 0) {
      const filterValue = tabs[activeTab].value;
      filtered = filtered.filter(post => post.authorRole === filterValue);
    }
    
    return filtered;
  };

  const handleLike = (postId, isLiked, likeCount) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: isLiked,
              likes: likeCount 
            }
          : post
      )
    );
  };

  const handleComment = async (postId) => {
    try {
      setSelectedPost(posts.find(p => p.id === postId));
      setCommentModalOpen(true);
    } catch (error) {
      console.error('Error opening comment modal:', error);
    }
  };

  const handleShowLikes = async (postId) => {
    try {
      setSelectedPost(posts.find(p => p.id === postId));
      setLikesModalOpen(true);
    } catch (error) {
      console.error('Error opening likes modal:', error);
    }
  };

  const handleOpenGallery = (images, startIndex = 0) => {
    setGalleryImages(images);
    setCurrentImageIndex(startIndex);
    setGalleryModalOpen(true);
  };

  const handleUpdateCommentCount = (postId, increment) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, comments: post.comments + increment }
          : post
      )
    );
  };

  const handleCloseCommentModal = () => {
    setCommentModalOpen(false);
    setSelectedPost(null);
  };

  const handleCloseLikesModal = () => {
    setLikesModalOpen(false);
    setSelectedPost(null);
  };

  const handleCloseGallery = () => {
    setGalleryModalOpen(false);
    setGalleryImages([]);
    setCurrentImageIndex(0);
  };

  return (
    <>
      <ArgonBox 
        maxWidth={{ xs: '100%', sm: '600px', md: '700px' }} 
        mx="auto"
        px={{ xs: 1, sm: 2 }}
      >
        {/* Loading State */}
        {loading && (
          <Card sx={{ 
            p: { xs: 4, sm: 6 }, 
            textAlign: 'center', 
            borderRadius: 3,
            boxShadow: 2,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}>
            <CircularProgress size={{ xs: 32, sm: 40 }} sx={{ mb: 2 }} />
            <ArgonTypography variant="h6" color="text" mb={1} fontWeight="bold">
              Đang tải bài viết...
            </ArgonTypography>
            <ArgonTypography variant="body2" color="text">
              Vui lòng chờ trong giây lát
            </ArgonTypography>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card sx={{ 
            p: { xs: 4, sm: 6 }, 
            textAlign: 'center', 
            borderRadius: 3,
            boxShadow: 2,
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
          }}>
            <Icon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'error.main', mb: 2 }}>
              <i className="ni ni-notification-70" />
            </Icon>
            <ArgonTypography variant="h6" color="error" mb={1} fontWeight="bold">
              Có lỗi xảy ra
            </ArgonTypography>
            <ArgonTypography variant="body2" color="text" mb={3}>
              {error}
            </ArgonTypography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => window.location.reload()}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              Thử lại
            </Button>
          </Card>
        )}

        {/* Posts List */}
        {!loading && !error && getFilteredPosts().map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onShowLikes={handleShowLikes}
            onOpenGallery={handleOpenGallery}
          />
        ))}

        {/* No Posts Message */}
        {!loading && !error && getFilteredPosts().length === 0 && (
          <Card sx={{ 
            p: { xs: 4, sm: 6 }, 
            textAlign: 'center', 
            borderRadius: 3,
            boxShadow: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <Icon sx={{ fontSize: { xs: 48, sm: 64 }, mb: 2, opacity: 0.8 }}>
              <i className="ni ni-paper-diploma" />
            </Icon>
            <ArgonTypography 
              variant="h5" 
              fontWeight="bold" 
              mb={2} 
              color="white"
              sx={{ fontSize: { xs: '18px', sm: '24px' } }}
            >
              Không có bài viết nào
            </ArgonTypography>
            <ArgonTypography 
              variant="body1" 
              color="rgba(255,255,255,0.8)"
              sx={{ fontSize: { xs: '14px', sm: '16px' } }}
            >
              Chưa có bài viết nào trong danh mục này
            </ArgonTypography>
          </Card>
        )}
      </ArgonBox>

      {/* Modals */}
      <CommentModal
        open={commentModalOpen}
        onClose={handleCloseCommentModal}
        selectedPost={selectedPost}
        onUpdateCommentCount={handleUpdateCommentCount}
      />

      <LikesModal
        open={likesModalOpen}
        onClose={handleCloseLikesModal}
        selectedPost={selectedPost}
      />

      <GalleryModal
        open={galleryModalOpen}
        onClose={handleCloseGallery}
        images={galleryImages}
        currentIndex={currentImageIndex}
      />
    </>
  );
}

PostsFeed.propTypes = {
  activeTab: PropTypes.number.isRequired,
  tabs: PropTypes.array.isRequired,
  posts: PropTypes.array,
  onUpdateCommentCount: PropTypes.func.isRequired
};

export default PostsFeed;
