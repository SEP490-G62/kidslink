// KidsLink School Admin Routes

import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";
import ClassesPage from "layouts/school-admin/pages/Classes";
import ChildrenPage from "layouts/school-admin/pages/Children";
import ManagePost from "layouts/school-admin/pages/ManagePost";

const schoolAdminRoutes = [
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
];

export default schoolAdminRoutes;
