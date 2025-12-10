const XLSX = require('xlsx');
const path = require('path');

// Tạo workbook mới
const workbook = XLSX.utils.book_new();

// ============ COVER SHEET ============
const coverData = [
    [],
    ['', 'UNIT TEST DOCUMENT', '', '', '', ''],
    [],
    ['Project Name', 'KidsLink - Preschool Management System', '', '', 'Creator', 'Development Team'],
    ['Project Code', 'KIDSLINK-2025', '', '', 'Issue Date', new Date().toISOString().split('T')[0]],
    ['Document Code', 'KIDSLINK-2025_UT_v1.0', '', '', 'Version', '1.0'],
    [],
    [],
    ['Record of change', '', '', '', '', ''],
    ['Effective Date', 'Version', 'Change Item', '*A,D,M', 'Change description', 'Reference'],
    [new Date().toISOString().split('T')[0], '1.0', 'Initial', 'A', 'Initial Unit Test Document', 'Sprint 5.1']
];
const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
XLSX.utils.book_append_sheet(workbook, coverSheet, 'Cover');

// ============ METHOD LIST SHEET ============
const methods = [
    [1, 'Authentication', 'login', 'Login', 'User logs in with username and password', 'User has an active account with valid credentials'],
    [2, 'User Management', 'createUser', 'Create User', 'School Admin creates a new user account', 'School Admin has permission; school_id is valid'],
    [3, 'User Management', 'getAllUsers', 'Get All Users', 'School Admin retrieves list of all users', 'User has admin or school_admin role'],
    [4, 'User Management', 'updateUser', 'Update User', 'School Admin updates user information', 'User exists; School Admin has permission'],
    [5, 'User Management', 'deleteUser', 'Delete User', 'School Admin retrieves list of all users', 'User exists; School Admin has permission'],
    [6, 'Student Management', 'createStudent', 'Create Student', 'School Admin creates a new student record', 'School Admin has permission; class_id and school_id are valid'],
    [7, 'Student Management', 'getAllStudents', 'Get All Students', 'School Admin retrieves list of all students', 'School Admin has permission'],
    [8, 'Student Management', 'getStudentDetail', 'Get Student Detail', 'School Admin retrieves detailed information of a specific student', 'Student ID exists; School Admin has permission'],
    [9, 'Student Management', 'updateStudent', 'Update Student', 'School Admin updates student information', 'Student exists; School Admin has permission'],
    [10, 'Student Management', 'deleteStudent', 'Delete Student', 'School Admin soft deletes a student', 'Student exists; School Admin has permission'],
    [11, 'Class Management', 'createClass', 'Create Class', 'School Admin creates a new class', 'School Admin has permission; teacher_id, class_age_id, academic_year are valid'],
    [12, 'Class Management', 'listClasses', 'List Classes', 'School Admin retrieves list of all classes', 'School Admin has permission'],
    [13, 'Class Management', 'updateClass', 'Update Class', 'School Admin updates class information', 'Class exists; School Admin has permission'],
    [14, 'Class Management', 'deleteClass', 'Delete Class', 'School Admin permanently deletes a class', 'Class exists; School Admin has permission'],
    [15, 'Class Management', 'addStudentToClass', 'Add Student To Class', 'School Admin adds a student to a class', 'Student and class exist; student not already in class'],
    [16, 'Teacher Management', 'getTeacherClasses', 'Get Teacher Classes', 'Teacher retrieves list of classes they teach', 'Teacher is authenticated'],
    [17, 'Teacher Management', 'getClassStudents', 'Get Class Students', 'Teacher retrieves list of students in their class', 'Teacher is authenticated; class exists'],
    [18, 'Teacher Management', 'getStudentsAttendanceByDate', 'Get Students Attendance By Date', 'Teacher retrieves attendance records for students on a specific date', 'Teacher is authenticated; class has schedule for the date'],
    [19, 'Daily Report', 'checkIn', 'Check In Student', 'Teacher checks in a student for the day', 'Teacher is authenticated; student belongs to teacher\'s class; class has schedule for the date'],
    [20, 'Daily Report', 'checkOut', 'Check Out Student', 'Teacher checks out a student for the day', 'Teacher is authenticated; student has been checked in'],
    [21, 'Calendar Management', 'getClassCalendars', 'Get Class Calendars', 'School Admin retrieves calendar entries for a class', 'School Admin has permission; class exists'],
    [22, 'Calendar Management', 'createOrUpdateCalendarEntry', 'Create Or Update Calendar Entry', 'School Admin creates or updates a calendar entry for a class', 'School Admin has permission; class, slot, activity exist'],
    [23, 'Calendar Management', 'getAllActivities', 'Get All Activities', 'School Admin retrieves list of all activities', 'School Admin has permission'],
    [24, 'Calendar Management', 'createActivity', 'Create Activity', 'School Admin creates a new activity', 'School Admin has permission'],
    [25, 'Slot Management', 'getAllSlots', 'Get All Slots', 'School Admin retrieves list of all time slots', 'School Admin has permission'],
    [26, 'Slot Management', 'createSlot', 'Create Slot', 'School Admin creates a new time slot', 'School Admin has permission; slot times don\'t overlap'],
    [27, 'Fee Management', 'createFee', 'Create Fee', 'School Admin creates a new fee', 'School Admin has permission; fee information is valid'],
    [28, 'Fee Management', 'getAllFees', 'Get All Fees', 'School Admin retrieves list of all fees', 'School Admin has permission'],
    [29, 'Fee Management', 'updateFee', 'Update Fee', 'School Admin updates fee information', 'School Admin has permission; fee exists'],
    [30, 'Fee Management', 'createOrGetInvoice', 'Create Or Get Invoice', 'System creates or retrieves invoice for student fees', 'Student has unpaid fees'],
    [31, 'Parent Fee', 'getStudentFees', 'Get Student Fees', 'Parent retrieves fee information for their child', 'Parent is authenticated; parent has linked student'],
    [32, 'Parent Fee', 'createPayOSPaymentRequest', 'Create PayOS Payment Request', 'Parent creates a payment request via PayOS', 'Parent is authenticated; invoice exists'],
    [33, 'Messaging', 'createConversation', 'Create Conversation', 'User creates a new conversation', 'User is authenticated; class exists'],
    [34, 'Messaging', 'getConversations', 'Get Conversations', 'User retrieves list of their conversations', 'User is authenticated'],
    [35, 'Messaging', 'sendMessage', 'Send Message', 'User sends a message in a conversation', 'User is authenticated; user is participant'],
    [36, 'Messaging', 'getMessages', 'Get Messages', 'User retrieves messages from a conversation', 'User is authenticated; user is participant'],
    [37, 'Post Management', 'createPost', 'Create Post', 'Teacher/Parent creates a new post', 'User is authenticated; class exists'],
    [38, 'Post Management', 'getAllPosts', 'Get All Posts', 'School Admin retrieves all posts in their school', 'School Admin has permission'],
    [39, 'Post Management', 'updatePostStatus', 'Update Post Status', 'School Admin approves or rejects a post', 'School Admin has permission; post exists'],
    [40, 'Comment Management', 'createComment', 'Create Comment', 'User creates a comment on a post', 'User is authenticated; post exists'],
    [41, 'Comment Management', 'getComments', 'Get Comments', 'User retrieves comments for a post', 'User is authenticated; post exists'],
    [42, 'Like Management', 'toggleLike', 'Toggle Like', 'User likes or unlikes a post', 'User is authenticated; post exists'],
    [43, 'Complaint Management', 'createComplaint', 'Create Complaint', 'Teacher/Parent creates a new complaint', 'User is authenticated; complaint type exists'],
    [44, 'Complaint Management', 'getMyComplaints', 'Get My Complaints', 'Teacher/Parent retrieves their own complaints', 'User is authenticated'],
    [45, 'School Admin Complaint', 'getAllComplaints', 'Get All Complaints', 'School Admin retrieves all complaints in their school', 'School Admin has permission'],
    [46, 'School Admin Complaint', 'approveComplaint', 'Approve Complaint', 'School Admin approves a complaint', 'School Admin has permission; complaint exists'],
    [47, 'School Admin Complaint', 'rejectComplaint', 'Reject Complaint', 'School Admin rejects a complaint', 'School Admin has permission; complaint exists'],
    [48, 'Health Care', 'createHealthRecord', 'Create Health Record', 'Health Care Staff creates a new health record', 'Health Care Staff is authenticated; student exists'],
    [49, 'Health Care', 'listHealthRecordsByStudent', 'List Health Records By Student', 'Health Care Staff retrieves health records for a student', 'Health Care Staff is authenticated; student exists'],
    [50, 'Health Care', 'createHealthNotice', 'Create Health Notice', 'Health Care Staff creates a new health notice', 'Health Care Staff is authenticated; student exists'],
    [51, 'Nutrition', 'createDish', 'Create Dish', 'Nutrition Staff creates a new dish', 'Nutrition Staff is authenticated; meal_type exists'],
    [52, 'Nutrition', 'listDishes', 'List Dishes', 'Nutrition Staff retrieves list of dishes in their school', 'Nutrition Staff is authenticated'],
    [53, 'Nutrition', 'assignDishesToClassAgeMeal', 'Assign Dishes To Class Age Meal', 'Nutrition Staff assigns dishes to a class age meal', 'Nutrition Staff is authenticated; class_age_id, meal_id, date are valid'],
    [54, 'School Management', 'createSchool', 'Create School', 'Admin creates a new school', 'Admin has permission; school information is valid'],
    [55, 'School Management', 'getAllSchools', 'Get All Schools', 'Admin retrieves list of all schools', 'Admin has permission'],
    [56, 'School Management', 'updateSchool', 'Update School', 'Admin updates school information', 'Admin has permission; school exists']
];

