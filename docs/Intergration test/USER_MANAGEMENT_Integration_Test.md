# INTEGRATION TEST - USER MANAGEMENT
**Module:** User Management  
**Base URL:** `/users`  
**Test Date:** [Date]  
**Tester:** [Tester Name]  

---

## CREATE USER

### USER-01
**Test Case Description:** Create new teacher with valid information  
**Pre-conditions:** School admin logged in, username not exists  
**Test Data:** Full name: Tran Thi B, Username: teacher_b, Password: Teacher@123, Email: teacher_b@test.com, Phone: 0901234567, Role: teacher, Qualification: Bachelor, Major: Early Childhood Education, Experience: 5 years  
**Test Case Procedure:** 1. Login as School Admin 2. Click on 'Quản lý tài khoản' (Manage Account) menu 3. Click 'Thêm tài khoản' (Add Account) button 4. In the dialog: Fill 'Họ tên' (Full Name) = 'Tran Thi B' 5. Fill 'Username' = 'teacher_b' 6. Fill 'Mật khẩu' (Password) = 'Teacher@123' 7. Select 'Vai trò' (Role) = 'Giáo viên' (Teacher) 8. Fill 'Email' = 'teacher_b@test.com' 9. Fill 'Số điện thoại' (Phone) = '0901234567' 10. Fill 'Địa chỉ' (Address) with appropriate value 11. Fill teacher profile section: Trình độ='Bachelor', Chuyên ngành='Early Childhood Education', Năm KN='5' 12. Click 'Lưu' (Save) button 13. Verify success toast message appears  
**Expected Results:** Success message appears, user list refreshes showing new teacher with role 'Giáo viên', teacher can login with username/password  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-02
**Test Case Description:** Create new parent with valid information  
**Pre-conditions:** School admin logged in, student exists in school, parent username not exists  
**Test Data:** Full name: Nguyen Van C, Username: parent_c, Password: Parent@123, Email: parent_c@test.com, Phone: 0912345678, Role: parent, Student: Student A, Relationship: Father  
**Test Case Procedure:** 1. Login as School Admin 2. Click 'Thêm tài khoản' button 3. In the dialog: Fill 'Họ tên' = 'Nguyen Van C' 4. Fill 'Username' = 'parent_c' 5. Fill 'Mật khẩu' = 'Parent@123' 6. Select 'Vai trò' = 'Phụ huynh' (Parent) 7. Fill 'Email' = 'parent_c@test.com' 8. Fill 'Số điện thoại' = '0912345678' 9. In Parent Profile section: Select student from 'Học sinh' dropdown 10. Select 'Relationship' = 'Father' 11. Click 'Lưu' button 12. Verify success message and parent appears in list  
**Expected Results:** Success message appears, parent created and linked to student, parent can login with credentials  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-03
**Test Case Description:** Create user with duplicate username  
**Pre-conditions:** School admin logged in, username 'teacher_existing' already exists  
**Test Data:** Username: teacher_existing (existing)  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, click 'Thêm tài khoản' button 2. Fill 'Họ tên' = 'Test User' 3. Fill 'Username' = 'teacher_existing' (already exists) 4. Fill 'Mật khẩu' = 'Test@123' 5. Select Role = 'Giáo viên' (Teacher) 6. Fill teacher profile fields 7. Click 'Lưu' button 8. Verify error message appears  
**Expected Results:** Error message "Username đã tồn tại" appears, user not created, dialog remains open  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-04
**Test Case Description:** Create user with duplicate email  
**Pre-conditions:** School admin logged in, email 'existing@test.com' already exists  
**Test Data:** Email: existing@test.com (existing)  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, click 'Thêm tài khoản' button 2. Fill all basic fields with valid data and unique username 3. Fill 'Email' = 'existing@test.com' (already exists) 4. Select Role = 'Giáo viên' 5. Fill teacher profile section 6. Click 'Lưu' button 7. Verify error message appears  
**Expected Results:** Error message appears about duplicate email, user not created  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-05
**Test Case Description:** Create user with weak password  
**Pre-conditions:** School admin logged in  
**Test Data:** Password: 123456 (weak, no uppercase, special char)  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, click 'Thêm tài khoản' button 2. Fill basic fields with valid data 3. Fill 'Mật khẩu' = '123456' (weak password) 4. Select Role = 'Giáo viên' 5. Verify helper text shows password requirements 6. Fill teacher profile fields 7. Click 'Lưu' button 8. Verify validation error appears  
**Expected Results:** Validation error about password strength appears (needs uppercase, special char), user not created  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-06
**Test Case Description:** Create teacher without required teacher profile  
**Pre-conditions:** School admin logged in  
**Test Data:** Teacher profile missing qualification or major field  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, click 'Thêm tài khoản' button 2. Fill basic info: Họ tên, Username, Password, Email, Phone 3. Select Role = 'Giáo viên' (Teacher) 4. Verify 'Hồ sơ giáo viên' section appears 5. Leave 'Trình độ' (Qualification) field empty 6. Leave 'Chuyên ngành' (Major) field empty 7. Click 'Lưu' button 8. Verify validation errors appear  
**Expected Results:** Validation errors appear on Qualification and Major fields, user not created  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-07
**Test Case Description:** Create parent without email  
**Pre-conditions:** School admin logged in  
**Test Data:** Parent info complete but email field empty  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, click 'Thêm tài khoản' button 2. Fill 'Họ tên', 'Username', 'Mật khẩu', 'Số điện thoại' 3. Select Role = 'Phụ huynh' (Parent) 4. Verify 'Thông tin liên hệ' section shows 5. Leave 'Email' field empty 6. Select student in Parent Profile section 7. Click 'Lưu' button 8. Verify validation error appears on Email field  
**Expected Results:** Validation error "Phụ huynh cần có email để nhận thông tin" appears, user not created  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

