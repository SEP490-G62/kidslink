/**
=========================================================
* KidsLink Teacher Dashboard - Teacher Layout
=========================================================
*/

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
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
import TeacherNavbar from "examples/Navbars/TeacherNavbar";
import Footer from "examples/Footer";
import DetailedStatisticsCard from "examples/Cards/StatisticsCards/DetailedStatisticsCard";

// Post components
import { PostsFeed, CreatePostModal } from "layouts/teacher/posts";

// Services
import teacherService from "services/teacherService";

// Auth context
import { useAuth } from "context/AuthContext";

function TeacherHome() {
  const { user } = useAuth();
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
        // Teacher không cần studentId, backend tự động lấy lớp của giáo viên
        const result = await teacherService.getAllPosts();
        // Lấy posts của user hiện tại (bao gồm pending và approved)
        const myPostsResult = user?.id ? await teacherService.getMyPosts() : { success: false, data: { data: [] } };

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
            isLiked: post.is_liked,
            status: post.status || 'pending',
            create_at: post.create_at
          }));

          // Nếu có posts của user, merge vào danh sách
          const myPostsData = myPostsResult.data?.data || myPostsResult.data || [];
          if (myPostsResult.success && Array.isArray(myPostsData) && myPostsData.length > 0) {
            const myPostsMap = new Map();
            myPostsData.forEach(post => {
              const transformedPost = {
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
                likes: post.like_count || 0,
                comments: post.comment_count || 0,
                isLiked: post.is_liked || false,
                status: post.status || 'pending',
                create_at: post.create_at || post._raw?.create_at || new Date()
              };
              myPostsMap.set(post._id, transformedPost);
            });

            transformedPosts.forEach(post => {
              if (myPostsMap.has(post.id)) {
                const myPost = myPostsMap.get(post.id);
                post.status = myPost.status;
                if (!post.create_at && myPost.create_at) {
                  post.create_at = myPost.create_at;
                }
                myPostsMap.delete(post.id);
              }
            });

            myPostsMap.forEach(post => {
              transformedPosts.push(post);
            });
          }

          transformedPosts.sort((a, b) => {
            const dateA = a.create_at ? new Date(a.create_at) : new Date(a._raw?.create_at || a.date);
            const dateB = b.create_at ? new Date(b.create_at) : new Date(b._raw?.create_at || b.date);
            return dateB - dateA;
          });

          setPosts(transformedPosts);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    };

    fetchPosts();
  }, [user?.id]);

  // Filter posts based on search criteria
  const getFilteredPosts = () => {
    let filtered = [...posts];

    if (searchFilters.search) {
      const searchTerm = searchFilters.search.toLowerCase();
      filtered = filtered.filter(post =>
        post.author.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm)
      );
    }

    if (searchFilters.dateFrom) {
      const fromDate = new Date(searchFilters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(post => {
        const postDate = post.create_at
          ? new Date(post.create_at)
          : post._raw?.create_at
            ? new Date(post._raw.create_at)
            : (() => {
              try {
                const [day, month, year] = post.date.split('/');
                return new Date(year, month - 1, day);
              } catch {
                return new Date();
              }
            })();
        postDate.setHours(0, 0, 0, 0);
        return postDate >= fromDate;
      });
    }

    if (searchFilters.dateTo) {
      const toDate = new Date(searchFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(post => {
        const postDate = post.create_at
          ? new Date(post.create_at)
          : post._raw?.create_at
            ? new Date(post._raw.create_at)
            : (() => {
              try {
                const [day, month, year] = post.date.split('/');
                return new Date(year, month - 1, day);
              } catch {
                return new Date();
              }
            })();
        postDate.setHours(23, 59, 59, 999);
        return postDate <= toDate;
      });
    }

    return filtered;
  };

  const filteredPosts = getFilteredPosts();
  const approvedPosts = filteredPosts.filter(p => p.status === 'approved');

  const tabs = [
    { label: "Tất cả", value: "all", count: approvedPosts.length },
    { label: "Trường", value: "school", count: approvedPosts.filter(p => p.authorRole === "school").length },
    { label: "Lớp", value: "teacher", count: approvedPosts.filter(p => p.authorRole === "teacher").length },
    { label: "Phụ huynh", value: "parent", count: approvedPosts.filter(p => p.authorRole === "parent").length },
    { label: "Của tôi", value: "mine", count: filteredPosts.filter(p => p.authorId === user?.id && (p.status === 'pending' || p.status === 'approved')).length }
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
    const currentTab = activeTab;

    try {
      const result = await teacherService.getAllPosts();
      const myPostsResult = user?.id ? await teacherService.getMyPosts() : { success: false, data: { data: [] } };

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
          isLiked: post.is_liked,
          status: post.status || 'pending',
          create_at: post.create_at
        }));

        const myPostsData = myPostsResult.data?.data || myPostsResult.data || [];
        if (myPostsResult.success && Array.isArray(myPostsData) && myPostsData.length > 0) {
          const myPostsMap = new Map();
          myPostsData.forEach(post => {
            const transformedPost = {
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
              likes: post.like_count || 0,
              comments: post.comment_count || 0,
              isLiked: post.is_liked || false,
              status: post.status || 'pending',
              create_at: post.create_at || post._raw?.create_at || new Date()
            };
            myPostsMap.set(post._id, transformedPost);
          });

          transformedPosts.forEach(post => {
            if (myPostsMap.has(post.id)) {
              const myPost = myPostsMap.get(post.id);
              post.status = myPost.status;
              if (!post.create_at && myPost.create_at) {
                post.create_at = myPost.create_at;
              }
              myPostsMap.delete(post.id);
            }
          });

          myPostsMap.forEach(post => {
            transformedPosts.push(post);
          });
        }

        transformedPosts.sort((a, b) => {
          const dateA = a.create_at ? new Date(a.create_at) : new Date(a._raw?.create_at || a.date);
          const dateB = b.create_at ? new Date(b.create_at) : new Date(b._raw?.create_at || b.date);
          return dateB - dateA;
        });

        setPosts(transformedPosts);
        setActiveTab(currentTab);
      }
    } catch (err) {
      console.error('Error refreshing posts:', err);
      setActiveTab(currentTab);
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
      <TeacherNavbar />
      <ArgonBox py={3}>
        {/* Welcome Section */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Chào mừng trở lại! 👋
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Trang dashboard dành cho giáo viên mầm non
          </ArgonTypography>
        </ArgonBox>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Tổng số lớp"
              count="5"
              icon={{ color: "info", component: <i className="ni ni-books" /> }}
              percentage={{ color: "success", count: "+1", text: "lớp mới tháng này" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Tổng số học sinh"
              count="120"
              icon={{ color: "success", component: <i className="ni ni-circle-08" /> }}
              percentage={{ color: "success", count: "+8", text: "học sinh mới" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Thông báo chưa đọc"
              count="12"
              icon={{ color: "warning", component: <i className="ni ni-notification-70" /> }}
              percentage={{ color: "error", count: "+3", text: "thông báo mới" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Hoạt động hôm nay"
              count="8"
              icon={{ color: "error", component: <i className="ni ni-calendar-grid-58" /> }}
              percentage={{ color: "success", count: "+2", text: "so với hôm qua" }}
            />
          </Grid>
        </Grid>

        {/* Toolbar: Search + Filters + Category Tabs */}
        <Card sx={{
          mb: 2,
          borderRadius: 3,
          boxShadow: 3,
          p: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease'
        }}>
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
              <ArgonBox display="flex" alignItems="center" gap={1} mb={1.5} sx={{ minHeight: '32px' }}>
                <i className="ni ni-zoom-split" style={{ fontSize: '20px', color: '#5e72e4' }} />
                <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                  Tìm kiếm bài viết
                </ArgonTypography>
              </ArgonBox>
              <Paper
                component="form"
                sx={{
                  p: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '2px solid',
                  borderColor: 'rgba(94, 114, 228, 0.2)',
                  background: 'white',
                  transition: 'all 0.3s ease',
                  flex: 1,
                  minHeight: '50px',
                  '&:hover': {
                    borderColor: 'rgba(94, 114, 228, 0.4)',
                    boxShadow: '0 4px 12px rgba(94, 114, 228, 0.15)'
                  },
                  '&:focus-within': {
                    borderColor: '#5e72e4',
                    boxShadow: '0 4px 12px rgba(94, 114, 228, 0.2)'
                  }
                }}
              >
                <i className="ni ni-zoom-split" style={{ fontSize: '18px', color: '#5e72e4', marginRight: '8px' }} />
                <InputBase
                  sx={{
                    flex: 1,
                    fontSize: '15px',
                    fontWeight: '500',
                    '& input::placeholder': {
                      color: 'rgba(0,0,0,0.5)',
                      fontWeight: '400'
                    },
                    '& .MuiInputBase-input': {
                      width: '100% !important',
                    }
                  }}
                  placeholder="Nhập từ khóa tìm kiếm (tác giả, nội dung)..."
                  value={searchFilters.search}
                  onChange={(e) => handleSearchChange('search', e.target.value)}
                  inputProps={{ 'aria-label': 'search' }}
                />
                {searchFilters.search && (
                  <IconButton
                    size="small"
                    onClick={() => handleSearchChange('search', '')}
                    sx={{
                      color: 'rgba(0,0,0,0.5)',
                      '&:hover': { color: '#5e72e4', backgroundColor: 'rgba(94, 114, 228, 0.1)' }
                    }}
                  >
                    <i className="ni ni-fat-remove" />
                  </IconButton>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column' }}>
              <ArgonBox display="flex" alignItems="center" gap={1} mb={1.5} sx={{ minHeight: '32px' }}>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                  Danh mục bài viết
                </ArgonTypography>
              </ArgonBox>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 50,
                  backgroundColor: 'rgba(94, 114, 228, 0.05)',
                  borderRadius: 2,
                  flex: 1,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    minHeight: 50,
                    px: 3,
                    '&.Mui-selected': {
                      color: '#5e72e4',
                      fontWeight: 'bold'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  }
                }}
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={tab.value}
                    label={tab.label}
                  />
                ))}
              </Tabs>
            </Grid>
          </Grid>
        </Card>

        {/* Posts Feed */}
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sx={{ maxWidth: { xs: '100%', sm: '800px', md: '1000px', lg: '1200px' }, mx: 'auto' }}>
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
                    '&:hover': {
                      background: 'rgba(255,255,255,0.95) !important',
                      color: '#5e72e4 !important',
                      boxShadow: '2px 2px 8px rgba(0,0,0,0.1) !important'
                    }
                  }}
                >
                  ✨ Tạo bài viết
                </Button>
              </ArgonBox>
            </Card>

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
              <ArgonBox p={3} pb={2}>
                {/* <ArgonBox display="flex" alignItems="center" gap={1} mb={1.5}>
                  <i className="ni ni-calendar-grid-58" style={{ fontSize: '20px', color: '#5e72e4' }} />
                  <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                    Lọc theo ngày
                  </ArgonTypography>
                </ArgonBox> */}
                <ArgonBox
                  display="flex"
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'stretch', sm: 'flex-end' }}
                  gap={2}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    // backgroundColor: 'rgba(94, 114, 228, 0.03)',
                    // border: '1px solid rgba(94, 114, 228, 0.1)'
                  }}
                >
                  <ArgonBox
                    sx={{
                      flex: { xs: 1, sm: '0 0 auto' },
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      minWidth: { xs: '100%', sm: '200px' }
                    }}
                  >
                    <ArgonBox display="flex" alignItems="center" gap={0.5}>
                      <i className="ni ni-calendar-grid-58" style={{ fontSize: '16px', color: '#5e72e4' }} />
                      <ArgonTypography variant="caption" fontWeight="bold" color="text">
                        Từ ngày
                      </ArgonTypography>
                    </ArgonBox>
                    <TextField
                      type="date"
                      value={searchFilters.dateFrom}
                      onChange={(e) => handleSearchChange('dateFrom', e.target.value)}
                      size="small"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,1)',
                            borderColor: '#5e72e4'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'rgba(255,255,255,1)',
                            borderColor: '#5e72e4'
                          }
                        }
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </ArgonBox>

                  <ArgonBox
                    sx={{
                      flex: { xs: 1, sm: '0 0 auto' },
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      minWidth: { xs: '100%', sm: '200px' }
                    }}
                  >
                    <ArgonBox display="flex" alignItems="center" gap={0.5}>
                      <i className="ni ni-calendar-grid-58" style={{ fontSize: '16px', color: '#5e72e4' }} />
                      <ArgonTypography variant="caption" fontWeight="bold" color="text">
                        Đến ngày
                      </ArgonTypography>
                    </ArgonBox>
                    <TextField
                      type="date"
                      value={searchFilters.dateTo}
                      onChange={(e) => handleSearchChange('dateTo', e.target.value)}
                      size="small"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,1)',
                            borderColor: '#5e72e4'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'rgba(255,255,255,1)',
                            borderColor: '#5e72e4'
                          }
                        }
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </ArgonBox>

                  {(searchFilters.dateFrom || searchFilters.dateTo) && (
                    <ArgonBox
                      display="flex"
                      alignItems={{ xs: 'stretch', sm: 'flex-end' }}
                      sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleClearSearch}
                        startIcon={<i className="ni ni-fat-remove" />}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 'bold',
                          borderColor: 'rgba(244, 67, 54, 0.5)',
                          color: '#f44336',
                          px: 3,
                          py: 0,
                          minHeight: 31,
                          width: { xs: '100%', sm: 'auto' },
                          '&:hover': {
                            borderColor: '#f44336',
                            backgroundColor: 'rgba(244, 67, 54, 0.08)',
                          }
                        }}
                      >
                        Xóa lọc
                      </Button>
                    </ArgonBox>
                  )}
                </ArgonBox>
              </ArgonBox>

              <ArgonBox
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 3,
                  pt: 0
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

      <CreatePostModal
        open={createPostModalOpen}
        onClose={() => {
          setCreatePostModalOpen(false);
          setEditingPost(null);
        }}
        post={editingPost}
        onPostCreated={handlePostCreated}
      />

      <Footer />
    </DashboardLayout>
  );
}

export default TeacherHome;