const methodListData = [
    [],
    ['', '', 'Method List', '', '', ''],
    [],
    ['Project Name', '', 'KidsLink - Preschool Management System', '', '', ''],
    ['Project Code', '', 'KIDSLINK-2025', '', '', ''],
    ['Test Environment Setup Description', '', 'Node.js v18+\nMongoDB Database\nExpress.js Server\nJWT Authentication\nPayOS Integration', '', '', ''],
    [],
    ['No', 'Module Name', 'Method Name', 'Sheet Name', 'Description', 'Pre-Condition'],
    ...methods
];

const methodListSheet = XLSX.utils.aoa_to_sheet(methodListData);
XLSX.utils.book_append_sheet(workbook, methodListSheet, 'MethodList');

// ============ STATISTICS SHEET ============
const statsData = [
    [],
    ['UNIT TEST REPORT', '', '', '', '', '', '', '', ''],
    [],
    ['Project Name', 'KidsLink - Preschool Management System', '', 'Creator', '', '', '', '', ''],
    ['Project Code', 'KIDSLINK-2025', '', 'Reviewer/Approver', '', '', '', '', ''],
    ['Document Code', 'KIDSLINK-2025_TestReport_v1.0', '', 'Issue Date', '', new Date().toISOString().split('T')[0], '', '', ''],
    ['Notes', 'Sprint 5.1 - Unit Test for all 56 methods', '', '', '', '', '', '', ''],
    [],
    [],
    [],
    ['No', 'Function code', 'Passed', 'Failed', 'Untested', 'N', 'A', 'B', 'Total Test Cases']
];

