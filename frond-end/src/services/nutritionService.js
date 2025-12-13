import apiService from './api';

class NutritionService {
  async getDishes() {
    return await apiService.get('/nutrition/dishes');
  }

  async createDish(payload) {
    return await apiService.post('/nutrition/dishes', payload);
  }

  async updateDish(id, payload) {
    return await apiService.put(`/nutrition/dishes/${id}`, payload);
  }

  async deleteDish(id) {
    return await apiService.delete(`/nutrition/dishes/${id}`);
  }

  async getClassAges() {
    return await apiService.get('/nutrition/class-ages');
  }

  async getMeals() {
    return await apiService.get('/nutrition/meals');
  }

  async getWeekDays() {
    return await apiService.get('/nutrition/weekdays');
  }

  async getClasses(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/nutrition/classes?${query}` : '/nutrition/classes';
    return await apiService.get(url);
  }

  async getStudentsByClass(classId) {
    return await apiService.get(`/nutrition/classes/${classId}/students`);
  }

  async getStudentsByClassAge(classAgeId) {
    return await apiService.get(`/nutrition/class-ages/${classAgeId}/students`);
  }

  async getClassAgeMeals(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/nutrition/class-age-meals?${query}` : '/nutrition/class-age-meals';
    return await apiService.get(url);
  }

  async assignDishes(payload) {
    return await apiService.post('/nutrition/class-age-meals/assign', payload);
  }

  async getAssignedDishes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `/nutrition/class-age-meals/dishes?${query}`;
    return await apiService.get(url);
  }

  async getWeeklyAssignedDishes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `/nutrition/class-age-meals/weekly-dishes?${query}`;
    return await apiService.get(url);
  }

  // Profile utilities for nutrition staff
  async getProfile() {
    return await apiService.get(`/nutrition/profile`);
  }

  async updateProfile(payload) {
    return await apiService.put(`/nutrition/profile`, payload);
  }

  async changePassword(payload) {
    return await apiService.put(`/nutrition/change-password`, payload);
  }
}

const nutritionService = new NutritionService();
export default nutritionService;

