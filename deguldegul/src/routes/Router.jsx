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
import MyRecordsPage from "../pages/ranking/MyRecordsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import TermsPage from "../pages/profile/TermsPage";
import PrivacyPage from "../pages/profile/PrivacyPage";
import AdminPage from "../pages/admin/AdminPage";
import CenterManagePage from "../pages/admin/CenterManagePage";
import UserManagePage from "../pages/admin/UserManagePage";
import MeetingManagePage from "../pages/admin/MeetingManagePage";
import BoardPage from "../pages/board/BoardPage";
import BoardWritePage from "../pages/board/BoardWritePage";
import BoardDetailPage from "../pages/board/BoardDetailPage";

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
            <Route path="/ranking/my-records" element={<MyRecordsPage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/board/write" element={<BoardWritePage />} />
            <Route path="/board/edit/:boardId" element={<BoardWritePage />} />
            <Route path="/board/:boardId" element={<BoardDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/terms" element={<TermsPage />} />
            <Route path="/profile/privacy" element={<PrivacyPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<UserManagePage />} />
            <Route path="/admin/centers" element={<CenterManagePage />} />
            <Route path="/admin/meetings" element={<MeetingManagePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default Router;