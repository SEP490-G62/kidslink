# SYSTEM TEST - DETAILED TEST CASES BY SCENARIO
## Dự án KidsLink - Hệ thống quản lý trường mầm non

**Ngày tạo:** 7/12/2025  
**Format:** Chi tiết test cases theo Scenario (Excel format)

---

## MODULE 1: USER & AUTHENTICATION PROCESS

### Scenario A - User Registration and Account Creation

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_AUTH_01 | Register new parent account with valid data | 1. Navigate to /authentication/sign-up<br>2. Fill form [email: parent1@test.com, password: Test@123, name: Nguyen Van A, phone: 0901234567, role: parent]<br>3. Click Register button<br>4. Verify response | User created successfully<br>Status 201<br>User saved in DB with hashed password<br>Email verification sent (if applicable) | No existing account with same email |
| TC_AUTH_02 | Attempt to register with existing email | 1. Navigate to /authentication/sign-up<br>2. Fill form with existing email<br>3. Click Register button | System rejects: "Email already exists"<br>Status 400<br>No duplicate user created | Email parent1@test.com already exists in DB |
| TC_AUTH_03 | Register with invalid email format | 1. Navigate to /authentication/sign-up<br>2. Fill form [email: invalidemail]<br>3. Click Register button | Validation error: "Invalid email format"<br>Status 400<br>No user created | None |
| TC_AUTH_04 | Register with weak password | 1. Navigate to /authentication/sign-up<br>2. Fill form [password: 123]<br>3. Click Register button | Validation error: "Password must be at least 8 characters"<br>Status 400 | None |
| TC_AUTH_05 | Register with missing required fields | 1. Navigate to /authentication/sign-up<br>2. Fill form with missing name field<br>3. Click Register button | Validation error: "Name is required"<br>Status 400 | None |

### Scenario B - User Login and Session Management

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_AUTH_06 | Login with valid parent credentials | 1. Navigate to /authentication/sign-in<br>2. Fill form [email: parent1@test.com, password: Test@123]<br>3. Click Login button<br>4. Verify redirect to /parent dashboard | Login successful<br>Status 200<br>Access token returned<br>User redirected to parent dashboard<br>Session created | Active parent account exists |
| TC_AUTH_07 | Login with wrong password | 1. Navigate to /authentication/sign-in<br>2. Fill form [email: parent1@test.com, password: WrongPass]<br>3. Click Login button | Login failed: "Invalid credentials"<br>Status 401<br>No token issued<br>User stays on login page | Parent account exists |
| TC_AUTH_08 | Login with non-existent email | 1. Navigate to /authentication/sign-in<br>2. Fill form [email: notexist@test.com]<br>3. Click Login button | Login failed: "User not found"<br>Status 401<br>No token issued | Email does not exist in DB |
| TC_AUTH_09 | Login as school_admin and verify role access | 1. Login as school_admin [email: schooladmin1@test.com]<br>2. Navigate to /school-admin/dashboard<br>3. Attempt to access /admin/schools | Access to school-admin dashboard: Success<br>Access to admin routes: Denied (403 Forbidden)<br>Role-based routing works correctly | Active school_admin account exists |
| TC_AUTH_10 | Login with deleted/inactive account | 1. Navigate to /authentication/sign-in<br>2. Fill form with deleted user credentials<br>3. Click Login button | Login failed: "Account is inactive"<br>Status 401 or 403<br>No token issued | User account exists but status = deleted |
| TC_AUTH_11 | Session expiration handling | 1. Login successfully<br>2. Wait for token expiration (or manipulate token)<br>3. Attempt to access protected route<br>4. Verify redirect to login | Token expired: Status 401<br>User redirected to /authentication/sign-in<br>Session cleared | Valid login, expired token |

### Scenario C - Forgot Password Flow

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_AUTH_12 | Request password reset with valid email | 1. Navigate to /authentication/forgot-password<br>2. Enter email: parent1@test.com<br>3. Click Submit | Success message: "Password reset link sent"<br>Status 200<br>Reset token generated in DB<br>Email sent (mock/real) | User account exists |
| TC_AUTH_13 | Request password reset with non-existent email | 1. Navigate to /authentication/forgot-password<br>2. Enter email: notexist@test.com<br>3. Click Submit | Generic message: "If email exists, reset link sent"<br>Status 200 (for security)<br>No token generated | Email does not exist |
| TC_AUTH_14 | Reset password with valid token | 1. Receive reset token<br>2. Navigate to reset link with token<br>3. Enter new password<br>4. Submit<br>5. Login with new password | Password updated successfully<br>Status 200<br>Can login with new password<br>Cannot login with old password<br>Token invalidated | Valid reset token exists |

### Scenario D - Role-Based Access Control (RBAC)

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_AUTH_15 | Parent attempts to access teacher routes | 1. Login as parent<br>2. Attempt GET /teachers/class<br>3. Verify response | Access denied: Status 403 Forbidden<br>Error: "Insufficient permissions" | Parent logged in |
| TC_AUTH_16 | Teacher attempts to access school-admin routes | 1. Login as teacher<br>2. Attempt POST /school-admin/posts<br>3. Verify response | Access denied: Status 403 Forbidden | Teacher logged in |
| TC_AUTH_17 | Access protected route without token | 1. No login<br>2. Attempt GET /users/me<br>3. Verify response | Unauthorized: Status 401<br>Error: "Authentication required" | No active session |

---

## MODULE 2: ACADEMIC MANAGEMENT PROCESS

