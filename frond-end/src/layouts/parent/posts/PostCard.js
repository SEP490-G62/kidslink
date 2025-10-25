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

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Services
import parentService from "services/parentService";

function PostCard({ 
  post, 
  onLike, 
  onComment, 
  onShowLikes, 
  onOpenGallery 
}) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);

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
                  bgcolor="rgba(0,0,0,0.6)"
                  borderRadius="12px"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onOpenGallery(post.images, 3)}
                >
                  <ArgonTypography variant="h4" color="white" fontWeight="bold">
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
    </Card>
  );
}

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
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
  onLike: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onShowLikes: PropTypes.func.isRequired,
  onOpenGallery: PropTypes.func.isRequired
};

export default PostCard;
