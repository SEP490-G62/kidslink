// Run in mongosh

const dbx = db.getSiblingDB('kidslink');



const ids = {

  school: ObjectId("671000000000000000000001"),

  classAges: {

    age3: ObjectId("671000000000000000000101"),

    age4: ObjectId("671000000000000000000102"),

    age5: ObjectId("671000000000000000000103"),

  },

  classes: {

    a1: ObjectId("671000000000000000000201"),

    b1: ObjectId("671000000000000000000202"),

    c1: ObjectId("671000000000000000000203"),

  },

  users: {

    // parents

    p1: ObjectId("671000000000000000000301"),

    p2: ObjectId("671000000000000000000302"),

    p3: ObjectId("671000000000000000000303"),

    p4: ObjectId("671000000000000000000304"),

    p5: ObjectId("671000000000000000000305"),

    // teachers

    t1: ObjectId("671000000000000000000311"),

    t2: ObjectId("671000000000000000000312"),

    t3: ObjectId("671000000000000000000313"),

    t4: ObjectId("671000000000000000000314"),

    t5: ObjectId("671000000000000000000315"),

    // nurse and nutrition

    nurse: ObjectId("671000000000000000000321"),

    cook: ObjectId("671000000000000000000322"),

    // school admin

    schoolAdmin: ObjectId("671000000000000000000330"),

  },

  parents: {

    p1: ObjectId("671000000000000000000341"),

    p2: ObjectId("671000000000000000000342"),

    p3: ObjectId("671000000000000000000343"),

    p4: ObjectId("671000000000000000000344"),

    p5: ObjectId("671000000000000000000345"),

  },

  teachers: {

    t1: ObjectId("671000000000000000000361"),

    t2: ObjectId("671000000000000000000362"),

    t3: ObjectId("671000000000000000000363"),

    t4: ObjectId("671000000000000000000364"),

    t5: ObjectId("671000000000000000000365"),

  },

  healthcare: {

    nurse: ObjectId("671000000000000000000381"),

  },

  students: {

    s1: ObjectId("671000000000000000000401"),

    s2: ObjectId("671000000000000000000402"),

    s3: ObjectId("671000000000000000000403"),

    s4: ObjectId("671000000000000000000404"),

    s5: ObjectId("671000000000000000000405"),

    s6: ObjectId("671000000000000000000406"),

  },

  studentClasses: {

    sc1: ObjectId("671000000000000000000421"),

    sc2: ObjectId("671000000000000000000422"),

    sc3: ObjectId("671000000000000000000423"),

    sc4: ObjectId("671000000000000000000424"),

    sc5: ObjectId("671000000000000000000425"),

    sc6: ObjectId("671000000000000000000426"),

  },

  parentStudents: {

    ps1: ObjectId("671000000000000000000441"),

    ps2: ObjectId("671000000000000000000442"),

    ps3: ObjectId("671000000000000000000443"),

    ps4: ObjectId("671000000000000000000444"),

    ps5: ObjectId("671000000000000000000445"),

    ps6: ObjectId("671000000000000000000446"),

  },

  weekdays: {

    mon: ObjectId("671000000000000000000501"),

    tue: ObjectId("671000000000000000000502"),

    wed: ObjectId("671000000000000000000503"),

    thu: ObjectId("671000000000000000000504"),

    fri: ObjectId("671000000000000000000505"),

  },

  meals: {

    breakfast: ObjectId("671000000000000000000521"),

    lunch: ObjectId("671000000000000000000522"),

    snack: ObjectId("671000000000000000000523"),

  },

  dishes: {

    porridge: ObjectId("671000000000000000000541"),

    chickenRice: ObjectId("671000000000000000000542"),

    veggieSoup: ObjectId("671000000000000000000543"),

    fruitCup: ObjectId("671000000000000000000544"),

  },

  classAgeMeals: {

    a3_mon_breakfast: ObjectId("671000000000000000000561"),

    a4_mon_lunch: ObjectId("671000000000000000000562"),

    a5_mon_snack: ObjectId("671000000000000000000563"),

  },

  activities: {

    reading: ObjectId("671000000000000000000581"),

    outdoor: ObjectId("671000000000000000000582"),

    nap: ObjectId("671000000000000000000583"),

  },

  calendars: {

    cA_mon: ObjectId("671000000000000000000601"),

    cB_mon: ObjectId("671000000000000000000602"),

    cC_mon: ObjectId("671000000000000000000603"),

  },

  slots: {

    a1_reading: ObjectId("671000000000000000000621"),

    a1_outdoor: ObjectId("671000000000000000000622"),

  },

  dailyReports: {

    dr_s1: ObjectId("671000000000000000000641"),

    dr_s3: ObjectId("671000000000000000000642"),

  },

  fees: {

    tuition: ObjectId("671000000000000000000661"),

    meal: ObjectId("671000000000000000000662"),

  },

  classFees: {

    cfA_tuition: ObjectId("671000000000000000000681"),

    cfA_meal: ObjectId("671000000000000000000682"),

  },

  invoices: {

    inv_sc1_tuition: ObjectId("671000000000000000000701"),

    inv_sc1_meal: ObjectId("671000000000000000000702"),

  },

  payments: {

    pay1: ObjectId("671000000000000000000721"),

  },

  pickups: {

    pk1: ObjectId("671000000000000000000741"),

    pk2: ObjectId("671000000000000000000742"),

    pk3: ObjectId("671000000000000000000743"),

  },

  pickupStudents: {

    pks1: ObjectId("671000000000000000000761"),

    pks2: ObjectId("671000000000000000000762"),

    pks3: ObjectId("671000000000000000000763"),

  },

  conversations: {

    convA: ObjectId("671000000000000000000781"),

  },

  conversationParticipants: {

    cp1: ObjectId("671000000000000000000801"),

    cp2: ObjectId("671000000000000000000802"),

    cp3: ObjectId("671000000000000000000803"),

  },

  messages: {

    m1: ObjectId("671000000000000000000821"),

    m2: ObjectId("671000000000000000000822"),

  },

  posts: {

    p1: ObjectId("671000000000000000000841"),

    schoolA1: ObjectId("671000000000000000000842"),

    schoolB1: ObjectId("671000000000000000000843"),

    schoolC1: ObjectId("671000000000000000000844"),

    parent1: ObjectId("671000000000000000000845"),

    parent2: ObjectId("671000000000000000000846"),

  },

  postImages: {

    pi1: ObjectId("671000000000000000000861"),

  },

  postComments: {

    pc1: ObjectId("671000000000000000000881"),

  },

  postLikes: {

    pl1: ObjectId("671000000000000000000901"),

  },

  health: {

    notice_s1: ObjectId("671000000000000000000921"),

    notice_s3: ObjectId("671000000000000000000922"),

    record_s1: ObjectId("671000000000000000000923"),

    record_s3: ObjectId("671000000000000000000924"),

  },

};



