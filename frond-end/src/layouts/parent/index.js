/**
=========================================================
* KidsLink Parent Dashboard - Parent Layout
=========================================================
*/

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DetailedStatisticsCard from "examples/Cards/StatisticsCards/DetailedStatisticsCard";

// Argon Dashboard 2 MUI base styles
import typography from "assets/theme/base/typography";

// Parent layout components
import QuickActions from "layouts/parent/components/QuickActions";
import UpcomingEvents from "layouts/parent/components/UpcomingEvents";

// Services
import parentService from "services/parentService";

function ParentDashboard() {
  const { size } = typography;
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Comment modal state
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Likes modal state
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [likes, setLikes] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);
  
  // Image gallery modal state
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await parentService.getAllPosts();
        
        if (result.success) {
          // Transform API data to match component structure
          const transformedPosts = result.data.data.map(post => ({
            id: post._id,
            title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
            content: post.content,
            author: post.user_id.full_name,
            authorRole: post.user_id.role === 'school_admin' ? 'school' : post.user_id.role,
            avatar: post.user_id.avatar_url,
            images: post.images || [],
            image: post.images && post.images.length > 0 ? post.images[0] : null,
            date: new Date(post.create_at).toLocaleDateString('vi-VN'),
            time: new Date(post.create_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            category: post.class_id ? post.class_id.class_name : 'Chung',
            likes: post.like_count,
            comments: post.comment_count,
            isLiked: post.is_liked
          }));
          
          setPosts(transformedPosts);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Có lỗi xảy ra khi tải bài viết');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const tabs = [
    { label: "Tất cả", value: "all", count: posts.length },
    { label: "Trường", value: "school", count: posts.filter(p => p.authorRole === "school").length },
    { label: "Lớp", value: "teacher", count: posts.filter(p => p.authorRole === "teacher").length },
    { label: "Phụ huynh", value: "parent", count: posts.filter(p => p.authorRole === "parent").length }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getFilteredPosts = () => {
    let filtered = posts;
    
    // Filter by tab
    if (activeTab > 0) {
      const filterValue = tabs[activeTab].value;
      filtered = filtered.filter(post => post.authorRole === filterValue);
    }
    
    return filtered;
  };

  const handleLike = async (postId) => {
    try {
      const response = await parentService.toggleLike(postId);
      if (response.success) {
        // Cập nhật state của post
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  isLiked: response.data.isLiked,
                  likes: response.data.likeCount 
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (postId) => {
    try {
      setSelectedPost(posts.find(p => p.id === postId));
      setCommentModalOpen(true);
      
      // Load comments for this post
      const response = await parentService.getComments(postId);
      if (response.success) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    
    try {
      setCommentLoading(true);
      const response = await parentService.createComment(selectedPost.id, newComment);
      if (response.success) {
        setNewComment('');
        // Reload comments
        const commentsResponse = await parentService.getComments(selectedPost.id);
        if (commentsResponse.success) {
          setComments(commentsResponse.data.comments);
        }
        // Update comment count in posts
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === selectedPost.id 
              ? { ...post, comments: post.comments + 1 }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCloseCommentModal = () => {
    setCommentModalOpen(false);
    setSelectedPost(null);
    setComments([]);
    setNewComment('');
  };

  const handleShowLikes = async (postId) => {
    try {
      setSelectedPost(posts.find(p => p.id === postId));
      setLikesModalOpen(true);
      setLikesLoading(true);
      
      // Load likes for this post
      const response = await parentService.getLikes(postId);
      if (response.success) {
        setLikes(response.data.likes);
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    } finally {
      setLikesLoading(false);
    }
  };

  const handleCloseLikesModal = () => {
    setLikesModalOpen(false);
    setSelectedPost(null);
    setLikes([]);
  };

  const handleShare = (postId) => {
    console.log("Share post:", postId);
  };

  const handleOpenGallery = (images, startIndex = 0) => {
    setGalleryImages(images);
    setCurrentImageIndex(startIndex);
    setGalleryModalOpen(true);
  };

  const handleCloseGallery = () => {
    setGalleryModalOpen(false);
    setGalleryImages([]);
    setCurrentImageIndex(0);
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };
  
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Welcome Section */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Chào mừng trở lại!
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Đây là tổng quan về thông tin con của bạn
          </ArgonTypography>
        </ArgonBox>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Số ngày đi học"
              count="25"
              icon={{ color: "info", component: <i className="ni ni-calendar-grid-58" /> }}
              percentage={{ color: "success", count: "+2", text: "tuần này" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Bài viết mới"
              count="8"
              icon={{ color: "success", component: <i className="ni ni-paper-diploma" /> }}
              percentage={{ color: "success", count: "+3", text: "tuần này" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Tin nhắn chưa đọc"
              count="5"
              icon={{ color: "warning", component: <i className="ni ni-notification-70" /> }}
              percentage={{ color: "error", count: "+2", text: "hôm nay" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Phí cần thanh toán"
              count="2,500,000"
              icon={{ color: "error", component: <i className="ni ni-money-coins" /> }}
              percentage={{ color: "warning", count: "VND", text: "tháng này" }}
            />
          </Grid>
        </Grid>

        {/* Tab Filter System */}
        <ArgonBox mb={3}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 60,
                  textTransform: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.value}
                  label={
                    <ArgonBox display="flex" alignItems="center" gap={1}>
                      <ArgonTypography variant="body1" fontWeight="medium">
                        {tab.label}
                      </ArgonTypography>
                      <Chip
                        label={tab.count}
                        size="small"
                        color={activeTab === index ? "primary" : "default"}
                        sx={{ 
                          minWidth: 24, 
                          height: 20,
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                    </ArgonBox>
                  }
                />
              ))}
            </Tabs>
          </Card>
        </ArgonBox>

        {/* Facebook-style Posts Feed - Centered */}
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
            <Card 
              key={post.id} 
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
                  {post.images.length === 1 ? (
                    // Single image
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
                      onClick={() => handleOpenGallery(post.images)}
                    />
                  ) : post.images.length === 2 ? (
                    // Two images side by side
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
                          onClick={() => handleOpenGallery(post.images, index)}
                        />
                      ))}
                    </ArgonBox>
                  ) : post.images.length === 3 ? (
                    // Three images: 2 on top, 1 below
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
                            onClick={() => handleOpenGallery(post.images, index)}
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
                        onClick={() => handleOpenGallery(post.images, 2)}
                      />
                    </ArgonBox>
                  ) : (
                    // Four or more images: 2x2 grid with "more" indicator
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
                            onClick={() => handleOpenGallery(post.images, index)}
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
                              onClick={() => handleOpenGallery(post.images, index + 2)}
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
                                onClick={() => handleOpenGallery(post.images, 3)}
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
                  )}
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
                      onClick={() => handleLike(post.id)}
                      sx={{
                        color: post.isLiked ? '#1976d2' : '#6c757d',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: { xs: 1.5, sm: 2 },
                        py: 1,
                        fontSize: { xs: '12px', sm: '14px' },
                        '&:hover': {
                          backgroundColor: post.isLiked ? 'rgba(25, 118, 210, 0.08)' : 'rgba(108, 117, 125, 0.08)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      Thích
                    </Button>
                    <Button
                      onClick={() => handleShowLikes(post.id)}
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
                      ({post.likes || 0})
                    </Button>
                  </ArgonBox>
                  
                  <Button
                    startIcon={<i className="ni ni-chat-round" />}
                    onClick={() => handleComment(post.id)}
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
      </ArgonBox>
      
      {/* Likes Modal */}
      <Dialog 
        open={likesModalOpen} 
        onClose={handleCloseLikesModal}
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
            onClick={handleCloseLikesModal}
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
      
      {/* Comment Modal */}
      <Dialog 
        open={commentModalOpen} 
        onClose={handleCloseCommentModal}
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
          overflow: 'auto',
          p: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {selectedPost && (
            <ArgonBox p={3} borderBottom="1px solid #f0f0f0" bgcolor="rgba(102, 126, 234, 0.05)">
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
          <ArgonBox flex={1} overflow="auto" p={3}>
            <ArgonTypography variant="h6" fontWeight="bold" mb={3} color="dark">
              Bình luận ({comments.length})
            </ArgonTypography>
            {comments.map((comment, index) => (
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
                <ArgonBox display="flex" alignItems="center" mb={1}>
                  <Avatar
                    src={comment.user_id?.avatar_url}
                    alt={comment.user_id?.full_name}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      mr: 2,
                      border: '2px solid #e3f2fd'
                    }}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="subtitle2" fontWeight="bold" color="dark">
                      {comment.user_id?.full_name}
                    </ArgonTypography>
                    <ArgonTypography variant="caption" color="text.secondary">
                      {new Date(comment.create_at).toLocaleString('vi-VN')}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
                <ArgonTypography variant="body2" color="text" sx={{ lineHeight: 1.6, mt: 1 }}>
                  {comment.contents}
                </ArgonTypography>
              </ArgonBox>
            ))}
          </ArgonBox>
        </DialogContent>
        
        {/* Sticky Comment Input - Giống Facebook */}
        <ArgonBox 
          p={3} 
          borderTop="1px solid #f0f0f0" 
          bgcolor="rgba(248, 249, 250, 0.95)"
          sx={{ 
            position: 'sticky',
            bottom: 0,
            zIndex: 1,
            backdropFilter: 'blur(10px)'
          }}
        >
          <ArgonBox display="flex" alignItems="flex-end" gap={2}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Viết bình luận..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '25px',
                  backgroundColor: 'white',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }
                }
              }}
            />
            <Button 
              onClick={handleSubmitComment}
              variant="contained"
              disabled={!newComment.trim() || commentLoading}
              startIcon={commentLoading ? <CircularProgress size={16} /> : <i className="ni ni-send" />}
              sx={{
                borderRadius: '25px',
                minWidth: 'auto',
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'scale(1.05)'
                },
                '&:disabled': {
                  background: '#e0e0e0',
                  color: '#9e9e9e'
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
            onClick={handleCloseCommentModal}
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
      
      {/* Image Gallery Modal */}
      <Dialog 
        open={galleryModalOpen} 
        onClose={handleCloseGallery}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            backgroundColor: 'black'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #333',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* <ArgonTypography variant="h5" fontWeight="bold" color="white">
            <i className="ni ni-image" style={{ marginRight: '8px' }} />
            ({currentImageIndex + 1}/{galleryImages.length})
          </ArgonTypography>
          <Button 
            onClick={handleCloseGallery}
            sx={{ 
              color: 'white',
              minWidth: 'auto',
              p: 1
            }}
          >
            <i className="ni ni-fat-remove" style={{ fontSize: '20px' }} />
          </Button> */}
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: 0,
          position: 'relative',
          minHeight: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'black'
        }}>
          {galleryImages.length > 0 && (
            <>
              {/* Main Image */}
              <img
                src={galleryImages[currentImageIndex]}
                alt={`Gallery image ${currentImageIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
              
              {/* Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <Button
                    onClick={handlePreviousImage}
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      minWidth: 'auto',
                      p: 2,
                      borderRadius: '50%',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.7)'
                      }
                    }}
                  >
                    <i className="ni ni-bold-left" style={{ fontSize: '20px' }} />
                  </Button>
                  
                  <Button
                    onClick={handleNextImage}
                    sx={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      minWidth: 'auto',
                      p: 2,
                      borderRadius: '50%',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.7)'
                      }
                    }}
                  >
                    <i className="ni ni-bold-right" style={{ fontSize: '20px' }} />
                  </Button>
                </>
              )}
              
              {/* Thumbnail Strip */}
              {galleryImages.length > 1 && (
                <ArgonBox
                  position="absolute"
                  bottom={16}
                  left="50%"
                  transform="translateX(-50%)"
                  display="flex"
                  gap={1}
                  p={1}
                  bgcolor="rgba(0,0,0,0.7)"
                  borderRadius={2}
                >
                  {galleryImages.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      onClick={() => setCurrentImageIndex(index)}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: currentImageIndex === index ? '3px solid #667eea' : '3px solid transparent',
                        opacity: currentImageIndex === index ? 1 : 0.7,
                        transition: 'all 0.2s ease-in-out'
                      }}
                    />
                  ))}
                </ArgonBox>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* <Footer /> */}
    </DashboardLayout>
  );
}

export default ParentDashboard;
