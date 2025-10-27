/**
=========================================================
* KidsLink Parent Dashboard - Parent Layout
=========================================================
*/

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";
import DetailedStatisticsCard from "examples/Cards/StatisticsCards/DetailedStatisticsCard";

// Argon Dashboard 2 MUI base styles
import typography from "assets/theme/base/typography";

// Parent layout components
import QuickActions from "layouts/parent/components/QuickActions";
import UpcomingEvents from "layouts/parent/components/UpcomingEvents";

// Post components
import { PostsFeed, CreatePostModal } from "layouts/parent/posts";

// Services
import parentService from "services/parentService";

// Auth context
import { useAuth } from "context/AuthContext";

function ParentDashboard() {
  const { size } = typography;
  const { user, selectedChild } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Fetch posts from API for tab counts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Pass selectedChild's _id if available
        const result = await parentService.getAllPosts(selectedChild?._id);
        
        if (result.success) {
          // Transform API data to match component structure
          const transformedPosts = result.data.data.map(post => ({
            id: post._id,
            _id: post._id,
            _raw: post,
            title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
            content: post.content,
            author: post.user_id.full_name,
            authorRole: post.user_id.role === 'school_admin' ? 'school' : post.user_id.role,
            authorId: post.user_id._id,
            avatar: post.user_id.avatar_url,
            images: post.images || [],
            image: post.images && post.images.length > 0 ? post.images[0] : null,
            date: new Date(post.create_at).toLocaleDateString('vi-VN'),
            time: new Date(post.create_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            category: post.class_id ? post.class_id.class_name : 'Chung',
            class_id: post.class_id,
            likes: post.like_count,
            comments: post.comment_count,
            isLiked: post.is_liked
          }));
          
          setPosts(transformedPosts);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    };

    fetchPosts();
  }, [selectedChild]);

  // Filter posts based on search criteria
  const getFilteredPosts = () => {
    let filtered = [...posts];

    // Filter by search term (author or content)
    if (searchFilters.search) {
      const searchTerm = searchFilters.search.toLowerCase();
      filtered = filtered.filter(post => 
        post.author.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by date range
    if (searchFilters.dateFrom) {
      const fromDate = new Date(searchFilters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(post => {
        // Parse Vietnamese date format DD/MM/YYYY
        const [day, month, year] = post.date.split('/');
        const postDate = new Date(year, month - 1, day);
        postDate.setHours(0, 0, 0, 0);
        return postDate >= fromDate;
      });
    }

    if (searchFilters.dateTo) {
      const toDate = new Date(searchFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter(post => {
        // Parse Vietnamese date format DD/MM/YYYY
        const [day, month, year] = post.date.split('/');
        const postDate = new Date(year, month - 1, day);
        postDate.setHours(23, 59, 59, 999);
        return postDate <= toDate;
      });
    }

    return filtered;
  };

  const filteredPosts = getFilteredPosts();

  const tabs = [
    { label: "Tất cả", value: "all", count: filteredPosts.length },
    { label: "Trường", value: "school", count: filteredPosts.filter(p => p.authorRole === "school").length },
    { label: "Lớp", value: "teacher", count: filteredPosts.filter(p => p.authorRole === "teacher").length },
    { label: "Phụ huynh", value: "parent", count: filteredPosts.filter(p => p.authorRole === "parent").length }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSearchChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearSearch = () => {
    setSearchFilters({
      search: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handlePostCreated = async () => {
    // Reload posts after create/update
    try {
      const result = await parentService.getAllPosts(selectedChild?._id);
      if (result.success) {
        const transformedPosts = result.data.data.map(post => ({
          id: post._id,
          _id: post._id,
          _raw: post,
          title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
          content: post.content,
          author: post.user_id.full_name,
          authorRole: post.user_id.role === 'school_admin' ? 'school' : post.user_id.role,
          authorId: post.user_id._id,
          avatar: post.user_id.avatar_url,
          images: post.images || [],
          image: post.images && post.images.length > 0 ? post.images[0] : null,
          date: new Date(post.create_at).toLocaleDateString('vi-VN'),
          time: new Date(post.create_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          category: post.class_id ? post.class_id.class_name : 'Chung',
          class_id: post.class_id,
          likes: post.like_count,
          comments: post.comment_count,
          isLiked: post.is_liked
        }));
        setPosts(transformedPosts);
      }
    } catch (err) {
      console.error('Error refreshing posts:', err);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setCreatePostModalOpen(true);
  };

  const handleDeletePost = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };
  
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Welcome Section */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            {selectedChild 
              ? `Xin chào! Đang xem thông tin của ${selectedChild.full_name}`
              : 'Chào mừng trở lại!'
            }
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            {selectedChild && selectedChild.class
              ? `Lớp: ${selectedChild.class.class_name}`
              : 'Đây là tổng quan về thông tin con của bạn'
            }
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

        {/* Two Column Layout: Search/Filter (Left) and Posts (Right) */}
        <Grid container spacing={3} sx={{ minHeight: '70vh' }}>
          {/* Left Column - Search and Filters */}
          <Grid item xs={12} md={4} lg={3}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: 3, 
              p: 3, 
              position: 'sticky', 
              top: 20,
              minHeight: '600px',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <ArgonBox mb={3}>
                <ArgonTypography 
                  variant="h6" 
                  fontWeight="bold" 
                  color="dark" 
                  mb={2}
                  sx={{ 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '1.2rem'
                  }}
                >
                  🔍 Bộ lọc
                </ArgonTypography>
              </ArgonBox>

              {/* Search Input */}
              <ArgonBox mb={3}>
                <Paper
                  component="form"
                  sx={{
                    p: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 3,
                    boxShadow: 2,
                    border: '2px solid',
                    borderColor: 'rgba(94, 114, 228, 0.2)',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    },
                    '&:focus-within': {
                      borderColor: 'primary.main',
                      boxShadow: '0 0 0 3px rgba(94, 114, 228, 0.1)'
                    }
                  }}
                >
                  {/* <IconButton sx={{ p: '12px', mr: 1 }} aria-label="search">
                    <i className="ni ni-zoom-split-in" style={{ fontSize: '22px', color: '#5e72e4' }} />
                  </IconButton> */}
                  <InputBase
                    sx={{ 
                      ml: 1, 
                      flex: 1,
                      fontSize: '15px',
                      fontWeight: '500',
                      '& input::placeholder': {
                        color: 'rgba(0,0,0,0.6)',
                        fontWeight: '400'
                      }
                    }}
                    placeholder="🔍 Tìm kiếm bài viết..."
                    value={searchFilters.search}
                    onChange={(e) => handleSearchChange('search', e.target.value)}
                    inputProps={{ 'aria-label': 'search' }}
                  />
                </Paper>
              </ArgonBox>

              {/* Tab Filter System */}
              <ArgonBox mb={3}>
                <ArgonTypography 
                  variant="body2" 
                  fontWeight="bold" 
                  color="dark" 
                  mb={2}
                  sx={{ 
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'rgba(0,0,0,0.7)'
                  }}
                >
                  📋 Phân loại bài viết
                </ArgonTypography>
                <ArgonBox display="flex" flexDirection="column" gap={1.5}>
                  {tabs.map((tab, index) => (
                    <Card
                      key={tab.value}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: activeTab === index ? 'primary.main' : 'rgba(0,0,0,0.1)',
                        backgroundColor: activeTab === index 
                          ? 'linear-gradient(135deg, rgba(94, 114, 228, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' 
                          : 'rgba(255,255,255,0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        transform: activeTab === index ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: activeTab === index ? 4 : 1,
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(94, 114, 228, 0.08)',
                          transform: 'scale(1.02)',
                          boxShadow: 3
                        }
                      }}
                      onClick={() => handleTabChange(null, index)}
                    >
                      <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
                        <ArgonTypography 
                          variant="body2" 
                          fontWeight="600" 
                          color={activeTab === index ? "primary" : "dark"}
                          sx={{ fontSize: '14px' }}
                        >
                          {tab.label}
                        </ArgonTypography>
                        <Chip
                          label={tab.count}
                          size="small"
                          color={activeTab === index ? "primary" : "default"}
                          sx={{ 
                            minWidth: 28, 
                            height: 24,
                            fontSize: '12px',
                            fontWeight: 'bold',
                            borderRadius: 2
                          }}
                        />
                      </ArgonBox>
                    </Card>
                  ))}
                </ArgonBox>
              </ArgonBox>

              {/* Date Range Section */}
              <ArgonBox mb={3}>
                <ArgonTypography 
                  variant="body2" 
                  fontWeight="bold" 
                  color="dark" 
                  mb={2}
                  sx={{ 
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'rgba(0,0,0,0.7)'
                  }}
                >
                  📅 Lọc theo ngày
                </ArgonTypography>
                
                {/* Date From */}
                <ArgonBox mb={2}>
                  <ArgonTypography variant="caption" fontWeight="600" color="dark" mb={1} sx={{ display: 'block', fontSize: '12px' }}>
                    Từ ngày
                  </ArgonTypography>
                  <Paper
                    component="div"
                    sx={{
                      p: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: 2,
                      border: '2px solid',
                      borderColor: 'rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 3,
                        transform: 'translateY(-1px)'
                      },
                      '&:focus-within': {
                        borderColor: 'primary.main',
                        boxShadow: '0 0 0 3px rgba(94, 114, 228, 0.1)'
                      }
                    }}
                  >
                    <IconButton sx={{ p: '8px', mr: 1 }} aria-label="calendar">
                      <i className="ni ni-calendar-grid-58" style={{ fontSize: '20px', color: '#5e72e4' }} />
                    </IconButton>
                    <InputBase
                      type="date"
                      value={searchFilters.dateFrom}
                      onChange={(e) => handleSearchChange('dateFrom', e.target.value)}
                      sx={{ 
                        flex: 1,
                        fontSize: '14px',
                        fontWeight: '500',
                        '& input': {
                          cursor: 'pointer'
                        }
                      }}
                      placeholder="Chọn ngày"
                      inputProps={{ 'aria-label': 'date from' }}
                    />
                  </Paper>
                </ArgonBox>

                {/* Date To */}
                <ArgonBox mb={2}>
                  <ArgonTypography variant="caption" fontWeight="600" color="dark" mb={1} sx={{ display: 'block', fontSize: '12px' }}>
                    Đến ngày
                  </ArgonTypography>
                  <Paper
                    component="div"
                    sx={{
                      p: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: 2,
                      border: '2px solid',
                      borderColor: 'rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 3,
                        transform: 'translateY(-1px)'
                      },
                      '&:focus-within': {
                        borderColor: 'primary.main',
                        boxShadow: '0 0 0 3px rgba(94, 114, 228, 0.1)'
                      }
                    }}
                  >
                    <IconButton sx={{ p: '8px', mr: 1 }} aria-label="calendar">
                      <i className="ni ni-calendar-grid-58" style={{ fontSize: '20px', color: '#5e72e4' }} />
                    </IconButton>
                    <InputBase
                      type="date"
                      value={searchFilters.dateTo}
                      onChange={(e) => handleSearchChange('dateTo', e.target.value)}
                      sx={{ 
                        flex: 1,
                        fontSize: '14px',
                        fontWeight: '500',
                        '& input': {
                          cursor: 'pointer'
                        }
                      }}
                      placeholder="Chọn ngày"
                      inputProps={{ 'aria-label': 'date to' }}
                    />
                  </Paper>
                </ArgonBox>
              </ArgonBox>

              {/* Clear Button */}
              <Button
                onClick={handleClearSearch}
                fullWidth
                variant="contained"
                // startIcon={<i className="ni ni-fat-remove" />}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '14px',
                  boxShadow: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
              >
                🗑️ Xóa bộ lọc
              </Button>
            </Card>
          </Grid>

          {/* Right Column - Posts Feed */}
          <Grid item xs={12} md={8} lg={9}>
            {/* Posts Header */}
            <Card sx={{ 
              mb: 2, 
              borderRadius: 3, 
              boxShadow: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <ArgonBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
                <ArgonTypography 
                  variant="h5" 
                  fontWeight="bold" 
                  color="white"
                  sx={{ 
                    fontSize: '1.4rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  📝 Bài viết
                </ArgonTypography>
                <Button
                  variant="contained"
                  startIcon={<i className="ni ni-fat-add" />}
                  onClick={() => {
                    setEditingPost(null);
                    setCreatePostModalOpen(true);
                  }}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    background: 'rgba(255,255,255,0.95) !important',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.8)',
                    color: '#5e72e4 !important',
                    boxShadow: '2px 2px 8px rgba(0,0,0,0.1) !important',
                    transition: 'none !important',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.95) !important',
                      color: '#5e72e4 !important',
                      transform: 'none !important',
                      boxShadow: '2px 2px 8px rgba(0,0,0,0.1) !important'
                    },
                    '&:active': {
                      background: 'rgba(255,255,255,0.95) !important',
                      color: '#5e72e4 !important',
                      transform: 'none !important',
                      boxShadow: '2px 2px 8px rgba(0,0,0,0.1) !important'
                    },
                    '&:focus': {
                      background: 'rgba(255,255,255,0.95) !important',
                      color: '#5e72e4 !important',
                      transform: 'none !important',
                      boxShadow: '2px 2px 8px rgba(0,0,0,0.1) !important'
                    },
                    '&:focus-visible': {
                      background: 'rgba(255,255,255,0.95) !important',
                      color: '#5e72e4 !important',
                      transform: 'none !important',
                      boxShadow: '2px 2px 8px rgba(0,0,0,0.1) !important'
                    }
                  }}
                >
                  ✨ Tạo bài viết
                </Button>
              </ArgonBox>
            </Card>

            {/* Posts Container */}
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: 3, 
              minHeight: '600px',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <ArgonBox 
                sx={{ 
                  flex: 1,
                  overflow: 'auto',
                  p: 3
                }}
              >
                <PostsFeed 
                  activeTab={activeTab}
                  tabs={tabs}
                  posts={filteredPosts}
                  currentUserId={user?.id}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                  onUpdateCommentCount={(postId, increment) => {
                    setPosts(prevPosts => 
                      prevPosts.map(post => 
                        post.id === postId 
                          ? { ...post, comments: post.comments + increment }
                          : post
                      )
                    );
                  }}
                />
              </ArgonBox>
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      
      {/* Create/Edit Post Modal */}
      <CreatePostModal
        open={createPostModalOpen}
        onClose={() => {
          setCreatePostModalOpen(false);
          setEditingPost(null);
        }}
        post={editingPost}
        onPostCreated={handlePostCreated}
      />

      {/* <Footer /> */}
    </DashboardLayout>
  );
}

export default ParentDashboard;