const today = new Date();

const iso = (s) => ISODate(s);



// USERS

dbx.users.insertMany([

  { _id: ids.users.p1, full_name: "Nguyen Van A", username: "parent1", password_hash: "$2b$10$parent1hashxxxxxxxxxxxxxxx", role: "parent", avatar_url: "https://picsum.photos/seed/parent1/200", status: 1, email: "parent1@example.com", phone_number: "0900000001", createdAt: today, updatedAt: today },

  { _id: ids.users.p2, full_name: "Tran Thi B", username: "parent2", password_hash: "$2b$10$parent2hashxxxxxxxxxxxxxxx", role: "parent", avatar_url: "https://picsum.photos/seed/parent2/200", status: 1, email: "parent2@example.com", phone_number: "0900000002", createdAt: today, updatedAt: today },

  { _id: ids.users.p3, full_name: "Le Van C", username: "parent3", password_hash: "$2b$10$parent3hashxxxxxxxxxxxxxxx", role: "parent", avatar_url: "https://picsum.photos/seed/parent3/200", status: 1, email: "parent3@example.com", phone_number: "0900000003", createdAt: today, updatedAt: today },

  { _id: ids.users.p4, full_name: "Pham Thi D", username: "parent4", password_hash: "$2b$10$parent4hashxxxxxxxxxxxxxxx", role: "parent", avatar_url: "https://picsum.photos/seed/parent4/200", status: 1, email: "parent4@example.com", phone_number: "0900000004", createdAt: today, updatedAt: today },

  { _id: ids.users.p5, full_name: "Do Van E", username: "parent5", password_hash: "$2b$10$parent5hashxxxxxxxxxxxxxxx", role: "parent", avatar_url: "https://picsum.photos/seed/parent5/200", status: 1, email: "parent5@example.com", phone_number: "0900000005", createdAt: today, updatedAt: today },



  { _id: ids.users.t1, full_name: "Teacher One", username: "teacher1", password_hash: "$2b$10$teacher1hashxxxxxxxxxxxxxx", role: "teacher", avatar_url: "https://picsum.photos/seed/teacher1/200", status: 1, email: "t1@school.com", phone_number: "0910000001", createdAt: today, updatedAt: today },

  { _id: ids.users.t2, full_name: "Teacher Two", username: "teacher2", password_hash: "$2b$10$teacher2hashxxxxxxxxxxxxxx", role: "teacher", avatar_url: "https://picsum.photos/seed/teacher2/200", status: 1, email: "t2@school.com", phone_number: "0910000002", createdAt: today, updatedAt: today },

  { _id: ids.users.t3, full_name: "Teacher Three", username: "teacher3", password_hash: "$2b$10$teacher3hashxxxxxxxxxxxx", role: "teacher", avatar_url: "https://picsum.photos/seed/teacher3/200", status: 1, email: "t3@school.com", phone_number: "0910000003", createdAt: today, updatedAt: today },

  { _id: ids.users.t4, full_name: "Teacher Four", username: "teacher4", password_hash: "$2b$10$teacher4hashxxxxxxxxxxxxx", role: "teacher", avatar_url: "https://picsum.photos/seed/teacher4/200", status: 1, email: "t4@school.com", phone_number: "0910000004", createdAt: today, updatedAt: today },

  { _id: ids.users.t5, full_name: "Teacher Five", username: "teacher5", password_hash: "$2b$10$teacher5hashxxxxxxxxxxxxx", role: "teacher", avatar_url: "https://picsum.photos/seed/teacher5/200", status: 1, email: "t5@school.com", phone_number: "0910000005", createdAt: today, updatedAt: today },



  { _id: ids.users.nurse, full_name: "Nguyen Nurse", username: "nurse1", password_hash: "$2b$10$nursehashxxxxxxxxxxxxxxxxx", role: "health_care_staff", avatar_url: "https://picsum.photos/seed/nurse/200", status: 1, email: "nurse@school.com", phone_number: "0920000001", createdAt: today, updatedAt: today },

  { _id: ids.users.cook, full_name: "Tran Cook", username: "cook1", password_hash: "$2b$10$cookhashxxxxxxxxxxxxxxxxxx", role: "nutrition_staff", avatar_url: "https://picsum.photos/seed/cook/200", status: 1, email: "cook@school.com", phone_number: "0920000002", createdAt: today, updatedAt: today },



  { _id: ids.users.schoolAdmin, full_name: "School Admin", username: "schooladmin", password_hash: "$2b$10$schooladminhashxxxxxxxxxxxxxxxxxxxx", role: "school_admin", avatar_url: "https://picsum.photos/seed/schooladmin/200", status: 1, email: "admin@kidslink.vn", phone_number: "0909999999", createdAt: today, updatedAt: today },

]);



