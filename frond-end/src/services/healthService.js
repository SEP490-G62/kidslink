import apiService from './api';

class HealthService {
  /**
   * Lấy danh sách tất cả các lớp học (cho health care staff).
   * @returns {Promise<Object>} - Kết quả API call
   */
  async getClasses() {
    try {
      const data = await apiService.get('/health-staff/classes');
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi lấy danh sách lớp' };
    }
  }

  /**
   * Lấy danh sách học sinh của một lớp
   * @param {string} classId
   */
  async getStudentsByClass(classId) {
    try {
      const data = await apiService.get(`/health-staff/classes/${classId}/students`);
      return { success: true, data: data.students || [] };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi lấy học sinh theo lớp' };
    }
  }

  /**
   * Lấy toàn bộ health record của 1 học sinh
   * @param {string} studentId
   */
  async getHealthRecords(studentId) {
    try {
      const url = `/health-staff/health/records?student_id=${studentId}`;
      const data = await apiService.get(url);
      return { success: true, data: data.records || [] };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi lấy hồ sơ sức khoẻ' };
    }
  }

  /**
   * Tạo hồ sơ sức khoẻ (health record)
   * @param {Object} payload
   */
  async createHealthRecord(payload) {
    try {
      const data = await apiService.post('/health-staff/health/records', payload);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi tạo hồ sơ sức khoẻ' };
    }
  }

  /**
   * Cập nhật sổ sức khoẻ
   */
  async updateHealthRecord(id, payload) {
    try {
      const data = await apiService.put(`/health-staff/health/records/${id}`, payload);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi cập nhật sổ sức khoẻ' };
    }
  }

  /**
   * Lấy toàn bộ thông báo y tế của 1 học sinh
   * @param {string} studentId
   */
  async getHealthNotices(studentId) {
    try {
      const url = `/health-staff/health/notices?student_id=${studentId}`;
      const data = await apiService.get(url);
      return { success: true, data: data.notices || [] };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi lấy thông báo y tế' };
    }
  }

  /**
   * Tạo mới thông báo y tế
   * @param {Object} payload
   */
  async createHealthNotice(payload) {
    try {
      const data = await apiService.post('/health-staff/health/notices', payload);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi tạo thông báo y tế' };
    }
  }

  /**
   * Cập nhật thông báo y tế
   */
  async updateHealthNotice(id, payload) {
    try {
      const data = await apiService.put(`/health-staff/health/notices/${id}`, payload);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi cập nhật thông báo y tế' };
    }
  }

  /**
   * Lấy profile nhân viên y tế hiện tại
   */
  async getStaffProfile() {
    try {
      const data = await apiService.get('/health-staff/profile');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi lấy profile' };
    }
  }

  /**
   * Cập nhật profile nhân viên y tế
   * @param {Object} payload - Thông tin cập nhật
   */
  async updateStaffProfile(payload) {
    try {
      const data = await apiService.put('/health-staff/profile', payload);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi cập nhật profile' };
    }
  }

  async changePassword(payload) {
    try {
      const data = await apiService.put('/health-staff/change-password', payload);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi đổi mật khẩu' };
    }
  }

  /**
   * Xoá sổ sức khoẻ
   */
  async deleteHealthRecord(id) {
    try {
      const data = await apiService.delete(`/health-staff/health/records/${id}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi xoá sổ sức khoẻ' };
    }
  }
  /**
   * Xoá thông báo y tế
   */
  async deleteHealthNotice(id) {
    try {
      const data = await apiService.delete(`/health-staff/health/notices/${id}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || 'Lỗi xoá thông báo y tế' };
    }
  }
}

const healthService = new HealthService();
export default healthService;