## UPDATE USER

### USER-08
**Test Case Description:** Update user basic information  
**Pre-conditions:** School admin logged in, user exists in system  
**Test Data:** User ID, New phone: 0923456789, New address: "123 Nguyen Trai, Hanoi"  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, locate the user to edit in the table 3. Click Edit icon (pencil) on the user row 4. In the dialog: Update 'Số điện thoại' (Phone) to '0923456789' 5. Update 'Dịa chỉ' (Address) to '123 Nguyen Trai, Hanoi' 6. Click 'Lưu' (Save) button 7. Verify success message (toast) appears  
**Expected Results:** Success message appears, dialog closes, user list refreshes showing updated phone and address  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-09
**Test Case Description:** Update teacher profile information  
**Pre-conditions:** School admin logged in, teacher user exists  
**Test Data:** Teacher user ID, New qualification: Master, New experience: 10 years  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, find and click Edit icon on teacher user row 3. In the dialog, scroll to 'Hồ sơ giáo viên' section 4. Update 'Trình độ' (Qualification) to 'Master' 5. Update 'Số năm kinh nghiệm' (Experience Years) to '10' 6. Update 'Ghi chú' (Note) field if needed 7. Click 'Lưu' button 8. Verify success message appears  
**Expected Results:** Success message appears, dialog closes, teacher profile shows updated qualification and experience  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-10
**Test Case Description:** Update user to duplicate email  
**Pre-conditions:** School admin logged in, two users exist with different emails  
**Test Data:** User A ID, Email of User B (already exists)  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, click Edit icon on User A row 3. In the dialog, scroll to 'Thông tin liên hệ' section 4. Change 'Email' field to User B's email address (which already exists) 5. Click 'Lưu' button 6. Verify error message appears  
**Expected Results:** Error message about duplicate email appears, dialog remains open, email not updated  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-11
**Test Case Description:** Cannot update username (read-only on edit)  
**Pre-conditions:** School admin logged in, user exists  
**Test Data:** User ID, attempt to change username  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, click Edit icon on user row 3. In the dialog, locate 'Username' field in first section 4. Attempt to click and edit the Username field 5. Verify Username field is disabled/grayed out 6. Verify no text can be entered  
**Expected Results:** Username field is disabled (read-only), cannot be edited, field appears grayed out  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

## DELETE USER