// PARENTS / TEACHERS / HEALTHCARE

dbx.parents.insertMany([

  { _id: ids.parents.p1, user_id: ids.users.p1, createdAt: today, updatedAt: today },

  { _id: ids.parents.p2, user_id: ids.users.p2, createdAt: today, updatedAt: today },

  { _id: ids.parents.p3, user_id: ids.users.p3, createdAt: today, updatedAt: today },

  { _id: ids.parents.p4, user_id: ids.users.p4, createdAt: today, updatedAt: today },

  { _id: ids.parents.p5, user_id: ids.users.p5, createdAt: today, updatedAt: today },

]);



dbx.teachers.insertMany([

  { _id: ids.teachers.t1, qualification: "Bachelor of Education", major: "Early Childhood", experience_years: 5, note: "Homeroom A1", user_id: ids.users.t1, createdAt: today, updatedAt: today },

  { _id: ids.teachers.t2, qualification: "Bachelor of Education", major: "Early Childhood", experience_years: 4, note: "Homeroom B1", user_id: ids.users.t2, createdAt: today, updatedAt: today },

  { _id: ids.teachers.t3, qualification: "Diploma", major: "Music", experience_years: 3, note: "Music support", user_id: ids.users.t3, createdAt: today, updatedAt: today },

  { _id: ids.teachers.t4, qualification: "Bachelor of Education", major: "Physical Education", experience_years: 6, note: "PE support", user_id: ids.users.t4, createdAt: today, updatedAt: today },

  { _id: ids.teachers.t5, qualification: "Master", major: "Early Childhood", experience_years: 7, note: "Homeroom C1", user_id: ids.users.t5, createdAt: today, updatedAt: today },

]);