// Thêm placeholder cho 56 methods
for (let i = 1; i <= 56; i++) {
    statsData.push([i, methods[i-1][2], 0, 0, 15, 0, 0, 0, 15]);
}

statsData.push([]);
statsData.push([]);
statsData.push(['', 'Sub total', 0, 0, 56*15, 0, 0, 0, 56*15]);
statsData.push([]);
statsData.push(['', 'Test coverage', '', '0.00', '%', '', '', '', '']);
statsData.push(['', 'Test successful coverage', '', '0.00', '%', '', '', '', '']);
statsData.push(['', 'Normal case', '', '0.00', '%', '', '', '', '']);

const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');

// ============ TẠO SAMPLE TEST CASE SHEETS (3 methods quan trọng) ============
const sampleMethods = [
    {name: 'login', module: 'Authentication', testReq: 'Verify user authentication with valid/invalid credentials'},
    {name: 'createStudent', module: 'Student Management', testReq: 'Verify student creation with valid/invalid data'},
    {name: 'createOrUpdateCalendarEntry', module: 'Calendar Management', testReq: 'Verify calendar entry creation and conflict detection'}
];

sampleMethods.forEach(method => {
    const testCaseData = [
        ['Code Module', '', method.module, '', 'Method', '', '', '', '', '', method.name, '', '', '', '', '', '', ''],
        ['Created By', '', 'Development Team', '', 'Executed By', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['Test requirement', '', method.testReq, '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['Passed', '', 'Failed', '', 'Untested', '', '', '', '', '', 'N/A/B', '', '', 'Total Test Cases', '', '', '', ''],
        [0, '', 0, '', 15, '', '', '', '', '', 0, 0, 0, 15, '', '', '', ''],
        [],
        ['', '', '', '', 'UTCID01', 'UTCID02', 'UTCID03', 'UTCID04', 'UTCID05', 'UTCID06', 'UTCID07', 'UTCID08', 'UTCID09', 'UTCID10', 'UTCID11', 'UTCID12', 'UTCID13', 'UTCID14', 'UTCID15'],
        ['Condition', 'Precondition', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', 'Authentication enabled', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', 'Database connected', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        [],
        ['Input', 'username', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Valid user', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Invalid user', '', '', '', 'O', 'O', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Empty', '', '', '', '', '', 'O', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Null', '', '', '', '', '', '', 'O', '', '', '', '', '', '', '', ''],
        ['', 'password', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Valid password', 'O', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Invalid password', '', 'O', '', 'O', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Empty', '', '', 'O', '', 'O', 'O', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Null', '', '', '', '', '', '', 'O', '', '', '', '', '', '', '', ''],
        [],
        ['Expected Output', 'status', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 200, 'O', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 401, '', 'O', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', ''],
        ['', 'token', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'JWT token', 'O', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'null', '', 'O', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', '', ''],
        [],
        ['Test Case Type', '', '', '', 'N', 'A', 'A', 'A', 'A', 'B', 'B', '', '', '', '', '', '', '', '']
    ];
    
    const sheet = XLSX.utils.aoa_to_sheet(testCaseData);
    XLSX.utils.book_append_sheet(workbook, sheet, method.name);
});

// Lưu file
const outputPath = path.join(__dirname, '../../docs/unittest/KidsLink_Unit_Test_v1.0.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ File Excel đã được tạo thành công!');
console.log('📁 Đường dẫn:', outputPath);
console.log('\n📊 Nội dung:');
console.log('- Cover: Thông tin dự án');
console.log('- MethodList: 56 methods cần test');
console.log('- Statistics: Báo cáo tổng hợp');
console.log('- Sample test cases: login, createStudent, createOrUpdateCalendarEntry');
console.log('\n💡 Bước tiếp theo:');
console.log('1. Mở file Excel');
console.log('2. Tạo sheet test case cho các methods còn lại (copy từ sample)');
console.log('3. Điền test cases cụ thể cho từng method');
console.log('4. Viết code unit test dựa trên test cases');
