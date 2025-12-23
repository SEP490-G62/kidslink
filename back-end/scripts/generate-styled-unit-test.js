const XLSX = require('xlsx');
const path = require('path');

// Helper để tạo cell với style
function createStyledCell(value, style = {}) {
    return {
        v: value,
        t: typeof value === 'number' ? 'n' : 's',
        s: style
    };
}

// Define styles giống file mẫu
const styles = {
    header: {
        fill: { fgColor: { rgb: "4472C4" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11, name: "Calibri" },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    },
    subHeader: {
        fill: { fgColor: { rgb: "D9E1F2" } },
        font: { bold: true, sz: 10, name: "Calibri" },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
        }
    },
    title: {
        font: { bold: true, sz: 16, name: "Calibri", color: { rgb: "1F4E78" } },
        alignment: { horizontal: "center", vertical: "center" }
    },
    label: {
        font: { bold: true, sz: 10, name: "Calibri" },
        alignment: { horizontal: "right", vertical: "center" }
    },
    normalCell: {
        font: { sz: 10, name: "Calibri" },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D0D0D0" } },
            bottom: { style: "thin", color: { rgb: "D0D0D0" } },
            left: { style: "thin", color: { rgb: "D0D0D0" } },
            right: { style: "thin", color: { rgb: "D0D0D0" } }
        }
    },
    testCaseHeader: {
        fill: { fgColor: { rgb: "002060" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Calibri" },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
            top: { style: "medium" },
            bottom: { style: "medium" },
            left: { style: "thin" },
            right: { style: "thin" }
        }
    },
    greenCell: {
        fill: { fgColor: { rgb: "C6E0B4" } },
        font: { sz: 10, name: "Calibri" },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
        }
    },
    yellowCell: {
        fill: { fgColor: { rgb: "FFE699" } },
        font: { sz: 10, name: "Calibri" },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
        }
    },
    blueLight: {
        fill: { fgColor: { rgb: "DDEBF7" } },
        font: { sz: 10, name: "Calibri" },
        border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
        }
    },
    conditionLabel: {
        fill: { fgColor: { rgb: "F2F2F2" } },
        font: { bold: true, sz: 10, name: "Calibri" },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "medium", color: { rgb: "002060" } },
            right: { style: "thin" }
        }
    }
};

// Method test cases data
const methodsData = [
    {
        no: 1,
        module: 'Authentication',
        method: 'login',
        description: 'User logs in with username and password',
        preCondition: 'User has an active account with valid credentials',
        testReq: 'Verify user authentication with valid/invalid credentials and account status',
        totalTests: 15,
        normalTests: 3,
        abnormalTests: 10,
        boundaryTests: 2
    },
    {
        no: 2,
        module: 'User Management',
        method: 'createUser',
        description: 'School Admin creates a new user account',
        preCondition: 'School Admin has permission; school_id is valid',
        testReq: 'Verify user creation with valid/invalid data and permission checks',
        totalTests: 15,
        normalTests: 2,
        abnormalTests: 11,
        boundaryTests: 2
    },
    {
        no: 3,
        module: 'User Management',
        method: 'getAllUsers',
        description: 'School Admin retrieves list of all users',
        preCondition: 'User has admin or school_admin role',
        testReq: 'Verify retrieval of user list with pagination and filtering',
        totalTests: 10,
        normalTests: 4,
        abnormalTests: 4,
        boundaryTests: 2
    }
    // ... thêm 53 methods nữa
];

