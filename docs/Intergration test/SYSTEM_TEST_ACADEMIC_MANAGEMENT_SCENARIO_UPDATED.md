# KidsLink System Test - Academic Management Scenarios
## Phiên bản cập nhật dựa trên UI thực tế (Frontend + Backend)

---

## Scenario A - School Creation and Configuration

### TC_ACAD_01: System admin creates new school
**Description:** Admin tạo trường học mới
**Procedure:**
1. Login as admin (role: "admin")
2. Navigate to `/admin/schools` → Button "Quản lý trường học"
3. Click button "Tạo trường" (or "Thêm trường")
4. Fill form fields:
   - school_name (required)
   - address (required)
   - phone (required, format: 10-11 digits)
   - email (required, email format)
   - logo_url (optional)
5. Click "Lưu"

**Expected Results:**
- Status code: 201
- Response: `{ success: true, message: "Tạo trường thành công", data: { _id, school_name, address, phone, email, logo_url, status: 1 } }`
- School visible in list at `/admin/schools`
- School accessible by school_admin assigned to it

**Pre-conditions:**
- System admin logged in with token
- System has auth middleware enabled

**UI Elements:**
- Page: `/admin/schools`
- Button: "Quản lý trường học" (tạo mới)
- Form: school_name, address, phone, email, logo_url (optional)
- Submit: "Lưu" button

**Notes:**
- Field validation: phone must match regex, email must be valid
- Status defaults to 1 (active)

---

### TC_ACAD_02: Create school with duplicate name
**Description:** Kiểm tra xử lý tên trường trùng lặp
**Procedure:**
1. Login as admin
2. Go to `/admin/schools` → Create school form
3. Enter school_name that already exists (e.g., "Trường A")
4. Fill other required fields
5. Click "Lưu"

**Expected Results:**
- Either:
  - Option 1: Server returns 400 with message "Tên trường đã tồn tại" (if business rule enforces uniqueness)
  - Option 2: Allowed if system permits duplicate names
- No duplicate record created in database

**Pre-conditions:**
- Admin logged in
- School with same name already exists in database

**UI Elements:**
- Same form as TC_ACAD_01
- Error message (alert/snackbar): "Tên trường đã tồn tại" (if applicable)

---

### TC_ACAD_03: School admin updates school info
**Description:** School admin cập nhật thông tin trường của mình
**Procedure:**
1. Login as school_admin (with school_id assigned)
2. Navigate to `/school-admin/school-info` (or from sidenav "Thông tin trường")
3. Click button "Chỉnh sửa" (EditIcon)
4. Update editable fields:
   - address
   - phone
   - logo_url (optional)
5. Click "Lưu"

**Expected Results:**
- Status code: 200
- Message: "Thông tin trường đã được cập nhật"
- Changes visible immediately on page
- Endpoint: `PUT /school-admin/school/{schoolId}`

**Pre-conditions:**
- School admin logged in with valid school_id
- School info page loaded

**UI Elements:**
- Page: `/school-admin/school-info`
- Button: "Chỉnh sửa" (Edit mode toggle)
- Editable fields: address (TextField), phone (TextField), logo_url (File upload optional)
- Submit: "Lưu" button

**Notes:**
- School name and ID should be read-only
- Only school_admin of that school can edit

---

### TC_ACAD_04: School admin cannot view other school
**Description:** Kiểm tra isolation giữa các trường
**Procedure:**
1. Login as schooladmin1 (school_id = "School A")
2. Try to navigate to `/school-admin/school-info`
3. Observe what data appears

**Expected Results:**
- Only "School A" info displayed
- If try to access other school via URL param: 403 Forbidden
- Message: "Bạn không có quyền xem thông tin trường khác"

**Pre-conditions:**
- Two schools exist in system
- schooladmin1 assigned to School A
- schooladmin2 assigned to School B

**UI Elements:**
- Page: `/school-admin/school-info`
- Shows only assigned school name, address, etc.

**Notes:**
- Backend validation: Check req.user.school_id matches resource.school_id
- No cross-school data leakage

---

## Scenario B - Class Age and Class Management

### TC_ACAD_05: Create class age
**Description:** School admin tạo khối tuổi mới
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/classes` (page "Quản lý lớp học")
3. Button "Quản lý khối tuổi" (or "Khối tuổi")
4. In ClassAgeManagementModal:
   - Click "Thêm khối tuổi"
   - Fill fields:
     - age_name (e.g., "Mầm 1")
     - age_from (e.g., 2)
     - age_to (e.g., 3)
   - Click "Thêm"

**Expected Results:**
- Status code: 201
- Message: "Khối tuổi đã được tạo"
- New age appears in class_age dropdown when creating class
- Endpoint: `POST /class-ages`

**Pre-conditions:**
- School admin logged in

**UI Elements:**
- Page: `/school-admin/classes`
- Button: "Quản lý khối tuổi"
- Modal: ClassAgeManagementModal
- Form fields: age_name (TextField), age_from (NumberInput), age_to (NumberInput)
- Submit: "Thêm" button

---

### TC_ACAD_06: Create class with class age
**Description:** Tạo lớp học mới với khối tuổi
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/classes`
3. Click "Tạo lớp mới" button (AddIcon or "Tạo lớp" text)
4. In ClassModal form, fill:
   - class_name (e.g., "Lớp Mầm 1A")
   - class_age_id (select from dropdown)
   - academic_year (e.g., "2024-2025")
   - teacher_id (select main teacher)
   - teacher_id2 (optional, select assistant teacher)