### Scenario A - School Setup and Configuration

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ACAD_01 | System admin creates new school | 1. Login as admin [email: admin@test.com]<br>2. Navigate to /admin/schools<br>3. Click Create School<br>4. Fill form [name: ABC Kindergarten, address: 123 Main St, phone: 0281234567, email: contact@abc.edu.vn]<br>5. Submit | School created successfully<br>Status 201<br>School saved in DB with unique ID<br>School status = active by default | System admin logged in |
| TC_ACAD_02 | Create school with duplicate name | 1. Login as admin<br>2. Attempt to create school with existing name<br>3. Submit | System allows (names can be duplicate)<br>Or validation error if business rule requires unique names<br>Check business requirements | Admin logged in<br>School with same name exists |
| TC_ACAD_03 | School admin updates school information | 1. Login as school_admin [email: schooladmin1@test.com]<br>2. Navigate to /school-admin/school<br>3. Update school info [address, phone]<br>4. Save | School information updated<br>Status 200<br>Updated data saved in DB<br>Changes visible immediately | School admin logged in<br>Assigned to specific school |
| TC_ACAD_04 | School admin attempts to view other school's data | 1. Login as schooladmin1 (School A)<br>2. Attempt GET /school-admin/school/{school_B_id}<br>3. Verify response | Access denied: Status 403<br>Or returns null/empty<br>Data isolation maintained | Two schools exist<br>School admin assigned to School A |

### Scenario B - Class Age and Class Creation

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ACAD_05 | School admin creates class age | 1. Login as school_admin<br>2. Navigate to /school-admin (class ages section)<br>3. POST /class-ages [name: Mầm, age_from: 3, age_to: 12 months, school_id: auto]<br>4. Verify response | Class age created successfully<br>Status 201<br>Saved with school_id<br>Available for class creation | School admin logged in |
| TC_ACAD_06 | Create class with valid class age | 1. Login as school_admin<br>2. Navigate to /school-admin/classes<br>3. Click Create Class<br>4. Fill form [name: Lớp Mầm 1, class_age_id: {mam_id}, academic_year: 2024-2025, capacity: 25]<br>5. Submit | Class created successfully<br>Status 201<br>Class linked to class age<br>Belongs to school_admin's school | School admin logged in<br>Class age exists |
| TC_ACAD_07 | Create class without required fields | 1. Login as school_admin<br>2. Attempt to create class without name<br>3. Submit | Validation error: "Class name is required"<br>Status 400<br>No class created | School admin logged in |
| TC_ACAD_08 | View list of classes for school | 1. Login as school_admin<br>2. GET /classes<br>3. Verify response | Returns list of classes for school only<br>Status 200<br>Pagination works<br>Filters work (academic_year, class_age) | Classes exist for school |

### Scenario C - Student Enrollment and Management

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ACAD_09 | School admin creates new student | 1. Login as school_admin<br>2. Navigate to /school-admin/children<br>3. Click Add Student<br>4. Fill form [name: Nguyen Van B, date_of_birth: 2021-05-15, gender: male, address: 456 St, school_id: auto]<br>5. Submit | Student created successfully<br>Status 201<br>Student saved with school_id<br>Status = active | School admin logged in |
| TC_ACAD_10 | Assign student to class | 1. Login as school_admin<br>2. Navigate to class detail page<br>3. Click Add Students<br>4. Select student(s)<br>5. POST /classes/{classId}/students [student_id: {id}]<br>6. Submit | Student added to class<br>Status 200<br>StudentClass record created<br>Student appears in class roster | Student exists<br>Class exists<br>Student not already in class |
| TC_ACAD_11 | Assign student already in another class | 1. Student in Class A<br>2. Attempt to add to Class B<br>3. Submit | System allows if business rule permits<br>Or error: "Student already in a class"<br>Check business requirements | Student in Class A<br>Class B exists |
| TC_ACAD_12 | Transfer student between classes | 1. Login as school_admin<br>2. Navigate to student detail<br>3. Click Transfer Class<br>4. POST /student/{id}/transfer [from_class_id, to_class_id]<br>5. Submit | Student transferred successfully<br>Old StudentClass record updated/deleted<br>New StudentClass record created<br>Student appears in new class roster | Student in Class A<br>Class B exists |
| TC_ACAD_13 | Link parent to student | 1. Login as school_admin<br>2. Navigate to student detail<br>3. Click Add Parent<br>4. POST /student/{studentId}/parents [parent_id: {id}, relationship: mother]<br>5. Submit | Parent linked to student<br>Status 200<br>ParentStudent record created<br>Parent can now see student data | Student exists<br>Parent account exists |
| TC_ACAD_14 | Remove parent from student | 1. Login as school_admin<br>2. Navigate to student detail<br>3. Select parent to remove<br>4. DELETE /student/{studentId}/parents/{parentId}<br>5. Confirm | Parent unlinked from student<br>Status 200<br>ParentStudent record deleted<br>Parent cannot see student data anymore | Parent linked to student |

