import HealthCareStaffHome from "layouts/health-care";
import HealthCareProfile from "layouts/health-care/Profile";
import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";

const healthCareStaffRoutes = [
  {
    type: "route",
    name: "Sức khoẻ trường",
    key: "health-care-home",
    route: "/health-care",
    icon: <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-favourite-28" />,
    component: <ProtectedRoute requiredRoles={['health_care_staff']}><HealthCareStaffHome /></ProtectedRoute>
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
