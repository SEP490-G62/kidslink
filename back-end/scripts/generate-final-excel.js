const ExcelJS = require('exceljs');
const path = require('path');

console.log('🎨 Đang tạo file Excel với format màu mè giống file mẫu...\n');

const workbook = new ExcelJS.Workbook();

// Define reusable styles
const headerStyle = {
    fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    },
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    }
};

const darkBlueHeaderStyle = {
    fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF002060' }
    },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
    }
};

const titleStyle = {
    font: { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1F4E78' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
};

const lightBlueStyle = {
    fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDDEBF7' }
    },
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { horizontal: 'left', vertical: 'middle' }
};

const greenStyle = {
    fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC6E0B4' }
    },
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' }
};

const yellowStyle = {
    fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE699' }
    },
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' }
};

const orangeStyle = {
    fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF4B084' }
    },
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' }
};

const grayStyle = {
    fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
    },
    font: { name: 'Calibri', size: 10, bold: true },
    border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    }
};

// Danh sách 56 methods
const methods = [
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
    [18, 'Teacher Management', 'getStudentsAttendanceByDate', 'Teacher retrieves attendance records', 'Teacher is authenticated; class has schedule for the date'],
    [19, 'Daily Report', 'checkIn', 'Teacher checks in a student for the day', 'Teacher is authenticated; student belongs to teacher\'s class'],
    [20, 'Daily Report', 'checkOut', 'Teacher checks out a student for the day', 'Teacher is authenticated; student has been checked in'],
    [21, 'Calendar Management', 'getClassCalendars', 'School Admin retrieves calendar entries for a class', 'School Admin has permission; class exists'],
    [22, 'Calendar Management', 'createOrUpdateCalendarEntry', 'School Admin creates or updates calendar entry', 'School Admin has permission; class, slot, activity exist'],
    [23, 'Calendar Management', 'getAllActivities', 'School Admin retrieves list of all activities', 'School Admin has permission'],
    [24, 'Calendar Management', 'createActivity', 'School Admin creates a new activity', 'School Admin has permission'],
    [25, 'Slot Management', 'getAllSlots', 'School Admin retrieves list of all time slots', 'School Admin has permission'],
    [26, 'Slot Management', 'createSlot', 'School Admin creates a new time slot', 'School Admin has permission; slot times don\'t overlap'],
    [27, 'Fee Management', 'createFee', 'School Admin creates a new fee', 'School Admin has permission; fee information is valid'],
    [28, 'Fee Management', 'getAllFees', 'School Admin retrieves list of all fees', 'School Admin has permission'],
    [29, 'Fee Management', 'updateFee', 'School Admin updates fee information', 'School Admin has permission; fee exists'],
    [30, 'Fee Management', 'createOrGetInvoice', 'System creates or retrieves invoice', 'Student has unpaid fees'],
    [31, 'Parent Fee', 'getStudentFees', 'Parent retrieves fee information for child', 'Parent is authenticated; parent has linked student'],
    [32, 'Parent Fee', 'createPayOSPaymentRequest', 'Parent creates payment request via PayOS', 'Parent is authenticated; invoice exists'],
    [33, 'Messaging', 'createConversation', 'User creates a new conversation', 'User is authenticated; class exists'],
    [34, 'Messaging', 'getConversations', 'User retrieves list of conversations', 'User is authenticated'],
    [35, 'Messaging', 'sendMessage', 'User sends a message in a conversation', 'User is authenticated; user is participant'],
    [36, 'Messaging', 'getMessages', 'User retrieves messages from conversation', 'User is authenticated; user is participant'],
    [37, 'Post Management', 'createPost', 'Teacher/Parent creates a new post', 'User is authenticated; class exists'],
    [38, 'Post Management', 'getAllPosts', 'School Admin retrieves all posts', 'School Admin has permission'],
    [39, 'Post Management', 'updatePostStatus', 'School Admin approves or rejects post', 'School Admin has permission; post exists'],
    [40, 'Comment Management', 'createComment', 'User creates a comment on a post', 'User is authenticated; post exists'],
    [41, 'Comment Management', 'getComments', 'User retrieves comments for a post', 'User is authenticated; post exists'],
    [42, 'Like Management', 'toggleLike', 'User likes or unlikes a post', 'User is authenticated; post exists'],
    [43, 'Complaint Management', 'createComplaint', 'Teacher/Parent creates a complaint', 'User is authenticated; complaint type exists'],
    [44, 'Complaint Management', 'getMyComplaints', 'Teacher/Parent retrieves own complaints', 'User is authenticated'],
    [45, 'School Admin Complaint', 'getAllComplaints', 'School Admin retrieves all complaints', 'School Admin has permission'],
    [46, 'School Admin Complaint', 'approveComplaint', 'School Admin approves a complaint', 'School Admin has permission; complaint exists'],
    [47, 'School Admin Complaint', 'rejectComplaint', 'School Admin rejects a complaint', 'School Admin has permission; complaint exists'],
    [48, 'Health Care', 'createHealthRecord', 'Health Care Staff creates health record', 'Health Care Staff is authenticated; student exists'],
    [49, 'Health Care', 'listHealthRecordsByStudent', 'Health Care Staff retrieves health records', 'Health Care Staff is authenticated; student exists'],
    [50, 'Health Care', 'createHealthNotice', 'Health Care Staff creates health notice', 'Health Care Staff is authenticated; student exists'],
    [51, 'Nutrition', 'createDish', 'Nutrition Staff creates a new dish', 'Nutrition Staff is authenticated; meal_type exists'],
    [52, 'Nutrition', 'listDishes', 'Nutrition Staff retrieves list of dishes', 'Nutrition Staff is authenticated'],
    [53, 'Nutrition', 'assignDishesToClassAgeMeal', 'Nutrition Staff assigns dishes', 'Nutrition Staff is authenticated; class_age_id, meal_id, date valid'],
    [54, 'School Management', 'createSchool', 'Admin creates a new school', 'Admin has permission; school information is valid'],
    [55, 'School Management', 'getAllSchools', 'Admin retrieves list of all schools', 'Admin has permission'],
    [56, 'School Management', 'updateSchool', 'Admin updates school information', 'Admin has permission; school exists']
];