### Scenario D - Teacher Assignment and Daily Operations

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ACAD_15 | Assign teacher to class | 1. Login as school_admin<br>2. Navigate to class detail<br>3. Select teacher<br>4. Update class [teacher_id: {id}]<br>5. Save | Teacher assigned to class<br>Status 200<br>Class.teacher_id updated<br>Teacher can view class | Teacher account exists<br>Class exists |
| TC_ACAD_16 | Teacher views assigned class | 1. Login as teacher [email: teacher1@test.com]<br>2. Navigate to /teacher dashboard<br>3. GET /teachers/class<br>4. Verify response | Returns teacher's assigned class<br>Status 200<br>Class details displayed<br>Student list visible | Teacher assigned to class |
| TC_ACAD_17 | Teacher views student list | 1. Login as teacher<br>2. Navigate to class page<br>3. GET /teachers/class/students<br>4. Verify list | Returns students in teacher's class<br>Status 200<br>Correct number of students<br>Student details visible | Teacher assigned to class<br>Students in class |
| TC_ACAD_18 | Teacher attempts to view another class | 1. Login as teacher1 (Class A)<br>2. Attempt to access Class B data<br>3. Verify response | Access denied or empty result<br>Teacher can only see assigned class | Teacher assigned to Class A<br>Class B exists |

### Scenario E - Student Check-in and Daily Reports

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ACAD_19 | Teacher checks in student | 1. Login as teacher<br>2. Navigate to attendance page<br>3. Select date: today<br>4. POST /teachers/daily-reports/checkin [student_id: {id}, checkin_time: 07:30, temperature: 36.5]<br>5. Submit | Check-in successful<br>Status 201<br>DailyReport created<br>Student status = present | Teacher logged in<br>Student in class |
| TC_ACAD_20 | Check-in student already checked in | 1. Student already checked in today<br>2. Attempt to check-in again<br>3. Submit | Error: "Student already checked in"<br>Status 400<br>No duplicate record created | Student checked in today |
| TC_ACAD_21 | Teacher updates daily report comment | 1. Login as teacher<br>2. Navigate to daily report<br>3. PUT /teachers/daily-reports/{id}/comment [comment: "Em ăn ngoan hôm nay"]<br>4. Save | Comment updated successfully<br>Status 200<br>Comment saved in DB<br>Parent can view comment | Daily report exists |
| TC_ACAD_22 | Teacher checks out student | 1. Login as teacher<br>2. Navigate to check-out page<br>3. PUT /teachers/daily-reports/checkout [report_id: {id}, checkout_time: 16:30, picked_by: Ba]<br>4. Submit | Check-out successful<br>Status 200<br>DailyReport updated with checkout info<br>Student status = picked up | Daily report with check-in exists |
| TC_ACAD_23 | View weekly reports for student | 1. Login as teacher<br>2. Navigate to student detail<br>3. GET /teachers/students/{id}/daily-reports/weekly<br>4. Verify response | Returns 7 days of reports<br>Status 200<br>Correct student data<br>Sorted by date | Daily reports exist for student |

### Scenario F - Calendar and Schedule Management

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ACAD_24 | School admin creates time slots | 1. Login as school_admin<br>2. Navigate to /school-admin/calendar (slots)<br>3. POST /school-admin/calendar/slots [slot_name: Slot 1, start_time: 07:00, end_time: 08:00]<br>4. Submit | Time slot created<br>Status 201<br>Available for calendar assignment | School admin logged in |
| TC_ACAD_25 | Create activity | 1. Login as school_admin<br>2. POST /school-admin/calendar/activities [activity_name: Học vần, description: ...]<br>3. Submit | Activity created<br>Status 201<br>Available for calendar assignment | School admin logged in |
| TC_ACAD_26 | Create class calendar entry | 1. Login as school_admin<br>2. Navigate to class calendar<br>3. POST /school-admin/calendar/calendar/{calendarId} [class_id, slot_id, activity_id, weekday_id]<br>4. Submit | Calendar entry created<br>Status 201<br>Schedule visible to teacher and parents | Class, slot, activity exist |
| TC_ACAD_27 | Bulk create weekly calendar | 1. Login as school_admin<br>2. POST /school-admin/calendar/calendar/bulk [array of calendar entries for full week]<br>3. Submit | All entries created successfully<br>Status 200/201<br>Full week schedule visible | Class, slots, activities exist |
| TC_ACAD_28 | Teacher views class calendar | 1. Login as teacher<br>2. Navigate to /teacher/calendar<br>3. GET /teachers/class-calendar<br>4. Verify response | Returns class schedule<br>Status 200<br>Weekly view displayed<br>Activities and time slots shown | Teacher assigned to class<br>Calendar entries exist |
| TC_ACAD_29 | Delete calendar entry | 1. Login as school_admin<br>2. Navigate to calendar<br>3. DELETE /school-admin/calendar/calendar/{calendarId}<br>4. Confirm | Calendar entry deleted<br>Status 200<br>Entry removed from schedule | Calendar entry exists |

### Scenario G - Class Promotion

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ACAD_30 | Promote class to next academic year | 1. Login as school_admin<br>2. Navigate to class detail (Lớp Mầm 1)<br>3. POST /classes/{id}/promote [new_class_name: Lớp Chồi 1, new_class_age_id: {choi_id}, new_academic_year: 2025-2026]<br>4. Confirm | New class created<br>Status 201<br>All students transferred to new class<br>Old class archived or marked | Class exists with students<br>New class age exists |

---

## MODULE 3: PARENT SERVICES PROCESS

