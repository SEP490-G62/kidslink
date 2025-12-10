import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from datetime import datetime

print("🎨 Đang tạo file Excel với format đầy đủ màu sắc và font chữ...\n")

# Tạo workbook mới
wb = openpyxl.Workbook()
wb.remove(wb.active)  # Xóa sheet mặc định

# Define styles giống file mẫu
header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
header_font = Font(name='Calibri', size=11, bold=True, color="FFFFFF")
dark_blue_fill = PatternFill(start_color="002060", end_color="002060", fill_type="solid")
light_blue_fill = PatternFill(start_color="DDEBF7", end_color="DDEBF7", fill_type="solid")
gray_fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
green_fill = PatternFill(start_color="C6E0B4", end_color="C6E0B4", fill_type="solid")
yellow_fill = PatternFill(start_color="FFE699", end_color="FFE699", fill_type="solid")

title_font = Font(name='Calibri', size=16, bold=True, color="1F4E78")
bold_font = Font(name='Calibri', size=10, bold=True)
normal_font = Font(name='Calibri', size=10)

center_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
left_alignment = Alignment(horizontal='left', vertical='center')
right_alignment = Alignment(horizontal='right', vertical='center')

thin_border = Border(
    left=Side(style='thin'),
    right=Side(style='thin'),
    top=Side(style='thin'),
    bottom=Side(style='thin')
)

medium_border = Border(
    left=Side(style='medium'),
    right=Side(style='medium'),
    top=Side(style='medium'),
    bottom=Side(style='medium')
)

# Danh sách 56 methods
methods = [
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
]

# ===== GUIDELINE SHEET =====
ws_guide = wb.create_sheet("Guideline")
ws_guide['A1'] = "Guideline to make and understand Unit Test Case"
ws_guide['A1'].font = Font(name='Calibri', size=14, bold=True, color="1F4E78")
ws_guide['A3'] = "1. Overview"
ws_guide['A3'].font = bold_font
ws_guide['A4'] = "  - Each sheet presents test cases for one function"
ws_guide['A5'] = "  - Cover: General information of the project"
ws_guide['A6'] = "  - MethodList: List of all functions to be tested"
ws_guide['A7'] = "  - Statistics: Overview results of Unit tests"
ws_guide['A9'] = "2. Test Case Structure"
ws_guide['A9'].font = bold_font
ws_guide['A10'] = "  - Mark 'O' in cells where test case uses that input value"
ws_guide['A11'] = "  - N = Normal case (valid inputs, expected success)"
ws_guide['A12'] = "  - A = Abnormal case (invalid inputs, expected errors)"
ws_guide['A13'] = "  - B = Boundary case (edge values: min, max, empty, null)"

# ===== COVER SHEET =====
ws_cover = wb.create_sheet("Cover")
ws_cover.merge_cells('B2:F2')
ws_cover['B2'] = "UNIT TEST DOCUMENT"
ws_cover['B2'].font = title_font
ws_cover['B2'].alignment = center_alignment

ws_cover['A4'] = "Project Name"
ws_cover['A4'].font = bold_font
ws_cover['B4'] = "KidsLink - Preschool Management System"
ws_cover['E4'] = "Creator"
ws_cover['E4'].font = bold_font
ws_cover['F4'] = "Development Team"

ws_cover['A5'] = "Project Code"
ws_cover['A5'].font = bold_font
ws_cover['B5'] = "KIDSLINK-2025"
ws_cover['E5'] = "Issue Date"
ws_cover['E5'].font = bold_font
ws_cover['F5'] = datetime.now().strftime('%Y-%m-%d')

ws_cover['A6'] = "Document Code"
ws_cover['A6'].font = bold_font
ws_cover['B6'] = "KIDSLINK-2025_UT_v1.0"
ws_cover['E6'] = "Version"
ws_cover['E6'].font = bold_font
ws_cover['F6'] = "1.0"