### USER-12
**Test Case Description:** Soft delete user (deactivate)  
**Pre-conditions:** School admin logged in, active user exists  
**Test Data:** User ID of active user  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, locate the active user in table with status 'Hoạt động' (Active) 3. Click Lock icon (LockIcon) on the user row 4. Verify confirmation dialog appears 5. Confirm the deactivation 6. Verify success message appears 7. Verify user status changed to 'Vô hiệu' (Inactive) in the table  
**Expected Results:** User deactivated successfully, status changed to 'Vô hiệu', user cannot login after deactivation  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-13
**Test Case Description:** Restore deleted user  
**Pre-conditions:** School admin logged in, soft deleted user exists (status=inactive)  
**Test Data:** Inactive user ID  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, locate the inactive user with status 'Vô hiệu' (Inactive) in table 3. Click Restore icon (RestoreIcon) on the user row 4. Verify confirmation dialog appears 5. Confirm the restoration 6. Verify success message appears 7. Check user status changed back to 'Hoạt động' (Active)  
**Expected Results:** User restored successfully, status changed to 'Hoạt động', user can login again  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-14
**Test Case Description:** Hard delete user permanently  
**Pre-conditions:** Admin logged in, user exists (preferably already soft deleted)  
**Test Data:** User ID  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, locate the user to permanently delete (can be inactive or active) 3. Click Delete icon (DeleteIcon/trash) on the user row 4. Verify confirmation dialog with warning message appears 5. Confirm permanent deletion 6. Verify success message appears 7. Verify user removed from list completely  
**Expected Results:** User permanently deleted from database and list, cannot be restored, warning message clearly indicates permanent deletion  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-15
**Test Case Description:** Cancel delete operation  
**Pre-conditions:** School admin logged in, user exists  
**Test Data:** User ID  
**Test Case Procedure:** 1. In 'Quản lý tài khoản' page, locate a user in the table 3. Click Delete icon (DeleteIcon) on the user row 4. When confirmation dialog appears, click 'Huỷ' (Cancel) or 'Không' (No) button 5. Verify dialog closes and user remains in list  
**Expected Results:** Confirmation dialog closes, user remains in list with unchanged status, no changes made  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

## PROFILE MANAGEMENT

### USER-16
**Test Case Description:** User views own profile  
**Pre-conditions:** Any user logged in (teacher, parent, etc.)  
**Test Data:** Current user credentials  
**Test Case Procedure:** 1. Login as any user (teacher, parent, health_care_staff, nutrition_staff) 2. Look at top right corner of navbar 3. Click on the user avatar or name 4. Select 'Thông tin tài khoản' (Profile/Account Info) from dropdown menu 5. Verify redirected to profile page (/profile route) 6. Check all personal information displayed: name, username, email, phone, avatar, status  
**Expected Results:** Profile page displays current user's information correctly matching database values  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-17
**Test Case Description:** User updates own profile information  
**Pre-conditions:** User logged in  
**Test Data:** New phone: 0934567890, New address: "456 Tran Hung Dao, HCMC"  
**Test Case Procedure:** 1. Login as any user 2. Click user avatar/name in navbar 3. Select 'Thông tin tài khoản' to go to profile page 4. Click 'Chỉnh sửa' (Edit) button on profile 5. Update 'Số điện thoại' to '0934567890' 6. Update 'Dịa chỉ' to '456 Tran Hung Dao, HCMC' 7. Click 'Lưu' (Save) button 8. Verify success message appears  
**Expected Results:** Success message appears, profile page refreshes showing updated phone and address  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-18
**Test Case Description:** User changes password  
**Pre-conditions:** User logged in  
**Test Data:** Current password: OldPass@123, New password: NewPass@456  
**Test Case Procedure:** 1. Login as user with password 'OldPass@123' 2. Click user avatar/name in navbar 3. Select 'Thông tin tài khoản' 4. Look for 'Thay đổi mật khẩu' (Change Password) link or tab 5. Fill 'Mật khẩu hiện tại' (Current Password) = 'OldPass@123' 6. Fill 'Mật khẩu mới' (New Password) = 'NewPass@456' 7. Fill 'Xác nhận mật khẩu' (Confirm Password) = 'NewPass@456' 8. Click 'Thay đổi' (Change) button 9. Verify success message appears 10. Logout and login with new password to verify  
**Expected Results:** Success message appears, can logout and login with new password 'NewPass@456', old password no longer works  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-19
**Test Case Description:** Change password with incorrect current password  
**Pre-conditions:** User logged in with correct password  
**Test Data:** Current password: WrongPass@999 (incorrect), New password: NewPass@456  
**Test Case Procedure:** 1. Navigate to change password section in profile 2. Fill 'Mật khẩu hiện tại' with 'WrongPass@999' (wrong password) 3. Fill 'Mật khẩu mới' = 'NewPass@456' 4. Fill 'Xác nhận mật khẩu' = 'NewPass@456' 5. Click 'Thay đổi' button 6. Verify error message appears  
**Expected Results:** Error message "Mật khẩu hiện tại không chín hợp" appears, password not changed, can still login with old password  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-20
**Test Case Description:** Change password with weak new password  
**Pre-conditions:** User logged in  
**Test Data:** Current password: OldPass@123 (correct), New password: 123 (weak)  
**Test Case Procedure:** 1. Navigate to change password section 2. Fill 'Mật khẩu hiện tại' = 'OldPass@123' (correct) 3. Fill 'Mật khẩu mới' = '123' (weak password) 4. Fill 'Xác nhận mật khẩu' = '123' 5. Verify helper text shows password requirements 6. Click 'Thay đổi' button 7. Verify validation error appears  
**Expected Results:** Validation error about password strength appears (needs 8-16 chars, uppercase, number, special char), password not changed  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-21
**Test Case Description:** New password and confirm password do not match  
**Pre-conditions:** User logged in  
**Test Data:** Current password: OldPass@123, New password: NewPass@456, Confirm: NewPass@789 (different)  
**Test Case Procedure:** 1. Navigate to change password section in profile 2. Fill 'Mật khẩu hiện tại' = 'OldPass@123' 3. Fill 'Mật khẩu mới' = 'NewPass@456' 4. Fill 'Xác nhận mật khẩu' = 'NewPass@789' (different) 5. Click 'Thay đổi' button 6. Verify validation error appears  
**Expected Results:** Validation error "Mật khẩu xác nhận không khớp" appears, password not changed  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