5. Click "Lưu"

**Expected Results:**
- Status code: 201
- Message: "Tạo lớp thành công"
- New class appears in table at `/school-admin/classes`
- Class linked to selected class_age and school_id
- Endpoint: `POST /classes`

**Pre-conditions:**
- School admin logged in
- At least one ClassAge exists
- At least one Teacher exists (User with role "teacher" + Teacher profile)

**UI Elements:**
- Page: `/school-admin/classes`
- Button: Add icon (AddIcon) or "Tạo lớp" link
- Modal: ClassModal
- Form fields:
  - class_name (TextField)
  - class_age_id (Select/Dropdown)
  - academic_year (TextField or DatePicker)
  - teacher_id (Select from Teacher list)
  - teacher_id2 (Optional Select)
- Submit: "Lưu" button

**Notes:**
- Validation: class_name required, class_age_id required, academic_year required, teacher_id required
- teacher_id must be a User with role="teacher" and linked Teacher profile
- One main teacher, one optional assistant teacher

---

### TC_ACAD_07: Create class missing required field
**Description:** Kiểm tra validation khi bỏ trống trường bắt buộc
**Procedure:**
1. Login as school_admin
2. Navigate to ClassModal (at `/school-admin/classes`)
3. Leave class_name empty
4. Fill other fields (class_age_id, academic_year, teacher_id)
5. Click "Lưu"

**Expected Results:**
- Status code: 400
- Error message: "Tên lớp là bắt buộc"
- Modal stays open (form not submitted)
- No class created

**Pre-conditions:**
- School admin at ClassModal
- Other fields (class_age, year, teacher) available to fill

**UI Elements:**
- Modal: ClassModal
- TextField: class_name (validation on blur or submit)
- Error message: Red text below field or in alert

---

### TC_ACAD_08: View class list & filter
**Description:** Xem danh sách lớp với filter và search
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/classes`
3. Use filters:
   - Search by class_name or teacher name (TextField with SearchIcon)
   - Filter by academic_year (Select/Dropdown)
   - Filter by class_age (Select/Dropdown)
4. Observe results

**Expected Results:**
- Status code: 200
- Classes displayed in table with columns: class_name, teacher_name, academic_year, student_count, actions
- Filters work correctly (intersect all conditions)
- Pagination works if > 10 classes
- Only classes belonging to school_admin's school displayed

**Pre-conditions:**
- School admin logged in
- Multiple classes exist in school

**UI Elements:**
- Page: `/school-admin/classes`
- Table: columns with class_name, teacher names, academic_year, student count
- Search: TextField with SearchIcon, placeholder "Tìm kiếm..."
- Filters: 
  - Year Select (FilterListIcon or "Lọc theo năm học")
  - Class Age Select (optional)
- Pagination: Page numbers if applicable

---

## Scenario C - Student Management

### TC_ACAD_09: Create new student
**Description:** School admin tạo học sinh mới
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/children` ("Quản lý học sinh")
3. Click "Thêm học sinh" button
4. Fill form:
   - full_name (required)
   - date_of_birth (required, date picker)
   - gender (required, radio buttons: "Nam" / "Nữ")
   - avatar (optional, upload image)
   - address (optional)
5. Click "Lưu"

**Expected Results:**
- Status code: 201
- Message: "Học sinh đã được tạo"
- New student appears in children list
- Student linked to school_admin's school
- status = 1 (active)
- Endpoint: `POST /student`

**Pre-conditions:**
- School admin logged in with school_id

**UI Elements:**
- Page: `/school-admin/children`
- Button: "Thêm học sinh"
- Modal or Form page with fields:
  - full_name (TextField)
  - date_of_birth (DatePicker)
  - gender (Radio group: "Nam" / "Nữ")
  - avatar (File upload, optional)
  - address (TextField, optional)
- Submit: "Lưu" button

**Notes:**
- Avatar uploaded to Cloudinary if configured
- date_of_birth must be in past
- gender: 0 = male, 1 = female

---

