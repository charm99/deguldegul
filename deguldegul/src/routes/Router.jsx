import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import AuthCallbackPage from "../pages/auth/AuthCallbackPage";
import CompleteProfilePage from "../pages/auth/CompleteProfilePage";

import HomePage from "../pages/home/HomePage";
import CalendarPage from "../pages/calendar/CalendarPage";
import RankingPage from "../pages/ranking/RankingPage";
import BoardPage from "../pages/board/BoardPage";
import ProfilePage from "../pages/profile/ProfilePage";
import AdminPage from "../pages/admin/AdminPage";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 비로그인 접근 가능 */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />

        {/* 로그인 + ACTIVE 회원만 접근 */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default Router;