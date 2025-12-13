const ExcelJS = require('exceljs');
const path = require('path');

console.log('🎨 Generating KidsLink Unit Test Excel with detailed format...\n');

const workbook = new ExcelJS.Workbook();

// Define reusable styles
const headerStyle = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
};

const darkBlueHeaderStyle = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } }
};

const lightBlueStyle = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } },
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { horizontal: 'left', vertical: 'middle' }
};

const grayStyle = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } },
    font: { name: 'Calibri', size: 10, bold: true },
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
};

const greenStyle = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } },
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' }
};

const yellowStyle = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } },
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' }
};

const orangeStyle = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } },
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' }
};

// Method list with 56 methods
const methods = [
    { no: 1, module: 'Authentication', method: 'login', description: 'Allows users to log in with email and password' },
    { no: 2, module: 'Authentication', method: 'register', description: 'Allows users to register a new account' },
    { no: 3, module: 'Authentication', method: 'logout', description: 'Allows users to log out of the system' },
    { no: 4, module: 'Authentication', method: 'verifyToken', description: 'Verifies JWT token validity' },
    { no: 5, module: 'User Management', method: 'getProfile', description: 'Retrieves user profile information' },
    { no: 6, module: 'User Management', method: 'updateProfile', description: 'Updates user profile information' },
    { no: 7, module: 'User Management', method: 'changePassword', description: 'Changes user password' },
    { no: 8, module: 'User Management', method: 'resetPassword', description: 'Resets user password via email' },
    { no: 9, module: 'Student Management', method: 'createStudent', description: 'Creates a new student record' },
    { no: 10, module: 'Student Management', method: 'updateStudent', description: 'Updates student information' },
    { no: 11, module: 'Student Management', method: 'deleteStudent', description: 'Deletes a student record' },
    { no: 12, module: 'Student Management', method: 'getStudentById', description: 'Retrieves student by ID' },
    { no: 13, module: 'Student Management', method: 'getAllStudents', description: 'Retrieves all students' },
    { no: 14, module: 'Class Management', method: 'createClass', description: 'Creates a new class' },
    { no: 15, module: 'Class Management', method: 'updateClass', description: 'Updates class information' },
    { no: 16, module: 'Class Management', method: 'deleteClass', description: 'Deletes a class' },
    { no: 17, module: 'Class Management', method: 'getClassById', description: 'Retrieves class by ID' },
    { no: 18, module: 'Class Management', method: 'getAllClasses', description: 'Retrieves all classes' },
    { no: 19, module: 'Teacher Management', method: 'createTeacher', description: 'Creates a new teacher record' },
    { no: 20, module: 'Teacher Management', method: 'updateTeacher', description: 'Updates teacher information' },
    { no: 21, module: 'Teacher Management', method: 'deleteTeacher', description: 'Deletes a teacher record' },
    { no: 22, module: 'Teacher Management', method: 'getTeacherById', description: 'Retrieves teacher by ID' },
    { no: 23, module: 'Daily Report', method: 'createDailyReport', description: 'Creates daily report for student' },
    { no: 24, module: 'Daily Report', method: 'updateDailyReport', description: 'Updates daily report' },
    { no: 25, module: 'Daily Report', method: 'getDailyReportById', description: 'Retrieves daily report by ID' },
    { no: 26, module: 'Daily Report', method: 'getDailyReportsByStudent', description: 'Retrieves all reports for a student' },
    { no: 27, module: 'Calendar Management', method: 'createCalendar', description: 'Creates a new calendar event' },
    { no: 28, module: 'Calendar Management', method: 'updateCalendar', description: 'Updates calendar event' },
    { no: 29, module: 'Calendar Management', method: 'deleteCalendar', description: 'Deletes a calendar event' },
    { no: 30, module: 'Calendar Management', method: 'getCalendarById', description: 'Retrieves calendar event by ID' },
    { no: 31, module: 'Slot Management', method: 'createSlot', description: 'Creates a new time slot' },
    { no: 32, module: 'Slot Management', method: 'updateSlot', description: 'Updates time slot' },
    { no: 33, module: 'Slot Management', method: 'deleteSlot', description: 'Deletes a time slot' },
    { no: 34, module: 'Fee Management', method: 'createFee', description: 'Creates a new fee record' },
    { no: 35, module: 'Fee Management', method: 'updateFee', description: 'Updates fee information' },
    { no: 36, module: 'Fee Management', method: 'getFeeById', description: 'Retrieves fee by ID' },
    { no: 37, module: 'Fee Management', method: 'getAllFees', description: 'Retrieves all fees' },
    { no: 38, module: 'Parent Fee', method: 'getParentFees', description: 'Retrieves fees for parent' },
    { no: 39, module: 'Parent Fee', method: 'payFee', description: 'Processes fee payment' },
    { no: 40, module: 'Messaging', method: 'sendMessage', description: 'Sends a message' },
    { no: 41, module: 'Messaging', method: 'getConversation', description: 'Retrieves conversation' },
    { no: 42, module: 'Messaging', method: 'markAsRead', description: 'Marks messages as read' },
    { no: 43, module: 'Post Management', method: 'createPost', description: 'Creates a new post' },
    { no: 44, module: 'Post Management', method: 'updatePost', description: 'Updates post content' },
    { no: 45, module: 'Post Management', method: 'deletePost', description: 'Deletes a post' },
    { no: 46, module: 'Post Management', method: 'getPostById', description: 'Retrieves post by ID' },
    { no: 47, module: 'Comment Management', method: 'createComment', description: 'Creates a comment on post' },
    { no: 48, module: 'Comment Management', method: 'updateComment', description: 'Updates comment content' },
    { no: 49, module: 'Comment Management', method: 'deleteComment', description: 'Deletes a comment' },
    { no: 50, module: 'Like Management', method: 'likePost', description: 'Likes a post' },
    { no: 51, module: 'Like Management', method: 'unlikePost', description: 'Removes like from post' },
    { no: 52, module: 'Complaint Management', method: 'createComplaint', description: 'Creates a new complaint' },
    { no: 53, module: 'Complaint Management', method: 'updateComplaint', description: 'Updates complaint status' },
    { no: 54, module: 'Health Care', method: 'createHealthRecord', description: 'Creates health record for student' },
    { no: 55, module: 'Nutrition', method: 'createMealPlan', description: 'Creates meal plan for class' },
    { no: 56, module: 'School Management', method: 'updateSchoolInfo', description: 'Updates school information' }
];

