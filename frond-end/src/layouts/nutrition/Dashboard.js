import ArgonBox from "components/ArgonBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";
import SchedulePlanner from "./SchedulePlanner";

export default function NutritionDashboard() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <SchedulePlanner />
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