dbx.healthcarestaffs.insertMany([

  { _id: ids.healthcare.nurse, qualification: "Bachelor of Nursing", major: "Pediatrics", experience_years: 8, note: "School nurse", user_id: ids.users.nurse, createdAt: today, updatedAt: today },

]);



// SCHOOL

dbx.schools.insertOne({

  _id: ids.school,

  school_name: "KidsLink Kindergarten",

  address: "123 Nguyen Trai, District 1, HCMC",

  phone: "0281234567",

  email: "contact@kidslink.vn",

  logo_url: "https://picsum.photos/seed/school/300",

  status: 1,

  qr_data: "KIDSLINK-SCHOOL-QR-001",

  createdAt: today, updatedAt: today

});



// CLASS AGES

dbx.classages.insertMany([

  { _id: ids.classAges.age3, age: 3, age_name: "3-4 years", createdAt: today, updatedAt: today },

  { _id: ids.classAges.age4, age: 4, age_name: "4-5 years", createdAt: today, updatedAt: today },

  { _id: ids.classAges.age5, age: 5, age_name: "5-6 years", createdAt: today, updatedAt: today },

]);



// CLASSES

dbx.classes.insertMany([

  { _id: ids.classes.a1, class_name: "A1", academic_year: "2024-2025", school_id: ids.school, class_age_id: ids.classAges.age3, teacher_id: ids.teachers.t1, teacher_id2: ids.teachers.t3, createdAt: today, updatedAt: today },

  { _id: ids.classes.b1, class_name: "B1", academic_year: "2024-2025", school_id: ids.school, class_age_id: ids.classAges.age4, teacher_id: ids.teachers.t2, teacher_id2: ids.teachers.t4, createdAt: today, updatedAt: today },

  { _id: ids.classes.c1, class_name: "C1", academic_year: "2024-2025", school_id: ids.school, class_age_id: ids.classAges.age5, teacher_id: ids.teachers.t5, createdAt: today, updatedAt: today },

]);



// STUDENTS

dbx.students.insertMany([

  { _id: ids.students.s1, full_name: "Be An", dob: iso("2021-09-15T00:00:00Z"), gender: 0, avatar_url: "https://picsum.photos/seed/s1/200", status: 1, allergy: "None", createdAt: today, updatedAt: today },

  { _id: ids.students.s2, full_name: "Be Binh", dob: iso("2020-07-20T00:00:00Z"), gender: 1, avatar_url: "https://picsum.photos/seed/s2/200", status: 1, allergy: "Peanuts", createdAt: today, updatedAt: today },

  { _id: ids.students.s3, full_name: "Be Chi", dob: iso("2019-11-05T00:00:00Z"), gender: 1, avatar_url: "https://picsum.photos/seed/s3/200", status: 1, allergy: "Milk", createdAt: today, updatedAt: today },

  { _id: ids.students.s4, full_name: "Be Dan", dob: iso("2021-03-08T00:00:00Z"), gender: 0, avatar_url: "https://picsum.photos/seed/s4/200", status: 1, allergy: "None", createdAt: today, updatedAt: today },

  { _id: ids.students.s5, full_name: "Be Em", dob: iso("2020-12-30T00:00:00Z"), gender: 0, avatar_url: "https://picsum.photos/seed/s5/200", status: 1, allergy: "Seafood", createdAt: today, updatedAt: today },

  { _id: ids.students.s6, full_name: "Be Gia", dob: iso("2019-05-12T00:00:00Z"), gender: 1, avatar_url: "https://picsum.photos/seed/s6/200", status: 1, allergy: "None", createdAt: today, updatedAt: today },

]);



// STUDENT-CLASS MAP