### TC_ACAD_10: Assign student to class
**Description:** Thêm học sinh vào lớp học
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/classes/:classId` (ClassDetail page)
3. Section "Danh sách học sinh" / Table "Học sinh"
4. Click "Thêm học sinh" button
5. In modal/dropdown:
   - Select student from list (students not yet in class)
   - Can optionally set discount (%)
6. Click "Thêm"

**Expected Results:**
- Status code: 200
- Message: "Thêm học sinh vào lớp thành công"
- Student appears in class roster
- StudentClass record created with class_id and student_id
- Endpoint: `POST /classes/{classId}/students`

**Pre-conditions:**
- School admin logged in
- Class exists and open
- Student exists
- Student not already in this class

**UI Elements:**
- Page: `/school-admin/classes/:classId` (ClassDetail)
- Section: Student roster table
- Button: "Thêm học sinh" (AddIcon)
- Modal: Select student from dropdown, optional discount field
- Submit: "Thêm" button

---

### TC_ACAD_11: Student cannot be in multiple classes same year
**Description:** Kiểm tra rule: 1 học sinh không thể vào 2 lớp khác nhau trong cùng 1 năm học
**Procedure:**
1. Student already in Class A (academic_year = "2024-2025")
2. Login as school_admin
3. Go to Class B (academic_year = "2024-2025") ClassDetail
4. Click "Thêm học sinh" → Select same student → Click "Thêm"

**Expected Results:**
- Status code: 400
- Error message: "Học sinh đã thuộc lớp khác trong năm học này" or "Học sinh đã thuộc lớp trong năm học này"
- Modal stays open or shows alert
- No duplicate StudentClass created

**Pre-conditions:**
- Student in Class A (2024-2025)
- Class B exists (2024-2025)
- Both classes same school

**UI Elements:**
- ClassDetail modal/page for Class B
- Error alert/snackbar showing message

---

### TC_ACAD_12: Transfer student between classes
**Description:** Chuyển học sinh từ lớp này sang lớp khác
**Procedure:**
1. Login as school_admin
2. Go to `/school-admin/classes/{classId}/` ClassDetail
3. In student roster table, find student
4. Click button "Chuyển lớp" (ArrowForwardIcon) on that row
5. In modal:
   - Select target_class_id (from list of available classes, preferably different year)
6. Click "Xác nhận" or "Chuyển"

**Expected Results:**
- Status code: 200
- Message: "Chuyển học sinh thành công"
- Student removed from Class A roster
- Student appears in Class B roster
- Old StudentClass unlinked or status changed
- New StudentClass created for Class B
- Endpoint: `POST /student/{studentId}/transfer`

**Pre-conditions:**
- Student in Class A
- Class B exists (typically different academic_year)
- School admin logged in

**UI Elements:**
- Page: ClassDetail for Class A
- Table row: Student with ArrowForwardIcon button
- Modal: Select list of target classes
- Submit: "Chuyển" or "Xác nhận" button

---

### TC_ACAD_13: Link parent to student
**Description:** Thêm phụ huynh cho học sinh
**Procedure:**
1. Login as school_admin
2. Navigate to Student Detail page (click on student name)
3. Section "Phụ huynh" / "Liên hệ phụ huynh"
4. Click "Thêm phụ huynh" button
5. In modal:
   - Select parent_id (dropdown: User with role="parent")
   - Select relationship (dropdown: "Bố" / "Mẹ" / "Ông" / "Bà" / "Khác")
6. Click "Thêm"

**Expected Results:**
- Status code: 201
- Message: "Phụ huynh đã được thêm"
- Parent appears in student's parent list with relationship
- ParentStudent record created
- Parent can now view student's data (reports, calendar, etc.)
- Endpoint: `POST /student/{studentId}/parents`

**Pre-conditions:**
- School admin logged in
- Student exists
- Parent user exists (role="parent", linked to same school)

**UI Elements:**
- Page: Student Detail
- Section: Parent list (table or list)
- Button: "Thêm phụ huynh" (AddIcon)
- Modal:
  - Select: parent_id (Parent User list)
  - Select: relationship (radio or dropdown: "Bố", "Mẹ", "Ông", "Bà", "Khác")
- Submit: "Thêm" button

**Notes:**
- Relationship field: 0="Bố", 1="Mẹ", 2="Ông", 3="Bà", 4="Khác" (or string values)
- Parent must be same school as student

---

### TC_ACAD_14: Remove parent from student
**Description:** Gỡ phụ huynh khỏi học sinh
**Procedure:**
1. Login as school_admin
2. Student Detail page
3. Section "Phụ huynh", find parent to remove
4. Click "Xóa" button (DeleteIcon) on that row
5. Confirm in dialog

**Expected Results:**
- Status code: 200
- Message: "Phụ huynh đã được gỡ"
- Parent removed from list
- ParentStudent record deleted
- Parent can no longer view student's data
- Endpoint: `DELETE /student/{studentId}/parents/{parentId}`

**Pre-conditions:**
- School admin logged in
- Parent linked to student

**UI Elements:**
- Page: Student Detail
- Section: Parent list (table or list)
- Each parent row: DeleteIcon button
- Confirmation dialog: "Bạn có chắc muốn gỡ phụ huynh này?"

---

## Scenario D - Teacher Assignment and Daily Operations

### TC_ACAD_15: Assign teacher to class
**Description:** Gán giáo viên cho lớp học
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/classes/:classId` (ClassDetail)
3. Click "Chỉnh sửa" button (EditIcon)
4. In ClassModal form:
   - teacher_id (Select: from Teacher list)
   - teacher_id2 (Optional Select: assistant teacher)
