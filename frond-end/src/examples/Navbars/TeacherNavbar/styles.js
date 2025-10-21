/**
=========================================================
* KidsLink Teacher Navbar Styles - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

function navbar(theme, ownerState) {
  const { palette, boxShadows, functions, transitions, breakpoints, borders } = theme;
  const { transparentNavbar, absolute, light } = ownerState;

  const { dark, white, text, transparent, success } = palette;
  const { navbarBoxShadow } = boxShadows;
  const { pxToRem } = functions;
  const { borderRadius } = borders;

  return {
    boxShadow: transparentNavbar || absolute ? "none" : navbarBoxShadow,
    backgroundColor: transparentNavbar || absolute ? `${transparent.main} !important` : white.main,

    color: () => {
      let color;

      if (light) {
        color = white.main;
      } else if (transparentNavbar) {
        color = text.main;
      } else {
        color = dark.main;
      }

      return color;
    },
    top: absolute ? 0 : pxToRem(12),
    minHeight: pxToRem(75),
    display: "grid",
    alignItems: "center",
    borderRadius: borderRadius.xl,
    paddingTop: pxToRem(8),
    paddingBottom: pxToRem(8),
    paddingRight: absolute ? pxToRem(8) : 0,
    paddingLeft: absolute ? pxToRem(16) : 0,

    // Teacher-specific styling
    borderLeft: `4px solid ${success.main}`,

    "& > *": {
      transition: transitions.create("all", {
        easing: transitions.easing.easeInOut,
        duration: transitions.duration.standard,
      }),
    },

    "& .MuiToolbar-root": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",

      [breakpoints.up("sm")]: {
        minHeight: "auto",
        padding: `${pxToRem(4)} ${pxToRem(16)}`,
      },
    },
  };
}

const navbarContainer = ({ breakpoints }) => ({
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  pt: 0.5,
  pb: 0.5,

  [breakpoints.up("md")]: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: "0",
    paddingBottom: "0",
  },
});

const navbarRow = ({ breakpoints }, { isMini }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",

  [breakpoints.up("md")]: {
    justifyContent: isMini ? "space-between" : "stretch",
    width: isMini ? "100%" : "max-content",
  },

  [breakpoints.up("xl")]: {
    justifyContent: "stretch !important",
    width: "max-content !important",
  },
});

const navbarIconButton = ({ typography: { size }, breakpoints }) => ({
  px: 0.75,
  position: "relative",

  "& .material-icons, .material-icons-round": {
    fontSize: `${size.md} !important`,
  },

  "& .MuiTypography-root": {
    display: "none",

    [breakpoints.up("sm")]: {
      display: "inline-block",
      lineHeight: 1.2,
      ml: 0.5,
    },
  },

  // Teacher-specific hover effects
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    borderRadius: "50%",
  },
});

const navbarDesktopMenu = ({ breakpoints }) => ({
  display: "none !important",
  cursor: "pointer",

  [breakpoints.up("xl")]: {
    display: "inline-block !important",
  },
});

const navbarMobileMenu = ({ breakpoints }) => ({
  display: "inline-block",
  lineHeight: 0,

  [breakpoints.up("xl")]: {
    display: "none",
  },
});

// Teacher-specific styles
const teacherSearchBox = ({ breakpoints }) => ({
  minWidth: 300,
  "& .MuiInputBase-root": {
    borderRadius: 2,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.08)",
    },
    "&.Mui-focused": {
      backgroundColor: "white",
      boxShadow: "0 0 0 2px rgba(0, 123, 255, 0.25)",
    },
  },
  [breakpoints.down("md")]: {
    minWidth: 200,
  },
  [breakpoints.down("sm")]: {
    minWidth: 150,
  },
});

const teacherNotificationBadge = {
  "& .MuiBadge-badge": {
    right: 3,
    top: 3,
    fontSize: "0.75rem",
    minWidth: "18px",
    height: "18px",
  },
};

const teacherProfileAvatar = {
  width: 32,
  height: 32,
  border: "2px solid",
  borderColor: "success.main",
  "&:hover": {
    borderColor: "success.dark",
  },
};

export {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
  teacherSearchBox,
  teacherNotificationBadge,
  teacherProfileAvatar,
};



