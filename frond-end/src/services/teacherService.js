import api from './api';

const TeacherService = {
  async getMyProfile() {
    return api.get('/teachers/profile');
  },

  async updateMyProfile(payload) {
    return api.put('/teachers/profile', payload);
  },

  async uploadAvatar(imageDataUrl) {
    // imageDataUrl: data URL (base64) or remote URL
    return api.post('/teachers/profile/avatar', { image: imageDataUrl });
  }
};

export default TeacherService;


