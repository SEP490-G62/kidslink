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
import { PostsFeed } from "layouts/parent/posts";

// Services
import parentService from "services/parentService";

function ParentDashboard() {
  const { size } = typography;
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: ''
  });

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

        {/* Two Column Layout: Search/Filter (Left) and Posts (Right) */}
        <Grid container spacing={3}>
          {/* Left Column - Search and Filters */}
          <Grid item xs={12} md={4} lg={3}>
            <Card sx={{ borderRadius: 2, boxShadow: 2, p: 2, position: 'sticky', top: 20 }}>
              <ArgonBox mb={2}>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
                  Bộ lọc
                </ArgonTypography>
              </ArgonBox>

              {/* Search Input */}
              <ArgonBox mb={2}>
                <Paper
                  component="form"
                  sx={{
                    p: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 2,
                    boxShadow: 1,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    '&:hover': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <IconButton sx={{ p: '10px' }} aria-label="search">
                    <i className="ni ni-zoom-split-in" style={{ fontSize: '20px', color: '#5e72e4' }} />
                  </IconButton>
                  <InputBase
                    sx={{ ml: 1, flex: 1 }}
                    placeholder="Tìm kiếm..."
                    value={searchFilters.search}
                    onChange={(e) => handleSearchChange('search', e.target.value)}
                    inputProps={{ 'aria-label': 'search' }}
                  />
                </Paper>
              </ArgonBox>

              {/* Tab Filter System */}
              <ArgonBox mb={2}>
                <ArgonTypography variant="body2" fontWeight="bold" color="dark" mb={1}>
                  Theo nguồn
                </ArgonTypography>
                <ArgonBox display="flex" flexDirection="column" gap={1}>
                  {tabs.map((tab, index) => (
                    <Card
                      key={tab.value}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: activeTab === index ? 'primary.main' : 'grey.300',
                        backgroundColor: activeTab === index ? 'rgba(94, 114, 228, 0.05)' : 'transparent',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(94, 114, 228, 0.05)'
                        }
                      }}
                      onClick={() => handleTabChange(null, index)}
                    >
                      <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
                        <ArgonTypography variant="body2" fontWeight="medium" color={activeTab === index ? "primary" : "dark"}>
                          {tab.label}
                        </ArgonTypography>
                        <Chip
                          label={tab.count}
                          size="small"
                          color={activeTab === index ? "primary" : "default"}
                          sx={{ 
                            minWidth: 24, 
                            height: 22,
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        />
                      </ArgonBox>
                    </Card>
                  ))}
                </ArgonBox>
              </ArgonBox>

              {/* Date From */}
              <ArgonBox mb={2}>
                <ArgonTypography variant="caption" fontWeight="bold" color="dark" mb={1} sx={{ display: 'block' }}>
                  Từ ngày
                </ArgonTypography>
                <Paper
                  component="div"
                  sx={{
                    p: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 2,
                    boxShadow: 1,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    '&:hover': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <IconButton sx={{ p: '6px', mr: 1 }} aria-label="calendar">
                    <i className="ni ni-calendar-grid-58" style={{ fontSize: '18px', color: '#5e72e4' }} />
                  </IconButton>
                  <InputBase
                    type="date"
                    value={searchFilters.dateFrom}
                    onChange={(e) => handleSearchChange('dateFrom', e.target.value)}
                    sx={{ 
                      flex: 1,
                      fontSize: '14px',
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
                <ArgonTypography variant="caption" fontWeight="bold" color="dark" mb={1} sx={{ display: 'block' }}>
                  Đến ngày
                </ArgonTypography>
                <Paper
                  component="div"
                  sx={{
                    p: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 2,
                    boxShadow: 1,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    '&:hover': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <IconButton sx={{ p: '6px', mr: 1 }} aria-label="calendar">
                    <i className="ni ni-calendar-grid-58" style={{ fontSize: '18px', color: '#5e72e4' }} />
                  </IconButton>
                  <InputBase
                    type="date"
                    value={searchFilters.dateTo}
                    onChange={(e) => handleSearchChange('dateTo', e.target.value)}
                    sx={{ 
                      flex: 1,
                      fontSize: '14px',
                      '& input': {
                        cursor: 'pointer'
                      }
                    }}
                    placeholder="Chọn ngày"
                    inputProps={{ 'aria-label': 'date to' }}
                  />
                </Paper>
              </ArgonBox>

              {/* Clear Button */}
              <IconButton
                onClick={handleClearSearch}
                fullWidth
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  backgroundColor: 'error.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'error.dark'
                  }
                }}
              >
                <i className="ni ni-fat-remove" style={{ marginRight: '8px' }} />
                <ArgonTypography variant="button" color="white" fontWeight="medium">
                  Xóa bộ lọc
                </ArgonTypography>
              </IconButton>
            </Card>
          </Grid>

          {/* Right Column - Posts Feed */}
          <Grid item xs={12} md={8} lg={9}>
            <PostsFeed 
              activeTab={activeTab}
              tabs={tabs}
              posts={filteredPosts}
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
          </Grid>
        </Grid>
      </ArgonBox>
      
      {/* <Footer /> */}
    </DashboardLayout>
  );
}

export default ParentDashboard;