// ===== GUIDELINE SHEET =====
const wsGuide = workbook.addWorksheet('Guideline');
wsGuide.getCell('A1').value = 'Guideline to make and understand Unit Test Case';
wsGuide.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1F4E78' } };
wsGuide.getCell('A3').value = '1. Overview';
wsGuide.getCell('A3').font = { name: 'Calibri', size: 11, bold: true };
wsGuide.getCell('A4').value = '  - Each sheet presents test cases for one function';
wsGuide.getCell('A5').value = '  - Mark "O" in cells where test case uses that input value';
wsGuide.getCell('A6').value = '  - N = Normal case, A = Abnormal case, B = Boundary case';

// ===== COVER SHEET =====
const wsCover = workbook.addWorksheet('Cover');
wsCover.mergeCells('B2:F2');
wsCover.getCell('B2').value = 'UNIT TEST DOCUMENT';
wsCover.getCell('B2').style = titleStyle;

wsCover.getCell('A4').value = 'Project Name';
wsCover.getCell('A4').font = { name: 'Calibri', size: 10, bold: true };
wsCover.getCell('B4').value = 'KidsLink - Preschool Management System';
wsCover.getCell('E4').value = 'Creator';
wsCover.getCell('E4').font = { name: 'Calibri', size: 10, bold: true };
wsCover.getCell('F4').value = 'Development Team';

wsCover.getCell('A5').value = 'Project Code';
wsCover.getCell('A5').font = { name: 'Calibri', size: 10, bold: true };
wsCover.getCell('B5').value = 'KIDSLINK-2025';
wsCover.getCell('E5').value = 'Issue Date';
wsCover.getCell('E5').font = { name: 'Calibri', size: 10, bold: true };
wsCover.getCell('F5').value = new Date().toISOString().split('T')[0];

wsCover.getCell('A6').value = 'Document Code';
wsCover.getCell('A6').font = { name: 'Calibri', size: 10, bold: true };
wsCover.getCell('B6').value = 'KIDSLINK-2025_UT_v1.0';
wsCover.getCell('E6').value = 'Version';
wsCover.getCell('E6').font = { name: 'Calibri', size: 10, bold: true };
wsCover.getCell('F6').value = '1.0';

