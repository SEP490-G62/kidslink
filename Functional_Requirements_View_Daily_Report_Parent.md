3.1.4. View Daily Report Parent
  
●	View daily reports list: Display all daily reports for selected child in a comprehensive list showing report date, child information, attendance times, notes, and health notifications with proper scrolling. 
●	Filter by date range: Use date picker filters for "From Date" and "To Date" to filter daily reports within a specific time period. Both dates are displayed as date picker inputs with format "mm/dd/yyyy" and calendar icon. 
●	Select child: Switch between children using child selector dropdown in the top navigation bar to view daily reports for different children. 
●	View child information: Display child avatar, name, and report date for each daily report card. 
●	View attendance information: Display check-in time with teacher name who checked in the child ("Đến lớp") and check-out time with teacher name who checked out the child ("Về nhà"). Both times are displayed with clock icon. 
●	View notes: Display general notes and comments about the child's activities, behavior, and daily activities in the "Ghi chú" (Notes) section. 
●	View health notifications: Display health notifications in a distinct section with light yellow background showing symptoms, medications used, actions taken, notes, and nurse name who created the notification. 
●	Clear date filters: Reset date filters using the "Xóa" (Clear) button to return to the unfiltered view of all daily reports. 
●	Refresh report data: Update the current daily reports list by refreshing the page to get the latest data from the server. 
On the screen, parent can also: 
●	Navigate between different sections: Access other parent functions through the sidebar navigation including Homepage, Class Schedule, Menu, Child Information, Fees, Orders, Messages, and Personal Information. 
●	View user information: See current user details and role (parent) in the top navigation bar. 
●	Switch between children: Change active child using the child selector dropdown to view reports for different children. 
Field Name 	Description 
(1) Report Date 	Data type: date. Retrieved from dailyReport.report_date and displayed in format "DD/MM/YYYY" (e.g., 29/10/2025) below child name in daily report card 
(2) Child Information 	Data type: object with child_id, child_name, and avatar_url. Retrieved from dailyReport.student_id populated with Student model (full_name, avatar_url) and displayed with circular profile picture and child name in daily report header 
(3) Check-in Time 	Data type: string (time format). Retrieved from dailyReport.checkin_time and displayed with clock icon in "Đến lớp" (Arrived at class) section (e.g., "07:55") 
(4) Check-in Teacher 	Data type: string. Retrieved from dailyReport.teacher_checkin_id populated with Teacher model and User model (full_name) and displayed next to check-in time showing teacher name who checked in the child (e.g., "Dinh Thi B") 
(5) Check-out Time 	Data type: string (time format). Retrieved from dailyReport.checkout_time and displayed with clock icon in "Về nhà" (Went home) section (e.g., "16:40") 
(6) Check-out Teacher 	Data type: string. Retrieved from dailyReport.teacher_checkout_id populated with Teacher model and User model (full_name) and displayed next to check-out time showing teacher name who checked out the child (e.g., "Le Thi D") 
(7) Notes 	Data type: string. Retrieved from dailyReport.comments and displayed in "Ghi chú" (Notes) section showing general comments about child's daily activities (e.g., "Bé đi học ngoan, ăn uống tốt.") 
(8) Health Notification 	Data type: object with symptoms, medications, actions_taken, note, and nurse_name. Retrieved from HealthNotice.find({ student_id, createdAt within report_date }) populated with HealthCareStaff and User model. Displayed in "Thông báo sức khỏe" section with light yellow background. Includes symptoms (healthNotice.symptoms), medications used (healthNotice.medications), actions taken (healthNotice.actions_taken), notes (healthNotice.note), and nurse name (healthNotice.health_care_staff_id.user_id.full_name) 
(9) Date Range 	Data type: date range with from_date and to_date. Used to filter daily reports by report_date within a specific time period. From Date filters reports with report_date >= from_date and To Date filters reports with report_date <= to_date. Both dates are displayed as date picker inputs with format "mm/dd/yyyy" and calendar icon. 
(10) Student ID 	Data type: ObjectId. Retrieved from selected child in child selector dropdown and used as query parameter (student_id) to filter daily reports for specific child. Retrieved from ParentStudent.find({ parent_id }) to get list of parent's children.