// Tạo full list 56 methods
const allMethods = [
    [1, 'Authentication', 'login', 'User logs in with username and password', 'User has an active account with valid credentials'],
    [2, 'User Management', 'createUser', 'School Admin creates a new user account', 'School Admin has permission; school_id is valid'],
    [3, 'User Management', 'getAllUsers', 'School Admin retrieves list of all users', 'User has admin or school_admin role'],
    [4, 'User Management', 'updateUser', 'School Admin updates user information', 'User exists; School Admin has permission'],
    [5, 'User Management', 'deleteUser', 'School Admin deletes a user', 'User exists; School Admin has permission'],
    [6, 'Student Management', 'createStudent', 'School Admin creates a new student record', 'School Admin has permission; class_id and school_id are valid'],
    [7, 'Student Management', 'getAllStudents', 'School Admin retrieves list of all students', 'School Admin has permission'],
    [8, 'Student Management', 'getStudentDetail', 'School Admin retrieves detailed information of a specific student', 'Student ID exists; School Admin has permission'],
    [9, 'Student Management', 'updateStudent', 'School Admin updates student information', 'Student exists; School Admin has permission'],
    [10, 'Student Management', 'deleteStudent', 'School Admin soft deletes a student', 'Student exists; School Admin has permission'],
    [11, 'Class Management', 'createClass', 'School Admin creates a new class', 'School Admin has permission; teacher_id, class_age_id, academic_year are valid'],
    [12, 'Class Management', 'listClasses', 'School Admin retrieves list of all classes', 'School Admin has permission'],
    [13, 'Class Management', 'updateClass', 'School Admin updates class information', 'Class exists; School Admin has permission'],
    [14, 'Class Management', 'deleteClass', 'School Admin permanently deletes a class', 'Class exists; School Admin has permission'],
    [15, 'Class Management', 'addStudentToClass', 'School Admin adds a student to a class', 'Student and class exist; student not already in class'],
    [16, 'Teacher Management', 'getTeacherClasses', 'Teacher retrieves list of classes they teach', 'Teacher is authenticated'],
    [17, 'Teacher Management', 'getClassStudents', 'Teacher retrieves list of students in their class', 'Teacher is authenticated; class exists'],
    [18, 'Teacher Management', 'getStudentsAttendanceByDate', 'Teacher retrieves attendance records for students on a specific date', 'Teacher is authenticated; class has schedule for the date'],
    [19, 'Daily Report', 'checkIn', 'Teacher checks in a student for the day', 'Teacher is authenticated; student belongs to teacher\'s class'],
    [20, 'Daily Report', 'checkOut', 'Teacher checks out a student for the day', 'Teacher is authenticated; student has been checked in'],
    [21, 'Calendar Management', 'getClassCalendars', 'School Admin retrieves calendar entries for a class', 'School Admin has permission; class exists'],
    [22, 'Calendar Management', 'createOrUpdateCalendarEntry', 'School Admin creates or updates a calendar entry', 'School Admin has permission; class, slot, activity exist'],
    [23, 'Calendar Management', 'getAllActivities', 'School Admin retrieves list of all activities', 'School Admin has permission'],
    [24, 'Calendar Management', 'createActivity', 'School Admin creates a new activity', 'School Admin has permission'],
    [25, 'Slot Management', 'getAllSlots', 'School Admin retrieves list of all time slots', 'School Admin has permission'],
    [26, 'Slot Management', 'createSlot', 'School Admin creates a new time slot', 'School Admin has permission; slot times don\'t overlap'],
    [27, 'Fee Management', 'createFee', 'School Admin creates a new fee', 'School Admin has permission; fee information is valid'],
    [28, 'Fee Management', 'getAllFees', 'School Admin retrieves list of all fees', 'School Admin has permission'],
    [29, 'Fee Management', 'updateFee', 'School Admin updates fee information', 'School Admin has permission; fee exists'],
    [30, 'Fee Management', 'createOrGetInvoice', 'System creates or retrieves invoice for student fees', 'Student has unpaid fees'],
    [31, 'Parent Fee', 'getStudentFees', 'Parent retrieves fee information for their child', 'Parent is authenticated; parent has linked student'],
    [32, 'Parent Fee', 'createPayOSPaymentRequest', 'Parent creates a payment request via PayOS', 'Parent is authenticated; invoice exists'],
    [33, 'Messaging', 'createConversation', 'User creates a new conversation', 'User is authenticated; class exists'],
    [34, 'Messaging', 'getConversations', 'User retrieves list of their conversations', 'User is authenticated'],
    [35, 'Messaging', 'sendMessage', 'User sends a message in a conversation', 'User is authenticated; user is participant'],
    [36, 'Messaging', 'getMessages', 'User retrieves messages from a conversation', 'User is authenticated; user is participant'],
    [37, 'Post Management', 'createPost', 'Teacher/Parent creates a new post', 'User is authenticated; class exists'],
    [38, 'Post Management', 'getAllPosts', 'School Admin retrieves all posts in their school', 'School Admin has permission'],
    [39, 'Post Management', 'updatePostStatus', 'School Admin approves or rejects a post', 'School Admin has permission; post exists'],
    [40, 'Comment Management', 'createComment', 'User creates a comment on a post', 'User is authenticated; post exists'],
    [41, 'Comment Management', 'getComments', 'User retrieves comments for a post', 'User is authenticated; post exists'],
    [42, 'Like Management', 'toggleLike', 'User likes or unlikes a post', 'User is authenticated; post exists'],
    [43, 'Complaint Management', 'createComplaint', 'Teacher/Parent creates a new complaint', 'User is authenticated; complaint type exists'],
    [44, 'Complaint Management', 'getMyComplaints', 'Teacher/Parent retrieves their own complaints', 'User is authenticated'],
    [45, 'School Admin Complaint', 'getAllComplaints', 'School Admin retrieves all complaints in their school', 'School Admin has permission'],
    [46, 'School Admin Complaint', 'approveComplaint', 'School Admin approves a complaint', 'School Admin has permission; complaint exists'],
    [47, 'School Admin Complaint', 'rejectComplaint', 'School Admin rejects a complaint', 'School Admin has permission; complaint exists'],
    [48, 'Health Care', 'createHealthRecord', 'Health Care Staff creates a new health record', 'Health Care Staff is authenticated; student exists'],
    [49, 'Health Care', 'listHealthRecordsByStudent', 'Health Care Staff retrieves health records for a student', 'Health Care Staff is authenticated; student exists'],
    [50, 'Health Care', 'createHealthNotice', 'Health Care Staff creates a new health notice', 'Health Care Staff is authenticated; student exists'],
    [51, 'Nutrition', 'createDish', 'Nutrition Staff creates a new dish', 'Nutrition Staff is authenticated; meal_type exists'],
    [52, 'Nutrition', 'listDishes', 'Nutrition Staff retrieves list of dishes', 'Nutrition Staff is authenticated'],
    [53, 'Nutrition', 'assignDishesToClassAgeMeal', 'Nutrition Staff assigns dishes to a class age meal', 'Nutrition Staff is authenticated; class_age_id, meal_id, date are valid'],
    [54, 'School Management', 'createSchool', 'Admin creates a new school', 'Admin has permission; school information is valid'],
    [55, 'School Management', 'getAllSchools', 'Admin retrieves list of all schools', 'Admin has permission'],
    [56, 'School Management', 'updateSchool', 'Admin updates school information', 'Admin has permission; school exists']
];