5. Click "Lưu"

**Expected Results:**
- Status code: 200
- Message: "Cập nhật lớp thành công"
- teacher_id updated in Class record
- Teacher can now see this class in their `/teacher/classes`
- Endpoint: `PUT /classes/{classId}`

**Pre-conditions:**
- School admin logged in
- Class exists
- Teacher(s) exist (User with role="teacher" + Teacher profile)

**UI Elements:**
- Page: ClassDetail
- Button: "Chỉnh sửa" (EditIcon) to toggle edit mode
- Modal: ClassModal with editable fields
- Select: teacher_id (list of available teachers)
- Select: teacher_id2 (optional assistant teacher)
- Submit: "Lưu" button

**Notes:**
- Teacher must have Teacher profile (not just User role)
- Teacher must belong to same school

---

### TC_ACAD_16: Teacher views assigned class
**Description:** Giáo viên xem lớp được giao
**Procedure:**
1. Login as teacher
2. Navigate to `/teacher` (Teacher home) or `/teacher/classes`
3. Section "Lớp của tôi" or page "Danh sách lớp"
4. View list of assigned classes

**Expected Results:**
- Status code: 200
- Shows only classes where user is teacher_id or teacher_id2
- Each class card/row shows: class_name, academic_year, student_count
- Can click to open ClassDetail or see student list
- Endpoint: `GET /teachers/class` (or `/teacher/class` depending on route)

**Pre-conditions:**
- Teacher logged in with valid Teacher profile
- Assigned to at least one class

**UI Elements:**
- Page: `/teacher` or `/teacher/classes`
- Section: "Lớp của tôi" (My Classes)
- Display: Class list/cards showing class_name, year, student_count
- Action: Click to view class details

---

### TC_ACAD_17: Teacher views student list of class
**Description:** Giáo viên xem danh sách học sinh lớp của mình
**Procedure:**
1. Login as teacher
2. Navigate to `/teacher/classes` or open class from previous step
3. Click on class name or "Xem chi tiết"
4. Page loads with student roster

**Expected Results:**
- Status code: 200
- Table shows: student_name, student_id, dob, gender, avatar, attendance_status
- All students in this class displayed
- Can click on student name to view student detail
- Endpoint: `GET /teachers/class/students` or `/student/class/{classId}`

**Pre-conditions:**
- Teacher logged in
- Teacher assigned to class
- Students exist in class

**UI Elements:**
- Page: `/teacher/classes/{classId}` or similar
- Table: Student list with columns: avatar, name, DOB, gender, status, actions
- Rows: Each student with clickable name to view detail

---

### TC_ACAD_18: Teacher cannot view other class
**Description:** Kiểm tra: Giáo viên không thể xem lớp của giáo viên khác
**Procedure:**
1. Login as teacher A (assigned to Class A)
2. Try to navigate to `/teacher/classes/{classIdB}` (Class B assigned to Teacher B)
3. Observe

**Expected Results:**
- Either:
  - Redirect to `/teacher/classes` (list view)
  - Show 403 Forbidden
  - Show empty/no data
- Message (optional): "Bạn không có quyền xem lớp này"

**Pre-conditions:**
- Teacher A assigned to Class A
- Teacher B assigned to Class B
- Different teachers

**UI Elements:**
- Route protection at `/teacher/classes/{classId}`
- May show: "Bạn không có quyền truy cập lớp này"

**Notes:**
- Backend validation: Check if req.user.id = class.teacher_id or class.teacher_id2

---

### TC_ACAD_19: Teacher checks in student
**Description:** Giáo viên điểm danh học sinh
**Procedure:**
1. Login as teacher
2. Navigate to `/teacher` (Teacher home) or `/teacher/attendance` / "Điểm danh"
3. Date = today (default or select today)
4. List of students in assigned class(es) displayed
5. Click on student or "Điểm danh" / "Check-in" button
6. checkin_time = current time (auto-filled) or manually enter
7. (Optional) Enter temperature (if health tracking enabled)
8. Click "Xác nhận" or "Check-in"

**Expected Results:**
- Status code: 201
- Message: "Điểm danh thành công"
- DailyReport record created with:
  - student_id, report_date = today, checkin_time
  - teacher_checkin_id = req.user.id
  - status = "present" (hoặc đánh dấu "có mặt")
