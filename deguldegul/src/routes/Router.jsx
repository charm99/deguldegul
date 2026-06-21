import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";

import LoginPage from "../pages/auth/LoginPage";
import AuthCallbackPage from "../pages/auth/AuthCallbackPage";
import CompleteProfilePage from "../pages/auth/CompleteProfilePage";

import HomePage from "../pages/home/HomePage";
import CalendarPage from "../pages/calendar/CalendarPage";
import RankingPage from "../pages/ranking/RankingPage";
import BoardPage from "../pages/board/BoardPage";
import ProfilePage from "../pages/profile/ProfilePage";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />

        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default Router;