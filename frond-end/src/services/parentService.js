import apiService from './api';

class ParentService {
  /**
   * Lấy tất cả bài post cho phụ huynh
   * Backend sẽ tự động lấy lớp con đang học và trạng thái published
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getAllPosts() {
    try {
      // Gọi API không cần authentication (tạm thời)
      const data = await apiService.get('/api/parent/posts', false);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('ParentService.getAllPosts Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy danh sách bài đăng'
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
      // Gọi API không cần authentication (tạm thời)
      const response = await apiService.post(`/api/parent/posts/${postId}/like`, {}, false);
      return response;
    } catch (error) {
      console.error('ParentService.toggleLike Error:', error);
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
      // Gọi API không cần authentication (tạm thời)
      const response = await apiService.get(`/api/parent/posts/${postId}/likes?page=${page}&limit=${limit}`, false);
      return response;
    } catch (error) {
      console.error('ParentService.getLikes Error:', error);
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
      
      // Gọi API không cần authentication (tạm thời)
      const response = await apiService.post(`/api/parent/posts/${postId}/comments`, data, false);
      return response;
    } catch (error) {
      console.error('ParentService.createComment Error:', error);
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
      // Gọi API không cần authentication (tạm thời)
      const response = await apiService.get(`/api/parent/posts/${postId}/comments?page=${page}&limit=${limit}`, false);
      return response;
    } catch (error) {
      console.error('ParentService.getComments Error:', error);
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
      // Gọi API không cần authentication (tạm thời)
      const response = await apiService.put(`/api/parent/comments/${commentId}`, { contents }, false);
      return response;
    } catch (error) {
      console.error('ParentService.updateComment Error:', error);
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
      // Gọi API không cần authentication (tạm thời)
      const response = await apiService.delete(`/api/parent/comments/${commentId}`, false);
      return response;
    } catch (error) {
      console.error('ParentService.deleteComment Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi xóa comment'
      };
    }
  }
}

const parentService = new ParentService();

export default parentService;