### Scenario A - Parent Account Access and Child Information

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_PAR_01 | Parent views list of children | 1. Login as parent [email: parent1@test.com]<br>2. Navigate to /parent dashboard<br>3. GET /parent/children<br>4. Verify response | Returns list of linked children<br>Status 200<br>Correct children displayed<br>Other students not visible | Parent logged in<br>Parent linked to 1+ students |
| TC_PAR_02 | Parent with no children tries to access | 1. Login as parent with no linked children<br>2. GET /parent/children<br>3. Verify response | Returns empty list or message<br>Status 200<br>"No children found" message | Parent logged in<br>No ParentStudent links |
| TC_PAR_03 | Parent views child detailed information | 1. Login as parent<br>2. Navigate to child info page<br>3. GET /parent/child-info/{studentId}<br>4. Verify response | Returns complete child info<br>Status 200<br>Name, class, age, health info visible<br>Pickup persons list shown | Parent linked to student |
| TC_PAR_04 | Parent attempts to view other's child | 1. Login as parent1<br>2. Attempt GET /parent/child-info/{other_student_id}<br>3. Verify response | Access denied: Status 403<br>Or empty result<br>Data privacy maintained | Parent1 linked to Student A<br>Student B exists (different parent) |

### Scenario B - Daily Report Viewing

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_PAR_05 | Parent views today's daily report | 1. Login as parent<br>2. Navigate to /parent/daily-report<br>3. GET /parent/daily-reports?date=today<br>4. Verify response | Returns today's report for all children<br>Status 200<br>Check-in/out times visible<br>Teacher comments visible<br>Photos displayed (if any) | Parent logged in<br>Daily reports exist for today |
| TC_PAR_06 | View daily report with no check-in yet | 1. Login as parent<br>2. View report early morning (before check-in)<br>3. Verify display | No report or "Not checked in yet" message<br>Status 200<br>Empty or pending status | Parent logged in<br>No check-in for today |
| TC_PAR_07 | View historical daily reports | 1. Login as parent<br>2. Select date: 3 days ago<br>3. GET /parent/daily-reports?date=2024-12-04<br>4. Verify response | Returns report for selected date<br>Status 200<br>Correct data displayed | Daily reports exist for that date |

### Scenario C - Menu and Calendar Access

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_PAR_08 | Parent views weekly menu for child's age group | 1. Login as parent<br>2. Navigate to /parent/menu<br>3. GET /parent/menu<br>4. Verify response | Returns menu for child's class age<br>Status 200<br>Full week displayed (Mon-Fri)<br>Meals: breakfast, morning snack, lunch, afternoon snack<br>Dishes with nutrition info | Parent logged in<br>Child in class with class_age<br>Menu assigned for that age |
| TC_PAR_09 | View menu when no menu assigned | 1. Login as parent<br>2. Child's class age has no menu<br>3. GET /parent/menu<br>4. Verify response | Empty menu or "No menu available" message<br>Status 200 | Parent logged in<br>No menu for class age |
| TC_PAR_10 | Parent views class calendar | 1. Login as parent<br>2. Navigate to /parent/class-calendar<br>3. GET /parent/class-calendar<br>4. Verify response | Returns child's class schedule<br>Status 200<br>Weekly view<br>Activities and time slots displayed | Parent logged in<br>Calendar exists for class |

### Scenario D - Fee Payment and Invoice Management

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_PAR_11 | Parent views list of fees for children | 1. Login as parent<br>2. Navigate to /parent/fee-payment<br>3. GET /parent/fees<br>4. Verify response | Returns list of fees/invoices<br>Status 200<br>Fees grouped by child<br>Status shown: paid/unpaid/overdue<br>Amounts displayed | Parent logged in<br>Fees and invoices exist |
| TC_PAR_12 | View invoice details | 1. Login as parent<br>2. Click on specific invoice<br>3. View details<br>4. Verify information | Invoice details displayed<br>Fee name, amount, due date<br>Surcharge (if late)<br>Payment status<br>QR code or payment button | Invoice exists for child |
| TC_PAR_13 | Create online payment request via PayOS | 1. Login as parent<br>2. Select unpaid invoice<br>3. Click Pay Online<br>4. POST /parent/fees/payos [invoice_id: {id}]<br>5. Verify redirect | Payment link created<br>Status 200<br>Redirected to PayOS payment page<br>Order ID generated | Unpaid invoice exists |
| TC_PAR_14 | Complete payment on PayOS and return | 1. Payment request created<br>2. Complete payment on PayOS sandbox<br>3. Return to app<br>4. POST /payos/webhook (automatic)<br>5. Check invoice status | Webhook received<br>Invoice status updated to paid<br>Payment record created<br>Status visible to parent<br>Receipt available | Payment initiated<br>PayOS webhook configured |
| TC_PAR_15 | Check payment status after webhook | 1. Login as parent (after payment)<br>2. POST /parent/fees/payos/status [order_id]<br>3. Verify status | Returns payment status<br>Status 200<br>Status = success<br>Invoice marked paid | Payment completed<br>Webhook processed |
| TC_PAR_16 | Attempt to pay already paid invoice | 1. Login as parent<br>2. Select paid invoice<br>3. Attempt to pay again | Error or disabled button<br>"Invoice already paid"<br>No duplicate payment created | Invoice already paid |
| TC_PAR_17 | View late payment with surcharge | 1. Login as parent<br>2. Invoice past due date<br>3. View invoice details | Surcharge calculated and displayed<br>Original amount + surcharge shown<br>Total amount updated | Invoice overdue |