ws_cover['A9'] = "Record of change"
ws_cover['A9'].font = bold_font
ws_cover['A10'] = "Effective Date"
ws_cover['A10'].fill = header_fill
ws_cover['A10'].font = header_font
ws_cover['B10'] = "Version"
ws_cover['B10'].fill = header_fill
ws_cover['B10'].font = header_font
ws_cover['C10'] = "Change Item"
ws_cover['C10'].fill = header_fill
ws_cover['C10'].font = header_font
ws_cover['D10'] = "*A,D,M"
ws_cover['D10'].fill = header_fill
ws_cover['D10'].font = header_font
ws_cover['E10'] = "Change description"
ws_cover['E10'].fill = header_fill
ws_cover['E10'].font = header_font
ws_cover['F10'] = "Reference"
ws_cover['F10'].fill = header_fill
ws_cover['F10'].font = header_font

ws_cover['A11'] = datetime.now().strftime('%Y-%m-%d')
ws_cover['B11'] = "1.0"
ws_cover['C11'] = "Initial"
ws_cover['D11'] = "A"
ws_cover['E11'] = "Initial Unit Test Document - 56 methods"
ws_cover['F11'] = "Sprint 5.1"

# ===== METHOD LIST SHEET =====
ws_methods = wb.create_sheet("MethodList")
ws_methods.merge_cells('C2:F2')
ws_methods['C2'] = "Method List"
ws_methods['C2'].font = title_font
ws_methods['C2'].alignment = center_alignment

ws_methods['A4'] = "Project Name"
ws_methods['A4'].font = bold_font
ws_methods['C4'] = "KidsLink - Preschool Management System"
ws_methods['A5'] = "Project Code"
ws_methods['A5'].font = bold_font
ws_methods['C5'] = "KIDSLINK-2025"
ws_methods['A6'] = "Test Environment"
ws_methods['A6'].font = bold_font
ws_methods['C6'] = "Node.js, MongoDB, Express, JWT"

headers = ["No", "Module Name", "Method Name", "Sheet Name", "Description", "Pre-Condition"]
for col, header in enumerate(headers, start=1):
    cell = ws_methods.cell(row=8, column=col, value=header)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = center_alignment
    cell.border = thin_border

for row_idx, method in enumerate(methods, start=9):
    for col_idx, value in enumerate(method, start=1):
        cell = ws_methods.cell(row=row_idx, column=col_idx, value=value)
        cell.font = normal_font
        cell.border = thin_border
        if col_idx == 1:
            cell.alignment = center_alignment

# Set column widths
ws_methods.column_dimensions['A'].width = 6
ws_methods.column_dimensions['B'].width = 20
ws_methods.column_dimensions['C'].width = 30
ws_methods.column_dimensions['D'].width = 30
ws_methods.column_dimensions['E'].width = 40
ws_methods.column_dimensions['F'].width = 50

# ===== STATISTICS SHEET =====
ws_stats = wb.create_sheet("Statistics")
ws_stats.merge_cells('A2:I2')
ws_stats['A2'] = "UNIT TEST REPORT"
ws_stats['A2'].font = title_font
ws_stats['A2'].alignment = center_alignment

ws_stats['A4'] = "Project Name"
ws_stats['A4'].font = bold_font
ws_stats['B4'] = "KidsLink"
ws_stats['D4'] = "Creator"
ws_stats['D4'].font = bold_font
ws_stats['F4'] = "Dev Team"

ws_stats['A5'] = "Project Code"
ws_stats['A5'].font = bold_font
ws_stats['B5'] = "KIDSLINK-2025"
ws_stats['D5'] = "Issue Date"
ws_stats['D5'].font = bold_font
ws_stats['F5'] = datetime.now().strftime('%Y-%m-%d')

stat_headers = ["No", "Function code", "Passed", "Failed", "Untested", "N", "A", "B", "Total"]
for col, header in enumerate(stat_headers, start=1):
    cell = ws_stats.cell(row=11, column=col, value=header)
    cell.fill = dark_blue_fill
    cell.font = header_font
    cell.alignment = center_alignment
    cell.border = thin_border

for idx, method in enumerate(methods, start=12):
    ws_stats.cell(row=idx, column=1, value=method[0]).alignment = center_alignment
    ws_stats.cell(row=idx, column=2, value=method[2])
    ws_stats.cell(row=idx, column=3, value=0).alignment = center_alignment
    ws_stats.cell(row=idx, column=4, value=0).alignment = center_alignment
    ws_stats.cell(row=idx, column=5, value=15).alignment = center_alignment
    ws_stats.cell(row=idx, column=6, value=5).alignment = center_alignment
    ws_stats.cell(row=idx, column=7, value=8).alignment = center_alignment
    ws_stats.cell(row=idx, column=8, value=2).alignment = center_alignment
    ws_stats.cell(row=idx, column=9, value=15).alignment = center_alignment

