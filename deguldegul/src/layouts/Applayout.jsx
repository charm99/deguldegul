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
        pb: 8,
      }}
    >
      <Box
        sx={{
          maxWidth: 480,
          mx: "auto",
          minHeight: "100vh",
          bgcolor: "#fff",
        }}
      >
        <Outlet />
      </Box>

      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 480,
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
      </Paper>
    </Box>
  );
}

export default AppLayout;