- Student status changes from "Chưa điểm danh" to "Có mặt"
- Endpoint: `POST /teachers/students/check-in`

**Pre-conditions:**
- Teacher logged in
- Student in teacher's assigned class
- Today is school day (not holiday)
- Student status = 1 (active)

**UI Elements:**
- Page: `/teacher` (DailyReportPage or TeacherHome)
- Date picker: Today (editable)
- Student list: Table/list of students
- Button per student: "Điểm danh" (or auto-list to check off)
- Time input: checkin_time (auto-current or manual)
- Temperature input (optional): if health tracking enabled
- Submit: "Xác nhận" or "Check-in" button

**Notes:**
- checkin_time auto-filled with server time (not client time, to prevent cheating)
- Can only check-in once per day per student
- Backend validates: student in teacher's class, today is valid report date

---

### TC_ACAD_20: Check-in already checked-in student
**Description:** Kiểm tra: Không thể điểm danh 2 lần trong 1 ngày
**Procedure:**
1. Student already checked-in today (DailyReport with checkin_time exists)
2. Login as teacher
3. Try to check-in same student again
4. Submit

**Expected Results:**
- Status code: 400
- Error message: "Học sinh đã điểm danh hôm nay" or "Học sinh đã được điểm danh"
- Modal/form stays open
- No duplicate DailyReport created

**Pre-conditions:**
- Teacher logged in
- Student checked-in same day
- Try to check-in again

**UI Elements:**
- Error alert/snackbar: "Học sinh đã điểm danh hôm nay"

---

### TC_ACAD_21: Teacher adds comment to daily report
**Description:** Giáo viên thêm ghi chú vào báo cáo hàng ngày
**Procedure:**
1. Login as teacher
2. Open DailyReport (either from `/teacher` page or Student Detail)
3. Find student report for specific day
4. Click "Chỉnh sửa ghi chú" (or pencil icon)
5. In modal/inline edit:
   - TextField: comments (free text)
   - Optional: temperature, weight, notes
6. Click "Lưu"

**Expected Results:**
- Status code: 200
- Message: "Cập nhật báo cáo thành công"
- DailyReport.comments updated
- Comment visible immediately
- Parent can view comments in their app
- Endpoint: `PUT /teachers/students/daily-report/{reportId}`

**Pre-conditions:**
- Teacher logged in
- DailyReport exists (after check-in)

**UI Elements:**
- Page: `/teacher` or DailyReportPage
- Button: "Chỉnh sửa ghi chú" (pencil/EditIcon)
- Modal: TextArea for comments (larger input)
- Submit: "Lưu" button

---

### TC_ACAD_22: Teacher checks out student (pickup)
**Description:** Giáo viên thực hiện trả trẻ (check-out)
**Procedure:**
1. Login as teacher
2. Navigate to check-out section (e.g., `/teacher` > "Trả trẻ" tab or page)
3. Select DailyReport of student (checked-in)
4. Fill form:
   - checkout_time (time picker, e.g., 16:00)
   - picked_up_by (Select from "Người đón" list: parent, guardian, etc.)
   - (Optional) comments
5. Click "Xác nhận" or "Lưu"

**Expected Results:**
- Status code: 200
- Message: "Trả trẻ thành công"
- DailyReport updated with:
  - checkout_time
  - picked_up_by_id (parent/guardian id)
  - status = "picked_up"
- Parent receives notification (optional)
- Endpoint: `PUT /teachers/students/daily-report/{reportId}/check-out`

**Pre-conditions:**
- Teacher logged in
- DailyReport with check-in exists
- Pickup person (parent/guardian) linked to student

**UI Elements:**
- Page: `/teacher` > Check-out section or separate page
- Time picker: checkout_time (e.g., TimePicker component)
- Select: picked_up_by (dropdown list of parents/guardians)
- TextArea: comments (optional)
- Submit: "Xác nhận" or "Lưu" button

**Notes:**
- checkout_time should be after checkin_time
- Backend validates: report with check-in exists, picked_up_by_id is valid parent

---

### TC_ACAD_23: View weekly reports for student
**Description:** Giáo viên xem báo cáo tuần của học sinh
**Procedure:**
1. Login as teacher
2. Navigate to Student Detail (click on student name from class list)
3. Find tab "Báo cáo tuần" or "Weekly Reports"
4. Page loads with 7-day reports (Mon-Sun)

**Expected Results:**
- Status code: 200
- Display: Table/list of reports for current week
- Columns: Date (formatted YYYY-MM-DD), Day name (Thứ 2, Thứ 3, ...), Check-in time, Check-out time, Comments, Status
- Sorted by date (Mon to Sun)
- If no report: Show "-" or "Không có dữ liệu"
- Endpoint: `GET /teachers/students/{studentId}/daily-reports/weekly`

