import { Outlet, useLocation, useNavigate } from "react-router-dom";
 
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BarChartIcon from "@mui/icons-material/BarChart";
import ArticleIcon from "@mui/icons-material/Article";
import PersonIcon from "@mui/icons-material/Person";

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isImmersivePage = location.pathname === "/capsule";

  const getCurrentTab = () => {
    if (location.pathname.startsWith("/calendar")) return "/calendar";
    if (location.pathname.startsWith("/ranking")) return "/ranking";
    if (location.pathname.startsWith("/board")) return "/board";
    if (location.pathname.startsWith("/profile")) return "/profile";

    return "/home";
  };

  const handleChange = (event, newValue) => {
    navigate(newValue);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f8fb",
        pb: isImmersivePage ? 0 : 9,
      }}
    >
      <Box
        sx={{
          maxWidth: 375,
          mx: "auto",
          minHeight: "100vh",
          bgcolor: "#fff",
        }}
      >
        <Outlet />
      </Box>

      {!isImmersivePage && <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 375,
          mx: "auto",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: "hidden",
        }}
      >
        <BottomNavigation
          value={getCurrentTab()}
          onChange={handleChange}
          showLabels
          sx={{
            height: 72,
            "& .MuiBottomNavigationAction-root": {
              minWidth: 0,
              px: 0.5,
              pt: 1.1,
              color: "#777b82",
            },
            "& .MuiBottomNavigationAction-label": {
              mt: 0.45,
              fontSize: 12,
              lineHeight: 1.2,
            },
            "& .Mui-selected": {
              color: "#0868f7",
            },
            "& .Mui-selected .MuiBottomNavigationAction-label": {
              fontSize: 12,
              fontWeight: 700,
            },
            "& .MuiSvgIcon-root": {
              fontSize: 22,
            },
          }}
        >
          <BottomNavigationAction
            label="홈"
            value="/home"
            icon={<HomeIcon />}
          />

          <BottomNavigationAction
            label="캘린더"
            value="/calendar"
            icon={<CalendarMonthIcon />}
          />

          <BottomNavigationAction
            label="통계"
            value="/ranking"
            icon={<BarChartIcon />}
          />

          <BottomNavigationAction
            label="게시판"
            value="/board"
            icon={<ArticleIcon />}
          />

          <BottomNavigationAction
            label="내정보"
            value="/profile"
            icon={<PersonIcon />}
          />
        </BottomNavigation>
      </Paper>}
    </Box>
  );
}

export default AppLayout;
