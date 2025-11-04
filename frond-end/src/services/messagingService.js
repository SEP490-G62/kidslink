import apiService from './api';

class MessagingService {
  /**
   * Lấy danh sách conversations của user
   * @param {number} page - Số trang
   * @param {number} limit - Số lượng mỗi trang
   * @returns {Promise<Object>}
   */
  async getConversations(page = 1, limit = 20) {
    try {
      const data = await apiService.get(`/api/messaging/conversations?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('MessagingService.getConversations Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy danh sách cuộc trò chuyện'
      };
    }
  }

  /**
   * Lấy thông tin chi tiết conversation
   * @param {string} conversationId - ID của conversation
   * @returns {Promise<Object>}
   */
  async getConversation(conversationId) {
    try {
      const data = await apiService.get(`/api/messaging/conversations/${conversationId}`);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('MessagingService.getConversation Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy thông tin cuộc trò chuyện'
      };
    }
  }

  /**
   * Lấy danh sách messages trong conversation
   * @param {string} conversationId - ID của conversation
   * @param {number} page - Số trang
   * @param {number} limit - Số lượng mỗi trang
   * @returns {Promise<Object>}
   */
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const data = await apiService.get(
        `/api/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
      );
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('MessagingService.getMessages Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy danh sách tin nhắn'
      };
    }
  }

  /**
   * Gửi tin nhắn (REST API - fallback)
   * @param {string} conversationId - ID của conversation
   * @param {string} content - Nội dung tin nhắn
   * @returns {Promise<Object>}
   */
  async sendMessage(conversationId, content) {
    try {
      const data = await apiService.post('/api/messaging/messages', {
        conversation_id: conversationId,
        content: content
      });
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('MessagingService.sendMessage Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi gửi tin nhắn'
      };
    }
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   * @param {string} conversationId - ID của conversation
   * @returns {Promise<Object>}
   */
  async markAsRead(conversationId) {
    try {
      const data = await apiService.put(`/api/messaging/conversations/${conversationId}/read`);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('MessagingService.markAsRead Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi đánh dấu đã đọc'
      };
    }
  }

  /**
   * Lấy số lượng tin nhắn chưa đọc
   * @returns {Promise<Object>}
   */
  async getUnreadCount() {
    try {
      const data = await apiService.get('/api/messaging/unread-count');
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('MessagingService.getUnreadCount Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy số lượng tin nhắn chưa đọc'
      };
    }
  }

  /**
   * Tạo nhóm chat cho lớp (dành cho giáo viên)
   * @param {string} classId - ID của lớp học
   * @param {string} title - Tiêu đề nhóm chat (optional)
   * @returns {Promise<Object>}
   */
  async createClassChatGroup(classId, title = null) {
    try {
      const body = { class_id: classId };
      if (title) {
        body.title = title;
      }
      const data = await apiService.post('/teachers/class/chat-group', body);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('MessagingService.createClassChatGroup Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi tạo nhóm chat cho lớp'
      };
    }
  }
}

// Tạo instance duy nhất
const messagingService = new MessagingService();

export default messagingService;



