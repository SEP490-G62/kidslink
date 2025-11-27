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

import { useCallback, useEffect, useRef, useState } from "react";

// react-router-dom components
import { useLocation, NavLink } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";
import SidenavFooter from "examples/Sidenav/SidenavFooter";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import SidenavItem from "examples/Sidenav/SidenavItem";

// Custom styles for the Sidenav
import SidenavRoot from "examples/Sidenav/SidenavRoot";
import sidenavLogoLabel from "examples/Sidenav/styles/sidenav";

// Argon Dashboard 2 MUI context
import { useArgonController, setMiniSidenav } from "context";
import io from "socket.io-client";
import messagingService from "services/messagingService";

function Sidenav({ color, brand, brandName, routes, ...rest }) {
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, darkSidenav, layout } = controller;
  const location = useLocation();
  const { pathname } = location;
  const itemName = pathname.split("/").slice(1)[0];
  const [unreadTotal, setUnreadTotal] = useState(() => {
    const saved = localStorage.getItem("kidslink:unread_total");
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const socketRef = useRef(null);

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  useEffect(() => {
    // A function that sets the mini state of the sidenav.
    function handleMiniSidenav() {
      setMiniSidenav(dispatch, window.innerWidth < 1200);
    }

    /** 
     The event listener that's calling the handleMiniSidenav function when resizing the window.
    */
    window.addEventListener("resize", handleMiniSidenav);

    // Call the handleMiniSidenav function to set the state with the initial value.
    handleMiniSidenav();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch, location]);

  const broadcastUnread = useCallback((total) => {
    localStorage.setItem("kidslink:unread_total", String(total));
    window.dispatchEvent(
      new CustomEvent("kidslink:unread_total", { detail: { total } })
    );
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await messagingService.getUnreadCount();
      if (res?.success && res.data) {
        // Đếm số conversation có tin nhắn chưa đọc thay vì tổng số tin nhắn
        const byConversation = Array.isArray(res.data.byConversation) ? res.data.byConversation : [];
        // Chỉ đếm những conversation có count > 0 (thực sự có tin nhắn chưa đọc)
        const conversationCount = byConversation.filter(item => (item.count || 0) > 0).length;
        setUnreadTotal(conversationCount);
        broadcastUnread(conversationCount);
      } else {
        // Nếu không có data, set về 0
        setUnreadTotal(0);
        broadcastUnread(0);
      }
    } catch (error) {
      console.error("Parent Sidenav refreshUnread error:", error);
      // Khi có lỗi, set về 0 để tránh hiển thị sai
      setUnreadTotal(0);
      broadcastUnread(0);
    }
  }, [broadcastUnread]);

  useEffect(() => {
    const handler = (e) => {
      if (e && e.detail && typeof e.detail.total !== "undefined") {
        setUnreadTotal(e.detail.total || 0);
      }
    };
    window.addEventListener("kidslink:unread_total", handler);
    return () => window.removeEventListener("kidslink:unread_total", handler);
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || socketRef.current) return;
    const API_BASE_URL =
      process.env.REACT_APP_API_URL || "http://localhost:5000";
    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    // Lấy user_id từ token để kiểm tra
    let currentUserId = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || 'e30='));
      currentUserId = payload?.id || payload?._id;
    } catch (e) {
      console.error('Parent Sidenav: Cannot parse token', e);
    }

    const handleNotify = (data) => {
      // Chỉ refresh nếu tin nhắn không phải từ chính mình
      const message = data?.message || data;
      if (message && currentUserId) {
        const senderId = message.sender_id?._id || message.sender_id?.id || message.sender_id;
        if (senderId && String(senderId) === String(currentUserId)) {
          // Tin nhắn từ chính mình, không cần refresh
          return;
        }
      }
      // Nếu đang ở trang chat, chat page sẽ tự cập nhật badge, không cần refresh ở đây
      // Chỉ refresh khi không ở trang chat
      const isOnChatPage = window.location.pathname.includes('/chat');
      if (!isOnChatPage) {
        refreshUnread();
      }
    };

    socket.on("new_message_notification", handleNotify);
    socket.on("new_message", handleNotify);
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (error) {
          console.error("Parent Sidenav socket close error:", error);
        } finally {
          socketRef.current = null;
        }
      }
    };
  }, [refreshUnread]);

  // Render all the routes from the routes.js (All the visible items on the Sidenav)
  const renderRoutes = routes.map(({ type, name, icon, title, key, href, route }) => {
    let returnValue;

    if (type === "route") {
      if (href) {
        returnValue = (
          <Link href={href} key={key} target="_blank" rel="noreferrer">
            <SidenavItem
              name={name}
              icon={icon}
              active={key === itemName}
              badgeCount={route === "/parent/chat" && unreadTotal > 0 ? unreadTotal : 0}
            />
          </Link>
        );
      } else {
        returnValue = (
          <NavLink to={route} key={key}>
            <SidenavItem 
              name={name} 
              icon={icon} 
              active={key === itemName}
              badgeCount={route === "/parent/chat" && unreadTotal > 0 ? unreadTotal : 0}
            />
          </NavLink>
        );
      }
    } else if (type === "title") {
      returnValue = (
        <ArgonTypography
          key={key}
          color={darkSidenav ? "white" : "dark"}
          display="block"
          variant="caption"
          fontWeight="bold"
          textTransform="uppercase"
          opacity={0.6}
          pl={3}
          mt={2}
          mb={1}
          ml={1}
        >
          {title}
        </ArgonTypography>
      );
    } else if (type === "divider") {
      returnValue = <Divider key={key} light={darkSidenav} />;
    }

    return returnValue;
  });

  return (
    <SidenavRoot {...rest} variant="permanent" ownerState={{ darkSidenav, miniSidenav, layout }}>
      <ArgonBox pt={3} pb={1} px={4} textAlign="center">
        <ArgonBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav}
          sx={{ cursor: "pointer" }}
        >
          <ArgonTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </ArgonTypography>
        </ArgonBox>
        <ArgonBox 
          display="flex" 
          alignItems="center"
          sx={{ cursor: "pointer" }}
          onClick={() => window.location.reload()}
        >
          {brand && (
            <ArgonBox component="img" src={brand} alt="Argon Logo" width="2rem" mr={0.25} />
          )}
          <ArgonBox
            width={!brandName && "100%"}
            sx={(theme) => sidenavLogoLabel(theme, { miniSidenav })}
          >
            <ArgonTypography
              component="h6"
              variant="button"
              fontWeight="medium"
              color={darkSidenav ? "white" : "dark"}
            >
              {brandName}
            </ArgonTypography>
          </ArgonBox>
        </ArgonBox>
      </ArgonBox>
      <Divider light={darkSidenav} />
      <List>{renderRoutes}</List>
      
      <ArgonBox pt={1} mt="auto" mb={2} mx={2}>
        <SidenavFooter />
      </ArgonBox>
    </SidenavRoot>
  );
}

// Setting default values for the props of Sidenav
Sidenav.defaultProps = {
  color: "info",
  brand: "",
};

// Typechecking props for the Sidenav
Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
