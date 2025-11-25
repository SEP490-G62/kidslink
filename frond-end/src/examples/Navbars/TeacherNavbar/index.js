/**
=========================================================
* KidsLink Teacher Navbar - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";

// react-router components
import { useLocation } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Avatar from "@mui/material/Avatar";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import Breadcrumbs from "examples/Breadcrumbs";

// Custom styles for TeacherNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarDesktopMenu,
  navbarMobileMenu,
  teacherProfileAvatar,
} from "examples/Navbars/TeacherNavbar/styles";

// Argon Dashboard 2 MUI context
import {
  useArgonController,
  setTransparentNavbar,
  setMiniSidenav,
} from "context";

// Auth context
import { useAuth } from "context/AuthContext";

// Images
import team2 from "assets/images/team-2.jpg";

function TeacherNavbar({ absolute, light, isMini, breadcrumbOverride }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, transparentNavbar, fixedNavbar } = controller;
  const location = useLocation();
  const route = location.pathname.split("/").slice(1);
  const last = route[route.length - 1];
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(last || "");
  const computedTitle = location.state?.title || (isMongoId ? "" : last);
  
  // Allow overriding breadcrumbs (route and title) from specific pages
  const effectiveRoute = breadcrumbOverride?.route || route;
  const effectiveTitle = breadcrumbOverride?.title ?? computedTitle;
  const { user } = useAuth();

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /** 
     The event listener that's calling the handleTransparentNavbar function when 
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme, { navbarType })}>
        <ArgonBox
          color={light && transparentNavbar ? "white" : "dark"}
          mb={{ xs: 1, md: 0 }}
          sx={(theme) => navbarRow(theme, { isMini })}
        >
          <Breadcrumbs
            icon="home"
            title={effectiveTitle}
            route={effectiveRoute}
            light={transparentNavbar ? light : false}
          />
          <Icon fontSize="medium" sx={navbarDesktopMenu} onClick={handleMiniSidenav}>
            {miniSidenav ? "menu_open" : "menu"}
          </Icon>
        </ArgonBox>
        {isMini ? null : (
          <ArgonBox sx={(theme) => navbarRow(theme, { isMini })}>
            <ArgonBox 
              color={light && transparentNavbar ? "white" : "dark"}
              display="flex"
              alignItems="center"
              gap={1.5}
            >
              {/* Teacher Info */}
              <ArgonBox display="flex" alignItems="center" gap={1}>
                <Avatar 
                  src={user?.avatar_url || team2} 
                  sx={teacherProfileAvatar}
                >
                  {user?.full_name?.charAt(0) || 'T'}
                </Avatar>
                <ArgonTypography
                  variant="button"
                  fontWeight="medium"
                  color={light && transparentNavbar ? "white" : "dark"}
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  {user?.full_name || "Giáo viên"}
                </ArgonTypography>
              </ArgonBox>

              {/* Mobile Menu */}
              <IconButton
                size="small"
                color={light && transparentNavbar ? "white" : "dark"}
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon>{miniSidenav ? "menu_open" : "menu"}</Icon>
              </IconButton>
            </ArgonBox>
          </ArgonBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Setting default values for the props of TeacherNavbar
TeacherNavbar.defaultProps = {
  absolute: false,
  light: true,
  isMini: false,
};

// Typechecking props for the TeacherNavbar
TeacherNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
  breadcrumbOverride: PropTypes.shape({
    route: PropTypes.array,
    title: PropTypes.string,
  }),
};

export default TeacherNavbar;
