const mongoose = require('mongoose');
const WeekDay = require('../src/models/WeekDay');
require('dotenv').config();

async function addWeekendDays() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kidslink';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if Saturday and Sunday already exist
    const saturday = await WeekDay.findOne({ day_of_week: 'Saturday' });
    const sunday = await WeekDay.findOne({ day_of_week: 'Sunday' });

    if (saturday && sunday) {
      console.log('Saturday and Sunday already exist in database');
      await mongoose.disconnect();
      return;
    }

    // Add Saturday if not exists
    if (!saturday) {
      await WeekDay.create({ day_of_week: 'Saturday' });
      console.log('Added Saturday');
    }

    // Add Sunday if not exists
    if (!sunday) {
      await WeekDay.create({ day_of_week: 'Sunday' });
      console.log('Added Sunday');
    }

    console.log('Weekend days added successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error adding weekend days:', error);
    process.exit(1);
  }
}

addWeekendDays();


