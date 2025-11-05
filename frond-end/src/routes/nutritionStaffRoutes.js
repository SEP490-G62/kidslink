import NutritionStaffHome from "layouts/nutrition";
import NutritionProfile from "layouts/nutrition/Profile";
import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";

const nutritionStaffRoutes = [
  {
    type: "route",
    name: "Quản lý thực đơn",
    key: "nutrition-dishes",
    route: "/nutrition",
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
  // ...các route khác cho nutrition nếu cần (ví dụ: Profile)
];

export default nutritionStaffRoutes;
