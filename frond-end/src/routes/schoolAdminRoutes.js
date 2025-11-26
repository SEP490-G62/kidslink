// KidsLink School Admin Routes

import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";
import ClassesPage from "layouts/school-admin/pages/Classes";
import ClassDetail from "layouts/school-admin/pages/Classes/ClassDetail";
import SchoolDashboard from "layouts/school-admin/pages/Dashboard";
import ChildrenPage from "layouts/school-admin/pages/Children";
import ManagePost from "layouts/school-admin/pages/ManagePost";
import ManageAccountPage from "layouts/school-admin/pages/ManageAccount";
import ManageCalendar from "layouts/school-admin/pages/ManageCalendar";
import ManageFees from "layouts/school-admin/pages/ManageFees";
import FeeDetail from "layouts/school-admin/pages/ManageFees/FeeDetail";
import SchoolInfo from "layouts/school-admin/pages/SchoolInfo";
import Profile from "layouts/profile";
import ManageComplaints from "layouts/school-admin/pages/ManageComplaints";

import { useEffect } from "react";
import { useAuth } from "context/AuthContext";
import { useNavigate } from "react-router-dom";

// Inline Logout component for admin sidenav
const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const doLogout = async () => {
      await logout();
      navigate("/authentication/sign-in");
    };
    doLogout();
  }, [logout, navigate]);
  return null;
};

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
    type: "hidden",
    name: "Chi tiết lớp học",
    key: "class-detail",
    route: "/school-admin/classes/:id",
    component: <ProtectedRoute requiredRoles={["school_admin"]}><ClassDetail /></ProtectedRoute>,
    hideFromSidenav: true,
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
    name: "Quản lý lịch học",
    key: "manage-calendar",
    route: "/school-admin/calendar",
    icon: (
      <ArgonBox component="i" color="error" fontSize="14px" className="ni ni-calendar-grid-58" />
    ),
    component: <ProtectedRoute requiredRoles={["school_admin"]}><ManageCalendar /></ProtectedRoute>,
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
    name: "Quản lý phí",
    key: "manage-fees",
    route: "/school-admin/fees",
    icon: (
      <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-money-coins" />
    ),
    component: <ProtectedRoute requiredRoles={["school_admin"]}><ManageFees /></ProtectedRoute>,
  },

  {
    type: "hidden",
    name: "Chi tiết phí",
    key: "fee-detail",
    route: "/school-admin/fees/:id",
    component: <ProtectedRoute requiredRoles={["school_admin"]}><FeeDetail /></ProtectedRoute>,
    // Hidden from sidenav
    hideFromSidenav: true,
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
  {
    type: "route",
    name: "Quản lý đơn",
    key: "manage-complaints",
    route: "/school-admin/complaints",
    icon: (
      <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-paper-diploma" />
    ),
    component: <ProtectedRoute requiredRoles={["school_admin"]}><ManageComplaints /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Thông tin trường học",
    key: "school-info",
    route: "/school-admin/school-info",
    icon: (
      <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-settings-gear-65" />
    ),
    component: <ProtectedRoute requiredRoles={["school_admin"]}><SchoolInfo /></ProtectedRoute>,
  },

  {
    type: "divider",
    key: "school-admin-divider-1",
  },
  {
    type: "route",
    name: "Thông tin cá nhân",
    key: "school-admin-profile",
    route: "/school-admin/profile",
    icon: <ArgonBox component="i" color="dark" fontSize="14px" className="ni ni-single-02" />,
    component: <ProtectedRoute requiredRoles={["school_admin"]}><Profile /></ProtectedRoute>,
  },

];

export default schoolAdminRoutes;
