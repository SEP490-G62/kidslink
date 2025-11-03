// Run in mongosh
// Add schedule for class A1 - this week and next week

const dbx = db.getSiblingDB('kidslink');

// IDs từ seed file
const ids = {
  classes: {
    a1: ObjectId("671000000000000000000201"),
  },
  weekdays: {
    mon: ObjectId("671000000000000000000501"),
    tue: ObjectId("671000000000000000000502"),
    wed: ObjectId("671000000000000000000503"),
    thu: ObjectId("671000000000000000000504"),
    fri: ObjectId("671000000000000000000505"),
  },
  activities: {
    reading: ObjectId("671000000000000000000581"),
    outdoor: ObjectId("671000000000000000000582"),
    nap: ObjectId("671000000000000000000583"),
  },
  teachers: {
    t1: ObjectId("671000000000000000000361"), // Homeroom teacher
    t3: ObjectId("671000000000000000000363"), // Support teacher
  },
};

const today = new Date();
const iso = (s) => ISODate(s);

// Tính toán ngày bắt đầu tuần này (Thứ 2)
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day === 0 ? 6 : day - 1; // Days to subtract to get Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const thisWeekMonday = getMonday(today);
const nextWeekMonday = new Date(thisWeekMonday);
nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);

// Counters để track số lượng (không dùng cho ObjectId)
let calendarIdCounter = 1000;
let slotIdCounter = 2000;

const createWeekSchedule = (weekStartDate, weekPrefix) => {
  const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const weekdayIds = [ids.weekdays.mon, ids.weekdays.tue, ids.weekdays.wed, ids.weekdays.thu, ids.weekdays.fri];
  
  const calendars = [];
  const slots = [];
  
  weekdays.forEach((dayName, index) => {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + index);
    const dayId = weekdayIds[index];
    
    // Tạo calendar cho ngày này - dùng ObjectId() tự generate
    const calendarId = new ObjectId();
    calendarIdCounter++;
    
    calendars.push({
      _id: calendarId,
      class_id: ids.classes.a1,
      weekday_id: dayId,
      date: iso(dayDate.toISOString().split('T')[0] + 'T00:00:00Z'),
      createdAt: today,
      updatedAt: today
    });
    
    // Tạo slots cho mỗi ngày
    // Slot 1: Morning Reading (08:30-09:00)
    const slot1Id = new ObjectId();
    slotIdCounter++;
    slots.push({
      _id: slot1Id,
      slot_name: "Morning Reading",
      start_time: "08:30",
      end_time: "09:00",
      calendar_id: calendarId,
      activity_id: ids.activities.reading,
      teacher_id: ids.teachers.t1,
      createdAt: today,
      updatedAt: today
    });
    
    // Slot 2: Outdoor Play (09:15-10:00)
    const slot2Id = new ObjectId();
    slotIdCounter++;
    slots.push({
      _id: slot2Id,
      slot_name: "Outdoor Play",
      start_time: "09:15",
      end_time: "10:00",
      calendar_id: calendarId,
      activity_id: ids.activities.outdoor,
      teacher_id: ids.teachers.t3,
      createdAt: today,
      updatedAt: today
    });
    
    // Slot 3: Nap Time (13:00-14:30)
    const slot3Id = new ObjectId();
    slotIdCounter++;
    slots.push({
      _id: slot3Id,
      slot_name: "Nap Time",
      start_time: "13:00",
      end_time: "14:30",
      calendar_id: calendarId,
      activity_id: ids.activities.nap,
      teacher_id: ids.teachers.t1,
      createdAt: today,
      updatedAt: today
    });
  });
  
  return { calendars, slots };
};

// Tạo lịch cho tuần này
const thisWeek = createWeekSchedule(thisWeekMonday, 'thisWeek');
print(`Tạo lịch tuần này (bắt đầu ${thisWeekMonday.toISOString().split('T')[0]})`);

// Tạo lịch cho tuần sau
const nextWeek = createWeekSchedule(nextWeekMonday, 'nextWeek');
print(`Tạo lịch tuần sau (bắt đầu ${nextWeekMonday.toISOString().split('T')[0]})`);

// Insert calendars
const allCalendars = [...thisWeek.calendars, ...nextWeek.calendars];
if (allCalendars.length > 0) {
  const calendarResult = dbx.calendars.insertMany(allCalendars);
  print(`Đã tạo ${calendarResult.insertedIds.length} calendars cho lớp A1`);
}

// Insert slots
const allSlots = [...thisWeek.slots, ...nextWeek.slots];
if (allSlots.length > 0) {
  const slotResult = dbx.slots.insertMany(allSlots);
  print(`Đã tạo ${slotResult.insertedIds.length} slots cho lớp A1`);
}

print(`Hoàn tất: Đã thêm lịch học cho lớp A1 - tuần này (${thisWeekMonday.toISOString().split('T')[0]}) và tuần sau (${nextWeekMonday.toISOString().split('T')[0]})`);
print(`Tổng cộng: ${allCalendars.length} ngày học, ${allSlots.length} slots hoạt động`);