dbx.studentclasses.insertMany([

  { _id: ids.studentClasses.sc1, student_id: ids.students.s1, class_id: ids.classes.a1, discount: 0, createdAt: today, updatedAt: today },

  { _id: ids.studentClasses.sc2, student_id: ids.students.s2, class_id: ids.classes.a1, discount: 0, createdAt: today, updatedAt: today },

  { _id: ids.studentClasses.sc3, student_id: ids.students.s3, class_id: ids.classes.b1, discount: 0, createdAt: today, updatedAt: today },

  { _id: ids.studentClasses.sc4, student_id: ids.students.s4, class_id: ids.classes.b1, discount: 0, createdAt: today, updatedAt: today },

  { _id: ids.studentClasses.sc5, student_id: ids.students.s5, class_id: ids.classes.c1, discount: 0, createdAt: today, updatedAt: today },

  { _id: ids.studentClasses.sc6, student_id: ids.students.s6, class_id: ids.classes.c1, discount: 0, createdAt: today, updatedAt: today },

]);



// PARENT-STUDENT MAP (parent1 có 2 con: s1, s3)

dbx.parentstudents.insertMany([

  { _id: ids.parentStudents.ps1, parent_id: ids.parents.p1, student_id: ids.students.s1, relationship: "Father", createdAt: today, updatedAt: today },

  { _id: ids.parentStudents.ps2, parent_id: ids.parents.p1, student_id: ids.students.s3, relationship: "Father", createdAt: today, updatedAt: today },

  { _id: ids.parentStudents.ps3, parent_id: ids.parents.p2, student_id: ids.students.s2, relationship: "Mother", createdAt: today, updatedAt: today },

  { _id: ids.parentStudents.ps4, parent_id: ids.parents.p3, student_id: ids.students.s4, relationship: "Father", createdAt: today, updatedAt: today },

  { _id: ids.parentStudents.ps5, parent_id: ids.parents.p4, student_id: ids.students.s5, relationship: "Mother", createdAt: today, updatedAt: today },

  { _id: ids.parentStudents.ps6, parent_id: ids.parents.p5, student_id: ids.students.s6, relationship: "Father", createdAt: today, updatedAt: today },

]);



// WEEKDAYS

dbx.weekdays.insertMany([

  { _id: ids.weekdays.mon, day_of_week: "Monday", createdAt: today, updatedAt: today },

  { _id: ids.weekdays.tue, day_of_week: "Tuesday", createdAt: today, updatedAt: today },

  { _id: ids.weekdays.wed, day_of_week: "Wednesday", createdAt: today, updatedAt: today },

  { _id: ids.weekdays.thu, day_of_week: "Thursday", createdAt: today, updatedAt: today },

  { _id: ids.weekdays.fri, day_of_week: "Friday", createdAt: today, updatedAt: today },

]);



// MEALS & DISHES

dbx.meals.insertMany([

  { _id: ids.meals.breakfast, meal: "Breakfast", createdAt: today, updatedAt: today },

  { _id: ids.meals.lunch, meal: "Lunch", createdAt: today, updatedAt: today },

  { _id: ids.meals.snack, meal: "Snack", createdAt: today, updatedAt: today },

]);



dbx.dishes.insertMany([

  { _id: ids.dishes.porridge, dish_name: "Chicken Porridge", description: "Soft porridge with chicken", createdAt: today, updatedAt: today },

  { _id: ids.dishes.chickenRice, dish_name: "Chicken Rice", description: "Steamed rice with chicken", createdAt: today, updatedAt: today },

  { _id: ids.dishes.veggieSoup, dish_name: "Vegetable Soup", description: "Mixed veggies soup", createdAt: today, updatedAt: today },

  { _id: ids.dishes.fruitCup, dish_name: "Fruit Cup", description: "Seasonal fruits", createdAt: today, updatedAt: today },

]);



// CLASS-AGE-MEAL

dbx.classagemeals.insertMany([

  { _id: ids.classAgeMeals.a3_mon_breakfast, class_age_id: ids.classAges.age3, meal_id: ids.meals.breakfast, weekday_id: ids.weekdays.mon, date: iso("2024-10-28T00:00:00Z"), createdAt: today, updatedAt: today },

  { _id: ids.classAgeMeals.a4_mon_lunch, class_age_id: ids.classAges.age4, meal_id: ids.meals.lunch, weekday_id: ids.weekdays.mon, date: iso("2024-10-28T00:00:00Z"), createdAt: today, updatedAt: today },

  { _id: ids.classAgeMeals.a5_mon_snack, class_age_id: ids.classAges.age5, meal_id: ids.meals.snack, weekday_id: ids.weekdays.mon, date: iso("2024-10-28T00:00:00Z"), createdAt: today, updatedAt: today },

]);



