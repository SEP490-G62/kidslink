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

  const handleLike = (postId) => {
    console.log("Toggle like for post:", postId);
  };

  const handleComment = (postId) => {
    console.log("Comment on post:", postId);
  };

  const handleShare = (postId) => {
    console.log("Share post:", postId);
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
        <ArgonBox maxWidth="600px" mx="auto">
          {/* Loading State */}
          {loading && (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <ArgonTypography variant="h6" color="text" mb={1}>
                Đang tải bài viết...
              </ArgonTypography>
              <ArgonTypography variant="body2" color="text">
                Vui lòng chờ trong giây lát
              </ArgonTypography>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <ArgonTypography variant="h6" color="error" mb={1}>
                Có lỗi xảy ra
              </ArgonTypography>
              <ArgonTypography variant="body2" color="text" mb={2}>
                {error}
              </ArgonTypography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => window.location.reload()}
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
                mb: 2, 
                borderRadius: 2, 
                boxShadow: 1,
                '&:hover': { 
                  boxShadow: 3,
                  transition: 'box-shadow 0.2s ease-in-out'
                }
              }}
            >
              {/* Post Header */}
              <ArgonBox p={2} pb={1}>
                <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
                  <ArgonBox display="flex" alignItems="center">
                    <Avatar
                      src={post.avatar}
                      alt={post.author}
                      sx={{ width: 40, height: 40, mr: 2 }}
                    />
                    <ArgonBox>
                      <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                        {post.author}
                      </ArgonTypography>
                      <ArgonBox display="flex" alignItems="center" gap={1}>
                        <ArgonTypography variant="caption" color="text">
                          {post.date} lúc {post.time}
                        </ArgonTypography>
                        {/* <Chip 
                          label={post.category} 
                          size="small" 
                          color="primary" 
                          sx={{ 
                            height: 20, 
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}
                        /> */}
                      </ArgonBox>
                    </ArgonBox>
                  </ArgonBox>
                </ArgonBox>
              </ArgonBox>

              {/* Post Content */}
              <ArgonBox px={2} pb={1}>
                <ArgonTypography variant="body1" color="dark" mb={2} sx={{ lineHeight: 1.6 }}>
                  {post.content}
                </ArgonTypography>
              </ArgonBox>

              {/* Post Image */}
              {post.image && (
                <ArgonBox>
                  <img
                    src={post.image}
                    alt={post.title}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '400px',
                      objectFit: 'cover'
                    }}
                  />
                </ArgonBox>
              )}

              {/* Post Actions */}
              <ArgonBox px={2} py={1} borderTop="1px solid #e0e0e0">
                <ArgonBox display="flex" justifyContent="space-around">
                  <Button
                    startIcon={<i className="ni ni-like-2" />}
                    onClick={() => handleLike(post.id)}
                    sx={{
                      color: post.isLiked ? '#1976d2' : '#8e8e8e',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    Thích
                  </Button>
                  <Button
                    startIcon={<i className="ni ni-chat-round" />}
                    onClick={() => handleComment(post.id)}
                    sx={{
                      color: '#8e8e8e',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    Bình luận
                  </Button>
                </ArgonBox>
              </ArgonBox>
            </Card>
          ))}

          {/* No Posts Message */}
          {!loading && !error && getFilteredPosts().length === 0 && (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <ArgonTypography variant="h6" color="text" mb={1}>
                Không có bài viết nào
              </ArgonTypography>
              <ArgonTypography variant="body2" color="text">
                Chưa có bài viết nào trong danh mục này
              </ArgonTypography>
            </Card>
          )}
        </ArgonBox>
      </ArgonBox>
      {/* <Footer /> */}
    </DashboardLayout>
  );
}

export default ParentDashboard;