**Pre-conditions:**
- Teacher logged in
- Student in teacher's class
- Reports exist (from previous check-in/check-out)

**UI Elements:**
- Page: Student Detail
- Tab navigation: "Báo cáo tuần" (WeeklyReportTab)
- Table:
  - Columns: Date, Day, Check-in, Check-out, Comments, Status
  - Rows: Each day of week
  - If no data: "Chưa có dữ liệu"

---

## Scenario E - Calendar and Schedule Management

### TC_ACAD_24: Create time slots
**Description:** School admin tạo khung giờ (tiết học)
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/calendar` (page "Quản lý lịch học")
3. Button "Quản lý tiết học" (or icon/tab "Khung giờ")
4. In SlotManagementModal:
   - Click "Thêm tiết" or "Thêm khung giờ"
   - Fill form:
     - slot_name (e.g., "Tiết 1", "Sáng")
     - start_time (HH:MM format, e.g., "07:00")
     - end_time (HH:MM format, e.g., "08:00")
   - Click "Lưu"

**Expected Results:**
- Status code: 201
- Message: "Khung giờ đã được tạo"
- Slot appears in SlotManagementModal list
- Available to select when creating calendar entries
- Endpoint: `POST /school-admin/calendar/slots`

**Pre-conditions:**
- School admin logged in

**UI Elements:**
- Page: `/school-admin/calendar`
- Button: "Quản lý tiết học"
- Modal: SlotManagementModal
- Form fields:
  - slot_name (TextField)
  - start_time (Time input, HH:MM format)
  - end_time (Time input, HH:MM format)
- Button: "Thêm" or "Lưu"

**Notes:**
- Validation: start_time < end_time
- Format: HH:MM (24-hour)
- Slot created per school (filtered by school_id)
- Slot_name examples: "Tiết 1", "Tiết 2", "Sáng (7h-11h)", etc.

---

### TC_ACAD_25: Create activity
**Description:** School admin tạo hoạt động (môn học)
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/calendar`
3. Button "Quản lý Môn Học" (or "Hoạt động")
4. In ActivityModal:
   - Click "Thêm hoạt động" or "Thêm môn học"
   - Fill form:
     - name (e.g., "Toán", "Tiếng Anh", "Vận động")
     - description (e.g., "Học Toán cơ bản")
     - requireOutdoor (checkbox: 0=indoor, 1=outdoor)
   - Click "Lưu"

**Expected Results:**
- Status code: 201
- Message: "Hoạt động đã được tạo"
- Activity appears in activity list (in ActivityModal or calendar)
- Available to assign in calendar entries
- Endpoint: `POST /school-admin/calendar/activities`

**Pre-conditions:**
- School admin logged in

**UI Elements:**
- Page: `/school-admin/calendar`
- Button: "Quản lý Môn Học"
- Modal: ActivityModal
- Form fields:
  - name (TextField)
  - description (TextField or TextArea)
  - requireOutdoor (Checkbox, Boolean or 0/1)
- Button: "Lưu"

---

### TC_ACAD_26: Create class calendar entry
**Description:** School admin tạo entry lịch học (gán hoạt động vào tiết học/ngày)
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/calendar`
3. Select class (dropdown at top)
4. Select week (week navigation arrows)
5. In calendar grid (Mon-Sun, with slots as rows):
   - Click on empty cell (intersection of slot + day)
   - In SlotModal:
     - Select activity (dropdown)
     - (Optional) Select weekday if not auto-populated
   - Click "Lưu"

**Expected Results:**
- Status code: 201
- Message: "Lịch học đã được tạo"
- Calendar record created with:
  - class_id, slot_id, activity_id, date (specific date for that day+week), weekday_id
- Cell displays activity name
- Visible to teacher and parents
- Endpoint: `POST /school-admin/calendar/{calendarId}` (or `POST /school-admin/calendar` for create)

**Pre-conditions:**
- School admin logged in
- Class selected
- At least one Slot created
- At least one Activity created

**UI Elements:**
- Page: `/school-admin/calendar`
- Dropdown: Select class
- Navigation: Week prev/next buttons
- Calendar grid:
  - Rows: Time slots (Tiết 1, Tiết 2, ...)
  - Columns: Weekdays (T2, T3, T4, T5, T6, T7, CN)
  - Empty cells: Clickable
- Modal: SlotModal (opens on cell click)
- Form:
  - Select: activity_id (Dropdown with activity names)
  - Submit: "Lưu"

**Notes:**
- Date = (Monday of week) + (day offset from column)
- weekday_id can be auto-detected from column (0=Mon, 6=Sun or similar)

---

### TC_ACAD_27: Bulk create weekly calendar
**Description:** School admin copy lịch từ tuần mẫu sang tuần khác (đặt lịch mặc định)
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/calendar`
3. Select class
4. Ensure template week (e.g., week 1) has full calendar entries
5. Button "Đặt Lịch Mặc Định"
6. In ApplyDefaultScheduleModal:
   - Select source_week (template week, e.g., "Tuần 1 - 2024-2025")
   - Select target_weeks (checkboxes or multi-select for weeks to copy to)
   - Click "Áp dụng"

