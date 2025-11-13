// KidsLink School Admin Routes

import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";
import ClassesPage from "layouts/school-admin/pages/Classes";
import SchoolDashboard from "layouts/school-admin/pages/Dashboard";
import ChildrenPage from "layouts/school-admin/pages/Children";
import ManagePost from "layouts/school-admin/pages/ManagePost";
import ManageAccountPage from "layouts/school-admin/pages/ManageAccount";
import ManageCalendar from "layouts/school-admin/pages/ManageCalendar";
import ManageTuition from "layouts/school-admin/pages/ManageTuition";
import ManageTuitionDetail from "layouts/school-admin/pages/ManageTuition/Detail";
import Profile from "layouts/profile";
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
    name: "Quản lý học phí",
    key: "school-admin-tuition",
    route: "/school-admin/tuition",
    icon: (
      <ArgonBox component="i" color="secondary" fontSize="14px" className="ni ni-money-coins" />
    ),
    component: <ProtectedRoute requiredRoles={["school_admin"]}><ManageTuition /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Chi tiết học phí",
    key: "school-admin-tuition-detail",
    route: "/school-admin/tuition/:feeId",
    noSidenav: true,
    icon: null,
    component: <ProtectedRoute requiredRoles={["school_admin"]}><ManageTuitionDetail /></ProtectedRoute>,
  },
  {
    type: "divider",
    key: "school-admin-divider-1",
  },
  {
    type: "route",
    name: "Thông tin cá nhân",
    key: "school-admin-profile",
    route: "/profile",
    icon: <ArgonBox component="i" color="dark" fontSize="14px" className="ni ni-single-02" />,
    component: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Đăng xuất",
    key: "school-admin-logout",
    route: "/logout",
    icon: <ArgonBox component="i" color="error" fontSize="14px" className="ni ni-user-run" />,
    component: <ProtectedRoute requiredRoles={["school_admin"]}><Logout /></ProtectedRoute>,
  },
];

export default schoolAdminRoutes;