dbx.dishesclassagemeals.insertMany([

  { _id: ObjectId("671000000000000000000901"), class_age_meal_id: ids.classAgeMeals.a3_mon_breakfast, dish_id: ids.dishes.porridge, createdAt: today, updatedAt: today },

  { _id: ObjectId("671000000000000000000902"), class_age_meal_id: ids.classAgeMeals.a4_mon_lunch, dish_id: ids.dishes.chickenRice, createdAt: today, updatedAt: today },

  { _id: ObjectId("671000000000000000000903"), class_age_meal_id: ids.classAgeMeals.a5_mon_snack, dish_id: ids.dishes.fruitCup, createdAt: today, updatedAt: today },

]);



// ACTIVITIES / CALENDARS / SLOTS

dbx.activities.insertMany([

  { _id: ids.activities.reading, activity_name: "Reading Time", description: "Story reading", require_outdoor: 0, createdAt: today, updatedAt: today },

  { _id: ids.activities.outdoor, activity_name: "Outdoor Play", description: "Play at playground", require_outdoor: 1, createdAt: today, updatedAt: today },

  { _id: ids.activities.nap, activity_name: "Nap Time", description: "Afternoon nap", require_outdoor: 0, createdAt: today, updatedAt: today },

]);



dbx.calendars.insertMany([

  { _id: ids.calendars.cA_mon, class_id: ids.classes.a1, weekday_id: ids.weekdays.mon, date: iso("2024-10-28T00:00:00Z"), createdAt: today, updatedAt: today },

  { _id: ids.calendars.cB_mon, class_id: ids.classes.b1, weekday_id: ids.weekdays.mon, date: iso("2024-10-28T00:00:00Z"), createdAt: today, updatedAt: today },

  { _id: ids.calendars.cC_mon, class_id: ids.classes.c1, weekday_id: ids.weekdays.mon, date: iso("2024-10-28T00:00:00Z"), createdAt: today, updatedAt: today },

]);



dbx.slots.insertMany([

  { _id: ids.slots.a1_reading, slot_name: "Morning Reading", start_time: "08:30", end_time: "09:00", calendar_id: ids.calendars.cA_mon, activity_id: ids.activities.reading, teacher_id: ids.teachers.t1, createdAt: today, updatedAt: today },

  { _id: ids.slots.a1_outdoor, slot_name: "Outdoor Play", start_time: "09:15", end_time: "10:00", calendar_id: ids.calendars.cA_mon, activity_id: ids.activities.outdoor, teacher_id: ids.teachers.t3, createdAt: today, updatedAt: today },

]);



// FEES / CLASSFEES / PAYMENTS / INVOICES

dbx.fees.insertMany([

  { _id: ids.fees.tuition, fee_name: "Tuition Fee", description: "Monthly tuition", amount: NumberDecimal("3000000"), createdAt: today, updatedAt: today },

  { _id: ids.fees.meal, fee_name: "Meal Fee", description: "Monthly meals", amount: NumberDecimal("800000"), createdAt: today, updatedAt: today },

]);



dbx.classfees.insertMany([

  { _id: ids.classFees.cfA_tuition, class_id: ids.classes.a1, fee_id: ids.fees.tuition, due_date: iso("2024-11-05T00:00:00Z"), note: "November tuition", status: 1, createdAt: today, updatedAt: today },

  { _id: ids.classFees.cfA_meal, class_id: ids.classes.a1, fee_id: ids.fees.meal, due_date: iso("2024-11-05T00:00:00Z"), note: "November meal", status: 1, createdAt: today, updatedAt: today },

]);



dbx.payments.insertOne({

  _id: ids.payments.pay1,

  payment_time: "2024-11-02 10:15",

  payment_method: 2,

  total_amount: NumberDecimal("3000000"),

  createdAt: today, updatedAt: today

});



dbx.invoices.insertMany([

  { _id: ids.invoices.inv_sc1_tuition, class_fee_id: ids.classFees.cfA_tuition, amount_due: NumberDecimal("3000000"), due_date: iso("2024-11-05T00:00:00Z"), student_class_id: ids.studentClasses.sc1, discount: 0, payment_id: ids.payments.pay1, status: 1, createdAt: today, updatedAt: today },

  { _id: ids.invoices.inv_sc1_meal, class_fee_id: ids.classFees.cfA_meal, amount_due: NumberDecimal("800000"), due_date: iso("2024-11-05T00:00:00Z"), student_class_id: ids.studentClasses.sc1, discount: 0, status: 0, createdAt: today, updatedAt: today },

]);



