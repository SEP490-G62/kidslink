/**
=========================================================
* KidsLink Teacher Routes - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// Teacher Layouts
import TeacherHome from "layouts/teacher";
import TeacherClasses from "layouts/teacher/pages/Classes/index";
import TeacherStudentDetail from "layouts/teacher/pages/StudentDetail/index";
import TeacherStudents from "layouts/teacher/pages/Students/index";
import TeacherReports from "layouts/teacher/pages/Reports/index";
import TeacherAttendance from "layouts/teacher/pages/Attendance/index";
import TeacherSchedule from "layouts/teacher/pages/Schedule/index";
import TeacherProfile from "layouts/teacher/pages/Profile/index";
import TeacherSettings from "layouts/teacher/pages/Settings/index";
import DailyReportPage from "layouts/teacher/pages/DailyReport/index";
import TeacherChat from "layouts/teacher/pages/Chat/index";
import TeacherComplaints from "layouts/teacher/pages/Complaints/index";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";

const teacherRoutes = [
  {
    type: "route",
    name: "Trang chủ",
    key: "teacher-home",
    route: "/teacher",
    icon: <ArgonBox component="i" color="primary" fontSize="14px" className="ni ni-tv-2" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherHome /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Lớp học",
    key: "teacher-classes",
    route: "/teacher/classes",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-books" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherClasses /></ProtectedRoute>,
  },

  // Trang chi tiết học sinh (không hiển thị ở menu)
  {
    type: "hidden",
    key: "teacher-student-detail",
    route: "/teacher/students/:id",
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherStudentDetail /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Báo cáo",
    key: "teacher-daily-report",
    route: "/teacher/daily-report",
    icon: <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-collection" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><DailyReportPage /></ProtectedRoute>,
  },

  {
    type: "route",
    name: "Điểm danh",
    key: "teacher-attendance",
    route: "/teacher/attendance",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-check-bold" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Lịch học",
    key: "teacher-schedule",
    route: "/teacher/schedule",
    icon: <ArgonBox component="i" color="dark" fontSize="14px" className="ni ni-calendar-grid-58" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherSchedule /></ProtectedRoute>,
  },
    {
    type: "route",
    name: "Nhắn tin",
    key: "teacher-chat",
    route: "/teacher/chat",
    icon: <ArgonBox component="i" color="warning" fontSize="14px" className="ni ni-chat-round" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherChat /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Đơn",
    key: "teacher-complaints",
    route: "/teacher/complaints",
    icon: <ArgonBox component="i" color="error" fontSize="14px" className="ni ni-paper-diploma" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherComplaints /></ProtectedRoute>,
  },
  { type: "divider", key: "teacher-divider-1" },
  {
    type: "route",
    name: "Hồ sơ",
    key: "teacher-profile",
    route: "/teacher/profile",
    icon: <ArgonBox component="i" color="secondary" fontSize="14px" className="ni ni-circle-08" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherProfile /></ProtectedRoute>,
  },

];

export default teacherRoutes;
