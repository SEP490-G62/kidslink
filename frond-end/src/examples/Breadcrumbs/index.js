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

// react-router-dom components
import { Link } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import { Breadcrumbs as MuiBreadcrumbs } from "@mui/material";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

function Breadcrumbs({ icon, title, route, light }) {
  const routes = route.slice(0, -1);

  // Mapping từ tiếng Anh sang tiếng Việt
  const translateRoute = (routeName) => {
    const translations = {
      'parent': 'Phụ huynh',
      'teacher': 'Giáo viên',
      'admin': 'Quản trị viên',
      'school': 'Trường học',
      'dashboard': 'Trang chủ',
      'posts': 'Bài viết',
      'daily-report': 'Báo cáo hàng ngày',
      'class-calendar': 'Lịch lớp học',
      'menu': 'Thực đơn',
      'child-info': 'Thông tin con',
      'fee-payment': 'Học phí',
      'personal-info': 'Thông tin cá nhân',
      'complaints-feedback': 'Khiếu nại & Góp ý',
      'chat': 'Tin nhắn',
      'authentication': 'Xác thực',
      'sign-in': 'Đăng nhập',
      'sign-up': 'Đăng ký',
      'profile': 'Hồ sơ',
      'settings': 'Cài đặt',
      'notifications': 'Thông báo',
      'help': 'Trợ giúp',
      'logout': 'Đăng xuất',
      'school-admin': 'Quản trị viên trường',
      'classes': 'Lớp học',
      'children': 'Học sinh',
      'calendar': 'Lịch học',
      'posts': 'Bài viết',
      'fees': 'Học phí',
      'accounts': 'Tài khoản',
      'complaints': 'Khiếu nại & Góp ý',
      'school-info': 'Thông tin trường',
      'profile': 'Hồ sơ',
      'settings': 'Cài đặt',
      'notifications': 'Thông báo',
      'help': 'Trợ giúp',
      'logout': 'Đăng xuất',
      'school-admin': 'Quản trị viên trường',
      'attendance': 'Điểm danh',
      'fees': 'Phí',
      'school-info': 'Thông tin trường',
      'complaints': 'Đơn',
      'calendar': 'Thời khóa biểu',
      'dishes': 'Thực đơn',

    };
    
    return translations[routeName] || routeName;
  };

  const translateTitle = (titleName) => {
    const titleTranslations = {
      'parent': 'Phụ huynh',
      'teacher': 'Giáo viên', 
      'admin': 'Quản trị viên',
      'school': 'Trường học',
      'dashboard': 'Trang chủ',
      'posts': 'Bài viết',
      'daily-report': 'Báo cáo hàng ngày',
      'class-calendar': 'Lịch lớp học',
      'menu': 'Thực đơn',
      'child-info': 'Thông tin con',
      'fee-payment': 'Học phí',
      'personal-info': 'Thông tin cá nhân',
      'complaints-feedback': 'Khiếu nại & Góp ý',
      'chat': 'Tin nhắn',
      'authentication': 'Xác thực',
      'sign-in': 'Đăng nhập',
      'sign-up': 'Đăng ký',
      'profile': 'Hồ sơ',
      'settings': 'Cài đặt',
      'notifications': 'Thông báo',
      'help': 'Trợ giúp',
      'logout': 'Đăng xuất',
      'attendance': 'Điểm danh',
      'classes': 'Lớp học',
      'schedule': 'Lịch học',
      'school-admin': 'Quản trị viên trường',
      'fees': 'Phí',
      'school-info': 'Thông tin trường',
      'complaints': 'Đơn',
      'accounts': 'Tài khoản',
      'children': 'Học sinh',
      'students': 'Học sinh',
      'schools': 'Trường học',
      'calendar': 'Thời khóa biểu',
      'dishes': 'Thực đơn',

    };
    
    return titleTranslations[titleName] || titleName.replace("-", " ");
  };

  return (
    <ArgonBox mr={{ xs: 0, xl: 8 }}>
      <MuiBreadcrumbs
        sx={{
          "& .MuiBreadcrumbs-separator": {
            color: ({ palette: { white, grey } }) => (light ? white.main : grey[600]),
          },
        }}
      >
        <Link to="/">
          <ArgonTypography
            component="span"
            variant="body2"
            color={light ? "white" : "dark"}
            opacity={light ? 0.8 : 0.5}
            sx={{ lineHeight: 0 }}
          >
            <Icon>{icon}</Icon>
          </ArgonTypography>
        </Link>
        {routes.map((el) => (
          <Link to={`/${el}`} key={el}>
            <ArgonTypography
              component="span"
              variant="button"
              fontWeight="regular"
              textTransform="capitalize"
              color={light ? "white" : "dark"}
              opacity={light ? 0.8 : 0.5}
              sx={{ lineHeight: 0 }}
            >
              {translateRoute(el)}
            </ArgonTypography>
          </Link>
        ))}
        {title ? (
          <ArgonTypography
            variant="button"
            fontWeight="regular"
            textTransform="capitalize"
            color={light ? "white" : "dark"}
            sx={{ lineHeight: 0 }}
          >
            {translateTitle(title)}
          </ArgonTypography>
        ) : null}
      </MuiBreadcrumbs>
      {title ? (
        <ArgonTypography
          fontWeight="bold"
          textTransform="capitalize"
          variant="h6"
          color={light ? "white" : "dark"}
          noWrap
        >
          {translateTitle(title)}
        </ArgonTypography>
      ) : null}
    </ArgonBox>
  );
}

// Setting default values for the props of Breadcrumbs
Breadcrumbs.defaultProps = {
  light: false,
};

// Typechecking props for the Breadcrumbs
Breadcrumbs.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  route: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
  light: PropTypes.bool,
};

export default Breadcrumbs;