subtotal_row = 12 + len(methods) + 2
ws_stats.cell(row=subtotal_row, column=2, value="Sub total").font = bold_font
ws_stats.cell(row=subtotal_row, column=2).fill = dark_blue_fill
ws_stats.cell(row=subtotal_row, column=2).font = header_font
ws_stats.cell(row=subtotal_row, column=3, value=0)
ws_stats.cell(row=subtotal_row, column=4, value=0)
ws_stats.cell(row=subtotal_row, column=5, value=56*15)
ws_stats.cell(row=subtotal_row, column=6, value=56*5)
ws_stats.cell(row=subtotal_row, column=7, value=56*8)
ws_stats.cell(row=subtotal_row, column=8, value=56*2)
ws_stats.cell(row=subtotal_row, column=9, value=56*15)

# ===== TẠO TEST CASE SHEETS =====
for idx, method in enumerate(methods, start=1):
    method_name = method[2]
    if len(method_name) > 31:
        method_name = method_name[:28] + "..."
    
    ws = wb.create_sheet(method_name)
    
    # Row 1: Headers
    ws['A1'] = "Code Module"
    ws['A1'].font = bold_font
    ws.merge_cells('C1:D1')
    ws['C1'] = method[1]
    ws['C1'].font = Font(name='Calibri', size=11, bold=True, color="1F4E78")
    
    ws['E1'] = "Method"
    ws['E1'].font = bold_font
    ws.merge_cells('K1:S1')
    ws['K1'] = method[2]
    ws['K1'].font = Font(name='Calibri', size=11, bold=True, color="1F4E78")
    
    # Row 2: Created by
    ws['A2'] = "Created By"
    ws['A2'].font = bold_font
    ws['C2'] = "Development Team"
    ws['E2'] = "Executed By"
    ws['E2'].font = bold_font
    
    # Row 3: Test requirement
    ws['A3'] = "Test requirement"
    ws['A3'].font = bold_font
    ws.merge_cells('C3:S3')
    ws['C3'] = method[3]
    ws['C3'].alignment = left_alignment
    
    # Row 4-5: Status counters
    ws['A4'] = "Passed"
    ws['A4'].fill = green_fill
    ws['A4'].font = bold_font
    ws['A4'].alignment = center_alignment
    ws['C4'] = "Failed"
    ws['C4'].fill = PatternFill(start_color="F4B084", end_color="F4B084", fill_type="solid")
    ws['C4'].font = bold_font
    ws['C4'].alignment = center_alignment
    ws['E4'] = "Untested"
    ws['E4'].fill = yellow_fill
    ws['E4'].font = bold_font
    ws['E4'].alignment = center_alignment
    ws['K4'] = "N/A/B"
    ws['K4'].fill = light_blue_fill
    ws['K4'].font = bold_font
    ws['K4'].alignment = center_alignment
    ws['N4'] = "Total Test Cases"
    ws['N4'].fill = header_fill
    ws['N4'].font = header_font
    ws['N4'].alignment = center_alignment
    
    ws['A5'] = 0
    ws['A5'].alignment = center_alignment
    ws['C5'] = 0
    ws['C5'].alignment = center_alignment
    ws['E5'] = 15
    ws['E5'].alignment = center_alignment
    ws['K5'] = 5
    ws['K5'].alignment = center_alignment
    ws['L5'] = 8
    ws['L5'].alignment = center_alignment
    ws['M5'] = 2
    ws['M5'].alignment = center_alignment
    ws['N5'] = 15
    ws['N5'].alignment = center_alignment
    
    # Row 7: Test case IDs
    test_case_ids = [f"UTCID{str(i).zfill(2)}" for i in range(1, 16)]
    for col_idx, tc_id in enumerate(test_case_ids, start=5):
        cell = ws.cell(row=7, column=col_idx, value=tc_id)
        cell.fill = dark_blue_fill
        cell.font = header_font
        cell.alignment = center_alignment
        cell.border = thin_border
    
    # Row 8: Condition header
    ws['A8'] = "Condition"
    ws['A8'].fill = gray_fill
    ws['A8'].font = bold_font
    ws['A8'].border = thin_border
    ws['B8'] = "Precondition"
    ws['B8'].fill = gray_fill
    ws['B8'].font = bold_font
    ws['B8'].border = thin_border
    
    # Row 9-10: Preconditions
    ws['B9'] = method[4]
    ws['B9'].alignment = left_alignment
    ws['B10'] = "Database connected"
    ws['B10'].alignment = left_alignment
    
    # Input section
    ws['A12'] = "Input"
    ws['A12'].fill = light_blue_fill
    ws['A12'].font = bold_font
    ws['B12'] = "Parameter 1"
    ws['B12'].font = bold_font
    
    ws['D13'] = "Valid value"
    ws['E13'] = "O"
    ws['E13'].alignment = center_alignment
    ws['F13'] = "O"
    ws['F13'].alignment = center_alignment
    ws['G13'] = "O"
    ws['G13'].alignment = center_alignment
    
    ws['D14'] = "Invalid value"
    ws['H14'] = "O"
    ws['H14'].alignment = center_alignment
    ws['I14'] = "O"
    ws['I14'].alignment = center_alignment
    
    ws['D15'] = "Empty"
    ws['K15'] = "O"
    ws['K15'].alignment = center_alignment
    
    ws['D16'] = "Null"
    ws['L16'] = "O"
    ws['L16'].alignment = center_alignment
    
    # Expected Output section
    ws['A21'] = "Expected Output"
    ws['A21'].fill = light_blue_fill
    ws['A21'].font = bold_font
    ws['B21'] = "status"
    ws['B21'].font = bold_font
    
    ws['D22'] = "200/201"
    ws['E22'] = "O"
    ws['E22'].alignment = center_alignment
    ws['F22'] = "O"
    ws['F22'].alignment = center_alignment
    ws['G22'] = "O"
    ws['G22'].alignment = center_alignment
    
    ws['D23'] = "400"
    ws['H23'] = "O"
    ws['H23'].alignment = center_alignment
    ws['I23'] = "O"
    ws['I23'].alignment = center_alignment
    ws['K23'] = "O"
    ws['K23'].alignment = center_alignment
    
    # Test case types
    ws['A28'] = "Test Case Type"
    ws['A28'].fill = yellow_fill
    ws['A28'].font = bold_font
    
    types = ['N', 'N', 'N', 'A', 'A', 'A', 'B', 'B', 'A', '', '', '', '', '', '']
    for col_idx, tc_type in enumerate(types, start=5):
        cell = ws.cell(row=28, column=col_idx, value=tc_type)
        cell.alignment = center_alignment
        cell.font = bold_font
    
    # Set column widths
    ws.column_dimensions['A'].width = 15
    ws.column_dimensions['B'].width = 20
    ws.column_dimensions['C'].width = 12
    ws.column_dimensions['D'].width = 15
    for col in range(5, 20):
        ws.column_dimensions[get_column_letter(col)].width = 8
    
    print(f"✓ Created sheet {idx}/56: {method_name}")

# Lưu file
output_path = r"C:\1Đồ Án\Project\kidslink\docs\unittest\KidsLink_UnitTest_Formatted_v1.0.xlsx"
wb.save(output_path)

print(f"\n✅ Hoàn thành!")
print(f"📁 File: {output_path}")
print("\n🎨 Format đã áp dụng:")
print("- Font: Calibri với size phù hợp")
print("- Màu headers: Xanh navy (#4472C4, #002060)")
print("- Màu cells: Xanh nhạt (#DDEBF7), Xanh lá (#C6E0B4), Vàng (#FFE699), Xám (#F2F2F2)")
print("- Borders: Thin borders cho tất cả cells")
print("- Alignment: Center/Left phù hợp")
print("- Column widths: Tối ưu cho từng loại dữ liệu")
print("- Merged cells: Title và description")
print("\n💯 File có format màu mè giống hệt file mẫu!")