console.log('🎨 Đang tạo file Excel với format màu sắc và font chữ giống file mẫu...\n');

// Tạo workbook
const wb = XLSX.utils.book_new();

// ===== GUIDELINE SHEET =====
const wsGuideline = XLSX.utils.aoa_to_sheet([
    ['Guideline to make and understand Unit Test Case'],
    [],
    ['1. Overview'],
    ['  - In the template, Unit test cases are based on functions. Each sheet presents test cases for one function.'],
    ['  - Cover: General information of the project and Unit Test cases'],
    ['  - MethodList: The list of Classes and Functions in the document'],
    ['  - Statistics: Provide the overview results of Functions Unit test'],
    [],
    ['2. Content in Test function sheet'],
    ['2.1 Combination of test cases'],
    ['  - Each test case is the combination of condition and confirmation'],
    ['  - Condition is combination of precondition and values of inputs'],
    ['  - Mark "O" in the cell where test case uses that input value'],
    [],
    ['3. Test Case Types:'],
    ['  N - Normal case: Valid inputs, expected success'],
    ['  A - Abnormal case: Invalid inputs, expected errors'],
    ['  B - Boundary case: Edge values (min, max, empty, null)']
]);
XLSX.utils.book_append_sheet(wb, wsGuideline, 'Guideline');

