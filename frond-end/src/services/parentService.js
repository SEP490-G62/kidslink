import apiService from './api';

class ParentService {
  /**
   * Lấy tất cả bài post cho phụ huynh
   * Backend sẽ tự động lấy lớp con đang học và trạng thái published
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getAllPosts() {
    try {
      // Gọi API không cần tham số
      const data = await apiService.get('/api/parent/posts');
      
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
}

const parentService = new ParentService();

export default parentService;
