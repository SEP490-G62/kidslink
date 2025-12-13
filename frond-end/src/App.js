import { useState, useEffect, useMemo } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
// Removed: Icon (Configurator button removed)

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";

// Argon Dashboard 2 MUI example components
import Sidenav from "examples/Sidenav";
import ParentSidenav from "examples/Sidenav/parent";

// Argon Dashboard 2 MUI themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Argon Dashboard 2 MUI routes
import routes from "routes";
import healthCareStaffRoutes from "routes/healthCareStaffRoutes";
import nutritionStaffRoutes from "routes/nutritionStaffRoutes";
import teacherRoutes from "routes/teacherRoutes";
import parentRoutes from "routes/parentRoutes";
import schoolAdminRoutes from "routes/schoolAdminRoutes";
import adminRoutes from "routes/adminRoutes";
// Argon Dashboard 2 MUI contexts
import { useArgonController, setMiniSidenav } from "context";
import { AuthProvider } from "context/AuthContext";
import messagingService from "services/messagingService";
import apiService from "services/api";

// Images
import brand from "assets/images/kll3.png";
import brandDark from "assets/images/kll3.png";

// Icon Fonts
import "assets/css/nucleo-icons.css";
import "assets/css/nucleo-svg.css";

const CLASS_DEPENDENT_TEACHER_ROUTE_KEYS = new Set([
  "teacher-daily-report",
  "teacher-attendance",
  "teacher-chat",
]);

const teacherRoutesWithoutLatestYearFeatures = teacherRoutes.filter(
  (route) => !CLASS_DEPENDENT_TEACHER_ROUTE_KEYS.has(route.key)
);

export default function App() {
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, direction, layout, sidenavColor, darkSidenav, darkMode } =
    controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const [teacherNavRoutes, setTeacherNavRoutes] = useState(teacherRoutes);
  const { pathname } = useLocation();
  const isTeacherPath = pathname.startsWith("/teacher");
  const isParentPath = pathname.startsWith("/parent");
  const isHealthCareStaffPath = pathname.startsWith("/health-care");
  const isNutritionStaffPath = pathname.startsWith("/nutrition");
  const isSchoolAdminPath = pathname.startsWith("/school-admin");
  const isAdminPath = pathname.startsWith("/admin");
  // Determine role from localStorage to support role-based sidenav
  let userRole = null;
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      userRole = JSON.parse(storedUser)?.role || null;
    }
  } catch (e) {
    userRole = null;
  }

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Removed Configurator feature

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  // Fetch unread count on app load so Sidenav badge hiển thị ngay
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await messagingService.getUnreadCount();
        if (res && res.success && res.data) {
          // Đếm số conversation có tin nhắn chưa đọc thay vì tổng số tin nhắn
          const byConversation = Array.isArray(res.data.byConversation) ? res.data.byConversation : [];
          const conversationCount = byConversation.length;
          localStorage.setItem('kidslink:unread_total', String(conversationCount));
          window.dispatchEvent(new CustomEvent('kidslink:unread_total', { detail: { total: conversationCount } }));
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const determineTeacherRoutes = async () => {
      if (userRole !== "teacher") {
        if (!cancelled) {
          setTeacherNavRoutes(teacherRoutes);
        }
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        if (!cancelled) {
          setTeacherNavRoutes(teacherRoutes);
        }
        return;
      }

      try {
        const response = await apiService.get("/teachers/class");
        const hasLatestAcademicYearClass = response?.metadata?.has_latest_academic_year_class;
        if (!cancelled) {
          setTeacherNavRoutes(
            hasLatestAcademicYearClass === false
              ? teacherRoutesWithoutLatestYearFeatures
              : teacherRoutes
          );
        }
      } catch (error) {
        console.error("Không thể kiểm tra quyền teacher:", error);
        if (!cancelled) {
          setTeacherNavRoutes(teacherRoutes);
        }
      }
    };

    determineTeacherRoutes();

    return () => {
      cancelled = true;
    };
  }, [userRole]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        // Use exact only if route doesn't contain :id or other params
        const hasParams = route.route.includes(':');
        return <Route exact={!hasParams} path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });

  // Nếu role là admin, luôn dùng adminRoutes
  const activeRoutes = userRole === "admin"
    ? adminRoutes
    : isTeacherPath
    ? teacherNavRoutes
    : isParentPath
    ? parentRoutes
    : isHealthCareStaffPath
    ? healthCareStaffRoutes
    : isNutritionStaffPath 
    ? nutritionStaffRoutes
    : isSchoolAdminPath
    ? schoolAdminRoutes
    : isAdminPath
    ? adminRoutes
    : routes;

  // Ensure sidenav is not in mini overlay mode on desktop
  useEffect(() => {
    setMiniSidenav(dispatch, window.innerWidth < 1200 ? true : false);
  }, [dispatch]);

  // Keep root "/" as public Landing regardless of role
  const SidenavComponent = isParentPath ? ParentSidenav : Sidenav;

  // Removed floating configurator button

  return (
    <AuthProvider>
      {direction === "rtl" ? (
        <CacheProvider value={rtlCache}>
          <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
            <CssBaseline />
            {layout === "dashboard" && (
              <>
                <SidenavComponent
                  color={sidenavColor}
                  brand={darkSidenav || darkMode ? brand : brandDark}
                  brandName="KidsLink"
                  routes={activeRoutes}
                  onMouseEnter={handleOnMouseEnter}
                  onMouseLeave={handleOnMouseLeave}
                />
                {/* Configurator removed */}
              </>
            )}
            {layout === "vr" && null}
            <Routes>
              {getRoutes(activeRoutes)}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ThemeProvider>
        </CacheProvider>
      ) : (
        <ThemeProvider theme={darkMode ? themeDark : theme}>
          <CssBaseline />
          {layout === "dashboard" && (
            <>
              <SidenavComponent
                color={sidenavColor}
                brand={darkSidenav || darkMode ? brand : brandDark}
                brandName="KidsLink"
                routes={activeRoutes}
                onMouseEnter={handleOnMouseEnter}
                onMouseLeave={handleOnMouseLeave}
              />
              {/* Configurator removed */}
            </>
          )}
          {layout === "vr" && null}
          <Routes>
            {getRoutes(activeRoutes)}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ThemeProvider>
      )}
    </AuthProvider>
  );
}