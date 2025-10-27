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
import TeacherStudents from "layouts/teacher/pages/Students/index";
import TeacherReports from "layouts/teacher/pages/Reports/index";
import TeacherAttendance from "layouts/teacher/pages/Attendance/index";
import TeacherSchedule from "layouts/teacher/pages/Schedule/index";
import TeacherProfile from "layouts/teacher/pages/Profile/index";
import TeacherSettings from "layouts/teacher/pages/Settings/index";

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
  {
    type: "route",
    name: "Học sinh",
    key: "teacher-students",
    route: "/teacher/students",
    icon: <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-single-02" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherStudents /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Báo cáo",
    key: "teacher-reports",
    route: "/teacher/reports",
    icon: <ArgonBox component="i" color="warning" fontSize="14px" className="ni ni-chart-bar-32" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherReports /></ProtectedRoute>,
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
  { type: "divider", key: "teacher-divider-1" },
  {
    type: "route",
    name: "Hồ sơ",
    key: "teacher-profile",
    route: "/teacher/profile",
    icon: <ArgonBox component="i" color="secondary" fontSize="14px" className="ni ni-circle-08" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherProfile /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Cài đặt",
    key: "teacher-settings",
    route: "/teacher/settings",
    icon: <ArgonBox component="i" color="text" fontSize="14px" className="ni ni-settings-gear-65" />,
    component: <ProtectedRoute requiredRoles={['teacher']}><TeacherSettings /></ProtectedRoute>,
  },
];

export default teacherRoutes;
