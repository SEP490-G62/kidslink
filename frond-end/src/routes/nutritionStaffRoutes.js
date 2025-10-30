import NutritionDishList from "layouts/nutrition/DishList";
import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";

const nutritionStaffRoutes = [
  {
    type: "route",
    name: "Quản lý món ăn",
    key: "nutrition-dishes",
    route: "/nutrition/dishes",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-basket" />,
    component: <ProtectedRoute requiredRoles={["nutrition_staff"]}><NutritionDishList /></ProtectedRoute>
  }
  // ...các route khác cho nutrition nếu cần
];

export default nutritionStaffRoutes;
