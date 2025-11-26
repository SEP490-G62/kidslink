/**
=========================================================
* KidsLink School Admin Dashboard - Manage Posts
=========================================================
*/

import { useCallback, useEffect, useMemo, useState } from "react";

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

// Argon components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Layout components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DetailedStatisticsCard from "examples/Cards/StatisticsCards/DetailedStatisticsCard";

// Post components
import { PostsFeed, CreatePostModal } from "./posts";

// Services & context
import schoolAdminService from "services/schoolAdminService";
import { useAuth } from "context/AuthContext";

const parsePostDate = (post) => {
  if (post.create_at) return new Date(post.create_at);
  if (post._raw?.create_at) return new Date(post._raw.create_at);
  if (post.date) {
    try {
      const [day, month, year] = post.date.split("/");
      return new Date(year, month - 1, day);
    } catch {
      return new Date();
    }
  }
  return new Date();
};

const transformPost = (post) => {
  const createdAt = post.create_at || post.created_at || post.createAt || new Date().toISOString();
  const createdDate = new Date(createdAt);

  return {
    id: post._id,
    _id: post._id,
    _raw: post,
    title: post.content?.substring(0, 50) + (post.content?.length > 50 ? "..." : ""),
    content: post.content || "",
    author: post.user_id?.full_name || "Không xác định",
    authorRole: post.user_id?.role === "school_admin" ? "school" : (post.user_id?.role || "parent"),
    authorId: post.user_id?._id,
    avatar: post.user_id?.avatar_url,
    images: Array.isArray(post.images) ? post.images : [],
    date: createdDate.toLocaleDateString("vi-VN"),
    time: createdDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    category: post.class_id?.class_name || "Toàn trường",
    class_id: post.class_id,
    likes: post.likes_count ?? post.like_count ?? 0,
    comments: post.comments_count ?? post.comment_count ?? 0,
    isLiked: post.is_liked ?? false,
    status: post.status || "pending",
    scope: post.scope || (post.class_id ? "class" : "school"),
    create_at: createdAt
  };
};

const cardWrapperStyles = (isActive) => ({
  cursor: "pointer",
  transition: "all 0.2s ease",
  transform: isActive ? "translateY(-4px)" : "none",
  "& .MuiCard-root": {
    boxShadow: isActive ? "0 12px 24px rgba(94, 114, 228, 0.2)" : undefined,
    border: isActive ? "2px solid rgba(94, 114, 228, 0.3)" : "2px solid transparent"
  }
});