### Scenario E - Pickup Person Management

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_PAR_18 | Parent adds pickup person for child | 1. Login as parent<br>2. Navigate to child info<br>3. Click Add Pickup Person<br>4. POST /parent/pickups/{studentId} [name: Ông ngoại, phone: 0909999999, relationship: grandfather, id_number: 123456789]<br>5. Submit | Pickup person created<br>Status 201<br>Person appears in pickup list<br>Available for check-out | Parent logged in<br>Linked to student |
| TC_PAR_19 | Update pickup person information | 1. Login as parent<br>2. Navigate to pickup list<br>3. Select person to edit<br>4. PUT /parent/pickups/{pickupId}/{studentId} [update phone]<br>5. Save | Pickup person updated<br>Status 200<br>New information saved<br>Changes visible | Pickup person exists |
| TC_PAR_20 | Delete pickup person | 1. Login as parent<br>2. Navigate to pickup list<br>3. Select person to remove<br>4. DELETE /parent/pickups/{pickupId}/{studentId}<br>5. Confirm | Pickup person deleted<br>Status 200<br>Person removed from list<br>Cannot be used for check-out | Pickup person exists |

### Scenario F - Communication and Social Features

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_PAR_21 | Parent views posts from school | 1. Login as parent<br>2. Navigate to news/posts page<br>3. GET /parent/posts<br>4. Verify response | Returns approved posts<br>Status 200<br>Posts from school and teachers visible<br>Sorted by date (newest first) | Parent logged in<br>Approved posts exist |
| TC_PAR_22 | Parent creates new post | 1. Login as parent<br>2. Click Create Post<br>3. POST /parent/posts [title, content, images]<br>4. Submit | Post created with pending status<br>Status 201<br>Post saved<br>Visible to creator only<br>Awaiting approval | Parent logged in |
| TC_PAR_23 | Parent likes a post | 1. Login as parent<br>2. View post<br>3. POST /parent/posts/{postId}/like<br>4. Verify response | Like added<br>Status 200<br>Like count increased<br>Unlike if clicked again (toggle) | Parent logged in<br>Post exists |
| TC_PAR_24 | Parent comments on post | 1. Login as parent<br>2. View post<br>3. POST /parent/posts/{postId}/comments [content: "Cảm ơn cô"]<br>4. Submit | Comment created<br>Status 201<br>Comment visible under post<br>Author name displayed | Parent logged in<br>Post exists |
| TC_PAR_25 | Parent edits own comment | 1. Login as parent<br>2. View own comment<br>3. PUT /parent/comments/{commentId} [content: updated]<br>4. Save | Comment updated<br>Status 200<br>New content displayed<br>"Edited" indicator shown | Parent created comment |
| TC_PAR_26 | Parent deletes own comment | 1. Login as parent<br>2. View own comment<br>3. DELETE /parent/comments/{commentId}<br>4. Confirm | Comment deleted<br>Status 200<br>Comment removed from post | Parent created comment |

### Scenario G - Messaging with Teachers

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_PAR_27 | Parent finds teacher to chat | 1. Login as parent<br>2. Navigate to chat/messaging<br>3. GET /api/messaging/teachers-by-student/{studentId}<br>4. Verify response | Returns list of child's teachers<br>Status 200<br>Teacher names and info displayed | Parent logged in<br>Child has assigned teacher |
| TC_PAR_28 | Create direct conversation with teacher | 1. Login as parent<br>2. Select teacher<br>3. POST /api/messaging/conversations [type: direct, participant_ids: [parent_id, teacher_id]]<br>4. Verify response | Conversation created or existing returned<br>Status 200/201<br>Conversation ID returned | Parent and teacher accounts exist |
| TC_PAR_29 | Parent sends message to teacher | 1. Conversation exists<br>2. POST /api/messaging/messages [conversation_id, content: "Xin chào cô"]<br>3. Verify delivery | Message sent<br>Status 201<br>Message saved in DB<br>Teacher receives notification | Conversation exists |
| TC_PAR_30 | Parent views message history | 1. Login as parent<br>2. Open conversation<br>3. GET /api/messaging/conversations/{id}/messages<br>4. Verify response | Returns all messages<br>Status 200<br>Messages sorted by time<br>Read status displayed | Messages exist in conversation |
| TC_PAR_31 | Real-time message receipt (Socket.IO) | 1. Parent connected to socket<br>2. Teacher sends message<br>3. Verify parent receives instantly | Message appears in real-time<br>No page refresh needed<br>Notification sound/indicator | Both users connected<br>Socket.IO active |

### Scenario H - Complaint Creation and Tracking

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_PAR_32 | Parent views complaint types | 1. Login as parent<br>2. Navigate to complaints page<br>3. GET /parent/complaints/types<br>4. Verify response | Returns list of complaint types<br>Status 200<br>Types displayed (Học phí, Cơ sở vật chất, etc.) | Parent logged in<br>Complaint types configured |
| TC_PAR_33 | Parent creates new complaint | 1. Login as parent<br>2. Click Create Complaint<br>3. POST /parent/complaints [type_id, title, description, student_id (optional)]<br>4. Submit | Complaint created with pending status<br>Status 201<br>Visible in parent's complaint list<br>Notification sent to school admin | Parent logged in |
| TC_PAR_34 | Parent views complaint status | 1. Login as parent<br>2. Navigate to complaints list<br>3. GET /parent/complaints<br>4. Click on complaint<br>5. GET /parent/complaints/{complaintId} | Returns complaint details<br>Status 200<br>Current status shown: pending/approved/rejected<br>Admin response visible (if any) | Parent created complaint |

---

## MODULE 4: STAFF OPERATIONS PROCESS

