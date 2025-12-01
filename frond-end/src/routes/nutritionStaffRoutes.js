import NutritionStaffHome from "layouts/nutrition";
import NutritionProfile from "layouts/nutrition/Profile";
import NutritionDashboard from "layouts/nutrition/Dashboard";
import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";

const nutritionStaffRoutes = [
  {
    type: "route",
    name: "Bảng thực đơn chung",
    key: "nutrition-dashboard",
    route: "/nutrition/dashboard",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-chart-bar-32" />,
    component: <ProtectedRoute requiredRoles={["nutrition_staff"]}><NutritionDashboard /></ProtectedRoute>
  },
  {
    type: "route",
    name: "Quản lý thực đơn",
    key: "nutrition-dishes",
    route: "/nutrition/dishes",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-basket" />,
    component: <ProtectedRoute requiredRoles={["nutrition_staff"]}><NutritionStaffHome /></ProtectedRoute>
  },
  {
    type: "route",
    name: "Thông tin cá nhân",
    key: "nutrition-profile",
    route: "/nutrition/profile",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-single-02" />,
    component: <ProtectedRoute requiredRoles={["nutrition_staff"]}><NutritionProfile /></ProtectedRoute>
  }
];

export default nutritionStaffRoutes;
