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
   * Lấy tất cả bài post của user hiện tại (bao gồm pending và approved)
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
      const response = await apiService.get(`/parent/posts/my-posts?user_id=${userId}`);
      
      // Backend trả về { success: true, data: [...] } hoặc { data: [...] }
      return {
        success: response.success !== false,
        data: response.data ? { data: response.data } : response
      };
    } catch (error) {
      console.error('ParentService.getMyPosts Error:', error);
      // Nếu API không tồn tại, trả về empty array thay vì error
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

  /**
   * Lấy thông tin chi tiết của học sinh (thông tin cá nhân, sức khỏe, người đón)
   * @param {string} studentId - ID của học sinh
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getChildInfo(studentId) {
    try {
      const response = await apiService.get(`/parent/child-info/${studentId}`);
      return response;
    } catch (error) {
      console.error('ParentService.getChildInfo Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy thông tin học sinh'
      };
    }
  }

  /**
   * Thêm người đón mới
   * @param {string} studentId - ID của học sinh
   * @param {Object} pickupData - Dữ liệu người đón (full_name, relationship, id_card_number, avatar_url, phone)
   * @returns {Promise<Object>} - Kết quả API call
   */
  async addPickup(studentId, pickupData) {
    try {
      const response = await apiService.post(`/parent/pickups/${studentId}`, pickupData);
      return response;
    } catch (error) {
      console.error('ParentService.addPickup Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi thêm người đón'
      };
    }
  }

  /**
   * Cập nhật người đón
   * @param {string} pickupId - ID của người đón
   * @param {string} studentId - ID của học sinh
   * @param {Object} pickupData - Dữ liệu người đón
   * @returns {Promise<Object>} - Kết quả API call
   */
  async updatePickup(pickupId, studentId, pickupData) {
    try {
      const response = await apiService.put(`/parent/pickups/${pickupId}/${studentId}`, pickupData);
      return response;
    } catch (error) {
      console.error('ParentService.updatePickup Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi cập nhật người đón'
      };
    }
  }

  /**
   * Xóa người đón
   * @param {string} pickupId - ID của người đón
   * @param {string} studentId - ID của học sinh
   * @returns {Promise<Object>} - Kết quả API call
   */
  async deletePickup(pickupId, studentId) {
    try {
      const response = await apiService.delete(`/parent/pickups/${pickupId}/${studentId}`);
      return response;
    } catch (error) {
      console.error('ParentService.deletePickup Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi xóa người đón'
      };
    }
  }

  /**
   * Lấy toàn bộ daily reports theo học sinh
   * @param {string} studentId
   */
  async getDailyReports(studentId) {
    try {
      const params = new URLSearchParams();
      if (studentId) params.append('student_id', studentId);
      const url = `/parent/daily-reports?${params.toString()}`;
      const response = await apiService.get(url);
      return response;
    } catch (error) {
      console.error('ParentService.getDailyReports Error:', error);
      return { success: false, error: error.message || 'Lỗi lấy daily reports' };
    }
  }

  /**
   * Lấy lịch học lớp theo năm học mới nhất của con
   * @param {string} studentId - optional, để chọn con cụ thể
   */
  async getLatestClassCalendar(studentId) {
    try {
      const params = new URLSearchParams();
      if (studentId) params.append('student_id', studentId);
      const url = `/parent/class-calendar?${params.toString()}`;
      const response = await apiService.get(url);
      return response;
    } catch (error) {
      console.error('ParentService.getLatestClassCalendar Error:', error);
      return { success: false, error: error.message || 'Lỗi lấy lịch lớp' };
    }
  }

  /**
   * Lấy danh sách khung giờ (slots) chuẩn để render cột thời gian
   */
  async getClassTimeSlots() {
    try {
      const response = await apiService.get('/parent/class-calendar/slots');
      // Chuẩn hóa trả về mảng
      return Array.isArray(response?.data) ? response.data : (response?.data?.data || []);
    } catch (error) {
      console.error('ParentService.getClassTimeSlots Error:', error);
      return [];
    }
  }


  /**
   * Lấy thực đơn tuần theo con và ngày bắt đầu tuần (Thứ 2)
   * @param {string} studentId - optional, để chọn con cụ thể
   * @param {string} startDateISO - YYYY-MM-DD (ngày bất kỳ trong tuần; backend sẽ tự tính Thứ 2)
   */
  async getWeeklyMenu(studentId) {
    try {
      const params = new URLSearchParams();
      if (studentId) params.append('student_id', studentId);
      const url = `/parent/menu?${params.toString()}`;
      const response = await apiService.get(url);
      return response;
    } catch (error) {
      console.error('ParentService.getWeeklyMenu Error:', error);
      return { success: false, error: error.message || 'Lỗi lấy thực đơn tuần' };
    }
  }

  /**
   * Lấy danh sách loại đơn (complaint types) cho parent
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getComplaintTypes() {
    try {
      const response = await apiService.get('/parent/complaints/types');
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('ParentService.getComplaintTypes Error:', error);
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
      const response = await apiService.post('/parent/complaints', data, true);
      return response;
    } catch (error) {
      console.error('ParentService.createComplaint Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi gửi đơn'
      };
    }
  }

  /**
   * Lấy danh sách đơn của parent
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getMyComplaints() {
    try {
      const response = await apiService.get('/parent/complaints');
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('ParentService.getMyComplaints Error:', error);
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
      const response = await apiService.get(`/parent/complaints/${complaintId}`);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('ParentService.getComplaintById Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy chi tiết đơn'
      };
    }
  }

  /**
   * Lấy danh sách các khoản thu của lớp có academic year lớn nhất cho mỗi student
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getStudentFees() {
    try {
      const response = await apiService.get('/parent/fees');
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('ParentService.getStudentFees Error:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi lấy danh sách khoản thu',
        data: []
      };
    }
  }

  /**
   * Tạo yêu cầu thanh toán PayOS cho phụ huynh
   * @param {Object} payload - { student_id, class_fee_id, student_class_id, invoice_id? }
   * @returns {Promise<Object>}
   */
  async createPayOSPayment(payload) {
    try {
      const response = await apiService.post('/parent/fees/payos', payload, true);
      return response;
    } catch (error) {
      console.error('ParentService.createPayOSPayment Error:', error);
      const message = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo yêu cầu thanh toán';
      return {
        success: false,
        error: message,
        data: error?.response?.data || null
      };
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán PayOS theo order_code
   * @param {number|string} orderCode
   * @returns {Promise<Object>}
   */
  async checkPayOSPaymentStatus(orderCode) {
    if (!orderCode) {
      return {
        success: false,
        error: 'order_code không hợp lệ'
      };
    }
    try {
      const response = await apiService.post('/parent/fees/payos/status', { order_code: orderCode }, true);
      return response;
    } catch (error) {
      console.error('ParentService.checkPayOSPaymentStatus Error:', error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.message || 'Không thể kiểm tra trạng thái thanh toán'
      };
    }
  }
}

const parentService = new ParentService();

export default parentService;