**Expected Results:**
- Status code: 200/201 (bulk operation)
- Message: "Lịch đã được áp dụng cho {n} tuần"
- All calendar entries from source week copied to target weeks
- Each target week has same activities in same slots + same days
- Modal closes
- Calendar grid refreshes to show new entries
- Endpoint: `POST /school-admin/calendar/bulk` or similar

**Pre-conditions:**
- School admin logged in
- Class selected
- Template week (week 1 or similar) has full calendar
- Target weeks defined

**UI Elements:**
- Page: `/school-admin/calendar`
- Button: "Đặt Lịch Mặc Định"
- Modal: ApplyDefaultScheduleModal
- Form:
  - Select: source_week (dropdown, default = current week if has entries)
  - Multi-select or checkboxes: target_weeks (e.g., "Tuần 2", "Tuần 3", ...)
  - Button: "Áp dụng"
- Success message: "Lịch đã được áp dụng cho {n} tuần"

**Notes:**
- Source week must have complete (or sufficient) calendar entries
- Copying logic: For each entry in source week, create new entry with same slot+activity but different date in target week

---

### TC_ACAD_28: Teacher views class calendar
**Description:** Giáo viên xem lịch học của lớp
**Procedure:**
1. Login as teacher
2. Navigate to `/teacher/classes` > Open class > Tab "Lịch lớp" / "Thời khóa biểu"
3. Or directly: `/teacher/classes/{classId}/calendar`
4. Page displays weekly calendar

**Expected Results:**
- Status code: 200
- Display: Calendar grid with:
  - Rows: Time slots (07:00-08:00, 08:00-09:00, ...)
  - Columns: Weekdays (T2, T3, ..., CN)
  - Cells: Activity names (if calendar entries exist)
- Sorted by date
- Teacher can view but typically cannot edit (read-only)
- Endpoint: `GET /school-admin/calendar/class/{classId}` or similar

**Pre-conditions:**
- Teacher logged in
- Teacher assigned to class
- Calendar entries created for this class

**UI Elements:**
- Page: `/teacher/classes/{classId}` or tab within ClassDetail
- Calendar grid:
  - Rows: Slots with times (HH:MM - HH:MM)
  - Columns: Weekday names
  - Cells: Activity names, clickable (to view details, maybe)

**Notes:**
- Read-only view for teacher (unless role="school_admin")
- Parents can also view (in parent app)

---