function ManagePost() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchFilters, setSearchFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: ""
  });
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await schoolAdminService.getAllPosts();
      if (!response?.success) {
        throw new Error(response?.message || "Không thể tải danh sách bài viết");
      }

      const data = response.data?.data || response.data || [];
      const transformed = data.map(transformPost).sort(
        (a, b) => new Date(b.create_at) - new Date(a.create_at)
      );
      setPosts(transformed);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err.message || "Đã xảy ra lỗi khi tải bài viết.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSearchChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearSearch = () => {
    setSearchFilters({
      search: "",
      dateFrom: "",
      dateTo: ""
    });
  };

  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    if (statusFilter !== "all") {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }

    if (searchFilters.search) {
      const term = searchFilters.search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.author?.toLowerCase().includes(term) ||
          post.content?.toLowerCase().includes(term) ||
          post.category?.toLowerCase().includes(term)
      );
    }

    if (searchFilters.dateFrom) {
      const fromDate = new Date(searchFilters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((post) => {
        const postDate = parsePostDate(post);
        postDate.setHours(0, 0, 0, 0);
        return postDate >= fromDate;
      });
    }

    if (searchFilters.dateTo) {
      const toDate = new Date(searchFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((post) => {
        const postDate = parsePostDate(post);
        postDate.setHours(23, 59, 59, 999);
        return postDate <= toDate;
      });
    }

    return filtered;
  }, [posts, statusFilter, searchFilters]);

  const statusCounts = useMemo(
    () => ({
      all: posts.length,
      pending: posts.filter((post) => post.status === "pending").length,
      approved: posts.filter((post) => post.status === "approved").length
    }),
    [posts]
  );

  const roleCounts = useMemo(() => {
    const dataset = filteredPosts;
    return {
      all: dataset.length,
      school: dataset.filter((post) => post.authorRole === "school").length,
      teacher: dataset.filter((post) => post.authorRole === "teacher").length,
      parent: dataset.filter((post) => post.authorRole === "parent").length
    };
  }, [filteredPosts]);

  const tabs = [
    { label: "Tất cả", value: "all" },
    { label: "Trường", value: "school" },
    { label: "Giáo viên", value: "teacher" },
    { label: "Phụ huynh", value: "parent" }
  ];

  const setTabByValue = (value) => {
    const targetIndex = tabs.findIndex((tab) => tab.value === value);
    if (targetIndex !== -1) {
      setActiveTab(targetIndex);
    }
  };
  const isAllCardActive = statusFilter === "all" && activeTab === 0;
  const isPendingCardActive = statusFilter === "pending" && activeTab === 0;
  const isApprovedCardActive = statusFilter === "approved" && activeTab === 0;

  const handleEditPost = (post) => {
    setEditingPost(post);
    setCreatePostModalOpen(true);
  };

  const handleDeletePost = async (postId) => {
    const response = await schoolAdminService.deletePost(postId);
    if (!response?.success) {
      throw new Error(response?.message || "Không thể xóa bài viết");
    }
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const handleApprovePost = async (post) => {
    try {
      const response = await schoolAdminService.updatePostStatus(post.id, "approved");
      if (!response?.success) {
        throw new Error(response?.message || "Không thể duyệt bài viết");
      }
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? { ...item, status: "approved" }
            : item
        )
      );
    } catch (err) {
      console.error("Approve post error:", err);
    }
  };

  const handleCommentCountUpdate = (postId, increment) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: (post.comments || 0) + increment }
          : post
      )
    );
  };

  const closeModal = () => {
    setCreatePostModalOpen(false);
    setEditingPost(null);
  };

  const handlePostMutation = async () => {
    await fetchPosts();
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Welcome Section */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Quản lý bài viết
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Xin chào {user?.full_name || "quản trị viên"}, hãy kiểm duyệt và quản lý mọi bài viết trong trường.
          </ArgonTypography>
        </ArgonBox>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3} justifyContent="center">
          <Grid item xs={12} md={4} lg={4}>
            <ArgonBox
              onClick={() => {
                setStatusFilter("all");
                setActiveTab(0);
              }}
              sx={cardWrapperStyles(isAllCardActive)}
            >
              <DetailedStatisticsCard
                title="Tổng bài viết"
                count={posts.length.toString()}
                icon={{ color: "info", component: <i className="ni ni-collection" /> }}
                percentage={{ color: "info", count: "+", text: "100% trong hệ thống" }}
              />
            </ArgonBox>
          </Grid>
          <Grid item xs={12} md={4} lg={4}>
            <ArgonBox
              onClick={() => {
                setStatusFilter("pending");
                setActiveTab(0);
              }}
              sx={cardWrapperStyles(isPendingCardActive)}
            >
              <DetailedStatisticsCard
                title="Chờ duyệt"
                count={statusCounts.pending.toString()}
                icon={{ color: "warning", component: <i className="ni ni-time-alarm" /> }}
                percentage={{ color: "warning", count: statusCounts.pending ? "!" : "0", text: "cần xử lý" }}
              />
            </ArgonBox>
          </Grid>
          <Grid item xs={12} md={4} lg={4}>
            <ArgonBox
              onClick={() => {
                setStatusFilter("approved");
                setActiveTab(0);
              }}
              sx={cardWrapperStyles(isApprovedCardActive)}
            >
              <DetailedStatisticsCard
                title="Đã duyệt"
                count={statusCounts.approved.toString()}
                icon={{ color: "success", component: <i className="ni ni-check-bold" /> }}
                percentage={{
                  color: "success",
                  count: statusCounts.approved > 0 ? "✓" : "0",
                  text: "bài viết đã duyệt"
                }}
              />
            </ArgonBox>
          </Grid>
        </Grid>

        {/* Toolbar */}
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            boxShadow: 3,
            p: 3,
            background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            border: "1px solid rgba(0,0,0,0.08)"
          }}
        >
          <Grid container spacing={3} alignItems="stretch">
            {/* Search */}
            <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <ArgonBox display="flex" alignItems="center" gap={1}>
                <i className="ni ni-zoom-split" style={{ fontSize: "20px", color: "#5e72e4" }} />
                <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                  Tìm kiếm bài viết
                </ArgonTypography>
              </ArgonBox>
              <Paper
                component="form"
                sx={{
                  p: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  border: "2px solid",
                  borderColor: "rgba(94, 114, 228, 0.2)",
                  background: "white",
                  transition: "all 0.3s ease",
                  flex: 1,
                  minHeight: "50px",
                  "&:hover": {
                    borderColor: "rgba(94, 114, 228, 0.4)",
                    boxShadow: "0 4px 12px rgba(94, 114, 228, 0.15)"
                  },
                  "&:focus-within": {
                    borderColor: "#5e72e4",
                    boxShadow: "0 4px 12px rgba(94, 114, 228, 0.2)"
                  }
                }}
              >
                <i className="ni ni-zoom-split" style={{ fontSize: "18px", color: "#5e72e4", marginRight: "8px" }} />
                <InputBase
                  sx={{
                    flex: 1,
                    fontSize: "15px",
                    fontWeight: "500",
                    "& input::placeholder": {
                      color: "rgba(0,0,0,0.5)",
                      fontWeight: "400"
                    }, '& .MuiInputBase-input': {
                      width: '100% !important',
                    }
                  }}
                  placeholder="Nhập từ khóa (tác giả, nội dung, lớp)..."
                  value={searchFilters.search}
                  onChange={(e) => handleSearchChange("search", e.target.value)}
                  inputProps={{ "aria-label": "search" }}
                />
                {searchFilters.search && (
                  <IconButton
                    size="small"
                    onClick={() => handleSearchChange("search", "")}
                    sx={{
                      color: "rgba(0,0,0,0.5)",
                      "&:hover": { color: "#5e72e4", backgroundColor: "rgba(94, 114, 228, 0.1)" }
                    }}
                  >
                    <i className="ni ni-fat-remove" />
                  </IconButton>
                )}
              </Paper>
            </Grid>

            {/* Tabs */}
            <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <ArgonBox display="flex" alignItems="center" gap={1}>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                  Nguồn bài viết
                </ArgonTypography>
              </ArgonBox>
              <Paper
                sx={{
                  p: { xs: 0.5, md: 1 },
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  background: "rgba(94, 114, 228, 0.05)",
                  flex: 1,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    width: "100%",
                    minHeight: 50,
                    "& .MuiTabs-flexContainer": {
                      gap: { xs: 1, md: 1.5 }
                    },
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "14px",
                      minHeight: 44,
                      borderRadius: 999,
                      px: 3,
                      color: "#525f7f",
                      backgroundColor: "transparent",
                      border: "1px solid transparent",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.7)",
                        color: "#344767"
                      }
                    },
                    "& .Mui-selected": {
                      backgroundColor: "white",
                      color: "#5e72e4",
                      border: "1px solid rgba(94,114,228,0.4)",
                      boxShadow: "0 6px 18px rgba(94, 114, 228, 0.2)"
                    },
                    "& .MuiTabs-indicator": {
                      display: "none"
                    }
                  }}
                >
                  {tabs.map((tab) => (
                    <Tab key={tab.value} label={tab.label} />
                  ))}
                </Tabs>
              </Paper>
            </Grid>
          </Grid>
        </Card>

        {/* Posts Feed */}
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sx={{ maxWidth: { xs: "100%", lg: "1100px" }, mx: "auto" }}>
            <Card
              sx={{
                mb: 2,
                borderRadius: 3,
                boxShadow: 3,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "1px solid rgba(255,255,255,0.2)"
              }}
            >
              <ArgonBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
                <ArgonTypography variant="h5" fontWeight="bold" color="white">
                  📝 Danh sách bài viết
                </ArgonTypography>
                <Button
                  variant="contained"
                  startIcon={<i className="ni ni-fat-add" />}
                  onClick={() => {
                    setEditingPost(null);
                    setCreatePostModalOpen(true);
                  }}
                  sx={{
                    textTransform: "none",
                    borderRadius: 3,
                    fontWeight: "bold",
                    backgroundColor: "white",
                    color: "#5e72e4 !important"
                  }}
                >
                  Tạo bài viết
                </Button>
              </ArgonBox>
            </Card>

            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 3,
                minHeight: "600px",
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                border: "1px solid rgba(255,255,255,0.2)"
              }}
            >
              <ArgonBox p={3}>
                <ArgonBox>
                  <ArgonBox
                    display="flex"
                    flexDirection={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "flex-end" }}
                    gap={2}
                    mb={3}
                  >
                    <ArgonBox
                      sx={{
                        flex: { xs: 1, sm: "0 0 auto" },
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        minWidth: { xs: "100%", sm: "200px" }
                      }}
                    >
                      <ArgonBox display="flex" alignItems="center" gap={0.5}>
                        <i className="ni ni-calendar-grid-58" style={{ fontSize: "16px", color: "#5e72e4" }} />
                        <ArgonTypography variant="caption" fontWeight="bold" color="text">
                          Từ ngày
                        </ArgonTypography>
                      </ArgonBox>
                      <TextField
                        type="date"
                        value={searchFilters.dateFrom}
                        onChange={(e) => handleSearchChange("dateFrom", e.target.value)}
                        size="small"
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "white",
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,1)",
                              borderColor: "#5e72e4"
                            },
                            "&.Mui-focused": {
                              backgroundColor: "rgba(255,255,255,1)",
                              borderColor: "#5e72e4"
                            }
                          }
                        }}
                        InputLabelProps={{
                          shrink: true
                        }}
                      />
                    </ArgonBox>

                    <ArgonBox
                      sx={{
                        flex: { xs: 1, sm: "0 0 auto" },
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        minWidth: { xs: "100%", sm: "200px" }
                      }}
                    >
                      <ArgonBox display="flex" alignItems="center" gap={0.5}>
                        <i className="ni ni-calendar-grid-58" style={{ fontSize: "16px", color: "#5e72e4" }} />
                        <ArgonTypography variant="caption" fontWeight="bold" color="text">
                          Đến ngày
                        </ArgonTypography>
                      </ArgonBox>
                      <TextField
                        type="date"
                        value={searchFilters.dateTo}
                        onChange={(e) => handleSearchChange("dateTo", e.target.value)}
                        size="small"
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "white",
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,1)",
                              borderColor: "#5e72e4"
                            },
                            "&.Mui-focused": {
                              backgroundColor: "rgba(255,255,255,1)",
                              borderColor: "#5e72e4"
                            }
                          }
                        }}
                        InputLabelProps={{
                          shrink: true
                        }}
                      />
                    </ArgonBox>

                    {(searchFilters.dateFrom || searchFilters.dateTo) && (
                      <ArgonBox
                        display="flex"
                        alignItems={{ xs: "stretch", sm: "flex-end" }}
                        sx={{ minWidth: { xs: "100%", sm: "auto" } }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleClearSearch}
                          startIcon={<i className="ni ni-fat-remove" />}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: "bold",
                            borderColor: "rgba(244, 67, 54, 0.5)",
                            color: "#f44336",
                            px: 3,
                            py: 0,
                            minHeight: 31,
                            width: { xs: "100%", sm: "auto" },
                            "&:hover": {
                              borderColor: "#f44336",
                              backgroundColor: "rgba(244, 67, 54, 0.08)"
                            }
                          }}
                        >
                          Xóa lọc
                        </Button>
                      </ArgonBox>
                    )}
                  </ArgonBox>

                  {error && (
                    <Card
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        border: "1px solid rgba(244, 67, 54, 0.2)",
                        backgroundColor: "rgba(244, 67, 54, 0.08)"
                      }}
                    >
                      <ArgonBox p={3}>
                        <ArgonTypography variant="body1" color="error" fontWeight="bold">
                          {error}
                        </ArgonTypography>
                        <Button
                          variant="outlined"
                          color="error"
                          sx={{ mt: 2, textTransform: "none", borderRadius: 2 }}
                          onClick={fetchPosts}
                        >
                          Thử tải lại
                        </Button>
                      </ArgonBox>
                    </Card>
                  )}

                  <PostsFeed
                    activeTab={activeTab}
                    tabs={tabs}
                    posts={filteredPosts}
                    currentUserId={user?.id}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                    onApprovePost={handleApprovePost}
                    onUpdateCommentCount={handleCommentCountUpdate}
                    isAdmin
                    loading={loading}
                    error={error}
                  />
                </ArgonBox>
              </ArgonBox>
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>

      <CreatePostModal
        open={createPostModalOpen}
        onClose={closeModal}
        post={editingPost}
        onPostCreated={handlePostMutation}
        isAdmin
      />

      <Footer />
    </DashboardLayout>
  );
}

export default ManagePost;
