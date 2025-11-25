// KidsLink System Admin Routes

import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";
import AdminDashboard from "layouts/admin/pages/Dashboard";
import ManageSchools from "layouts/admin/pages/ManageSchools";
import Profile from "layouts/profile";



const adminRoutes = [
  {
    type: "route",
    name: "Tổng quan",
    key: "admin-dashboard",
    route: "/admin",
    icon: (
      <ArgonBox component="i" color="primary" fontSize="14px" className="ni ni-chart-bar-32" />
    ),
    component: <ProtectedRoute requiredRoles={["admin"]}><AdminDashboard /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Quản lý trường học",
    key: "admin-manage-schools",
    route: "/admin/schools",
    icon: (
      <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-building" />
    ),
    component: <ProtectedRoute requiredRoles={["admin"]}><ManageSchools /></ProtectedRoute>,
  },


];

export default adminRoutes;