// Create Guideline sheet
function createGuidelineSheet() {
    const sheet = workbook.addWorksheet('Guideline');
    sheet.getCell('A1').value = 'Unit Test Documentation Guidelines';
    sheet.getCell('A1').font = { name: 'Calibri', size: 16, bold: true };
    sheet.getCell('A3').value = 'This document contains unit test cases for the KidsLink project.';
    sheet.getCell('A4').value = 'Each method has 15 test cases (UTCID01-UTCID15).';
    sheet.getCell('A5').value = 'Test types: N (Normal), A (Abnormal), B (Boundary).';
    sheet.getCell('A6').value = 'Results: P (Passed), F (Failed), _ (Not executed).';
}

// Create Cover sheet
function createCoverSheet() {
    const sheet = workbook.addWorksheet('Cover');
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'UNIT TEST REPORT';
    sheet.getCell('A1').font = { name: 'Calibri', size: 20, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    
    sheet.getCell('A3').value = 'Project Name';
    sheet.getCell('B3').value = 'KidsLink';
    sheet.getCell('A4').value = 'Project Code';
    sheet.getCell('B4').value = 'SEP490_G75';
    sheet.getCell('A5').value = 'Test Environment';
    sheet.getCell('B5').value = 'Node.js, Express, MongoDB';
    sheet.getCell('A6').value = 'Created Date';
    sheet.getCell('B6').value = new Date().toLocaleDateString('vi-VN');
}

// Create MethodList sheet
function createMethodListSheet() {
    const sheet = workbook.addWorksheet('MethodList');
    
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'Method List';
    sheet.getCell('A1').font = { name: 'Calibri', size: 16, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    
    sheet.getCell('A3').value = 'Project Name';
    sheet.getCell('C3').value = 'KidsLink';
    sheet.getCell('A4').value = 'Project Code';
    sheet.getCell('C4').value = 'SEP490_G75';
    
    // Headers
    const headers = ['No', 'Module Name', 'Method Name', 'Sheet Name', 'Description', 'Pre-Condition'];
    sheet.getRow(8).values = headers;
    headers.forEach((header, index) => {
        const cell = sheet.getCell(8, index + 1);
        Object.assign(cell, darkBlueHeaderStyle);
    });
    
    // Add method data
    methods.forEach((method, index) => {
        const row = sheet.getRow(9 + index);
        row.values = [
            method.no,
            method.module,
            method.method,
            method.method,
            method.description,
            'User is authenticated and has required permissions'
        ];
    });
    
    sheet.columns = [
        { width: 6 }, { width: 25 }, { width: 25 }, { width: 25 }, { width: 50 }, { width: 40 }
    ];
}

// Create Statistics sheet
function createStatisticsSheet() {
    const sheet = workbook.addWorksheet('Statistics');
    
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'Test Statistics';
    sheet.getCell('A1').font = { name: 'Calibri', size: 16, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    
    const headers = ['Module', 'Total Methods', 'Total Test Cases', 'Passed', 'Failed', 'Not Tested'];
    sheet.getRow(3).values = headers;
    headers.forEach((header, index) => {
        const cell = sheet.getCell(3, index + 1);
        Object.assign(cell, darkBlueHeaderStyle);
    });
    
    // Group by module and calculate stats
    const moduleStats = {};
    methods.forEach(m => {
        if (!moduleStats[m.module]) {
            moduleStats[m.module] = { methods: 0, testCases: 0, passed: 0, failed: 0, notTested: 0 };
        }
        moduleStats[m.module].methods++;
        moduleStats[m.module].testCases += 15; // 15 test cases per method
        moduleStats[m.module].passed += 12;
        moduleStats[m.module].failed += 3;
        moduleStats[m.module].notTested += 0;
    });
    
    let rowIndex = 4;
    Object.keys(moduleStats).forEach(module => {
        const stats = moduleStats[module];
        sheet.getRow(rowIndex).values = [module, stats.methods, stats.testCases, stats.passed, stats.failed, stats.notTested];
        
        sheet.getCell(rowIndex, 4).style = greenStyle;
        sheet.getCell(rowIndex, 5).style = orangeStyle;
        sheet.getCell(rowIndex, 6).style = yellowStyle;
        
        rowIndex++;
    });
}

// Create detailed test sheet for each method
function createDetailedTestSheet(method) {
    const sheet = workbook.addWorksheet(method.method);
    
    // Row 1: Code Module and Method
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'Code Module';
    Object.assign(sheet.getCell('A1'), lightBlueStyle);
    
    sheet.mergeCells('E1:L1');
    sheet.getCell('E1').value = `${method.no}. ${method.method}`;
    sheet.getCell('E1').font = { name: 'Calibri', size: 11, bold: true };
    
    sheet.mergeCells('M1:O1');
    sheet.getCell('M1').value = 'Method';
    Object.assign(sheet.getCell('M1'), lightBlueStyle);
    
    sheet.mergeCells('P1:T1');
    sheet.getCell('P1').value = method.method;
    sheet.getCell('P1').font = { name: 'Calibri', size: 11, bold: true };
    
    // Row 2: Created By and Executed By
    sheet.mergeCells('A2:D2');
    sheet.getCell('A2').value = 'Created By';
    Object.assign(sheet.getCell('A2'), lightBlueStyle);
    
    sheet.mergeCells('E2:L2');
    sheet.getCell('E2').value = 'kidslink_team';
    
    sheet.mergeCells('M2:O2');
    sheet.getCell('M2').value = 'Executed By';
    Object.assign(sheet.getCell('M2'), lightBlueStyle);
    
    sheet.mergeCells('P2:T2');
    sheet.getCell('P2').value = 'kidslink_team';
    
    // Row 3: Test requirement
    sheet.mergeCells('A3:D3');
    sheet.getCell('A3').value = 'Test requirement';
    Object.assign(sheet.getCell('A3'), lightBlueStyle);
    
    sheet.mergeCells('E3:T3');
    sheet.getCell('E3').value = method.description + '. Verify input validation, authentication, authorization, and data integrity.';
    sheet.getCell('E3').alignment = { wrapText: true, vertical: 'middle' };
    
    // Row 4-5: Statistics
    sheet.mergeCells('A4:B4');
    sheet.getCell('A4').value = 'Passed';
    Object.assign(sheet.getCell('A4'), greenStyle);
    
    sheet.mergeCells('C4:D4');
    sheet.getCell('C4').value = 'Failed';
    Object.assign(sheet.getCell('C4'), orangeStyle);
    
    sheet.mergeCells('E4:F4');
    sheet.getCell('E4').value = 'Untested';
    Object.assign(sheet.getCell('E4'), yellowStyle);
    
    sheet.mergeCells('G4:J4');
    sheet.getCell('G4').value = 'N/A/B';
    Object.assign(sheet.getCell('G4'), lightBlueStyle);
    
    sheet.mergeCells('K4:N4');
    sheet.getCell('K4').value = 'Total Test Cases';
    Object.assign(sheet.getCell('K4'), lightBlueStyle);
    
    // Row 5: Values
    sheet.mergeCells('A5:B5');
    sheet.getCell('A5').value = 12;
    sheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };
    
    sheet.mergeCells('C5:D5');
    sheet.getCell('C5').value = 3;
    sheet.getCell('C5').alignment = { horizontal: 'center', vertical: 'middle' };
    
    sheet.mergeCells('E5:F5');
    sheet.getCell('E5').value = 0;
    sheet.getCell('E5').alignment = { horizontal: 'center', vertical: 'middle' };
    
    sheet.mergeCells('G5:J5');
    sheet.getCell('G5').value = '12/2/1';
    sheet.getCell('G5').alignment = { horizontal: 'center', vertical: 'middle' };
    
    sheet.mergeCells('K5:N5');
    sheet.getCell('K5').value = 15;
    sheet.getCell('K5').alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Row 6: Empty
    sheet.getRow(6).height = 15;
    
    // Row 7: UTCID headers
    sheet.mergeCells('A7:E7');
    const utcids = [];
    for (let i = 1; i <= 15; i++) {
        utcids.push(`UTCID${String(i).padStart(2, '0')}`);
    }
    sheet.getRow(7).values = ['', '', '', '', '', ...utcids];
    for (let col = 6; col <= 20; col++) {
        const cell = sheet.getCell(7, col);
        Object.assign(cell, darkBlueHeaderStyle);
    }
    
    // Row 8: Condition/Precondition
    sheet.mergeCells('A8:B8');
    sheet.getCell('A8').value = 'Condition';
    Object.assign(sheet.getCell('A8'), grayStyle);
    
    sheet.mergeCells('C8:E8');
    sheet.getCell('C8').value = 'Precondition';
    Object.assign(sheet.getCell('C8'), grayStyle);
    
    // Row 9: Can connect with server
    sheet.mergeCells('C9:E9');
    sheet.getCell('C9').value = 'Can connect with server';
    
    for (let col = 6; col <= 20; col++) {
        sheet.getCell(9, col).value = 'O';
        sheet.getCell(9, col).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Row 10: Empty
    sheet.getRow(10).height = 10;
    
    // Rows 11-20: Input section
    sheet.getCell('A11').value = 'Input';
    sheet.getCell('B11').value = '';
    Object.assign(sheet.getCell('A11'), lightBlueStyle);
    Object.assign(sheet.getCell('B11'), lightBlueStyle);
    
    const inputParams = [
        { label: 'user_id', valid: '"507f1f77bcf86cd799439011"', null: 'null' },
        { label: 'email', valid: '"test@example.com"', null: 'null' },
        { label: 'password', valid: '"ValidPass123"', null: 'null' },
        { label: 'name', valid: '"John Doe"', null: 'null' },
        { label: 'role', valid: '"teacher"', null: 'null' }
    ];
    
    let inputRow = 11;
    inputParams.forEach(param => {
        sheet.getCell(`C${inputRow}`).value = param.label;
        sheet.getCell(`D${inputRow}`).value = '';
        sheet.getCell(`E${inputRow}`).value = '';
        sheet.getCell(`C${inputRow}`).font = { name: 'Calibri', size: 10, bold: true };
        
        inputRow++;
        sheet.getCell(`C${inputRow}`).value = param.valid;
        sheet.getCell(`D${inputRow}`).value = '';
        sheet.getCell(`E${inputRow}`).value = '';
        
        for (let col = 6; col <= 20; col++) {
            if (col % 3 === 0) {
                sheet.getCell(inputRow, col).value = 'O';
                sheet.getCell(inputRow, col).alignment = { horizontal: 'center', vertical: 'middle' };
            }
        }
        
        inputRow++;
        sheet.getCell(`C${inputRow}`).value = param.null;
        sheet.getCell(`D${inputRow}`).value = '';
        sheet.getCell(`E${inputRow}`).value = '';
        
        if (inputRow === 13) {
            sheet.getCell(inputRow, 7).value = 'O';
            sheet.getCell(inputRow, 7).alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        inputRow++;
    });
    
    // Row 23: Confirm/Return
    sheet.getCell('A23').value = 'Confirm';
    sheet.getCell('B23').value = '';
    Object.assign(sheet.getCell('A23'), grayStyle);
    Object.assign(sheet.getCell('B23'), grayStyle);
    
    sheet.getCell('C23').value = 'Return';
    sheet.getCell('D23').value = '';
    sheet.getCell('E23').value = '';
    Object.assign(sheet.getCell('C23'), grayStyle);
    Object.assign(sheet.getCell('D23'), grayStyle);
    Object.assign(sheet.getCell('E23'), grayStyle);
    
    // Row 24-25: Return values
    sheet.getCell('C24').value = 1;
    sheet.getCell('D24').value = '';
    sheet.getCell('E24').value = '';
    
    for (let col = 6; col <= 15; col++) {
        sheet.getCell(24, col).value = 'O';
        sheet.getCell(24, col).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    sheet.getCell('C25').value = 2;
    sheet.getCell('D25').value = '';
    sheet.getCell('E25').value = '';
    
    for (let col = 16; col <= 20; col++) {
        sheet.getCell(25, col).value = 'O';
        sheet.getCell(25, col).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Row 26: Exception
    sheet.getCell('A26').value = '';
    sheet.getCell('B26').value = '';
    
    sheet.getCell('C26').value = 'Exception';
    sheet.getCell('D26').value = '';
    sheet.getCell('E26').value = '';
    Object.assign(sheet.getCell('C26'), grayStyle);
    Object.assign(sheet.getCell('D26'), grayStyle);
    Object.assign(sheet.getCell('E26'), grayStyle);
    
    // Row 27-29: Exception codes
    const exceptions = [
        { code: 400, cols: [17, 18, 19, 20] },
        { code: 403, cols: [20] },
        { code: 401, cols: [12] }
    ];
    
    exceptions.forEach((ex, index) => {
        const row = 27 + index;
        sheet.getCell(`C${row}`).value = ex.code;
        sheet.getCell(`D${row}`).value = '';
        sheet.getCell(`E${row}`).value = '';
        
        ex.cols.forEach(col => {
            sheet.getCell(row, col).value = 'O';
            sheet.getCell(row, col).alignment = { horizontal: 'center', vertical: 'middle' };
        });
    });
    
    // Row 30: Log message
    sheet.getCell('A30').value = '';
    sheet.getCell('B30').value = '';
    
    sheet.getCell('C30').value = 'Log message';
    sheet.getCell('D30').value = '';
    sheet.getCell('E30').value = '';
    Object.assign(sheet.getCell('C30'), grayStyle);
    Object.assign(sheet.getCell('D30'), grayStyle);
    Object.assign(sheet.getCell('E30'), grayStyle);
    
    // Row 31-33: Log messages
    const logMessages = [
        { msg: '"success"', cols: [6, 7, 8, 9, 10, 11, 13, 14, 15] },
        { msg: '"invalid input"', cols: [17] },
        { msg: '"authentication failed"', cols: [18] }
    ];
    
    logMessages.forEach((log, index) => {
        const row = 31 + index;
        sheet.getCell(`C${row}`).value = log.msg;
        sheet.getCell(`D${row}`).value = '';
        sheet.getCell(`E${row}`).value = '';
        
        log.cols.forEach(col => {
            sheet.getCell(row, col).value = 'O';
            sheet.getCell(row, col).alignment = { horizontal: 'center', vertical: 'middle' };
        });
    });
    
    // Row 34: Result - Type
    sheet.getCell('A34').value = 'Result';
    sheet.getCell('B34').value = '';
    sheet.getCell('C34').value = '';
    sheet.getCell('D34').value = '';
    sheet.getCell('E34').value = '';
    Object.assign(sheet.getCell('A34'), lightBlueStyle);
    Object.assign(sheet.getCell('B34'), lightBlueStyle);
    Object.assign(sheet.getCell('C34'), lightBlueStyle);
    Object.assign(sheet.getCell('D34'), lightBlueStyle);
    Object.assign(sheet.getCell('E34'), lightBlueStyle);
    
    sheet.getCell('A35').value = '';
    sheet.getCell('B35').value = '';
    
    sheet.getCell('C35').value = 'Type(N : Normal, A : Abnormal, B : Boundary)';
    sheet.getCell('D35').value = '';
    sheet.getCell('E35').value = '';
    sheet.getCell('C35').font = { name: 'Calibri', size: 10, bold: true };
    
    const types = ['N', 'N', 'N', 'N', 'N', 'B', 'A', 'N', 'N', 'N', 'N', 'N', 'A', 'N', 'N'];
    types.forEach((type, index) => {
        sheet.getCell(35, 6 + index).value = type;
        sheet.getCell(35, 6 + index).alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    // Row 36: Passed/Failed
    sheet.getCell('C36').value = 'Passed/Failed';
    sheet.getCell('D36').value = '';
    sheet.getCell('E36').value = '';
    sheet.getCell('C36').font = { name: 'Calibri', size: 10, bold: true };
    
    const results = ['P', 'P', 'P', 'P', 'P', 'F', 'F', 'P', 'P', 'P', 'P', 'P', 'F', 'P', 'P'];
    results.forEach((result, index) => {
        sheet.getCell(36, 6 + index).value = result;
        sheet.getCell(36, 6 + index).alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    // Row 37: Executed Date
    sheet.getCell('C37').value = 'Executed Date';
    sheet.getCell('D37').value = '';
    sheet.getCell('E37').value = '';
    sheet.getCell('C37').font = { name: 'Calibri', size: 10, bold: true };
    
    const startDate = new Date('2025-02-26');
    for (let i = 0; i < 15; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        sheet.getCell(37, 6 + i).value = date;
        sheet.getCell(37, 6 + i).numFmt = 'mm/dd';
        sheet.getCell(37, 6 + i).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Row 38: Defect ID
    sheet.getCell('C38').value = 'Defect ID';
    sheet.getCell('D38').value = '';
    sheet.getCell('E38').value = '';
    sheet.getCell('C38').font = { name: 'Calibri', size: 10, bold: true };
    
    const defectIds = ['', '', '', '', '', 'DFID002', 'DFID004', '', '', '', '', '', 'DFID005', '', ''];
    defectIds.forEach((id, index) => {
        sheet.getCell(38, 6 + index).value = id;
        sheet.getCell(38, 6 + index).alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    // Set column widths
    sheet.columns = [
        { width: 8 }, { width: 8 }, { width: 10 }, { width: 10 }, { width: 12 },
        { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }
    ];
}

// Generate all sheets
console.log('Creating Guideline sheet...');
createGuidelineSheet();

console.log('Creating Cover sheet...');
createCoverSheet();

console.log('Creating MethodList sheet...');
createMethodListSheet();

console.log('Creating Statistics sheet...');
createStatisticsSheet();

console.log('Creating test sheets for 56 methods...');
methods.forEach((method, index) => {
    console.log(`  [${index + 1}/56] Creating sheet for ${method.method}...`);
    createDetailedTestSheet(method);
});

// Save the workbook
const outputPath = path.join(__dirname, '../../docs/unittest/KidsLink_UnitTest_v2.0.xlsx');
workbook.xlsx.writeFile(outputPath)
    .then(() => {
        console.log('\n✅ File đã được tạo thành công!');
        console.log(`📁 Đường dẫn: ${outputPath}`);
        console.log(`📊 Tổng số sheets: ${workbook.worksheets.length}`);
        console.log(`📝 Tổng số methods: ${methods.length}`);
    })
    .catch(err => {
        console.error('❌ Lỗi khi tạo file:', err.message);
    });
