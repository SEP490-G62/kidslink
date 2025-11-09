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
          {/* Right Column - Posts Feed (Full width) */}
          <Grid item xs={12} md={12} lg={12}>
            {/* Top Toolbar: Search + Category Tabs */}
            <Card sx={{ 
              mb: 2, 
              borderRadius: 3, 
              boxShadow: 3,
              p: 2,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <ArgonBox display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} gap={2}>
                <ArgonBox sx={{ flexGrow: { xs: 1, md: 0 }, flexBasis: { xs: '100%', md: '33.333%' } }}>
                  <Paper
                    component="form"
                    sx={{
                      p: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: 2,
                      border: '2px solid',
                      borderColor: 'rgba(94, 114, 228, 0.2)',
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
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
                <ArgonBox sx={{ flexGrow: { xs: 1, md: 0 }, flexBasis: { xs: '100%', md: '66.666%' }, minWidth: 0 }}>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                      minHeight: 44,
                      '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                    }}
                  >
                    {tabs.map((tab, index) => (
                      <Tab key={tab.value} label={tab.label} />
                    ))}
                  </Tabs>
                </ArgonBox>
              </ArgonBox>
            </Card>
            {/* Posts Header */}
            <Card sx={{ 
              mb: 2, 
              borderRadius: 3, 
              boxShadow: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              maxWidth: 1200,
              mx: 'auto'
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
              flexDirection: 'column',
              maxWidth: 1200,
              mx: 'auto'
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