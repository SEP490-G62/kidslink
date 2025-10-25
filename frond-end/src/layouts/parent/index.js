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

// Post components
import { PostsFeed } from "layouts/parent/posts";

// Services
import parentService from "services/parentService";

function ParentDashboard() {
  const { size } = typography;
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);

  // Fetch posts from API for tab counts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
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
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
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

        {/* Posts Feed Component */}
        <PostsFeed 
          activeTab={activeTab}
          tabs={tabs}
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
      
      {/* <Footer /> */}
    </DashboardLayout>
  );
}

export default ParentDashboard;
