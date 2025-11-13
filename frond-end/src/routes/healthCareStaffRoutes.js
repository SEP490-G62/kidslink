import HealthCareStaffHome from "layouts/health-care";
import HealthCareProfile from "layouts/health-care/Profile";
import ClassesList from "layouts/health-care/pages/ClassesList";
import StudentsByClass from "layouts/health-care/pages/StudentsByClass";
import StudentRecords from "layouts/health-care/pages/StudentRecords";
import StudentNotices from "layouts/health-care/pages/StudentNotices";
import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";

const healthCareStaffRoutes = [
  // Option 1: Feature pages
  {
    type: "route",
    name: "Danh sách lớp",
    key: "health-care-classes",
    route: "/health-care",
    icon: <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-bullet-list-67" />,
    component: <ProtectedRoute requiredRoles={['health_care_staff']}><ClassesList /></ProtectedRoute>
  },
  {
    type: "hidden",
    name: "Học sinh theo lớp",
    key: "health-care-students-by-class",
    route: "/health-care/classes/:classId/students",
    icon: <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-hat-3" />,
    component: <ProtectedRoute requiredRoles={['health_care_staff']}><StudentsByClass /></ProtectedRoute>
  },
  {
    type: "hidden",
    name: "Sổ sức khoẻ học sinh",
    key: "health-care-student-records",
    route: "/health-care/students/:studentId/records",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-collection" />,
    component: <ProtectedRoute requiredRoles={['health_care_staff']}><StudentRecords /></ProtectedRoute>
  },
  {
    type: "hidden",
    name: "Thông báo y tế học sinh",
    key: "health-care-student-notices",
    route: "/health-care/students/:studentId/notices",
    icon: <ArgonBox component="i" color="danger" fontSize="14px" className="ni ni-notification-70" />,
    component: <ProtectedRoute requiredRoles={['health_care_staff']}><StudentNotices /></ProtectedRoute>
  },
  {
    type: "route",
    name: "Thông tin cá nhân",
    key: "health-care-profile",
    route: "/health-care/profile",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-single-02" />,
    component: <ProtectedRoute requiredRoles={['health_care_staff']}><HealthCareProfile /></ProtectedRoute>
  }
];

export default healthCareStaffRoutes;