### Scenario A - Health Care Staff Operations

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_HEALTH_01 | Health staff views class list | 1. Login as health_care_staff [email: health1@test.com]<br>2. Navigate to dashboard<br>3. GET /health-staff/classes<br>4. Verify response | Returns classes in health staff's school<br>Status 200<br>Class list displayed | Health staff logged in<br>Classes exist in school |
| TC_HEALTH_02 | View students in class for health check | 1. Login as health staff<br>2. Select class<br>3. GET /health-staff/classes/{classId}/students<br>4. Verify response | Returns students in selected class<br>Status 200<br>Student names and basic info shown | Health staff logged in<br>Students exist in class |
| TC_HEALTH_03 | Create health record for student | 1. Login as health staff<br>2. Select student<br>3. POST /health-staff/health/records [student_id, height: 105cm, weight: 18kg, date, notes]<br>4. Submit | Health record created<br>Status 201<br>Record saved with timestamp<br>Visible in student's health history | Health staff logged in<br>Student exists |
| TC_HEALTH_04 | Update existing health record | 1. Login as health staff<br>2. View student's health records<br>3. Select record to edit<br>4. PUT /health-staff/health/records/{recordId} [update notes]<br>5. Save | Health record updated<br>Status 200<br>Changes saved<br>Update timestamp recorded | Health record exists |
| TC_HEALTH_05 | Delete health record | 1. Login as health staff<br>2. Select record<br>3. DELETE /health-staff/health/records/{recordId}<br>4. Confirm | Health record deleted<br>Status 200<br>Record removed from history | Health record exists |
| TC_HEALTH_06 | Create health notice for parent | 1. Login as health staff<br>2. POST /health-staff/health/notices [student_id, title: "Cần tiêm phòng", content, priority: high]<br>3. Submit | Health notice created<br>Status 201<br>Notice saved<br>Parent receives notification<br>Visible to parent | Health staff logged in<br>Student with linked parent exists |
| TC_HEALTH_07 | View health records for specific student | 1. Login as health staff<br>2. GET /health-staff/health/records?student_id={id}<br>3. Verify response | Returns all health records for student<br>Status 200<br>Records sorted by date<br>Growth chart data available | Health records exist for student |

### Scenario B - Nutrition Staff Operations

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_NUT_01 | Nutrition staff creates new dish | 1. Login as nutrition_staff [email: nutrition1@test.com]<br>2. Navigate to dishes management<br>3. POST /nutrition/dishes [name: Thịt kho tàu, ingredients: thịt ba chỉ 200g..., calories: 350, protein: 25g, description]<br>4. Submit | Dish created successfully<br>Status 201<br>Dish saved with nutrition info<br>Available for menu assignment | Nutrition staff logged in |
| TC_NUT_02 | Update dish information | 1. Login as nutrition staff<br>2. Navigate to dishes list<br>3. Select dish to edit<br>4. PUT /nutrition/dishes/{id} [update calories, ingredients]<br>5. Save | Dish updated<br>Status 200<br>Changes saved<br>Updated in existing menus | Dish exists |
| TC_NUT_03 | Delete dish not in any menu | 1. Login as nutrition staff<br>2. Select unused dish<br>3. DELETE /nutrition/dishes/{id}<br>4. Confirm | Dish deleted<br>Status 200<br>Dish removed from database | Dish exists, not assigned to any menu |
| TC_NUT_04 | Attempt to delete dish currently in menu | 1. Login as nutrition staff<br>2. Select dish assigned to current week menu<br>3. DELETE /nutrition/dishes/{id}<br>4. Verify response | Error: "Dish is in use"<br>Status 400<br>Dish not deleted<br>Menu integrity maintained | Dish assigned to active menu |
| TC_NUT_05 | View class ages for menu planning | 1. Login as nutrition staff<br>2. Navigate to menu planning<br>3. GET /nutrition/class-ages<br>4. Verify response | Returns list of class ages<br>Status 200<br>Ages displayed for menu assignment | Nutrition staff logged in<br>Class ages exist |
| TC_NUT_06 | View meals and weekdays | 1. Login as nutrition staff<br>2. GET /nutrition/meals<br>3. GET /nutrition/weekdays<br>4. Verify responses | Returns meals (Sáng, Phụ sáng, Trưa, Phụ chiều)<br>Returns weekdays (Thứ 2-6)<br>Status 200 | Nutrition staff logged in<br>Master data configured |

### Scenario C - Weekly Menu Creation and Assignment

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_NUT_07 | View class age meal schedule | 1. Login as nutrition staff<br>2. GET /nutrition/class-age-meals?class_age_id={id}&date=2024-12-09<br>3. Verify response | Returns meal schedule for class age and date<br>Status 200<br>Existing assignments shown | Nutrition staff logged in<br>Class age exists |
| TC_NUT_08 | Assign dishes to specific meal | 1. Login as nutrition staff<br>2. Select [class_age: Mầm, meal: Trưa, date: 2024-12-09]<br>3. POST /nutrition/class-age-meals/assign [class_age_id, meal_id, date, dish_ids: [{id1}, {id2}]]<br>4. Submit | Dishes assigned to meal<br>Status 200/201<br>DishesClassAgeMeals records created<br>Menu visible to parents of that age group | Nutrition staff logged in<br>Dishes exist |
| TC_NUT_09 | View assigned dishes for meal | 1. Login as nutrition staff<br>2. GET /nutrition/class-age-meals/dishes?class_age_id={id}&meal_id={id}&date=2024-12-09<br>3. Verify response | Returns list of dishes assigned<br>Status 200<br>Dish details displayed | Dishes assigned to meal |
| TC_NUT_10 | Create full weekly menu | 1. Login as nutrition staff<br>2. For each day (Mon-Fri)<br>3. For each meal (4 meals/day)<br>4. Assign dishes<br>5. Verify completion | Full week menu created<br>20 meal slots assigned (5 days × 4 meals)<br>All assignments saved<br>Menu visible to parents | Nutrition staff logged in<br>Sufficient dishes exist |
| TC_NUT_11 | View weekly dishes summary | 1. Login as nutrition staff<br>2. GET /nutrition/class-age-meals/weekly-dishes?class_age_id={id}&start_date=2024-12-09<br>3. Verify response | Returns full week menu<br>Status 200<br>Grouped by day and meal<br>Nutrition totals calculated | Weekly menu exists for class age |
| TC_NUT_12 | Update existing menu assignment | 1. Dishes assigned to meal<br>2. Reassign with different dishes<br>3. POST /nutrition/class-age-meals/assign (same meal, new dishes)<br>4. Verify update | Old assignments removed<br>New dishes assigned<br>Status 200<br>Parents see updated menu | Menu assignment exists |