### TC_ACAD_29: Delete calendar entry
**Description:** School admin xóa entry lịch học
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/calendar`
3. Select class
4. In calendar grid, find cell with activity
5. Right-click or click menu icon (3-dot icon / ⋮)
6. Select "Xóa" from context menu
7. Confirm in dialog

**Expected Results:**
- Status code: 200
- Message: "Lịch học đã được xóa"
- Cell becomes empty
- Calendar record deleted from database
- No longer visible in grid
- Endpoint: `DELETE /school-admin/calendar/{calendarId}`

**Pre-conditions:**
- School admin logged in
- Class selected
- Calendar entry exists in grid

**UI Elements:**
- Page: `/school-admin/calendar`
- Calendar grid: Cells
- Right-click menu or 3-dot icon on cell: Options
  - "Xóa" option
- Confirmation dialog: "Bạn có chắc muốn xóa lịch học này?"

---

## Scenario F - Class Promotion

### TC_ACAD_30: Promote class to next year
**Description:** School admin "lên lớp" - tạo lớp mới cho năm học tiếp theo và chuyển học sinh
**Procedure:**
1. Login as school_admin
2. Navigate to `/school-admin/classes`
3. Find class to promote (e.g., "Lớp Mầm 1" - 2024-2025)
4. Click button "Lên lớp" (TrendingUpIcon or promote button)
5. In ClassModal (promote mode):
   - Form auto-fills: old class_name
   - Select new_class_age (from dropdown, typically age + 1)
   - Confirm or adjust new_class_name
   - academic_year (auto-fill or select: "2025-2026")
   - Assign teacher for new class (optional)
6. Click "Lưu"

**Expected Results:**
- Status code: 201 (new class) + 200 (bulk operations)
- Message: "Lên lớp thành công" or "Lớp mới đã được tạo"
- New class created:
  - class_name = old_name or modified
  - class_age_id = new_class_age
  - academic_year = "2025-2026"
  - school_id = same
- All students from old class auto-transferred to new class:
  - Old StudentClass: status = 0 (inactive) or deleted
  - New StudentClass: created for each student, class_id = new class
- Old class remains in list (archived view or marked)
- New class appears in list as new entry
- Endpoint: `POST /classes/{classId}/promote`

**Pre-conditions:**
- School admin logged in
- Class with students exists (e.g., "Lớp Mầm 1" with 20 students)
- New class age for next level exists (e.g., "Mầm 2" for age 3-4)

**UI Elements:**
- Page: `/school-admin/classes`
- Class table row: Button "Lên lớp" (TrendingUpIcon)
- Modal: ClassModal in promote mode
- Form fields:
  - class_name (pre-filled, editable)
  - class_age_id (Select dropdown, pre-filled with age+1)
  - academic_year (pre-filled with next year, maybe editable)
  - teacher_id (Select, optional to reassign)
- Submit: "Lưu" button
- Success message: "Lên lớp thành công"

**Notes:**
- Auto-transfer logic: Fetch all StudentClass records for old class, create new StudentClass for each student with new class_id
- Soft delete or status change for old StudentClass (don't hard delete, keep history)
- New class ready immediately with same students
- Can reassign teacher or keep unassigned
- Class promotion typically happens at end of school year

---

## Summary of API Endpoints (for reference)

### School Management
- `POST /admin/schools` - Create school
- `PUT /admin/schools/{schoolId}` - Update school info
- `GET /school-admin/school/{schoolId}` - Get school info for admin
- `PUT /school-admin/school/{schoolId}` - Update school info by school_admin

### Class Management
- `GET /classes` - List classes (school_admin sees own, admin sees all)
- `POST /classes` - Create class
- `PUT /classes/{classId}` - Update class (teacher assignment)
- `DELETE /classes/{classId}` - Delete class
- `POST /classes/{classId}/promote` - Promote class to next year

### Class Age
- `GET /class-ages` - List class ages
- `POST /class-ages` - Create class age
- `PUT /class-ages/{ageId}` - Update class age
- `DELETE /class-ages/{ageId}` - Delete class age

### Student Management
- `GET /student/all` - List all students
- `GET /student/class/{classId}` - List students in class
- `POST /student` - Create student
- `PUT /student/{studentId}` - Update student
- `DELETE /student/{studentId}` - Soft delete student
- `POST /student/{studentId}/transfer` - Transfer student to another class
- `POST /student/{studentId}/parents` - Add parent to student
- `DELETE /student/{studentId}/parents/{parentId}` - Remove parent from student
- `POST /classes/{classId}/students` - Add student to class

### Calendar & Schedule
- `GET /school-admin/calendar/class/{classId}` - Get calendar for class
- `POST /school-admin/calendar/{calendarId}` - Create/update calendar entry
- `DELETE /school-admin/calendar/{calendarId}` - Delete calendar entry
- `POST /school-admin/calendar/bulk` - Bulk copy calendar entries

### Slots
- `GET /school-admin/calendar/slots` - List slots
- `POST /school-admin/calendar/slots` - Create slot
- `PUT /school-admin/calendar/slots/{slotId}` - Update slot
- `DELETE /school-admin/calendar/slots/{slotId}` - Delete slot

### Activities
- `GET /school-admin/calendar/activities` - List activities
- `POST /school-admin/calendar/activities` - Create activity
- `PUT /school-admin/calendar/activities/{activityId}` - Update activity
- `DELETE /school-admin/calendar/activities/{activityId}` - Delete activity

### Daily Reports
- `POST /teachers/students/check-in` - Check-in student
- `PUT /teachers/students/daily-report/{reportId}` - Update daily report
- `PUT /teachers/students/daily-report/{reportId}/check-out` - Check-out student
- `GET /teachers/students/{studentId}/daily-reports/weekly` - Get weekly reports

### Teacher
- `GET /teachers/class` - Get teacher's classes
- `GET /teachers/class/students` - Get students in teacher's class(es)
- `GET /teacher/classes` - List teacher's classes (alternative route)

---

## Test Execution Notes

1. **Setup**: Ensure test environment has:
   - MongoDB instance (in-memory or test database)
   - Test users with different roles: admin, school_admin, teacher, parent
   - Test schools linked to school_admin users

2. **Cleanup**: After each scenario or test case:
   - Clear test data
   - Reset to known state
   - Or use database transactions/snapshots

3. **Assertions**: Verify:
   - HTTP status codes (201 for create, 200 for update, 400/403/404 for errors)
   - Response messages and data structure
   - Database state changes
   - UI state changes (for integration tests)

4. **Order**: Execute scenarios in order:
   - Scenario A (Schools) first (prerequisite for all)
   - Scenario B (Class ages & classes) second
   - Scenario C (Students) third
   - Scenario D (Teachers & daily ops) fourth
   - Scenario E (Calendar) fifth
   - Scenario F (Promotion) last

