# INTEGRATION TEST - AUTHENTICATION & AUTHORIZATION
**Module:** Authentication & Authorization  
**Base URL:** `/auth`  
**Test Date:** [Date]  
**Tester:** [Tester Name]  

---

## REGISTER

### AUTH-01
**Test Case Description:** Register new user with valid information  
**Pre-conditions:** Email does not exist, server is running, user at registration page  
**Test Data:** Name: Nguyen Van A, Email: teacher_new@test.com, Password: Test@123456  
**Test Case Procedure:** 1. Open browser and navigate to http://localhost:3000/authentication/sign-up 2. Fill in 'Name' field with 'Nguyen Van A' 3. Fill in 'Email' field with 'teacher_new@test.com' 4. Fill in 'Password' field with 'Test@123456' 5. Check 'I agree the Terms and Conditions' checkbox 6. Click 'SIGN UP' button 7. Verify success message appears 8. Verify redirected to Sign In page  
**Expected Results:** Success message displayed, redirected to /authentication/sign-in page, user can login with new credentials  
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

### AUTH-02
**Test Case Description:** Register with existing email  
**Pre-conditions:** User with email existing@test.com already registered  
**Test Data:** Name: Test User, Email: existing@test.com, Password: Test@123456  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-up 2. Fill in 'Name' field with 'Test User' 3. Fill in 'Email' field with 'existing@test.com' 4. Fill in 'Password' field with 'Test@123456' 5. Check Terms and Conditions 6. Click 'SIGN UP' button 7. Verify error message appears  
**Expected Results:** Error message "Email already exists" or similar appears, user remains on registration page, no new account created  
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

### AUTH-03
**Test Case Description:** Register with invalid email format  
**Pre-conditions:** User at registration page  
**Test Data:** Name: Test User, Email: invalid-email-format, Password: Test@123456  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-up 2. Fill in 'Name' field with 'Test User' 3. Fill in 'Email' field with 'invalid-email-format' 4. Fill in 'Password' field with 'Test@123456' 5. Check Terms and Conditions 6. Click 'SIGN UP' button 7. Verify validation error message appears  
**Expected Results:** Validation error "Please enter a valid email" or similar appears, form not submitted, no account created  
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

### AUTH-04
**Test Case Description:** Register with weak password  
**Pre-conditions:** User at registration page  
**Test Data:** Name: Test User, Email: test@test.com, Password: 123  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-up 2. Fill in 'Name' field with 'Test User' 3. Fill in 'Email' field with 'test@test.com' 4. Fill in 'Password' field with '123' 5. Check Terms and Conditions 6. Click 'SIGN UP' button 7. Verify validation error appears  
**Expected Results:** Password validation error "Password must be at least 6 characters" or similar appears, form not submitted  
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

### AUTH-05
**Test Case Description:** Register missing required fields  
**Pre-conditions:** User at registration page  
**Test Data:** Name: (empty), Email: (empty), Password: (empty)  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-up 2. Leave 'Name' field empty 3. Leave 'Email' field empty 4. Leave 'Password' field empty 5. Check Terms and Conditions 6. Click 'SIGN UP' button 7. Verify validation errors appear  
**Expected Results:** Validation errors "Name is required", "Email is required", "Password is required" appear, form not submitted  
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

### AUTH-06
**Test Case Description:** Register without accepting Terms and Conditions  
**Pre-conditions:** User at registration page  
**Test Data:** Name: Test User, Email: test@test.com, Password: Test@123456  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-up 2. Fill in 'Name' field with 'Test User' 3. Fill in 'Email' field with 'test@test.com' 4. Fill in 'Password' field with 'Test@123456' 5. Leave 'Terms and Conditions' checkbox unchecked 6. Click 'SIGN UP' button 7. Verify validation error or disabled button  
**Expected Results:** SIGN UP button disabled or validation error appears, form not submitted  
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

## LOGIN

### AUTH-07
**Test Case Description:** Login successfully with correct credentials  
**Pre-conditions:** User teacher1@test.com exists with password Test@123456, status active  
**Test Data:** Username: teacher1@test.com, Password: Test@123456  
**Test Case Procedure:** 1. Open browser and navigate to http://localhost:3000/authentication/sign-in 2. Fill in 'Username' field with 'teacher1@test.com' 3. Fill in 'Password' field with 'Test@123456' 4. Check 'Remember me' switch (optional) 5. Click 'SIGN IN' button 6. Verify success message appears 7. Verify redirected to dashboard page based on user role (teacher dashboard)  
**Expected Results:** Success message "Login successful" appears, redirected to /teacher dashboard, user info displayed in navigation bar  
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

