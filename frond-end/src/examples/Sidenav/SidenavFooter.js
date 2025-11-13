/**
=========================================================
* Argon Dashboard 2 MUI - v3.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-material-ui
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonButton from "components/ArgonButton";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI context
import { useArgonController } from "context";

// Auth context
import { useAuth } from "context/AuthContext";

// React Router
import { useNavigate } from "react-router-dom";

// Images
import icon from "assets/images/illustrations/icon-documentation.svg";

function SidenavFooter() {
  const [controller] = useArgonController();
  const { miniSidenav, darkSidenav } = controller;
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Gọi hàm logout từ AuthContext để xóa token và dữ liệu
      await logout();
      // Chuyển về trang đăng nhập
      navigate("/authentication/sign-in");
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      // Ngay cả khi có lỗi, vẫn chuyển về trang đăng nhập
      navigate("/authentication/sign-in");
    }

  };

  return (
    <ArgonBox opacity={miniSidenav ? 0 : 1} sx={{ transition: "opacity 200ms linear" }}>
      <ArgonBox display="flex" flexDirection="column">
        <ArgonButton
          color="error"
          size="small"
          fullWidth
          onClick={handleLogout}
          startIcon={<Icon>logout</Icon>}
        >
          Đăng xuất
        </ArgonButton>
      </ArgonBox>
    </ArgonBox>
  );
}

export default SidenavFooter;
