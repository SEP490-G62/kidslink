import api from './api';

const adminService = {
  // Schools
  getAllSchools: async (page = 1, limit = 10, search = '') => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('search', search);
    return await api.get(`/admin/schools?${params.toString()}`, true);
  },

  getSchoolById: async (schoolId) => {
    return await api.get(`/admin/schools/${schoolId}`, true);
  },

  createSchool: async (schoolData) => {
    return await api.post('/admin/schools', schoolData, true);
  },

  updateSchool: async (schoolId, schoolData) => {
    return await api.put(`/admin/schools/${schoolId}`, schoolData, true);
  },

  deleteSchool: async (schoolId) => {
    return await api.delete(`/admin/schools/${schoolId}`, true);
  },

  updateSchoolStatus: async (schoolId, status) => {
    return await api.put(`/admin/schools/${schoolId}/status`, { status }, true);
  },
};

export default adminService;




