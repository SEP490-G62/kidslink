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

import { useState, useEffect, useMemo } from "react";

// react-router components
import { Link, useLocation } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Custom styles for DashboardNavbar
import { navbar, navbarContainer, navbarIconButton, navbarDesktopMenu } from "examples/Navbars/DashboardNavbar/styles";

// Argon Dashboard 2 MUI context
import { useArgonController, setTransparentNavbar, setMiniSidenav } from "context";

// Auth context
import { useAuth } from "context/AuthContext";

// Breadcrumbs component
import Breadcrumbs from "examples/Breadcrumbs/parent";

// Services
import parentService from "services/parentService";

// Images
import team2 from "assets/images/team-2.jpg";

function DashboardNavbar({ absolute, light }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useArgonController();
  const { transparentNavbar, fixedNavbar, miniSidenav } = controller;
  const { user, selectedChild, setSelectedChild } = useAuth();
  const location = useLocation();
  const [children, setChildren] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  // Get current route for breadcrumbs with custom names for health-care
  const getCurrentRoute = () => {
    const pathname = location.pathname;
    if (pathname === "/") return { route: ["parent"], title: "dashboard", icon: "dashboard" };
    
    const routes = pathname.split("/").filter(Boolean);
    const title = routes[routes.length - 1] || "dashboard";
    
    // Custom breadcrumb for health-care routes
    if (routes[0] === "health-care") {
      const customRoutes = ["health-care"];
      const state = location.state || {};
      
      // Pattern: /health-care/classes/:classId/students
      if (routes[1] === "classes" && routes.length >= 3) {
        // Use class name from state or keep ID
        if (state.classInfo?.class_name) {
          customRoutes.push(state.classInfo.class_name);
        } else {
          customRoutes.push(routes[2]); // classId
        }
        // Add "students" if present
        if (routes[3] === "students") {
          customRoutes.push("students");
        }
      }
      // Pattern: /health-care/students/:studentId/records or /health-care/students/:studentId/notices
      else if (routes[1] === "students" && routes.length >= 3) {
        // Add class name if available (from state)
        if (state.classInfo?.class_name) {
          customRoutes.push(state.classInfo.class_name);
        }
        // Use student name from state or keep ID
        if (state.student?.full_name) {
          customRoutes.push(state.student.full_name);
        } else {
          customRoutes.push(routes[2]); // studentId
        }
        // Add records/notices
        if (routes[3] === "records" || routes[3] === "notices") {
          customRoutes.push(routes[3]);
        }
      }
      // Pattern: /health-care (home page)
      else if (routes.length === 1) {
        // Just health-care, no additional routes
      }
      
      return {
        route: customRoutes,
        title,
        icon: "home"
      };
    }
    
    return {
      route: routes,
      title,
      icon: "home"
    };
  };

  const { route, title, icon } = useMemo(() => getCurrentRoute(), [location.pathname, location.state]);

  // Fetch children when user is logged in
  useEffect(() => {
    const fetchChildren = async () => {
      if (user && user.role === 'parent') {
        try {
          const result = await parentService.getChildren();
          if (result.success && result.data) {
            setChildren(result.data);
            // Set default child (oldest child) if not already set or if current selectedChild is not in the new children list
            if (result.data.length > 0) {
              const isCurrentChildValid = selectedChild && result.data.some(child => child._id === selectedChild._id);
              if (!selectedChild || !isCurrentChildValid) {
                setSelectedChild(result.data[0]);
              }
            } else {
              setSelectedChild(null);
            }
          }
        } catch (error) {
          console.error('Error fetching children:', error);
        }
      } else {
        // Clear children and selectedChild when user is not a parent or not logged in
        setChildren([]);
        setSelectedChild(null);
      }
    };
    
    fetchChildren();
  }, [user, setSelectedChild]); // Only depend on user, not selectedChild

  // Clear selected child when user changes (for example, logout or switch user)
  useEffect(() => {
    if (!user && selectedChild) {
      setSelectedChild(null);
    }
  }, [user, selectedChild, setSelectedChild]);

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

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    handleMenuClose();
  };

  const handleMiniSidenav = () => {
    setMiniSidenav(dispatch, !miniSidenav);
  };

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme, { navbarType })}>
        <ArgonBox sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          {/* Menu button and Breadcrumbs on the left */}
          <ArgonBox sx={{ display: "flex", alignItems: "center", flex: 1 }}>
            <Breadcrumbs 
              icon={icon}
              title={title}
              route={route}
              light={light && transparentNavbar}
            />
            <Icon 
              fontSize="medium" 
              sx={{
                ...navbarDesktopMenu,
                color: 'white !important'
              }} 
              onClick={handleMiniSidenav}
            >
              {miniSidenav ? "menu_open" : "menu"}
            </Icon>
          </ArgonBox>

          {/* Children Dropdown - Show only if user has children */}
          {children.length > 0 && selectedChild && (
            <ArgonBox sx={{ display: "flex", alignItems: "center", gap: 1, mr: 2 }}>
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: 'rgba(94, 114, 228, 0.08)',
                  minWidth: 'auto',
                  width: 'auto',
                  maxWidth: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(94, 114, 228, 0.15)'
                  }
                }}
              >
                <Avatar 
                  src={selectedChild.avatar_url} 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    border: '2px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  {selectedChild.full_name?.charAt(0)}
                </Avatar>
                <ArgonBox sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  minWidth: 0,
                  flex: 1
                }}>
                  <ArgonTypography 
                    variant="button" 
                    fontWeight="bold" 
                    color="dark" 
                    sx={{ 
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%'
                    }}
                  >
                    {selectedChild.full_name}
                  </ArgonTypography>
                  {selectedChild.class && (
                    <Chip 
                      label={selectedChild.class.class_name}
                      size="small"
                      sx={{ 
                        height: 18,
                        fontSize: '10px',
                        fontWeight: 'bold',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        maxWidth: '100%',
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }
                      }}
                    />
                  )}
                </ArgonBox>
                <Icon sx={{ color: 'dark.main', flexShrink: 0 }}>
                  <i className="ni ni-bold-down" />
                </Icon>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    minWidth: 280,
                    mt: 1,
                    borderRadius: 2,
                    boxShadow: 4
                  }
                }}
              >
                <ArgonBox px={2} py={1}>
                  <ArgonTypography variant="caption" fontWeight="bold" color="dark">
                    Chọn con để xem thông tin
                  </ArgonTypography>
                </ArgonBox>
                <Divider />
                {children.map((child) => (
                  <MenuItem 
                    key={child._id}
                    onClick={() => handleChildSelect(child)}
                    selected={selectedChild._id === child._id}
                    sx={{
                      py: 2,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(94, 114, 228, 0.08)',
                        '&:hover': {
                          backgroundColor: 'rgba(94, 114, 228, 0.15)'
                        }
                      }
                    }}
                  >
                    <Avatar 
                      src={child.avatar_url} 
                      sx={{ 
                        width: 40, 
                        height: 40,
                        mr: 2
                      }}
                    >
                      {child.full_name?.charAt(0)}
                    </Avatar>
                    <ArgonBox flex={1}>
                      <ArgonTypography variant="button" fontWeight="bold" color="dark">
                        {child.full_name}
                      </ArgonTypography>
                      <ArgonBox display="flex" gap={1} mt={0.5}>
                        {child.class ? (
                          <Chip 
                            label={child.class.class_name}
                            size="small"
                            color="primary"
                            sx={{ 
                              height: 20,
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}
                          />
                        ) : (
                          <ArgonTypography variant="caption" color="text">
                            Chưa có lớp
                          </ArgonTypography>
                        )}
                      </ArgonBox>
                    </ArgonBox>
                    {selectedChild._id === child._id && (
                      <Icon sx={{ color: 'primary.main' }}>
                        <i className="ni ni-check-bold" />
                      </Icon>
                    )}
                  </MenuItem>
                ))}
              </Menu>
            </ArgonBox>
          )}

          {/* User info on the right */}
          <ArgonBox sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {user ? (
              // Hiển thị avatar và tên nếu đã đăng nhập
              <>
                <Avatar 
                src={user.avatar_url || team2}
                sx={{ width: 32, height: 32 }}
              >
                {user.full_name?.charAt(0) || 'P'}
              </Avatar>
              <ArgonTypography
                variant="button"
                fontWeight="medium"
                color={light && transparentNavbar ? "white" : "dark"}
              >
                {user.full_name || 'Parent'}
              </ArgonTypography>
              </>
            ) : (
            // Hiển thị nút Sign in nếu chưa đăng nhập
            <Link to="/authentication/sign-in/basic">
              <IconButton sx={navbarIconButton} size="small">
                <Icon
                  sx={({ palette: { dark, white } }) => ({
                    color: light && transparentNavbar ? white.main : dark.main,
                  })}
                >
                  account_circle
                </Icon>
                <ArgonTypography
                  variant="button"
                  fontWeight="medium"
                  color={light && transparentNavbar ? "white" : "dark"}
                >
                  Sign in
                </ArgonTypography>
              </IconButton>
            </Link>
            )}
          </ArgonBox>
        </ArgonBox>
      </Toolbar>
    </AppBar>
  );
}

// Setting default values for the props of DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: true,
};

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
};

export default DashboardNavbar;
