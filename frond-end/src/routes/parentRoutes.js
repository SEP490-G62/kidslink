/**
=========================================================
* KidsLink Parent Routes - v1.0.0
=========================================================

* Product Page: KidsLink Parent Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// Parent Layouts
import ParentHome from "layouts/parent";
import ParentChildInfo from "layouts/parent/child-info/index";
import ParentDailyReport from "layouts/parent/daily-report/index";
import ParentClassCalendar from "layouts/parent/class-calendar/index";
import ParentMenu from "layouts/parent/menu/index";
import ParentFeePayment from "layouts/parent/fee-payment/index";
import ParentPersonalInfo from "layouts/parent/personal-info/index";
import ParentComplaintsFeedback from "layouts/parent/complaints-feedback/index";
import ParentChat from "layouts/parent/chat/index";

// Logout component
import { useEffect } from "react";
import { useAuth } from "context/AuthContext";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      await logout();
      navigate("/authentication/sign-in");
    };
    handleLogout();
  }, [logout, navigate]);

  return null;
};

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "components/ProtectedRoute";

const parentRoutes = [
  {
    type: "route",
    name: "Trang chủ",
    key: "parent-home",
    route: "/parent",
    icon: <ArgonBox component="i" color="primary" fontSize="14px" className="ni ni-tv-2" />,
    component: <ProtectedRoute requiredRoles={['parent']}><ParentHome /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Báo cáo hàng ngày",
    key: "parent-daily-report",
    route: "/parent/daily-report",
    icon: <ArgonBox component="i" color="warning" fontSize="14px" className="ni ni-paper-diploma" />,
    component: <ProtectedRoute requiredRoles={['parent']}><ParentDailyReport /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Lịch lớp học",
    key: "parent-class-calendar",
    route: "/parent/class-calendar",
    icon: <ArgonBox component="i" color="dark" fontSize="14px" className="ni ni-calendar-grid-58" />,
    component: <ProtectedRoute requiredRoles={['parent']}><ParentClassCalendar /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Thực đơn",
    key: "parent-menu",
    route: "/parent/menu",
    icon: <ArgonBox component="i" color="secondary" fontSize="14px" className="ni ni-archive-2" />,
    component: <ProtectedRoute requiredRoles={['parent']}><ParentMenu /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Thông tin con",
    key: "parent-child-info",
    route: "/parent/child-info",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-circle-08" />,
    component: <ProtectedRoute requiredRoles={['parent']}><ParentChildInfo /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Phí",
    key: "parent-fee-payment",
    route: "/parent/fee-payment",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-credit-card" />,
    component: <ProtectedRoute requiredRoles={['parent']}><ParentFeePayment /></ProtectedRoute>,
  },
  {
    type: "divider",
    key: "parent-divider-1"
  },
  {
    type: "route",
    name: "Thông tin cá nhân",
    key: "parent-personal-info",
    route: "/parent/personal-info",
    icon: <ArgonBox component="i" color="text" fontSize="14px" className="ni ni-single-02" />,
    component: <ProtectedRoute requiredRoles={['parent']}><ParentPersonalInfo /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Khiếu nại & Góp ý",
    key: "parent-complaints-feedback",
    route: "/parent/complaints-feedback",
    icon: <ArgonBox component="i" color="error" fontSize="14px" className="ni ni-chat-round" />,
    component: <ProtectedRoute requiredRoles={['parent']}><ParentComplaintsFeedback /></ProtectedRoute>,
  },
  {
    type: "route",
    name: "Tin nhắn",
    key: "parent-chat",
    route: "/parent/chat",
    icon: <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-chat-round" />,
    component: <ProtectedRoute requiredRoles={['parent']}><ParentChat /></ProtectedRoute>,
  },

];

export default parentRoutes;