## AUTHORIZATION & DATA ISOLATION

### USER-22
**Test Case Description:** School admin can only manage users in their school  
**Pre-conditions:** Two schools with their respective school admins  
**Test Data:** School A admin account, School B admin account, users from both schools  
**Test Case Procedure:** 1. Login as School A admin 2. Click 'Quản lý tài khoản' (Manage Account) menu 4. Verify only users from School A are visible in the table 5. Search for a user from School B by name/username 6. Verify this user does NOT appear in search results 7. Logout and login as School B admin 8. Navigate to Manage Account page 9. Verify only users from School B are visible 10. Verify users from School A are not visible  
**Expected Results:** Each school admin sees only their school's users, cannot access or view users from other schools  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-23
**Test Case Description:** School admin cannot create admin or school_admin roles  
**Pre-conditions:** Logged in as school admin  
**Test Data:** New user details with admin/school_admin role attempt  
**Test Case Procedure:** 1. Login as school admin 2. Navigate to Manage Account page 3. Click 'Thêm tài khoản' (Add Account) button 4. In the dialog, click on 'Vai trò' (Role) dropdown 5. Verify available role options in dropdown: "Giáo viên" (teacher), "Phụ huynh" (parent), "Nhân viên y tế" (health_care_staff), "Nhân viên dinh dưỡng" (nutrition_staff) 6. Verify 'admin' and 'school_admin' roles are NOT available in dropdown 7. Verify role field is disabled on edit (cannot change existing user role)  
**Expected Results:** Role dropdown shows only available roles (teacher, parent, health_care_staff, nutrition_staff), admin/school_admin roles not visible, school admin cannot assign admin privileges  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-24
**Test Case Description:** Parent cannot access user management  
**Pre-conditions:** Parent account created and logged in  
**Test Data:** Parent user credentials  
**Test Case Procedure:** 1. Login as parent user 2. Verify access is denied or redirected to unauthorized page 4. Check navigation menu 5. Verify 'Quản lý tài khoản' (Manage Account) menu item is NOT visible 6. Verify parent's navigation shows only their allowed sections (profile, class info, student info, messages, etc.) 7. Try to access directly by URL: http://localhost:3000/school-admin/dashboard/manage-account 8. Verify access denied or automatic redirect to parent home page  
**Expected Results:** Parent cannot access user management page or dashboard, menu item not visible, direct URL access redirected to appropriate parent page  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

### USER-25
**Test Case Description:** Teacher cannot access user management  
**Pre-conditions:** Teacher account created and logged in  
**Test Data:** Teacher user credentials  
**Test Case Procedure:** 1. Login as teacher user 2. Verify access is denied or redirected to unauthorized page 4. Check navigation menu visible to teacher 5. Verify 'Quản lý tài khoản' (Manage Account) menu item is NOT visible 6. Verify teacher's navigation shows only their allowed sections (profile, class info, lesson plans, attendance, messages, etc.) 7. Try to access directly by URL: http://localhost:3000/school-admin/dashboard/manage-account 8. Verify access denied or automatic redirect to teacher home page  
**Expected Results:** Teacher cannot access user management page or dashboard, menu item not visible, direct URL access redirected to appropriate teacher page  
**Round 1:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 2:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Round 3:** [Passed/Failed]  
**Test date:**  
**Tester:**  
**Note:**  

---

## TEST SUMMARY
**Total Test Cases:** 25  
**Passed:** [Number]  
**Failed:** [Number]  
**Pass Rate:** [%]