### AUTH-08
**Test Case Description:** Login with wrong password  
**Pre-conditions:** User teacher1@test.com exists  
**Test Data:** Username: teacher1@test.com, Password: WrongPassword123  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-in 2. Fill in 'Username' field with 'teacher1@test.com' 3. Fill in 'Password' field with 'WrongPassword123' 4. Click 'SIGN IN' button 5. Verify error message appears  
**Expected Results:** Error message "Invalid username or password" appears, user remains on sign-in page, not redirected  
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

### AUTH-09
**Test Case Description:** Login with non-existent username  
**Pre-conditions:** Username notexist@test.com does not exist in system  
**Test Data:** Username: notexist@test.com, Password: Test@123456  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-in 2. Fill in 'Username' field with 'notexist@test.com' 3. Fill in 'Password' field with 'Test@123456' 4. Click 'SIGN IN' button 5. Verify error message appears  
**Expected Results:** Error message "Invalid username or password" appears, user remains on sign-in page  
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

### AUTH-10
**Test Case Description:** Login with deactivated account  
**Pre-conditions:** User inactive@test.com exists but status is inactive/deactivated  
**Test Data:** Username: inactive@test.com, Password: Test@123456  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-in 2. Fill in 'Username' field with 'inactive@test.com' 3. Fill in 'Password' field with 'Test@123456' 4. Click 'SIGN IN' button 5. Verify error message appears  
**Expected Results:** Error message "Account has been deactivated" or "Account is inactive" appears, user blocked from login  
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

### AUTH-11
**Test Case Description:** Login with missing password  
**Pre-conditions:** User at sign-in page  
**Test Data:** Username: test@test.com, Password: (empty)  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-in 2. Fill in 'Username' field with 'test@test.com' 3. Leave 'Password' field empty 4. Click 'SIGN IN' button 5. Verify validation error appears  
**Expected Results:** Validation error "Password is required" or SIGN IN button disabled, form not submitted  
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

## FORGOT PASSWORD

### AUTH-12
**Test Case Description:** Forgot password with valid email  
**Pre-conditions:** User teacher1@test.com exists, email service configured  
**Test Data:** Email: teacher1@test.com  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-in 2. Click 'Forgot Password?' link 3. Verify redirected to /authentication/forgot-password page 4. Fill in 'Email' field with 'teacher1@test.com' 5. Click 'SEND RESET LINK' or 'SUBMIT' button 6. Verify success message appears 7. Check email inbox for password reset email (or verify in email logs)  
**Expected Results:** Success message "Password reset email has been sent to your email" appears, password reset email sent, email contains reset link  
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

### AUTH-13
**Test Case Description:** Forgot password with non-existent email  
**Pre-conditions:** Email notexist@test.com does not exist in system  
**Test Data:** Email: notexist@test.com  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/forgot-password 2. Fill in 'Email' field with 'notexist@test.com' 3. Click 'SEND RESET LINK' button 4. Verify response message  
**Expected Results:** Generic success message appears (to prevent user enumeration), no email sent in backend  
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

### AUTH-14
**Test Case Description:** Forgot password with invalid email format  
**Pre-conditions:** User at forgot password page  
**Test Data:** Email: invalid-email  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/forgot-password 2. Fill in 'Email' field with 'invalid-email' 3. Click 'SEND RESET LINK' button 4. Verify validation error appears  
**Expected Results:** Validation error "Please enter a valid email" appears, form not submitted  
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

## AUTHORIZATION & ACCESS CONTROL

### AUTH-15
**Test Case Description:** Access protected page without login  
**Pre-conditions:** User not logged in, browser has no session/token  
**Test Data:** N/A  
**Test Case Procedure:** 1. Open incognito/private browser window 2. Navigate directly to http://localhost:3000/dashboard (protected page) 3. Verify redirection occurs  
**Expected Results:** Automatically redirected to /authentication/sign-in page, unable to access dashboard without authentication  
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

### AUTH-16
**Test Case Description:** Session expires after token timeout  
**Pre-conditions:** User logged in, session timeout configured (e.g., 2 hours)  
**Test Data:** Valid user account  
**Test Case Procedure:** 1. Login to system with valid credentials 2. Navigate to dashboard 3. Manually expire token (by changing system time or waiting for timeout) 4. Attempt to navigate to any protected page or perform action 5. Verify session expired handling  
**Expected Results:** Redirected to sign-in page with message "Session expired, please login again" or similar  
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

