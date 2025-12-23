const ExcelJS = require('exceljs');
const path = require('path');

console.log('🎨 Generating KidsLink Unit Test Excel with FULL validation test cases...\n');

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

// Method list with detailed validation scenarios
const methods = [
    {
        no: 1,
        module: 'Authentication',
        method: 'login',
        description: 'User login with username and password',
        inputs: [
            { label: 'username', valid: '"testuser"', invalid: ['null', '""', '123 (not string)', '"  " (empty after trim)'] },
            { label: 'password', valid: '"ValidPass123!"', invalid: ['null', '""', '123 (not string)'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'user not found or wrong password' },
            { code: 403, reason: 'account locked or school disabled' }
        ]
    },
    {
        no: 2,
        module: 'Authentication',
        method: 'register',
        description: 'Register new user account',
        inputs: [
            { label: 'full_name', valid: '"John Doe"', invalid: ['null', '""', '123 (not string)'] },
            { label: 'username', valid: '"john_doe"', invalid: ['null', '""', '123', '"existing_user" (duplicate)'] },
            { label: 'password', valid: '"ValidPass123!"', invalid: ['null', '""', '"weak" (no uppercase/special)', '"short" (< 8 chars)', '"verylongpasswordmorethan16" (> 16 chars)'] },
            { label: 'role', valid: '"teacher"', invalid: ['null', '"invalid_role"', '"" (empty)'] },
            { label: 'email', valid: '"test@example.com"', invalid: ['null', '""', '"invalid@" (invalid format)', '"existing@example.com" (duplicate)'] },
            { label: 'phone_number', valid: '"0912345678"', invalid: ['null', '""', '"123" (invalid format)', '"0123456789" (duplicate)', '"1234567890" (not VN format)'] },
            { label: 'avatar_url', valid: '"https://example.com/avatar.jpg"', invalid: ['"not-a-url" (invalid URL)'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 409, reason: 'username/email/phone already exists' }
        ]
    },
    {
        no: 3,
        module: 'Authentication',
        method: 'logout',
        description: 'User logout (clear session)',
        inputs: [],
        exceptions: [
            { code: 401, reason: 'not authenticated' }
        ]
    },
    {
        no: 4,
        module: 'Authentication',
        method: 'verifyToken',
        description: 'Verify JWT token validity',
        inputs: [
            { label: 'token', valid: '"valid_jwt_token"', invalid: ['null', '""', '"invalid_token"', '"expired_token"'] }
        ],
        exceptions: [
            { code: 401, reason: 'invalid or expired token' }
        ]
    },
    {
        no: 5,
        module: 'User Management',
        method: 'getProfile',
        description: 'Get user profile information',
        inputs: [],
        exceptions: [
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'user not found' }
        ]
    },
    {
        no: 6,
        module: 'User Management',
        method: 'updateProfile',
        description: 'Update user profile',
        inputs: [
            { label: 'full_name', valid: '"Updated Name"', invalid: ['"" (empty)', '123 (not string)'] },
            { label: 'phone_number', valid: '"0912345678"', invalid: ['"123" (invalid format)', '"1234567890" (not VN)'] },
            { label: 'avatar_url', valid: '"https://example.com/new.jpg"', invalid: ['"not-url"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'user not found' }
        ]
    },
    {
        no: 7,
        module: 'User Management',
        method: 'changePassword',
        description: 'Change user password',
        inputs: [
            { label: 'old_password', valid: '"OldPass123!"', invalid: ['null', '""', '123 (not string)'] },
            { label: 'new_password', valid: '"NewPass123!"', invalid: ['null', '""', '"weak"', '"short"', '"verylongpasswordmorethan16"'] }
        ],
        exceptions: [
            { code: 400, reason: 'old password incorrect or validation error' },
            { code: 401, reason: 'not authenticated' }
        ]
    },
    {
        no: 8,
        module: 'User Management',
        method: 'resetPassword',
        description: 'Reset password via email',
        inputs: [
            { label: 'email', valid: '"user@example.com"', invalid: ['null', '""', '"invalid@" (invalid format)'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 404, reason: 'email not found' }
        ]
    },
    {
        no: 9,
        module: 'Student Management',
        method: 'createStudent',
        description: 'Create new student record',
        inputs: [
            { label: 'full_name', valid: '"Student Name"', invalid: ['null', '""', '123'] },
            { label: 'date_of_birth', valid: '"2020-01-15"', invalid: ['null', '""', '"invalid-date"', '"2030-01-01" (future)'] },
            { label: 'gender', valid: '"male"', invalid: ['null', '"invalid"', '""'] },
            { label: 'address', valid: '"123 Street"', invalid: ['123 (not string)'] },
            { label: 'avatar_url', valid: '"https://example.com/avatar.jpg"', invalid: ['"not-url"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'school not found' }
        ]
    },
    {
        no: 10,
        module: 'Student Management',
        method: 'updateStudent',
        description: 'Update student information',
        inputs: [
            { label: 'student_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'full_name', valid: '"Updated Name"', invalid: ['"" (empty)'] },
            { label: 'date_of_birth', valid: '"2020-02-20"', invalid: ['"invalid-date"'] },
            { label: 'gender', valid: '"female"', invalid: ['"invalid"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error or invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'student not found' }
        ]
    },
    {
        no: 11,
        module: 'Student Management',
        method: 'deleteStudent',
        description: 'Delete student record',
        inputs: [
            { label: 'student_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'student not found' }
        ]
    },
    {
        no: 12,
        module: 'Student Management',
        method: 'getStudentById',
        description: 'Get student by ID',
        inputs: [
            { label: 'student_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'student not found' }
        ]
    },
    {
        no: 13,
        module: 'Student Management',
        method: 'getAllStudents',
        description: 'Get all students',
        inputs: [
            { label: 'page', valid: '1', invalid: ['-1 (negative)', '0 (zero)', '"abc" (not number)'] },
            { label: 'limit', valid: '10', invalid: ['-1', '0', '1000 (too large)'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid pagination' },
            { code: 401, reason: 'not authenticated' }
        ]
    },
    {
        no: 14,
        module: 'Class Management',
        method: 'createClass',
        description: 'Create new class',
        inputs: [
            { label: 'class_name', valid: '"Class A1"', invalid: ['null', '""', '123'] },
            { label: 'class_age_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'max_students', valid: '30', invalid: ['null', '-1', '0', '"abc"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error or invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'class_age not found' }
        ]
    },
    {
        no: 15,
        module: 'Class Management',
        method: 'updateClass',
        description: 'Update class information',
        inputs: [
            { label: 'class_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'class_name', valid: '"Class A2"', invalid: ['"" (empty)'] },
            { label: 'max_students', valid: '35', invalid: ['-1', '0'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'class not found' }
        ]
    },
    {
        no: 16,
        module: 'Class Management',
        method: 'deleteClass',
        description: 'Delete class',
        inputs: [
            { label: 'class_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId or class has students' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'class not found' }
        ]
    },
    {
        no: 17,
        module: 'Class Management',
        method: 'getClassById',
        description: 'Get class by ID',
        inputs: [
            { label: 'class_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'class not found' }
        ]
    },
    {
        no: 18,
        module: 'Class Management',
        method: 'getAllClasses',
        description: 'Get all classes',
        inputs: [
            { label: 'school_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid school_id' },
            { code: 401, reason: 'not authenticated' }
        ]
    },
    {
        no: 19,
        module: 'Teacher Management',
        method: 'createTeacher',
        description: 'Create teacher record',
        inputs: [
            { label: 'full_name', valid: '"Teacher Name"', invalid: ['null', '""'] },
            { label: 'email', valid: '"teacher@example.com"', invalid: ['null', '""', '"invalid@"', '"duplicate@example.com"'] },
            { label: 'phone_number', valid: '"0912345678"', invalid: ['null', '""', '"123"'] },
            { label: 'qualification', valid: '"Bachelor"', invalid: ['null', '""'] },
            { label: 'major', valid: '"Education"', invalid: ['null', '""'] },
            { label: 'experience_years', valid: '5', invalid: ['null', '-1', '"abc"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 409, reason: 'email/phone duplicate' }
        ]
    },
    {
        no: 20,
        module: 'Teacher Management',
        method: 'updateTeacher',
        description: 'Update teacher information',
        inputs: [
            { label: 'teacher_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'full_name', valid: '"Updated Name"', invalid: ['"" (empty)'] },
            { label: 'experience_years', valid: '7', invalid: ['-1', '"abc"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'teacher not found' }
        ]
    },
    {
        no: 21,
        module: 'Teacher Management',
        method: 'deleteTeacher',
        description: 'Delete teacher record',
        inputs: [
            { label: 'teacher_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'teacher not found' }
        ]
    },
    {
        no: 22,
        module: 'Teacher Management',
        method: 'getTeacherById',
        description: 'Get teacher by ID',
        inputs: [
            { label: 'teacher_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'teacher not found' }
        ]
    },
    {
        no: 23,
        module: 'Daily Report',
        method: 'createDailyReport',
        description: 'Create daily report for student',
        inputs: [
            { label: 'student_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'report_date', valid: '"2025-12-02"', invalid: ['null', '""', '"invalid-date"'] },
            { label: 'health_status', valid: '"good"', invalid: ['"invalid"'] },
            { label: 'notes', valid: '"Student did well today"', invalid: ['123 (not string)'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'student not found' }
        ]
    },
    {
        no: 24,
        module: 'Daily Report',
        method: 'updateDailyReport',
        description: 'Update daily report',
        inputs: [
            { label: 'report_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'health_status', valid: '"excellent"', invalid: ['"invalid"'] },
            { label: 'notes', valid: '"Updated notes"', invalid: ['123'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'report not found' }
        ]
    },
    {
        no: 25,
        module: 'Daily Report',
        method: 'getDailyReportById',
        description: 'Get daily report by ID',
        inputs: [
            { label: 'report_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'report not found' }
        ]
    },
    {
        no: 26,
        module: 'Daily Report',
        method: 'getDailyReportsByStudent',
        description: 'Get all reports for student',
        inputs: [
            { label: 'student_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'from_date', valid: '"2025-11-01"', invalid: ['"invalid-date"'] },
            { label: 'to_date', valid: '"2025-12-01"', invalid: ['"invalid-date"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'student not found' }
        ]
    },
    {
        no: 27,
        module: 'Calendar Management',
        method: 'createCalendar',
        description: 'Create calendar event',
        inputs: [
            { label: 'title', valid: '"Event Title"', invalid: ['null', '""', '123'] },
            { label: 'event_date', valid: '"2025-12-15"', invalid: ['null', '""', '"invalid-date"'] },
            { label: 'description', valid: '"Event description"', invalid: ['123'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' }
        ]
    },
    {
        no: 28,
        module: 'Calendar Management',
        method: 'updateCalendar',
        description: 'Update calendar event',
        inputs: [
            { label: 'calendar_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'title', valid: '"Updated Title"', invalid: ['"" (empty)'] },
            { label: 'event_date', valid: '"2025-12-20"', invalid: ['"invalid-date"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'calendar not found' }
        ]
    },
    {
        no: 29,
        module: 'Calendar Management',
        method: 'deleteCalendar',
        description: 'Delete calendar event',
        inputs: [
            { label: 'calendar_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'calendar not found' }
        ]
    },
    {
        no: 30,
        module: 'Calendar Management',
        method: 'getCalendarById',
        description: 'Get calendar event by ID',
        inputs: [
            { label: 'calendar_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'calendar not found' }
        ]
    },
    {
        no: 31,
        module: 'Slot Management',
        method: 'createSlot',
        description: 'Create time slot',
        inputs: [
            { label: 'slot_name', valid: '"Morning"', invalid: ['null', '""', '123'] },
            { label: 'start_time', valid: '"08:00"', invalid: ['null', '""', '"25:00" (invalid)'] },
            { label: 'end_time', valid: '"12:00"', invalid: ['null', '""', '"25:00"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error or end_time < start_time' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' }
        ]
    },
    {
        no: 32,
        module: 'Slot Management',
        method: 'updateSlot',
        description: 'Update time slot',
        inputs: [
            { label: 'slot_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'slot_name', valid: '"Afternoon"', invalid: ['"" (empty)'] },
            { label: 'start_time', valid: '"13:00"', invalid: ['"25:00"'] },
            { label: 'end_time', valid: '"17:00"', invalid: ['"25:00"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'slot not found' }
        ]
    },
    {
        no: 33,
        module: 'Slot Management',
        method: 'deleteSlot',
        description: 'Delete time slot',
        inputs: [
            { label: 'slot_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'slot not found' }
        ]
    },
    {
        no: 34,
        module: 'Fee Management',
        method: 'createFee',
        description: 'Create fee record',
        inputs: [
            { label: 'student_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'fee_type', valid: '"tuition"', invalid: ['null', '""', '"invalid"'] },
            { label: 'amount', valid: '1000000', invalid: ['null', '-1', '0', '"abc"'] },
            { label: 'due_date', valid: '"2025-12-31"', invalid: ['null', '""', '"invalid-date"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'student not found' }
        ]
    },
    {
        no: 35,
        module: 'Fee Management',
        method: 'updateFee',
        description: 'Update fee information',
        inputs: [
            { label: 'fee_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'amount', valid: '1200000', invalid: ['-1', '0', '"abc"'] },
            { label: 'status', valid: '"paid"', invalid: ['"invalid"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'fee not found' }
        ]
    },
    {
        no: 36,
        module: 'Fee Management',
        method: 'getFeeById',
        description: 'Get fee by ID',
        inputs: [
            { label: 'fee_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'fee not found' }
        ]
    },
    {
        no: 37,
        module: 'Fee Management',
        method: 'getAllFees',
        description: 'Get all fees',
        inputs: [
            { label: 'student_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['"invalid_id"'] },
            { label: 'status', valid: '"paid"', invalid: ['"invalid"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid parameters' },
            { code: 401, reason: 'not authenticated' }
        ]
    },
    {
        no: 38,
        module: 'Parent Fee',
        method: 'getParentFees',
        description: 'Get fees for parent students',
        inputs: [
            { label: 'parent_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'not parent' }
        ]
    },
    {
        no: 39,
        module: 'Parent Fee',
        method: 'payFee',
        description: 'Process fee payment',
        inputs: [
            { label: 'fee_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'payment_method', valid: '"bank_transfer"', invalid: ['null', '""', '"invalid"'] },
            { label: 'amount', valid: '1000000', invalid: ['null', '-1', '0', '"abc"'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error or amount mismatch' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'not authorized' },
            { code: 404, reason: 'fee not found' }
        ]
    },
    {
        no: 40,
        module: 'Messaging',
        method: 'sendMessage',
        description: 'Send a message',
        inputs: [
            { label: 'conversation_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'content', valid: '"Hello, this is a message"', invalid: ['null', '""', '123'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'not participant' },
            { code: 404, reason: 'conversation not found' }
        ]
    },
    {
        no: 41,
        module: 'Messaging',
        method: 'getConversation',
        description: 'Get conversation',
        inputs: [
            { label: 'conversation_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'not participant' },
            { code: 404, reason: 'conversation not found' }
        ]
    },
    {
        no: 42,
        module: 'Messaging',
        method: 'markAsRead',
        description: 'Mark messages as read',
        inputs: [
            { label: 'message_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'message not found' }
        ]
    },
    {
        no: 43,
        module: 'Post Management',
        method: 'createPost',
        description: 'Create a new post',
        inputs: [
            { label: 'title', valid: '"Post Title"', invalid: ['null', '""', '123'] },
            { label: 'content', valid: '"Post content here"', invalid: ['null', '""', '123'] },
            { label: 'images', valid: '["https://example.com/img1.jpg"]', invalid: ['["not-url"]'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' }
        ]
    },
    {
        no: 44,
        module: 'Post Management',
        method: 'updatePost',
        description: 'Update post content',
        inputs: [
            { label: 'post_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'title', valid: '"Updated Title"', invalid: ['"" (empty)'] },
            { label: 'content', valid: '"Updated content"', invalid: ['"" (empty)'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'not author' },
            { code: 404, reason: 'post not found' }
        ]
    },
    {
        no: 45,
        module: 'Post Management',
        method: 'deletePost',
        description: 'Delete a post',
        inputs: [
            { label: 'post_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'not author' },
            { code: 404, reason: 'post not found' }
        ]
    },
    {
        no: 46,
        module: 'Post Management',
        method: 'getPostById',
        description: 'Get post by ID',
        inputs: [
            { label: 'post_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'post not found' }
        ]
    },
    {
        no: 47,
        module: 'Comment Management',
        method: 'createComment',
        description: 'Create comment on post',
        inputs: [
            { label: 'post_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'contents', valid: '"This is a comment"', invalid: ['null', '""', '123'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'post not found' }
        ]
    },
    {
        no: 48,
        module: 'Comment Management',
        method: 'updateComment',
        description: 'Update comment content',
        inputs: [
            { label: 'comment_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'contents', valid: '"Updated comment"', invalid: ['null', '""', '123'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'not author' },
            { code: 404, reason: 'comment not found' }
        ]
    },
    {
        no: 49,
        module: 'Comment Management',
        method: 'deleteComment',
        description: 'Delete a comment',
        inputs: [
            { label: 'comment_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'not author' },
            { code: 404, reason: 'comment not found' }
        ]
    },
    {
        no: 50,
        module: 'Like Management',
        method: 'likePost',
        description: 'Like a post',
        inputs: [
            { label: 'post_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId or already liked' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'post not found' }
        ]
    },
    {
        no: 51,
        module: 'Like Management',
        method: 'unlikePost',
        description: 'Remove like from post',
        inputs: [
            { label: 'post_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] }
        ],
        exceptions: [
            { code: 400, reason: 'invalid ObjectId or not liked yet' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'post not found' }
        ]
    },
    {
        no: 52,
        module: 'Complaint Management',
        method: 'createComplaint',
        description: 'Create a new complaint',
        inputs: [
            { label: 'complaint_type_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'description', valid: '"Complaint description"', invalid: ['null', '""', '123'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 404, reason: 'complaint_type not found' }
        ]
    },
    {
        no: 53,
        module: 'Complaint Management',
        method: 'updateComplaint',
        description: 'Update complaint status',
        inputs: [
            { label: 'complaint_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'status', valid: '"resolved"', invalid: ['"invalid"'] },
            { label: 'response', valid: '"Response to complaint"', invalid: ['123'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'complaint not found' }
        ]
    },
    {
        no: 54,
        module: 'Health Care',
        method: 'createHealthRecord',
        description: 'Create health record for student',
        inputs: [
            { label: 'student_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'height', valid: '120', invalid: ['null', '-1', '0', '"abc"'] },
            { label: 'weight', valid: '30', invalid: ['null', '-1', '0', '"abc"'] },
            { label: 'notes', valid: '"Health notes"', invalid: ['123'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'student not found' }
        ]
    },
    {
        no: 55,
        module: 'Nutrition',
        method: 'createMealPlan',
        description: 'Create meal plan for class',
        inputs: [
            { label: 'class_age_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'meal_date', valid: '"2025-12-15"', invalid: ['null', '""', '"invalid-date"'] },
            { label: 'dishes', valid: '["507f1f77bcf86cd799439011"]', invalid: ['null', '[]', '["invalid_id"]'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'no permission' },
            { code: 404, reason: 'class_age or dishes not found' }
        ]
    },
    {
        no: 56,
        module: 'School Management',
        method: 'updateSchoolInfo',
        description: 'Update school information',
        inputs: [
            { label: 'school_id', valid: '"507f1f77bcf86cd799439011"', invalid: ['null', '""', '"invalid_id"'] },
            { label: 'school_name', valid: '"Updated School"', invalid: ['"" (empty)'] },
            { label: 'address', valid: '"123 New Street"', invalid: ['123'] },
            { label: 'phone_number', valid: '"0912345678"', invalid: ['"123" (invalid)'] }
        ],
        exceptions: [
            { code: 400, reason: 'validation error' },
            { code: 401, reason: 'not authenticated' },
            { code: 403, reason: 'not school_admin' },
            { code: 404, reason: 'school not found' }
        ]
    }
];

// Rest of generation code will continue...
console.log(`✅ Loaded ${methods.length} methods with detailed validations\n`);

module.exports = { methods, workbook, headerStyle, darkBlueHeaderStyle, lightBlueStyle, grayStyle, greenStyle, yellowStyle, orangeStyle };
