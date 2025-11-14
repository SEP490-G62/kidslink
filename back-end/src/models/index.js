// Export all models
module.exports = {
  // Core models
  User: require('./User'),
  School: require('./School'),
  Class: require('./Class'),
  ClassAge: require('./ClassAge'),
  Student: require('./Student'),
  Parent: require('./Parent'),
  
  // Staff models
  Teacher: require('./Teacher'),
  HealthCareStaff: require('./HealthCareStaff'),
  
  // Activity models
  Activity: require('./Activity'),
  Calendar: require('./Calendar'),
  Slot: require('./Slot'),
  WeekDay: require('./WeekDay'),
  
  // Meal models
  Meal: require('./Meal'),
  ClassAgeMeal: require('./ClassAgeMeal'),
  Dish: require('./Dish'),
  DishesClassAgeMeal: require('./DishesClassAgeMeal'),
  
  // Communication models
  Conversation: require('./Conversation'),
  ConversationParticipant: require('./ConversationParticipant'),
  Message: require('./Message'),
  Post: require('./Post'),
  PostImage: require('./PostImage'),
  PostComment: require('./PostComment'),
  PostLike: require('./PostLike'),
  
  // Health models
  HealthNotice: require('./HealthNotice'),
  HealthRecord: require('./HealthRecord'),
  
  // Financial models
  Fee: require('./Fee'),
  ClassFee: require('./ClassFee'),
  Invoice: require('./Invoice'),
  Payment: require('./Payment'),
  
  // Junction tables
  ParentStudent: require('./ParentStudent'),
  StudentClass: require('./StudentClass'),
  DailyReport: require('./DailyReport'),
  Pickup: require('./Pickup'),
  PickupStudent: require('./PickupStudent'),
  
  // Complaint models
  ComplaintType: require('./ComplaintType'),
  Complaint: require('./Complaint')
};