### AUTH-17
**Test Case Description:** Session persists with Remember Me option  
**Pre-conditions:** User at sign-in page  
**Test Data:** Username: teacher1@test.com, Password: Test@123456  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-in 2. Fill in username and password 3. Check 'Remember me' switch 4. Click 'SIGN IN' button 5. Close browser completely 6. Reopen browser 7. Navigate to http://localhost:3000 8. Verify still logged in  
**Expected Results:** After reopening browser, user remains logged in, redirected to dashboard automatically  
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

### AUTH-18
**Test Case Description:** Parent cannot access admin functions (RBAC)  
**Pre-conditions:** Parent account exists and logged in  
**Test Data:** Parent user credentials  
**Test Case Procedure:** 1. Login as parent user 2. Navigate to parent dashboard (/parent) 3. Attempt to manually navigate to admin page http://localhost:3000/admin 4. Verify access denied  
**Expected Results:** Redirected to /unauthorized page or parent dashboard, message "You don't have permission to access this page" appears  
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

### AUTH-19
**Test Case Description:** Teacher cannot view data from other schools (Data Isolation)  
**Pre-conditions:** Teacher A logged in (belongs to School A), Class B exists (belongs to School B)  
**Test Data:** Teacher A credentials, Class B ID  
**Test Case Procedure:** 1. Login as Teacher A from School A 2. Navigate to class list page 3. Verify only classes from School A visible 4. Attempt to access Class B details page directly (e.g., /classes/classB_id) 5. Verify access denied  
**Expected Results:** Class list shows only School A classes, attempting to access School B class shows 403/404 error or redirected to unauthorized page  
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

### AUTH-20
**Test Case Description:** School admin can only see users from their school  
**Pre-conditions:** School Admin A logged in, users exist in School A and School B  
**Test Data:** School Admin A credentials  
**Test Case Procedure:** 1. Login as School Admin A 2. Navigate to user management page (/school-admin/users or /users) 3. View user list 4. Verify all users displayed belong to School A only 5. Check no users from School B visible  
**Expected Results:** User list displays only users with school_id matching School A, no School B users visible  
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

## SECURITY & RATE LIMITING

### AUTH-21
**Test Case Description:** Rate limiting - too many login attempts  
**Pre-conditions:** Rate limit configured (e.g., max 100 requests per 15 min)  
**Test Data:** Username: test@test.com, Password: WrongPassword (incorrect)  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-in 2. Attempt to login with wrong password repeatedly 3. Send more than 100 login requests within 15 minutes 4. Verify rate limit response after exceeding threshold  
**Expected Results:** First 100 requests processed normally (failed login), request 101+ shows error message "Too many login attempts. Please try again later" or similar  
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

### AUTH-22
**Test Case Description:** Password not visible in browser network logs  
**Pre-conditions:** Browser DevTools available  
**Test Data:** Username: teacher1@test.com, Password: Test@123456  
**Test Case Procedure:** 1. Open browser DevTools (F12) 2. Go to Network tab 3. Navigate to http://localhost:3000/authentication/sign-in 4. Enter username and password 5. Click SIGN IN 6. Check Network tab for login request 7. Verify password is sent securely (HTTPS) and not logged in plain text  
**Expected Results:** Login request uses HTTPS, password encrypted in transit, response does not contain plain password  
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

### AUTH-23
**Test Case Description:** Logout functionality  
**Pre-conditions:** User logged in to system  
**Test Data:** Any valid user account  
**Test Case Procedure:** 1. Login to system with valid credentials 2. Navigate to dashboard 3. Locate and click 'Logout' button (usually in top nav or user menu) 4. Verify logout successful 5. Attempt to navigate back to protected page 6. Verify redirected to login  
**Expected Results:** User logged out successfully, redirected to landing or sign-in page, session cleared, cannot access protected pages without re-login  
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

### AUTH-24
**Test Case Description:** SQL Injection attempt in login form  
**Pre-conditions:** User at sign-in page  
**Test Data:** Username: admin' OR '1'='1, Password: anything  
**Test Case Procedure:** 1. Navigate to http://localhost:3000/authentication/sign-in 2. Fill in 'Username' field with "admin' OR '1'='1" 3. Fill in 'Password' field with 'anything' 4. Click 'SIGN IN' button 5. Verify authentication blocked  
**Expected Results:** Login fails with "Invalid username or password", SQL injection attack prevented, no unauthorized access, no SQL error messages exposed to user  
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
**Total Test Cases:** 24  
**Passed:** [Number]  
**Failed:** [Number]  
**Pass Rate:** [%]