---

## MODULE 5: ADMINISTRATION PROCESS

### Scenario A - Post Moderation and Management

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ADMIN_01 | School admin views all posts | 1. Login as school_admin<br>2. Navigate to /school-admin/posts<br>3. GET /school-admin/posts<br>4. Verify response | Returns all posts in school<br>Status 200<br>Includes: pending, approved, rejected<br>Filtered by status<br>Pagination works | School admin logged in<br>Posts exist |
| TC_ADMIN_02 | View pending posts only | 1. Login as school_admin<br>2. Filter by status: pending<br>3. GET /school-admin/posts?status=pending<br>4. Verify response | Returns pending posts only<br>Status 200<br>Posts from parents/teachers awaiting approval | Pending posts exist |
| TC_ADMIN_03 | School admin approves post | 1. Login as school_admin<br>2. View pending post<br>3. PUT /school-admin/posts/{postId}/status [status: approved]<br>4. Confirm | Post status changed to approved<br>Status 200<br>Post visible to all users<br>Creator notified | Pending post exists |
| TC_ADMIN_04 | School admin rejects post | 1. Login as school_admin<br>2. View pending post<br>3. PUT /school-admin/posts/{postId}/status [status: rejected, reason: "Inappropriate content"]<br>4. Confirm | Post status changed to rejected<br>Status 200<br>Post hidden from public<br>Creator notified with reason | Pending post exists |
| TC_ADMIN_05 | School admin creates official post | 1. Login as school_admin<br>2. Click Create Post<br>3. POST /school-admin/posts [title, content, images, status: approved]<br>4. Publish | Post created with approved status<br>Status 201<br>Immediately visible to all users<br>No approval needed | School admin logged in |
| TC_ADMIN_06 | Update existing post | 1. Login as school_admin<br>2. Select post to edit<br>3. PUT /school-admin/posts/{postId} [update content]<br>4. Save | Post updated<br>Status 200<br>Changes visible immediately<br>Edit timestamp recorded | Post exists |
| TC_ADMIN_07 | Delete inappropriate post | 1. Login as school_admin<br>2. Select post<br>3. DELETE /school-admin/posts/{postId}<br>4. Confirm | Post deleted<br>Status 200<br>Post removed from all views<br>Comments and likes cascade deleted | Post exists |

### Scenario B - Comment and Like Moderation

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ADMIN_08 | View comments on post | 1. Login as school_admin<br>2. View post detail<br>3. GET /school-admin/posts/{postId}/comments<br>4. Verify response | Returns all comments<br>Status 200<br>Comment authors shown<br>Timestamps displayed | Post with comments exists |
| TC_ADMIN_09 | Delete inappropriate comment | 1. Login as school_admin<br>2. View comment<br>3. DELETE /school-admin/posts/comments/{commentId}<br>4. Confirm | Comment deleted<br>Status 200<br>Comment removed from post<br>User notified (optional) | Comment exists |
| TC_ADMIN_10 | View likes on post | 1. Login as school_admin<br>2. GET /school-admin/posts/{postId}/likes<br>3. Verify response | Returns list of users who liked<br>Status 200<br>Like count displayed | Post with likes exists |

### Scenario C - Complaint Management

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ADMIN_11 | View complaint statistics | 1. Login as school_admin<br>2. Navigate to complaints dashboard<br>3. GET /school-admin/complaints/stats<br>4. Verify response | Returns statistics<br>Status 200<br>Total complaints<br>By status: pending, approved, rejected<br>By type<br>By date range | School admin logged in<br>Complaints exist |
| TC_ADMIN_12 | View all complaints | 1. Login as school_admin<br>2. Navigate to complaints list<br>3. GET /school-admin/complaints<br>4. Verify response | Returns all complaints in school<br>Status 200<br>Filtered by status<br>Sorted by date<br>Pagination works | Complaints exist |
| TC_ADMIN_13 | View complaint detail | 1. Login as school_admin<br>2. Click on complaint<br>3. GET /school-admin/complaints/{complaintId}<br>4. Verify response | Returns full complaint details<br>Status 200<br>Type, title, description, status<br>Creator info<br>Student (if linked)<br>Timestamps | Complaint exists |
| TC_ADMIN_14 | Approve and resolve complaint | 1. Login as school_admin<br>2. View pending complaint<br>3. PUT /school-admin/complaints/{complaintId}/approve [resolution: "Đã xử lý..."]<br>4. Confirm | Complaint status changed to approved<br>Status 200<br>Resolution saved<br>Creator notified | Pending complaint exists |
| TC_ADMIN_15 | Reject complaint | 1. Login as school_admin<br>2. View complaint<br>3. PUT /school-admin/complaints/{complaintId}/reject [reason: "Không thuộc phạm vi xử lý"]<br>4. Confirm | Complaint status changed to rejected<br>Status 200<br>Reason saved<br>Creator notified | Pending complaint exists |

