// KidsLink School Admin Routes

import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";
import ClassesPage from "layouts/school-admin/pages/Classes";
import SchoolDashboard from "layouts/school-admin/pages/Dashboard";
import ChildrenPage from "layouts/school-admin/pages/Children";
import ManagePost from "layouts/school-admin/pages/ManagePost";
import ManageAccountPage from "layouts/school-admin/pages/ManageAccount";

const schoolAdminRoutes = [
  {
    type: "route",
    name: "Tổng quan",
    key: "school-dashboard",
    route: "/school-admin/dashboard",
    icon: (
      <ArgonBox component="i" color="primary" fontSize="14px" className="ni ni-chart-bar-32" />
    ),
    component: <ProtectedRoute requiredRoles={["school_admin"]}><SchoolDashboard /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Quản lý lớp học",
    key: "manage-classes",
    route: "/school-admin/classes",
    icon: (
      <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-bullet-list-67" />
    ),
    component: <ProtectedRoute requiredRoles={["school_admin"]}><ClassesPage /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Quản lý học sinh",
    key: "manage-children",
    route: "/school-admin/children",
    icon: (
      <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-single-02" />
    ),
    component: <ProtectedRoute requiredRoles={["school_admin"]}><ChildrenPage /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Quản lý bài đăng",
    key: "manage-posts",
    route: "/school-admin/posts",
    icon: (
      <ArgonBox component="i" color="warning" fontSize="14px" className="ni ni-notification-70" />
    ),
    component: <ProtectedRoute requiredRoles={["school_admin"]}><ManagePost /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Quản lý tài khoản",
    key: "manage-accounts",
    route: "/school-admin/accounts",
    icon: (
      <ArgonBox component="i" color="primary" fontSize="14px" className="ni ni-single-02" />
    ),
    component: <ProtectedRoute requiredRoles={["school_admin"]}><ManageAccountPage /></ProtectedRoute>,
  },
];

export default schoolAdminRoutes;
