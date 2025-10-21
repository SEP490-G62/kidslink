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
import { useLocation, Link } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonInput from "components/ArgonInput";

// Argon Dashboard 2 MUI example components
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

// Custom styles for TeacherNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
  teacherSearchBox,
  teacherNotificationBadge,
  teacherProfileAvatar,
} from "examples/Navbars/TeacherNavbar/styles";

// Argon Dashboard 2 MUI context
import {
  useArgonController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";

// Auth context
import { useAuth } from "context/AuthContext";

// Teacher components
import TeacherProfileMenu from "./TeacherProfileMenu";
import TeacherNotificationMenu from "./TeacherNotificationMenu";

// Images
import team2 from "assets/images/team-2.jpg";
import logoSpotify from "assets/images/small-logos/logo-spotify.svg";

function TeacherNavbar({ absolute, light, isMini }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator } = controller;
  const [openMenu, setOpenMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const route = useLocation().pathname.split("/").slice(1);
  const { user, logout } = useAuth();

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
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);
  
  const handleOpenProfileMenu = (event) => {
    setOpenProfileMenu(true);
    setProfileMenuAnchor(event.currentTarget);
  };
  const handleCloseProfileMenu = () => {
    setOpenProfileMenu(false);
    setProfileMenuAnchor(null);
  };

  // Mock data for notifications
  const notifications = [
    {
      id: 1,
      title: "Họp phụ huynh tuần tới",
      message: "Cuộc họp phụ huynh định kỳ sẽ diễn ra vào thứ 6",
      time: "2 giờ trước",
      type: "meeting",
      unread: true
    },
    {
      id: 2,
      title: "Chuyến dã ngoại sắp tới",
      message: "Chuẩn bị cho chuyến dã ngoại đến công viên",
      time: "1 ngày trước",
      type: "trip",
      unread: true
    },
    {
      id: 3,
      title: "Cập nhật quy định mới",
      message: "Nhà trường đã cập nhật quy định về an toàn",
      time: "3 ngày trước",
      type: "policy",
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Render the notifications menu
  const renderNotificationsMenu = () => (
    <TeacherNotificationMenu
      open={Boolean(openMenu)}
      anchorEl={openMenu}
      onClose={handleCloseMenu}
      notifications={notifications}
    />
  );

  // Render the profile menu
  const renderProfileMenu = () => (
    <TeacherProfileMenu
      open={openProfileMenu}
      anchorEl={profileMenuAnchor}
      onClose={handleCloseProfileMenu}
      user={user}
    />
  );

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
            title={route[route.length - 1]}
            route={route}
            light={transparentNavbar ? light : false}
          />
          <Icon fontSize="medium" sx={navbarDesktopMenu} onClick={handleMiniSidenav}>
            {miniSidenav ? "menu_open" : "menu"}
          </Icon>
        </ArgonBox>
        {isMini ? null : (
          <ArgonBox sx={(theme) => navbarRow(theme, { isMini })}>
            {/* Search Box */}
            <ArgonBox pr={1}>
              <ArgonInput
                placeholder="Tìm kiếm học sinh, lớp học..."
                startAdornment={
                  <Icon fontSize="small" style={{ marginRight: "6px" }}>
                    search
                  </Icon>
                }
                sx={teacherSearchBox}
              />
            </ArgonBox>
            
            <ArgonBox color={light ? "white" : "inherit"}>
              {/* Notifications */}
              <IconButton
                size="small"
                color={light && transparentNavbar ? "white" : "dark"}
                sx={[navbarIconButton, teacherNotificationBadge]}
                aria-controls="notification-menu"
                aria-haspopup="true"
                variant="contained"
                onClick={handleOpenMenu}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <Icon>notifications</Icon>
                </Badge>
              </IconButton>
              {renderNotificationsMenu()}

              {/* Settings */}
              <IconButton
                size="small"
                color={light && transparentNavbar ? "white" : "dark"}
                sx={navbarIconButton}
                onClick={handleConfiguratorOpen}
              >
                <Icon>settings</Icon>
              </IconButton>

              {/* Profile Menu */}
              <IconButton
                size="small"
                color={light && transparentNavbar ? "white" : "dark"}
                sx={navbarIconButton}
                onClick={handleOpenProfileMenu}
              >
                <Avatar 
                  src={user?.avatar || team2} 
                  sx={teacherProfileAvatar}
                >
                  {user?.name?.charAt(0) || 'T'}
                </Avatar>
              </IconButton>
              {renderProfileMenu()}

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
};

export default TeacherNavbar;
