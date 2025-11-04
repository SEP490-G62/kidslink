import React, { useEffect, useState } from "react";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import PostCard from "layouts/parent/posts/PostCard";
import CreatePostModal from "layouts/parent/posts/CreatePostModal";
import GalleryModal from "layouts/parent/posts/GalleryModal";
import LikesModal from "layouts/parent/posts/LikesModal";
import CommentModal from "layouts/parent/posts/CommentModal";
import api from "services/api";

const ManagePost = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

  useEffect(() => {
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
        id: post._id
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

  const handleSuccess = () => {
    fetchPosts();
    setCreateModalOpen(false);
    setSelectedPost(null);
  };

  return (
    <DashboardLayout>
      <ArgonBox py={3} position="relative" zIndex={3}>
        <ArgonBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h5" fontWeight="bold" color="white">
            Quản lý bài đăng
          </ArgonTypography>
          <ArgonButton color="info" onClick={handleCreate} variant="gradient">
            + Tạo bài đăng
          </ArgonButton>
        </ArgonBox>
        {loading ? (
          <ArgonBox p={3} bgcolor="white" borderRadius={2}>
            <ArgonTypography variant="body2">Đang tải dữ liệu...</ArgonTypography>
          </ArgonBox>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onEdit={() => handleEdit(post)}
              onDelete={() => handleDelete(post._id)}
              onGallery={() => { setSelectedPost(post); setGalleryOpen(true); }}
              onLikes={() => { setSelectedPost(post); setLikesOpen(true); }}
              onComment={() => { setSelectedPost(post); setCommentOpen(true); }}
              isAdmin
            />
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