// PICKUPS

dbx.pickups.insertMany([

  { _id: ids.pickups.pk1, full_name: "Grandpa A", relationship: "Grandfather", id_card_number: "079123456", avatar_url: "https://picsum.photos/seed/pk1/200", phone: "0930000001", createdAt: today, updatedAt: today },

  { _id: ids.pickups.pk2, full_name: "Grandma B", relationship: "Grandmother", id_card_number: "079654321", avatar_url: "https://picsum.photos/seed/pk2/200", phone: "0930000002", createdAt: today, updatedAt: today },

  { _id: ids.pickups.pk3, full_name: "Uncle C", relationship: "Uncle", id_card_number: "079777777", avatar_url: "https://picsum.photos/seed/pk3/200", phone: "0930000003", createdAt: today, updatedAt: today },

]);



dbx.pickupstudents.insertMany([

  { _id: ids.pickupStudents.pks1, pickup_id: ids.pickups.pk1, student_id: ids.students.s1, createdAt: today, updatedAt: today },

  { _id: ids.pickupStudents.pks2, pickup_id: ids.pickups.pk2, student_id: ids.students.s2, createdAt: today, updatedAt: today },

  { _id: ids.pickupStudents.pks3, pickup_id: ids.pickups.pk3, student_id: ids.students.s3, createdAt: today, updatedAt: today },

]);



// CONVERSATIONS

dbx.conversations.insertOne({

  _id: ids.conversations.convA,

  title: "Class A1 Chat",

  create_at: iso("2024-10-28T08:00:00Z"),

  last_message_at: iso("2024-10-28T09:10:00Z"),

  class_id: ids.classes.a1,

  createdAt: today, updatedAt: today

});



dbx.conversationparticipants.insertMany([

  { _id: ids.conversationParticipants.cp1, user_id: ids.users.t1, conversation_id: ids.conversations.convA, createdAt: today, updatedAt: today },

  { _id: ids.conversationParticipants.cp2, user_id: ids.users.p1, conversation_id: ids.conversations.convA, createdAt: today, updatedAt: today },

  { _id: ids.conversationParticipants.cp3, user_id: ids.users.p2, conversation_id: ids.conversations.convA, createdAt: today, updatedAt: today },

]);



dbx.messages.insertMany([

  { _id: ids.messages.m1, content: "Welcome to A1!", send_at: iso("2024-10-28T09:00:00Z"), read_status: 0, conversation_id: ids.conversations.convA, sender_id: ids.users.t1, createdAt: today, updatedAt: today },

  { _id: ids.messages.m2, content: "Xin chào cô!", send_at: iso("2024-10-28T09:10:00Z"), read_status: 0, conversation_id: ids.conversations.convA, sender_id: ids.users.p1, createdAt: today, updatedAt: today },

]);



// POSTS (1 post giáo viên ban đầu + post trường + post phụ huynh)

dbx.posts.insertOne({

  _id: ids.posts.p1,

  content: "A1 had a great day reading and playing!",

  create_at: iso("2024-10-28T10:00:00Z"),

  status: "approved",

  user_id: ids.users.t1,

  class_id: ids.classes.a1,

  createdAt: today, updatedAt: today

});



dbx.postimages.insertOne({

  _id: ids.postImages.pi1,

  image_url: "https://picsum.photos/seed/a1post/400",

  post_id: ids.posts.p1,

  createdAt: today, updatedAt: today

});



dbx.postcomments.insertOne({

  _id: ids.postComments.pc1,

  contents: "Tuyệt vời ạ!",

  create_at: iso("2024-10-28T10:15:00Z"),

  post_id: ids.posts.p1,

  user_id: ids.users.p1,

  parent_comment_id: null,

  createdAt: today, updatedAt: today

});



dbx.postlikes.insertOne({

  _id: ids.postLikes.pl1,

  post_id: ids.posts.p1,

  user_id: ids.users.p2,

  createdAt: today, updatedAt: today

});



// Post của trường (school_admin) mỗi lớp

