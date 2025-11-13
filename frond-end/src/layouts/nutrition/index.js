import NutritionDishList from "./DishList";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

export default function NutritionStaffHome() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <ArgonTypography variant="h4" fontWeight="bold" mb={3}>
          Quản lý thực đơn - Nutrition Staff
        </ArgonTypography>
        <NutritionDishList />
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

