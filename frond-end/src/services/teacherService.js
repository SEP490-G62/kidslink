import apiService from './api';

class TeacherService {
  async getMyProfile() {
    return apiService.get('/teachers/profile');
  }

  async updateMyProfile(payload) {
    return apiService.put('/teachers/profile', payload);
  }

  async uploadAvatar(imageDataUrl) {
    // imageDataUrl: data URL (base64) or remote URL
    return apiService.post('/teachers/profile/avatar', { image: imageDataUrl });
  }

  /**
   * Lấy tất cả bài post cho giáo viên
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getAllPosts() {
    try {
      const data = await apiService.get('/teachers/posts');
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('TeacherService.getAllPosts Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy danh sách bài đăng'
      };
    }
  }

  /**
   * Lấy tất cả bài post của giáo viên hiện tại (bao gồm pending và approved)
   * @param {string} userId - ID của user
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getMyPosts(userId) {
    if (!userId) {
      return {
        success: false,
        error: 'User ID không hợp lệ',
        data: { data: [] }
      };
    }
    
    try {
      const response = await apiService.get(`/teachers/posts/my-posts?user_id=${userId}`);
      return {
        success: response.success !== false,
        data: response.data ? { data: response.data } : response
      };
    } catch (error) {
      console.error('TeacherService.getMyPosts Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy bài viết của bạn',
        data: { data: [] }
      };
    }
  }

  /**
   * Like/Unlike bài post
   * @param {string} postId - ID của bài post
   * @returns {Promise<Object>} - Kết quả API call
   */
  async toggleLike(postId) {
    try {
      const response = await apiService.post(`/teachers/posts/${postId}/like`, {}, true);
      return response;
    } catch (error) {
      console.error('TeacherService.toggleLike Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi xử lý like'
      };
    }
  }

  /**
   * Lấy danh sách user đã like bài post
   * @param {string} postId - ID của bài post
   * @param {number} page - Trang hiện tại
   * @param {number} limit - Số lượng item per page
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getLikes(postId, page = 1, limit = 10) {
    try {
      const response = await apiService.get(`/teachers/posts/${postId}/likes?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('TeacherService.getLikes Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy danh sách like'
      };
    }
  }

  /**
   * Tạo comment mới
   * @param {string} postId - ID của bài post
   * @param {string} contents - Nội dung comment
   * @param {string} parentCommentId - ID của comment cha (cho reply)
   * @returns {Promise<Object>} - Kết quả API call
   */
  async createComment(postId, contents, parentCommentId = null) {
    try {
      const data = { contents };
      if (parentCommentId) {
        data.parent_comment_id = parentCommentId;
      }
      
      const response = await apiService.post(`/teachers/posts/${postId}/comments`, data, true);
      return response;
    } catch (error) {
      console.error('TeacherService.createComment Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi tạo comment'
      };
    }
  }

  /**
   * Lấy danh sách comment của bài post
   * @param {string} postId - ID của bài post
   * @param {number} page - Trang hiện tại
   * @param {number} limit - Số lượng item per page
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getComments(postId, page = 1, limit = 10) {
    try {
      const response = await apiService.get(`/teachers/posts/${postId}/comments?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('TeacherService.getComments Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy danh sách comment'
      };
    }
  }

  /**
   * Cập nhật comment
   * @param {string} commentId - ID của comment
   * @param {string} contents - Nội dung comment mới
   * @returns {Promise<Object>} - Kết quả API call
   */
  async updateComment(commentId, contents) {
    try {
      const response = await apiService.put(`/teachers/comments/${commentId}`, { contents });
      return response;
    } catch (error) {
      console.error('TeacherService.updateComment Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi cập nhật comment'
      };
    }
  }

  /**
   * Xóa comment
   * @param {string} commentId - ID của comment
   * @returns {Promise<Object>} - Kết quả API call
   */
  async deleteComment(commentId) {
    try {
      const response = await apiService.delete(`/teachers/comments/${commentId}`);
      return response;
    } catch (error) {
      console.error('TeacherService.deleteComment Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi xóa comment'
      };
    }
  }

  /**
   * Tạo bài post mới
   * @param {string} content - Nội dung bài post
   * @param {Array} images - Mảng các base64 images hoặc URLs
   * @param {string} class_id - ID của lớp học (optional)
   * @returns {Promise<Object>} - Kết quả API call
   */
  async createPost(content, images = [], class_id = null) {
    try {
      const data = { content, images };
      if (class_id) {
        data.class_id = class_id;
      }
      const response = await apiService.post('/teachers/posts', data, true);
      return response;
    } catch (error) {
      console.error('TeacherService.createPost Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi tạo bài đăng'
      };
    }
  }

  /**
   * Cập nhật bài post
   * @param {string} postId - ID của bài post
   * @param {string} content - Nội dung bài post mới
   * @param {Array} images - Mảng các base64 images hoặc URLs
   * @returns {Promise<Object>} - Kết quả API call
   */
  async updatePost(postId, content, images = []) {
    try {
      const data = { content, images };
      const response = await apiService.put(`/teachers/posts/${postId}`, data);
      return response;
    } catch (error) {
      console.error('TeacherService.updatePost Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi cập nhật bài đăng'
      };
    }
  }

  /**
   * Xóa bài post
   * @param {string} postId - ID của bài post
   * @returns {Promise<Object>} - Kết quả API call
   */
  async deletePost(postId) {
    try {
      const response = await apiService.delete(`/teachers/posts/${postId}`);
      return response;
    } catch (error) {
      console.error('TeacherService.deletePost Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi xóa bài đăng'
      };
    }
  }

  /**
   * Lấy danh sách loại đơn (complaint types) cho teacher
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getComplaintTypes() {
    try {
      const response = await apiService.get('/teachers/complaints/types');
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('TeacherService.getComplaintTypes Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy danh sách loại đơn',
        data: []
      };
    }
  }

  /**
   * Tạo đơn khiếu nại/góp ý mới
   * @param {string} complaint_type_id - ID của loại đơn
   * @param {string} reason - Nội dung khiếu nại/góp ý
   * @param {string} image - Base64 string của ảnh (tùy chọn)
   * @returns {Promise<Object>} - Kết quả API call
   */
  async createComplaint(complaint_type_id, reason, image = null) {
    try {
      const data = { complaint_type_id, reason };
      if (image) {
        data.image = image;
      }
      const response = await apiService.post('/teachers/complaints', data, true);
      return response;
    } catch (error) {
      console.error('TeacherService.createComplaint Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi gửi đơn'
      };
    }
  }

  /**
   * Lấy danh sách đơn của teacher
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getMyComplaints() {
    try {
      const response = await apiService.get('/teachers/complaints');
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('TeacherService.getMyComplaints Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy danh sách đơn',
        data: []
      };
    }
  }

  /**
   * Lấy chi tiết một đơn
   * @param {string} complaintId - ID của đơn
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getComplaintById(complaintId) {
    try {
      const response = await apiService.get(`/teachers/complaints/${complaintId}`);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('TeacherService.getComplaintById Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy chi tiết đơn'
      };
    }
  }

  async changePassword(currentPassword, newPassword) {
    return apiService.put('/users/change-password', { currentPassword, newPassword }, true);
  }
}

const teacherService = new TeacherService();

export default teacherService;


