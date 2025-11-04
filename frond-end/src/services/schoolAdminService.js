import api from './api';

const schoolAdminService = {
  // Posts
  getAllPosts: async () => {
    return await api.get('/school-admin/posts', true);
  },

  getPostById: async (postId) => {
    return await api.get(`/school-admin/posts/${postId}`, true);
  },

  createPost: async (postData) => {
    return await api.post('/school-admin/posts', postData, true);
  },

  updatePost: async (postId, postData) => {
    return await api.put(`/school-admin/posts/${postId}`, postData, true);
  },

  deletePost: async (postId) => {
    return await api.delete(`/school-admin/posts/${postId}`, true);
  },

  updatePostStatus: async (postId, status) => {
    return await api.put(`/school-admin/posts/${postId}/status`, { status }, true);
  },

  // Comments
  getComments: async (postId) => {
    return await api.get(`/school-admin/posts/${postId}/comments`, true);
  },

  createComment: async (postId, contents, parentCommentId = null) => {
    return await api.post(`/school-admin/posts/${postId}/comments`, {
      contents,
      parent_comment_id: parentCommentId
    }, true);
  },

  deleteComment: async (commentId) => {
    return await api.delete(`/school-admin/posts/comments/${commentId}`, true);
  },

  // Likes
  getLikes: async (postId) => {
    return await api.get(`/school-admin/posts/${postId}/likes`, true);
  },
};

export default schoolAdminService;
