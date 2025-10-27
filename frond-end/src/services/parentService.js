import apiService from './api';

class ParentService {
  /**
   * Lấy tất cả bài post cho phụ huynh
   * Backend sẽ tự động lấy lớp con đang học và trạng thái published
   * @param {string} studentId - ID của học sinh (optional, để filter posts by child)
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getAllPosts(studentId = null) {
    try {
      const url = studentId 
        ? `/parent/posts?student_id=${studentId}` 
        : '/parent/posts';
      const data = await apiService.get(url);
      
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
      const response = await apiService.post(`/parent/posts/${postId}/like`, {}, true);
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
      const response = await apiService.get(`/parent/posts/${postId}/likes?page=${page}&limit=${limit}`);
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
      
      const response = await apiService.post(`/parent/posts/${postId}/comments`, data, true);
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
      const response = await apiService.get(`/parent/posts/${postId}/comments?page=${page}&limit=${limit}`);
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
      const response = await apiService.put(`/parent/comments/${commentId}`, { contents });
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
      const response = await apiService.delete(`/parent/comments/${commentId}`);
      return response;
    } catch (error) {
      console.error('ParentService.deleteComment Error:', error);
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
   * @param {string} student_id - ID của học sinh (optional, để xác định lớp học)
   * @returns {Promise<Object>} - Kết quả API call
   */
  async createPost(content, images = [], student_id = null) {
    try {
      const data = { content, images };
      if (student_id) {
        data.student_id = student_id;
      }
      const response = await apiService.post('/parent/posts', data, true);
      return response;
    } catch (error) {
      console.error('ParentService.createPost Error:', error);
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
      const response = await apiService.put(`/parent/posts/${postId}`, data);
      return response;
    } catch (error) {
      console.error('ParentService.updatePost Error:', error);
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
      const response = await apiService.delete(`/parent/posts/${postId}`);
      return response;
    } catch (error) {
      console.error('ParentService.deletePost Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi xóa bài đăng'
      };
    }
  }

  /**
   * Lấy danh sách con của phụ huynh
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getChildren() {
    try {
      const response = await apiService.get('/parent/children');
      return response;
    } catch (error) {
      console.error('ParentService.getChildren Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy danh sách con'
      };
    }
  }

  /**
   * Lấy thông tin cá nhân của phụ huynh
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getPersonalInfo() {
    try {
      const response = await apiService.get('/parent/personal-info');
      return response;
    } catch (error) {
      console.error('ParentService.getPersonalInfo Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy thông tin cá nhân'
      };
    }
  }

  /**
   * Cập nhật thông tin cá nhân của phụ huynh
   * @param {Object} userData - Dữ liệu cập nhật (full_name, email, phone_number, avatar_url, password)
   * @returns {Promise<Object>} - Kết quả API call
   */
  async updatePersonalInfo(userData) {
    try {
      const response = await apiService.put('/parent/personal-info', userData);
      return response;
    } catch (error) {
      console.error('ParentService.updatePersonalInfo Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi cập nhật thông tin cá nhân'
      };
    }
  }
}

const parentService = new ParentService();

export default parentService;