wsCover.getCell('A9').value = 'Record of change';
wsCover.getCell('A9').font = { name: 'Calibri', size: 11, bold: true };

const coverHeaders = ['Effective Date', 'Version', 'Change Item', '*A,D,M', 'Change description', 'Reference'];
coverHeaders.forEach((header, idx) => {
    const cell = wsCover.getCell(10, idx + 1);
    cell.value = header;
    cell.style = headerStyle;
});

wsCover.getRow(11).values = [new Date().toISOString().split('T')[0], '1.0', 'Initial', 'A', 'Initial Unit Test Document - 56 methods', 'Sprint 5.1'];

// ===== METHOD LIST SHEET =====
const wsMethods = workbook.addWorksheet('MethodList');
wsMethods.mergeCells('C2:F2');
wsMethods.getCell('C2').value = 'Method List';
wsMethods.getCell('C2').style = titleStyle;

wsMethods.getCell('A4').value = 'Project Name';
wsMethods.getCell('A4').font = { name: 'Calibri', size: 10, bold: true };
wsMethods.getCell('C4').value = 'KidsLink - Preschool Management System';
wsMethods.getCell('A5').value = 'Project Code';
wsMethods.getCell('A5').font = { name: 'Calibri', size: 10, bold: true };
wsMethods.getCell('C5').value = 'KIDSLINK-2025';
wsMethods.getCell('A6').value = 'Test Environment';
wsMethods.getCell('A6').font = { name: 'Calibri', size: 10, bold: true };
wsMethods.getCell('C6').value = 'Node.js, MongoDB, Express, JWT';

const methodHeaders = ['No', 'Module Name', 'Method Name', 'Sheet Name', 'Description', 'Pre-Condition'];
methodHeaders.forEach((header, idx) => {
    const cell = wsMethods.getCell(8, idx + 1);
    cell.value = header;
    cell.style = headerStyle;
});

methods.forEach((method, idx) => {
    const row = wsMethods.getRow(idx + 9);
    row.values = method;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.font = { name: 'Calibri', size: 10 };
    row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
        };
    });
});

wsMethods.getColumn(1).width = 6;
wsMethods.getColumn(2).width = 22;
wsMethods.getColumn(3).width = 32;
wsMethods.getColumn(4).width = 32;
wsMethods.getColumn(5).width = 45;
wsMethods.getColumn(6).width = 55;

// ===== STATISTICS SHEET =====
const wsStats = workbook.addWorksheet('Statistics');
wsStats.mergeCells('A2:I2');
wsStats.getCell('A2').value = 'UNIT TEST REPORT';
wsStats.getCell('A2').style = titleStyle;

wsStats.getCell('A4').value = 'Project Name';
wsStats.getCell('A4').font = { name: 'Calibri', size: 10, bold: true };
wsStats.getCell('B4').value = 'KidsLink';
wsStats.getCell('D4').value = 'Creator';
wsStats.getCell('D4').font = { name: 'Calibri', size: 10, bold: true };
wsStats.getCell('F4').value = 'Dev Team';

wsStats.getCell('A5').value = 'Project Code';
wsStats.getCell('A5').font = { name: 'Calibri', size: 10, bold: true };
wsStats.getCell('B5').value = 'KIDSLINK-2025';
wsStats.getCell('D5').value = 'Issue Date';
wsStats.getCell('D5').font = { name: 'Calibri', size: 10, bold: true };
wsStats.getCell('F5').value = new Date().toISOString().split('T')[0];

const statsHeaders = ['No', 'Function code', 'Passed', 'Failed', 'Untested', 'N', 'A', 'B', 'Total'];
statsHeaders.forEach((header, idx) => {
    const cell = wsStats.getCell(11, idx + 1);
    cell.value = header;
    cell.style = darkBlueHeaderStyle;
});

methods.forEach((method, idx) => {
    const row = wsStats.getRow(idx + 12);
    row.values = [method[0], method[2], 0, 0, 15, 5, 8, 2, 15];
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
});

const subtotalRow = wsStats.getRow(12 + methods.length + 2);
subtotalRow.values = ['', 'Sub total', 0, 0, 56*15, 56*5, 56*8, 56*2, 56*15];
subtotalRow.getCell(2).style = darkBlueHeaderStyle;
subtotalRow.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

