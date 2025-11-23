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

  toggleLike: async (postId) => {
    return await api.post(`/school-admin/posts/${postId}/like`, {}, true);
  },

  // Calendar & Slots
  getClassCalendars: async (classId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return await api.get(`/school-admin/calendar/class/${classId}${queryString ? '?' + queryString : ''}`, true);
  },

  getAllSlots: async () => {
    return await api.get('/school-admin/calendar/slots', true);
  },

  createSlot: async (slotData) => {
    return await api.post('/school-admin/calendar/slots', slotData, true);
  },

  updateSlot: async (slotId, slotData) => {
    return await api.put(`/school-admin/calendar/slots/${slotId}`, slotData, true);
  },

  deleteSlot: async (slotId) => {
    return await api.delete(`/school-admin/calendar/slots/${slotId}`, true);
  },

  createOrUpdateCalendarEntry: async (calendarId, entryData) => {
    return await api.post(`/school-admin/calendar/calendar/${calendarId}`, entryData, true);
  },

  deleteCalendarEntry: async (calendarId) => {
    return await api.delete(`/school-admin/calendar/calendar/${calendarId}`, true);
  },

  updateAllSlotNames: async () => {
    return await api.post('/school-admin/calendar/slots/update-names', {}, true);
  },

  // Activities
  getAllActivities: async () => {
    return await api.get('/school-admin/calendar/activities', true);
  },

  createActivity: async (activityData) => {
    return await api.post('/school-admin/calendar/activities', activityData, true);
  },

  updateActivity: async (activityId, activityData) => {
    return await api.put(`/school-admin/calendar/activities/${activityId}`, activityData, true);
  },

  deleteActivity: async (activityId) => {
    return await api.delete(`/school-admin/calendar/activities/${activityId}`, true);
  },

  // Teachers
  getAllTeachers: async () => {
    return await api.get('/school-admin/calendar/teachers', true);
  },

  // Fees
  getAllFees: async (page = 1, limit = 50) => {
    return await api.get(`/school-admin/fees?page=${page}&limit=${limit}`, true);
  },

  getFeeById: async (feeId) => {
    return await api.get(`/school-admin/fees/${feeId}`, true);
  },

  createFee: async (feeData) => {
    return await api.post('/school-admin/fees', feeData, true);
  },

  updateFee: async (feeId, feeData) => {
    return await api.put(`/school-admin/fees/${feeId}`, feeData, true);
  },

  deleteFee: async (feeId) => {
    return await api.delete(`/school-admin/fees/${feeId}`, true);
  },

  getClassFeePayments: async (feeId, classFeeId) => {
    return await api.get(`/school-admin/fees/${feeId}/classes/${classFeeId}/payments`, true);
  },

  markInvoicePaidOffline: async (feeId, classFeeId, invoiceId, amount) => {
    return await api.post(`/school-admin/fees/${feeId}/classes/${classFeeId}/payments/${invoiceId}/offline`, { amount }, true);
  },

  createOrGetInvoice: async (feeId, classFeeId, studentClassId) => {
    return await api.post(`/school-admin/fees/${feeId}/classes/${classFeeId}/students/${studentClassId}/invoice`, {}, true);
  },

  // School Info
  getSchoolInfo: async (schoolId = null) => {
    const endpoint = schoolId ? `/school-admin/school/${schoolId}` : '/school-admin/school';
    return await api.get(endpoint, true);
  },

  updateSchoolInfo: async (schoolId, schoolData) => {
    const endpoint = schoolId ? `/school-admin/school/${schoolId}` : '/school-admin/school';
    return await api.put(endpoint, schoolData, true);
  },
    // Complaints
    getComplaintStats: async () => {
      return await api.get('/school-admin/complaints/stats', true);
    },
  
    getAllComplaints: async (category = null, status = null) => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      const queryString = params.toString();
      return await api.get(`/school-admin/complaints${queryString ? '?' + queryString : ''}`, true);
    },
  
    getComplaintById: async (complaintId) => {
      return await api.get(`/school-admin/complaints/${complaintId}`, true);
    },
  
    approveComplaint: async (complaintId, response = '') => {
      return await api.put(`/school-admin/complaints/${complaintId}/approve`, { response }, true);
    },
  
    rejectComplaint: async (complaintId, response) => {
      return await api.put(`/school-admin/complaints/${complaintId}/reject`, { response }, true);
    },
  
    // Complaint Types
    getAllComplaintTypes: async () => {
      return await api.get('/school-admin/complaints/types/list', true);
    },
  
    createComplaintType: async (typeData) => {
      return await api.post('/school-admin/complaints/types', typeData, true);
    },
  
    updateComplaintType: async (typeId, typeData) => {
      return await api.put(`/school-admin/complaints/types/${typeId}`, typeData, true);
    },
  
    deleteComplaintType: async (typeId) => {
      return await api.delete(`/school-admin/complaints/types/${typeId}`, true);
    },
};

export default schoolAdminService;