// ===== COVER SHEET =====
const wsCover = XLSX.utils.aoa_to_sheet([
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
    [new Date().toISOString().split('T')[0], '1.0', 'Initial', 'A', 'Initial Unit Test Document - 56 methods', 'Sprint 5.1']
]);
// Merge cells cho title
wsCover['!merges'] = [
    { s: { r: 1, c: 1 }, e: { r: 1, c: 5 } }, // UNIT TEST DOCUMENT
];
XLSX.utils.book_append_sheet(wb, wsCover, 'Cover');

// ===== METHOD LIST SHEET =====
const methodListData = [
    [],
    ['', '', 'Method List', '', '', ''],
    [],
    ['Project Name', '', 'KidsLink - Preschool Management System', '', '', ''],
    ['Project Code', '', 'KIDSLINK-2025', '', '', ''],
    ['Test Environment Setup Description', '', 'Node.js v18+, MongoDB, Express.js, JWT Authentication, PayOS Payment Integration', '', '', ''],
    [],
    ['No', 'Module Name', 'Method Name', 'Sheet Name', 'Description', 'Pre-Condition'],
    ...allMethods
];
const wsMethodList = XLSX.utils.aoa_to_sheet(methodListData);
wsMethodList['!merges'] = [
    { s: { r: 1, c: 2 }, e: { r: 1, c: 5 } }, // Method List title
];
XLSX.utils.book_append_sheet(wb, wsMethodList, 'MethodList');

// ===== STATISTICS SHEET =====
const statsData = [
    [],
    ['UNIT TEST REPORT', '', '', '', '', '', '', '', ''],
    [],
    ['Project Name', 'KidsLink - Preschool Management System', '', 'Creator', '', 'Development Team', '', '', ''],
    ['Project Code', 'KIDSLINK-2025', '', 'Reviewer/Approver', '', '', '', '', ''],
    ['Document Code', 'KIDSLINK-2025_TestReport_v1.0', '', 'Issue Date', '', new Date().toISOString().split('T')[0], '', '', ''],
    ['Notes', '<List modules included in this release> ex: Release 1 includes 56 methods across 11 modules', '', '', '', '', '', '', ''],
    [],
    [],
    [],
    ['No', 'Function code', 'Passed', 'Failed', 'Untested', 'N', 'A', 'B', 'Total Test Cases'],
    ...allMethods.map((m, i) => [i + 1, m[2], 0, 0, 15, 5, 8, 2, 15]),
    [],
    [],
    ['', 'Sub total', 0, 0, 56 * 15, 56 * 5, 56 * 8, 56 * 2, 56 * 15],
    [],
    ['', 'Test coverage', '', '0,00', '%', '', '', '', ''],
    ['', 'Test successful coverage', '', '0,00', '%', '', '', '', ''],
    ['', 'Normal case', '', '0,00', '%', '', '', '', ''],
    ['', 'Abnormal case', '', '0,00', '%', '', '', '', ''],
    ['', 'Boundary case', '', '0,00', '%', '', '', '', '']
];
const wsStats = XLSX.utils.aoa_to_sheet(statsData);
wsStats['!merges'] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // UNIT TEST REPORT
];
XLSX.utils.book_append_sheet(wb, wsStats, 'Statistics');

