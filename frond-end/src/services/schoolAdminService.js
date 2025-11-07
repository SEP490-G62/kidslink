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
};

export default schoolAdminService;