### Scenario D - Complaint Type Management

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ADMIN_16 | View complaint types | 1. Login as school_admin<br>2. Navigate to settings<br>3. GET /school-admin/complaints/types/list<br>4. Verify response | Returns list of complaint types<br>Status 200<br>Types displayed with descriptions | School admin logged in |
| TC_ADMIN_17 | Create new complaint type | 1. Login as school_admin<br>2. Click Add Type<br>3. POST /school-admin/complaints/types [name: "An toàn học đường", description]<br>4. Submit | Complaint type created<br>Status 201<br>Available in complaint form<br>Users can select when creating complaint | School admin logged in |
| TC_ADMIN_18 | Update complaint type | 1. Login as school_admin<br>2. Select type to edit<br>3. PUT /school-admin/complaints/types/{typeId} [update description]<br>4. Save | Complaint type updated<br>Status 200<br>Changes saved<br>Visible in forms | Complaint type exists |
| TC_ADMIN_19 | Delete unused complaint type | 1. Login as school_admin<br>2. Select type with no complaints<br>3. DELETE /school-admin/complaints/types/{typeId}<br>4. Confirm | Complaint type deleted<br>Status 200<br>Removed from list | Complaint type exists, no associated complaints |
| TC_ADMIN_20 | Attempt to delete complaint type in use | 1. Login as school_admin<br>2. Select type with existing complaints<br>3. DELETE /school-admin/complaints/types/{typeId}<br>4. Verify response | Error: "Type is in use"<br>Status 400<br>Type not deleted<br>Data integrity maintained | Complaint type with associated complaints exists |

### Scenario E - School Information Management

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
|--------------|----------------------|---------------------|------------------|----------------|
| TC_ADMIN_21 | School admin views own school info | 1. Login as school_admin<br>2. Navigate to school settings<br>3. GET /school-admin/school<br>4. Verify response | Returns school information<br>Status 200<br>Name, address, phone, email displayed<br>Logo shown | School admin logged in |
| TC_ADMIN_22 | Update school information | 1. Login as school_admin<br>2. Edit school info<br>3. PUT /school-admin/school [address: new address, phone: new phone]<br>4. Save | School info updated<br>Status 200<br>Changes saved in DB<br>New info displayed everywhere | School admin logged in |
| TC_ADMIN_23 | Upload school logo | 1. Login as school_admin<br>2. Navigate to school settings<br>3. Upload logo image<br>4. PUT /school-admin/school [logo_url]<br>5. Save | Logo uploaded<br>Status 200<br>Logo displayed in app header<br>Visible to all school users | School admin logged in |

---

## 📊 SUMMARY TABLE (For Excel)

Copy and paste this into Excel:

```
Module,Scenario,Test Case ID,Test Case Description,Priority
User & Authentication Process,Scenario A - User Registration and Account Creation,TC_AUTH_01,Register new parent account with valid data,Critical
User & Authentication Process,Scenario A - User Registration and Account Creation,TC_AUTH_02,Attempt to register with existing email,High
User & Authentication Process,Scenario A - User Registration and Account Creation,TC_AUTH_03,Register with invalid email format,High
User & Authentication Process,Scenario A - User Registration and Account Creation,TC_AUTH_04,Register with weak password,High
User & Authentication Process,Scenario A - User Registration and Account Creation,TC_AUTH_05,Register with missing required fields,High
User & Authentication Process,Scenario B - User Login and Session Management,TC_AUTH_06,Login with valid parent credentials,Critical
User & Authentication Process,Scenario B - User Login and Session Management,TC_AUTH_07,Login with wrong password,Critical
User & Authentication Process,Scenario B - User Login and Session Management,TC_AUTH_08,Login with non-existent email,High
User & Authentication Process,Scenario B - User Login and Session Management,TC_AUTH_09,Login as school_admin and verify role access,Critical
User & Authentication Process,Scenario B - User Login and Session Management,TC_AUTH_10,Login with deleted/inactive account,High
User & Authentication Process,Scenario B - User Login and Session Management,TC_AUTH_11,Session expiration handling,Medium
User & Authentication Process,Scenario C - Forgot Password Flow,TC_AUTH_12,Request password reset with valid email,High
User & Authentication Process,Scenario C - Forgot Password Flow,TC_AUTH_13,Request password reset with non-existent email,Medium
User & Authentication Process,Scenario C - Forgot Password Flow,TC_AUTH_14,Reset password with valid token,High
User & Authentication Process,Scenario D - Role-Based Access Control (RBAC),TC_AUTH_15,Parent attempts to access teacher routes,Critical
User & Authentication Process,Scenario D - Role-Based Access Control (RBAC),TC_AUTH_16,Teacher attempts to access school-admin routes,Critical
User & Authentication Process,Scenario D - Role-Based Access Control (RBAC),TC_AUTH_17,Access protected route without token,Critical
```

---

**Tổng số test cases chi tiết: 90+ test cases**  
**Format:** Sẵn sàng copy vào Excel  
**Last Updated:** 7/12/2025