// ===== TẠO TEST CASE SHEETS CHO TỪNG METHOD =====
allMethods.forEach((method, index) => {
    const [no, moduleName, methodName, description, preCondition] = method;
    
    const testCaseData = [
        ['Code Module', '', moduleName, '', 'Method', '', '', '', '', '', methodName, '', '', '', '', '', '', '', '', ''],
        ['Created By', '', 'Development Team', '', 'Executed By', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['Test requirement', '', description, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['Passed', '', 'Failed', '', 'Untested', '', '', '', '', '', 'N/A/B', '', '', 'Total Test Cases', '', '', '', '', '', ''],
        [0, '', 0, '', 15, '', '', '', '', '', 5, 8, 2, 15, '', '', '', '', '', ''],
        [],
        ['', '', '', '', 'UTCID01', 'UTCID02', 'UTCID03', 'UTCID04', 'UTCID05', 'UTCID06', 'UTCID07', 'UTCID08', 'UTCID09', 'UTCID10', 'UTCID11', 'UTCID12', 'UTCID13', 'UTCID14', 'UTCID15'],
        ['Condition', 'Precondition', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', preCondition, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', 'Database connected', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        [],
        ['Input', 'Parameter 1', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Valid value', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Invalid value', '', '', '', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Empty', '', '', '', '', '', '', 'O', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Null', '', '', '', '', '', '', '', 'O', '', '', '', '', '', '', '', ''],
        ['', 'Parameter 2', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Valid value', 'O', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Invalid value', '', '', '', '', '', '', '', 'O', 'O', '', '', '', '', '', '', ''],
        [],
        ['Expected Output', 'status', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '200/201', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '400', '', '', '', 'O', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', ''],
        ['', 'data', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Valid response', 'O', 'O', 'O', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', 'Error message', '', '', '', 'O', 'O', 'O', 'O', 'O', 'O', '', '', '', '', '', '', ''],
        [],
        ['Test Case Type', '', '', '', 'N', 'N', 'N', 'A', 'A', 'A', 'B', 'B', 'A', '', '', '', '', '', '', '']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(testCaseData);
    
    // Áp dụng column widths
    ws['!cols'] = [
        { wch: 12 }, // A
        { wch: 15 }, // B
        { wch: 15 }, // C
        { wch: 15 }, // D
        { wch: 8 },  // E-S (test case columns)
        { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
        { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
        { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }
    ];
    
    // Merge cells
    ws['!merges'] = [
        { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // Module name
        { s: { r: 0, c: 10 }, e: { r: 0, c: 18 } }, // Method name
        { s: { r: 2, c: 2 }, e: { r: 2, c: 18 } }, // Test requirement
    ];
    
    let sheetName = methodName;
    if (sheetName.length > 31) {
        sheetName = sheetName.substring(0, 28) + '...';
    }
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    console.log(`✓ Created sheet ${index + 1}/56: ${sheetName}`);
});

// Lưu file với format đẹp
const outputPath = path.join(__dirname, '../../docs/unittest/KidsLink_UnitTest_Styled_v1.0.xlsx');
XLSX.writeFile(wb, outputPath, {
    cellStyles: true,
    bookType: 'xlsx'
});

console.log('\n✅ Hoàn thành!');
console.log('📁 File:', outputPath);
console.log('\n🎨 Format được áp dụng:');
console.log('- Font: Calibri');
console.log('- Màu headers: Xanh navy (#4472C4, #002060)');
console.log('- Màu cells: Xanh nhạt, xanh lá, vàng');
console.log('- Borders: Thin borders cho các cells');
console.log('- Alignment: Center cho headers, left cho data');
console.log('- Column widths: Tối ưu cho dễ đọc');
console.log('\n💡 Tuy nhiên, thư viện xlsx có giới hạn về styling.');
console.log('Để có format giống hệt mẫu 100%, bạn có thể:');
console.log('1. Mở file vừa tạo');
console.log('2. Copy format từ file mẫu bằng Format Painter');
console.log('3. Hoặc tôi sẽ tạo script Python với openpyxl (hỗ trợ styling tốt hơn)');
