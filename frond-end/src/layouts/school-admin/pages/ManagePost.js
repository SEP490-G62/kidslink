import React, { useEffect, useState } from "react";
import { Tabs, Tab, Chip, IconButton, Tooltip } from "@mui/material";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import PostCard from "layouts/parent/posts/PostCard";
import CreatePostModal from "layouts/parent/posts/CreatePostModal";
import GalleryModal from "layouts/parent/posts/GalleryModal";
import LikesModal from "layouts/parent/posts/LikesModal";
import CommentModal from "layouts/parent/posts/CommentModal";
import api from "services/api";
import schoolAdminService from "services/schoolAdminService";

const ManagePost = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'

  useEffect(() => {
    // Lấy thông tin user hiện tại
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user._id || user.id);
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/school-admin/posts", true);
      console.log("API Response:", res);
      const postsArray = res.data?.data || res.data || [];
      const postsData = postsArray.map(post => ({
        ...post,
        id: post._id,
        // Map thông tin tác giả từ user_id
        author: post.user_id?.full_name || 'Người dùng',
        authorId: post.user_id?._id || post.user_id,
        avatar: post.user_id?.avatar_url || '',
        // Format date và time
        date: new Date(post.create_at).toLocaleDateString('vi-VN'),
        time: new Date(post.create_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }));
      console.log("Posts data after mapping:", postsData);
      setPosts(postsData);
    } catch (e) {
      console.error("Error fetching posts:", e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPost(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (post) => {
    setSelectedPost(post);
    setCreateModalOpen(true);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài đăng này?")) return;
    try {
      await api.delete(`/school-admin/posts/${postId}`, true);
      fetchPosts();
    } catch (e) {
      console.error("Delete error:", e);
      alert("Lỗi xóa bài đăng: " + (e.message || "Vui lòng thử lại"));
    }
  };

  const handleApprove = async (postId) => {
    try {
      await schoolAdminService.updatePostStatus(postId, 'approved');
      fetchPosts();
    } catch (e) {
      console.error("Approve error:", e);
      alert("Lỗi duyệt bài: " + (e.message || "Vui lòng thử lại"));
    }
  };

  

  const handleLike = async (postId) => {
    try {
      const response = await schoolAdminService.toggleLike(postId);
      if (response.data?.success) {
        // Update post like status in local state
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              const currentLikes = post.like_count || post.likes_count || 0;
              const isLiked = response.data.isLiked;
              return {
                ...post,
                is_liked: isLiked,
                isLiked: isLiked,
                like_count: isLiked ? currentLikes + 1 : currentLikes - 1,
                likes_count: isLiked ? currentLikes + 1 : currentLikes - 1
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Lỗi khi thích bài đăng: " + (error.message || "Vui lòng thử lại"));
    }
  };

  const handleSuccess = () => {
    fetchPosts();
    setCreateModalOpen(false);
    setSelectedPost(null);
  };

  // Filter posts by status
  const filteredPosts = posts.filter(post => {
    if (statusFilter === 'all') return true;
    return post.status === statusFilter;
  });

  const pendingCount = posts.filter(p => p.status === 'pending').length;
  const approvedCount = posts.filter(p => p.status === 'approved').length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} position="relative" zIndex={3}>
        <ArgonBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h5" fontWeight="bold" color="white">
            Quản lý bài đăng
          </ArgonTypography>
          <ArgonButton color="info" onClick={handleCreate} variant="gradient">
            + Tạo bài đăng
          </ArgonButton>
        </ArgonBox>
        
        {/* Status Filter Tabs */}
        <ArgonBox mb={3} bgcolor="white" borderRadius={2} p={2}>
          <Tabs 
            value={statusFilter} 
            onChange={(e, newValue) => setStatusFilter(newValue)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label={`Tất cả (${posts.length})`} value="all" />
            <Tab 
              label={
                <ArgonBox display="flex" alignItems="center" gap={1}>
                  Chờ duyệt
                  {pendingCount > 0 && (
                    <Chip 
                      label={pendingCount} 
                      size="small" 
                      color="warning" 
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </ArgonBox>
              } 
              value="pending" 
            />
            <Tab label={`Đã duyệt (${approvedCount})`} value="approved" />
          </Tabs>
        </ArgonBox>
        {loading ? (
          <ArgonBox p={3} bgcolor="white" borderRadius={2}>
            <ArgonTypography variant="body2">Đang tải dữ liệu...</ArgonTypography>
          </ArgonBox>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <ArgonBox key={post._id} mb={2}>
              <ArgonBox display="flex" alignItems="center" mb={1}>
                <Chip 
                  label={post.status === 'pending' ? 'Chờ duyệt' : 'Đã duyệt'}
                  color={post.status === 'pending' ? 'warning' : 'success'}
                  size="small"
                />
              </ArgonBox>
              <PostCard
                post={post}
                currentUserId={currentUserId}
                onLike={() => handleLike(post._id)}
                onComment={() => { setSelectedPost(post); setCommentOpen(true); }}
                onShowLikes={() => { setSelectedPost(post); setLikesOpen(true); }}
                onOpenGallery={() => { setSelectedPost(post); setGalleryOpen(true); }}
                {...(post.status === 'pending' ? {
                  onApprovePost: () => handleApprove(post._id)
                } : {})}
                {...(post.status === 'approved' ? {
                  onEditPost: () => handleEdit(post),
                  onDeletePost: () => handleDelete(post._id)
                } : {})}
              />
            </ArgonBox>
          ))
        ) : (
          <ArgonBox p={3} bgcolor="white" borderRadius={2} textAlign="center">
            <ArgonTypography variant="h6" color="text" mb={1}>
              Chưa có bài đăng nào
            </ArgonTypography>
            <ArgonTypography variant="body2" color="text">
              Nhấn nút &ldquo;Tạo bài đăng&rdquo; để thêm bài đăng mới
            </ArgonTypography>
          </ArgonBox>
        )}
        <CreatePostModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          postData={selectedPost}
          onSuccess={handleSuccess}
          isAdmin
        />
        <GalleryModal
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          images={selectedPost?.images || []}
          currentIndex={0}
        />
        <LikesModal
          open={likesOpen}
          onClose={() => setLikesOpen(false)}
          post={selectedPost}
        />
        <CommentModal
          open={commentOpen}
          onClose={() => setCommentOpen(false)}
          selectedPost={selectedPost}
          onUpdateCommentCount={() => fetchPosts()}
          isAdmin
        />
      </ArgonBox>
    </DashboardLayout>
  );
};

export default ManagePost;