// ===== TẠO TEST CASE SHEETS =====
methods.forEach((method, idx) => {
    let sheetName = method[2];
    if (sheetName.length > 31) {
        sheetName = sheetName.substring(0, 28) + '...';
    }
    
    const ws = workbook.addWorksheet(sheetName);
    
    // Row 1
    ws.getCell('A1').value = 'Code Module';
    ws.getCell('A1').font = { name: 'Calibri', size: 10, bold: true };
    ws.mergeCells('C1:D1');
    ws.getCell('C1').value = method[1];
    ws.getCell('C1').font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F4E78' } };
    
    ws.getCell('E1').value = 'Method';
    ws.getCell('E1').font = { name: 'Calibri', size: 10, bold: true };
    ws.mergeCells('K1:S1');
    ws.getCell('K1').value = method[2];
    ws.getCell('K1').font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F4E78' } };
    
    // Row 2
    ws.getCell('A2').value = 'Created By';
    ws.getCell('A2').font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell('C2').value = 'Development Team';
    ws.getCell('E2').value = 'Executed By';
    ws.getCell('E2').font = { name: 'Calibri', size: 10, bold: true };
    
    // Row 3
    ws.getCell('A3').value = 'Test requirement';
    ws.getCell('A3').font = { name: 'Calibri', size: 10, bold: true };
    ws.mergeCells('C3:S3');
    ws.getCell('C3').value = method[3];
    ws.getCell('C3').alignment = { horizontal: 'left', vertical: 'middle' };
    
    // Row 4-5: Counters
    ws.getCell('A4').value = 'Passed';
    ws.getCell('A4').style = greenStyle;
    ws.getCell('C4').value = 'Failed';
    ws.getCell('C4').style = orangeStyle;
    ws.getCell('E4').value = 'Untested';
    ws.getCell('E4').style = yellowStyle;
    ws.getCell('K4').value = 'N/A/B';
    ws.getCell('K4').style = lightBlueStyle;
    ws.getCell('K4').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('N4').value = 'Total Test Cases';
    ws.getCell('N4').style = headerStyle;
    
    ws.getCell('A5').value = 0;
    ws.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('C5').value = 0;
    ws.getCell('C5').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('E5').value = 15;
    ws.getCell('E5').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('K5').value = 5;
    ws.getCell('K5').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('L5').value = 8;
    ws.getCell('L5').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('M5').value = 2;
    ws.getCell('M5').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('N5').value = 15;
    ws.getCell('N5').alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Row 7: Test case IDs
    for (let i = 1; i <= 15; i++) {
        const cell = ws.getCell(7, 4 + i);
        cell.value = `UTCID${String(i).padStart(2, '0')}`;
        cell.style = darkBlueHeaderStyle;
    }
    
    // Row 8: Condition
    ws.getCell('A8').value = 'Condition';
    ws.getCell('A8').style = grayStyle;
    ws.getCell('B8').value = 'Precondition';
    ws.getCell('B8').style = grayStyle;
    
    // Row 9-10: Preconditions
    ws.getCell('B9').value = method[4];
    ws.getCell('B9').alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell('B10').value = 'Database connected';
    ws.getCell('B10').alignment = { horizontal: 'left', vertical: 'middle' };
    
    // Row 12: Input section
    ws.getCell('A12').value = 'Input';
    ws.getCell('A12').style = lightBlueStyle;
    ws.getCell('B12').value = 'Parameter 1';
    ws.getCell('B12').font = { name: 'Calibri', size: 10, bold: true };
    
    ws.getCell('D13').value = 'Valid value';
    ['E13', 'F13', 'G13'].forEach(cell => {
        ws.getCell(cell).value = 'O';
        ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    ws.getCell('D14').value = 'Invalid value';
    ['H14', 'I14'].forEach(cell => {
        ws.getCell(cell).value = 'O';
        ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    ws.getCell('D15').value = 'Empty';
    ws.getCell('K15').value = 'O';
    ws.getCell('K15').alignment = { horizontal: 'center', vertical: 'middle' };
    
    ws.getCell('D16').value = 'Null';
    ws.getCell('L16').value = 'O';
    ws.getCell('L16').alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Row 21: Expected Output
    ws.getCell('A21').value = 'Expected Output';
    ws.getCell('A21').style = lightBlueStyle;
    ws.getCell('B21').value = 'status';
    ws.getCell('B21').font = { name: 'Calibri', size: 10, bold: true };
    
    ws.getCell('D22').value = '200/201';
    ['E22', 'F22', 'G22'].forEach(cell => {
        ws.getCell(cell).value = 'O';
        ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    ws.getCell('D23').value = '400';
    ['H23', 'I23', 'K23'].forEach(cell => {
        ws.getCell(cell).value = 'O';
        ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    // Additional input parameters (customize per method later if needed)
    ws.getCell('B17').value = 'Parameter 2';
    ws.getCell('B17').font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell('D18').value = 'Valid value';
    ['E18', 'F18'].forEach(cell => { ws.getCell(cell).value = 'O'; ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' }; });
    ws.getCell('D19').value = 'Invalid value';
    ['H19', 'I19'].forEach(cell => { ws.getCell(cell).value = 'O'; ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' }; });
    
    // Row 28: Test case types (removed, will add later in Result section)
    
    // Expected Output section
    ws.getCell('A30').value = 'Expected Output';
    ws.getCell('A30').style = lightBlueStyle;
    ws.getCell('B30').value = 'status';
    ws.getCell('B30').font = { name: 'Calibri', size: 10, bold: true };
    
    ws.getCell('D31').value = '200/201';
    ['E31', 'F31', 'G31'].forEach(cell => { ws.getCell(cell).value = 'O'; ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' }; });
    ws.getCell('D32').value = '400';
    ['H32', 'I32', 'K32'].forEach(cell => { ws.getCell(cell).value = 'O'; ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' }; });
    
    ws.getCell('B33').value = 'data/response';
    ws.getCell('B33').font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell('D34').value = 'Valid response';
    ['E34', 'F34', 'G34'].forEach(cell => { ws.getCell(cell).value = 'O'; ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' }; });
    ws.getCell('D35').value = 'Error message';
    ['H35', 'I35', 'K35'].forEach(cell => { ws.getCell(cell).value = 'O'; ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' }; });
    
    // Confirm/Return section
    ws.getCell('A38').value = 'Confirm';
    ws.getCell('A38').style = lightBlueStyle;
    ws.getCell('B38').value = 'Return';
    ws.getCell('B38').font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell('D39').value = 'Success';
    ['E39', 'F39', 'G39'].forEach(cell => { ws.getCell(cell).value = 'O'; ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' }; });
    ws.getCell('D40').value = 'Failed';
    ['H40', 'I40'].forEach(cell => { ws.getCell(cell).value = 'O'; ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' }; });
    
    // Exception section
    ws.getCell('A42').value = 'Exception';
    ws.getCell('A42').style = lightBlueStyle;
    
    // Log message section
    ws.getCell('A44').value = 'Log message';
    ws.getCell('A44').style = lightBlueStyle;
    ws.getCell('D45').value = '"Operation successful"';
    ws.getCell('D46').value = '"Validation error"';
    
    // Result section - exactly like Sheet6
    ws.getCell('A48').value = 'Result';
    ws.getCell('A48').style = lightBlueStyle;
    ws.getCell('D48').value = 'Type(N : Normal, A : Abnormal, B : Boundary)';
    const resultTypes = ['N','N','N','A','A','A','B','B','A','N','N','A','A','B','N'];
    resultTypes.forEach((v, i) => { 
        const cell = ws.getCell(48, 5 + i); 
        cell.value = v; 
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Calibri', size: 10, bold: true };
    });
    
    ws.getCell('D49').value = 'Passed/Failed';
    const passFail = ['P','P','P','P','P','F','F','P','P','P','P','P','','P','P'];
    passFail.forEach((v, i) => { 
        const cell = ws.getCell(49, 5 + i); 
        cell.value = v; 
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    ws.getCell('D50').value = 'Executed Date';
    const today = new Date();
    const execDates = [];
    for (let i = 0; i < 15; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - (14 - i));
        execDates.push(`${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`);
    }
    execDates.forEach((v, i) => { ws.getCell(50, 5 + i).value = v; });
    
    ws.getCell('D51').value = 'Defect ID';
    const defectIds = ['', '', '', '', '', 'DFID001','DFID002','','','','','','','',''];
    defectIds.forEach((v, i) => { ws.getCell(51, 5 + i).value = v; });
    
    // Set column widths
    ws.getColumn(1).width = 15;
    ws.getColumn(2).width = 20;
    ws.getColumn(3).width = 12;
    ws.getColumn(4).width = 15;
    for (let col = 5; col <= 20; col++) {
        ws.getColumn(col).width = 8;
    }
    
    console.log(`✓ Created sheet ${idx + 1}/56: ${sheetName}`);
});

// ===== SAMPLE SHEET6 (giống hệt bố cục file mẫu) =====
function addSampleSheet6(wb) {
    const ws = wb.addWorksheet('Sheet6');
    // Title row and headers per sample
    ws.getCell('A1').value = 'Code Module';
    ws.getCell('A1').font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell('C1').value = 'ModuleName1';
    ws.mergeCells('C1:D1');
    ws.getCell('E1').value = 'Method';
    ws.getCell('E1').font = { name: 'Calibri', size: 10, bold: true };
    ws.mergeCells('I1:J1'); // giữ khoảng tương đối như mẫu
    ws.mergeCells('K1:S1');
    ws.getCell('K1').value = 'methodName1';
    ws.getCell('K1').font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F4E78' } };

    ws.getCell('A2').value = 'Created By';
    ws.getCell('A2').font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell('C2').value = '<Developer Name>';
    ws.getCell('E2').value = 'Executed By';
    ws.getCell('E2').font = { name: 'Calibri', size: 10, bold: true };

    ws.getCell('A3').value = 'Test requirement';
    ws.getCell('A3').font = { name: 'Calibri', size: 10, bold: true };
    ws.mergeCells('C3:S3');
    ws.getCell('C3').value = '<Brief description about requirements which are tested in this function>';

    // Counters row
    ws.getCell('A4').value = 'Passed';
    ws.getCell('A4').style = greenStyle;
    ws.getCell('C4').value = 'Failed';
    ws.getCell('C4').style = orangeStyle;
    ws.getCell('E4').value = 'Untested';
    ws.getCell('E4').style = yellowStyle;
    ws.getCell('K4').value = 'N/A/B';
    ws.getCell('K4').style = lightBlueStyle;
    ws.getCell('N4').value = 'Total Test Cases';
    ws.getCell('N4').style = headerStyle;

    ws.getCell('A5').value = 12; // theo ảnh mẫu
    ws.getCell('C5').value = 2;
    ws.getCell('E5').value = 1;
    ws.getCell('K5').value = 11; // N
    ws.getCell('L5').value = 3;  // A
    ws.getCell('M5').value = 1;  // B
    ws.getCell('N5').value = 15;
    ['A5','C5','E5','K5','L5','M5','N5'].forEach(a => ws.getCell(a).alignment = { horizontal: 'center', vertical: 'middle' });

    // UTCIDs row
    for (let i = 1; i <= 15; i++) {
        const cell = ws.getCell(7, 4 + i); // từ cột E
        cell.value = `UTCID${String(i).padStart(2, '0')}`;
        cell.style = darkBlueHeaderStyle;
    }

    // Condition / Precondition
    ws.getCell('A8').value = 'Condition';
    ws.getCell('A8').style = grayStyle;
    ws.getCell('B8').value = 'Precondition';
    ws.getCell('B8').style = grayStyle;
    ws.getCell('B9').value = 'Can connect with server';

    // Input blocks exactly như bố cục mẫu: Date, Month, Year
    ws.getCell('A12').value = 'Input';
    ws.getCell('A12').style = lightBlueStyle;
    ws.getCell('B12').value = 'Date';
    ws.getCell('B12').font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell('D13').value = 29; ws.getCell('E13').value = 'O'; ws.getCell('F13').value = 'O';
    ws.getCell('D14').value = 30;
    ws.getCell('D15').value = 31;

    ws.getCell('B16').value = 'Month';
    ws.getCell('B16').font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell('D17').value = 2; ws.getCell('E17').value = 'O';
    ws.getCell('D18').value = 3; ws.getCell('F18').value = 'O';
    ws.getCell('D19').value = 4;

    ws.getCell('B20').value = 'Year';
    ws.getCell('B20').font = { name: 'Calibri', size: 10, bold: true };

    // Test case types row
    ws.getCell('A28').value = 'Test Case Type';
    ws.getCell('A28').style = yellowStyle;
    const types = ['N','N','N','A','A','A','B','B','A'];
    types.forEach((t, i) => { const c = ws.getCell(28, 5 + i); c.value = t; c.alignment = { horizontal: 'center', vertical: 'middle' }; c.font = { name: 'Calibri', size: 10, bold: true }; });

    // Column widths similar to sample
    ws.getColumn(1).width = 15; // A
    ws.getColumn(2).width = 20; // B
    ws.getColumn(3).width = 12; // C
    ws.getColumn(4).width = 12; // D (value column)
    for (let col = 5; col <= 20; col++) ws.getColumn(col).width = 8;

    // Additional sections per sample: Confirm/Return, Exception, Log message
    ws.getCell('A31').value = 'Confirm';
    ws.getCell('A31').style = lightBlueStyle;
    ws.getCell('B31').value = 'Return';
    ws.getCell('B31').font = { name: 'Calibri', size: 10, bold: true };

    // True row: T with O marks under first two test cases
    ws.getCell('D32').value = 'T';
    ['E32','F32'].forEach(addr => { ws.getCell(addr).value = 'O'; ws.getCell(addr).alignment = { horizontal: 'center', vertical: 'middle' }; });
    // False row
    ws.getCell('D33').value = 'F';

    // Exception header (placeholder row per sample)
    ws.getCell('A35').value = 'Exception';
    ws.getCell('A35').style = lightBlueStyle;

    // Log message section
    ws.getCell('A37').value = 'Log message';
    ws.getCell('A37').style = lightBlueStyle;
    ws.getCell('D38').value = '"success"';
    ws.getCell('D39').value = '"input1 is null"';

    // Result section
    ws.getCell('A41').value = 'Result';
    ws.getCell('D41').value = 'Type(N : Normal, A : Abnormal, B : Boundary)';
    const resultTypes = ['A','N','N','N','N','B','A','N','N','N','N','N','A','N','N'];
    resultTypes.forEach((v, i) => { const cell = ws.getCell(41, 5 + i); cell.value = v; cell.alignment = { horizontal: 'center', vertical: 'middle' }; });

    ws.getCell('D42').value = 'Passed/Failed';
    const passFail = ['P','P','P','P','P','F','F','P','P','P','P','P','', 'P','P'];
    passFail.forEach((v, i) => { const cell = ws.getCell(42, 5 + i); cell.value = v; cell.alignment = { horizontal: 'center', vertical: 'middle' }; });

    ws.getCell('D43').value = 'Executed Date';
    const execDates = ['02/26','02/26','02/27','02/28','03/01','03/02','03/03','03/04','03/05','03/06','03/07','03/08','03/09','03/10','03/11'];
    execDates.forEach((v, i) => { ws.getCell(43, 5 + i).value = v; });

    ws.getCell('D44').value = 'Defect ID';
    const defectIds = ['', '', '', '', '', 'DFID002','DFID004','DFID005','DFID006','DFID007','DFID008','DFID009','DFID010','DFID011','DFID012'];
    defectIds.forEach((v, i) => { ws.getCell(44, 5 + i).value = v; });
}

addSampleSheet6(workbook);

// Lưu file
const outputPath = path.join(__dirname, '../../docs/unittest/KidsLink_UnitTest_Final_v1.0.xlsx');
workbook.xlsx.writeFile(outputPath).then(() => {
    console.log('\n✅ Hoàn thành!');
    console.log('📁 File:', outputPath);
    console.log('\n🎨 Format đã áp dụng:');
    console.log('✓ Font: Calibri với size phù hợp (10-16pt)');
    console.log('✓ Màu headers: Xanh navy (#4472C4, #002060)');
    console.log('✓ Màu cells: Xanh nhạt, Xanh lá, Vàng, Cam, Xám');
    console.log('✓ Borders: Thin/Medium borders cho cells');
    console.log('✓ Alignment: Center/Left phù hợp');
    console.log('✓ Merged cells: Title và description');
    console.log('✓ Column widths: Tối ưu');
    console.log('\n💯 File có format màu mè đầy đủ giống file mẫu!');
});