dbx.posts.insertMany([

  { _id: ids.posts.schoolA1, content: "Thông báo nhà trường: Lịch hoạt động tuần mới đã cập nhật.", create_at: today, status: "approved", user_id: ids.users.schoolAdmin, class_id: ids.classes.a1, createdAt: today, updatedAt: today },

  { _id: ids.posts.schoolB1, content: "Thông báo nhà trường: Tuần sau có hoạt động trải nghiệm ngoài trời.", create_at: today, status: "approved", user_id: ids.users.schoolAdmin, class_id: ids.classes.b1, createdAt: today, updatedAt: today },

  { _id: ids.posts.schoolC1, content: "Thông báo nhà trường: Nhắc phụ huynh kiểm tra sổ liên lạc điện tử.", create_at: today, status: "approved", user_id: ids.users.schoolAdmin, class_id: ids.classes.c1, createdAt: today, updatedAt: today },

]);



// Post phụ huynh

dbx.posts.insertMany([

  { _id: ids.posts.parent1, content: "Phụ huynh parent1: Cảm ơn cô và nhà trường về buổi đọc sách hôm nay!", create_at: today, status: "approved", user_id: ids.users.p1, class_id: ids.classes.a1, createdAt: today, updatedAt: today },

  { _id: ids.posts.parent2, content: "Phụ huynh parent2: Bé nhà mình rất thích giờ vận động, cảm ơn cô.", create_at: today, status: "approved", user_id: ids.users.p2, class_id: ids.classes.b1, createdAt: today, updatedAt: today },

]);



// DAILY REPORTS cho con của parent1 (s1 ở A1, s3 ở B1)

dbx.dailyreports.insertMany([

  { _id: ids.dailyReports.dr_s1, report_date: iso("2024-10-28T00:00:00Z"), checkin_time: "07:45", checkout_time: "16:30", comments: "Bé đi học ngoan, ăn uống tốt.", student_id: ids.students.s1, teacher_checkin_id: ids.teachers.t1, teacher_checkout_id: ids.teachers.t3, createdAt: today, updatedAt: today },

  { _id: ids.dailyReports.dr_s3, report_date: iso("2024-10-28T00:00:00Z"), checkin_time: "07:55", checkout_time: "16:40", comments: "Hoạt động tốt, ngủ trưa đủ.", student_id: ids.students.s3, teacher_checkin_id: ids.teachers.t2, teacher_checkout_id: ids.teachers.t4, createdAt: today, updatedAt: today },

]);



// HEALTH RECORDS & NOTICES cho con của parent1 (s1, s3)

dbx.healthrecords.insertMany([

  { _id: ids.health.record_s1, checkup_date: iso("2024-10-28T00:00:00Z"), height_cm: NumberDecimal("98.5"), weight_kg: NumberDecimal("15.2"), note: "Khỏe mạnh", student_id: ids.students.s1, health_care_staff_id: ids.healthcare.nurse, createdAt: today, updatedAt: today },

  { _id: ids.health.record_s3, checkup_date: iso("2024-10-28T00:00:00Z"), height_cm: NumberDecimal("101.0"), weight_kg: NumberDecimal("16.0"), note: "Theo dõi dinh dưỡng", student_id: ids.students.s3, health_care_staff_id: ids.healthcare.nurse, createdAt: today, updatedAt: today },

]);



dbx.healthnotices.insertMany([

  { _id: ids.health.notice_s1, student_id: ids.students.s1, symptoms: "Hắt hơi nhẹ", actions_taken: "Đo thân nhiệt, theo dõi trong lớp", medications: "Chưa cần", notice_time: "2024-10-28 10:20", note: "Báo phụ huynh nếu triệu chứng tăng.", health_care_staff_id: ids.healthcare.nurse, createdAt: today, updatedAt: today },

  { _id: ids.health.notice_s3, student_id: ids.students.s3, symptoms: "Ho khan nhẹ", actions_taken: "Đo thân nhiệt, theo dõi trong lớp", medications: "Chưa cần", notice_time: "2024-10-28 10:35", note: "Uống nước ấm, theo dõi.", health_care_staff_id: ids.healthcare.nurse, createdAt: today, updatedAt: today },

]);



print("Seed KidsLink hoàn tất: school_admin, posts (trường & phụ huynh), daily reports & health cho con parent1.");

