import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import { ADMIN_ROLES, USER_MANAGER_ROLES } from "../shared/constants/roles";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const AppLayout = lazy(() => import("../layouts/AppLayout"));
const SignupPage = lazy(() => import("../pages/auth/SignupPage"));
const AuthCallbackPage = lazy(() => import("../pages/auth/AuthCallbackPage"));
const CompleteProfilePage = lazy(() => import("../pages/auth/CompleteProfilePage"));
const HomePage = lazy(() => import("../pages/home/HomePage"));
const CalendarPage = lazy(() => import("../pages/calendar/CalendarPage"));
const RankingPage = lazy(() => import("../pages/ranking/RankingPage"));
const MyRecordsPage = lazy(() => import("../pages/ranking/MyRecordsPage"));
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const ProfileEditPage = lazy(() => import("../pages/profile/ProfileEditPage"));
const PointHistoryPage = lazy(() => import("../pages/profile/PointHistoryPage"));
const CapsuleHistoryPage = lazy(() => import("../pages/profile/CapsuleHistoryPage"));
const TermsPage = lazy(() => import("../pages/profile/TermsPage"));
const PrivacyPage = lazy(() => import("../pages/profile/PrivacyPage"));
const AdminPage = lazy(() => import("../pages/admin/AdminPage"));
const CenterManagePage = lazy(() => import("../pages/admin/CenterManagePage"));
const UserManagePage = lazy(() => import("../pages/admin/UserManagePage"));
const MeetingManagePage = lazy(() => import("../pages/admin/MeetingManagePage"));
const BattleManagePage = lazy(() => import("../pages/admin/BattleManagePage"));
const CapsuleManagePage = lazy(() => import("../pages/admin/CapsuleManagePage"));
const AttendanceStatusPage = lazy(() => import("../pages/admin/AttendanceStatusPage"));
const AverageManagePage = lazy(() => import("../pages/admin/AverageManagePage"));
const CapsulePage = lazy(() => import("../pages/capsule/CapsulePage"));
const BoardPage = lazy(() => import("../pages/board/BoardPage"));
const BoardWritePage = lazy(() => import("../pages/board/BoardWritePage"));
const BoardDetailPage = lazy(() => import("../pages/board/BoardDetailPage"));

function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
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
            <Route path="/capsule" element={<CapsulePage />} />

            <Route path="/board" element={<BoardPage />} />
            <Route path="/board/write" element={<BoardWritePage />} />
            <Route path="/board/edit/:boardId" element={<BoardWritePage />} />
            <Route path="/board/:boardId" element={<BoardDetailPage />} />

            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/profile/points" element={<PointHistoryPage />} />
            <Route path="/profile/capsule-history" element={<CapsuleHistoryPage />} />
            <Route path="/profile/terms" element={<TermsPage />} />
            <Route path="/profile/privacy" element={<PrivacyPage />} />

            <Route element={<RoleRoute roles={ADMIN_ROLES} />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/centers" element={<CenterManagePage />} />
              <Route path="/admin/meetings" element={<MeetingManagePage />} />
              <Route path="/admin/capsule" element={<CapsuleManagePage />} />
              <Route path="/admin/attendance-status" element={<AttendanceStatusPage />} />
              <Route path="/admin/averages" element={<AverageManagePage />} />
            </Route>

            <Route element={<RoleRoute roles={USER_MANAGER_ROLES} />}>
              <Route path="/admin/users" element={<UserManagePage />} />
              <Route path="/admin/battle" element={<BattleManagePage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function RouteLoading() {
  return <div role="status" aria-label="화면 불러오는 중" style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#777", fontFamily: "Pretendard, sans-serif" }}>불러오는 중...</div>;
}

export default Router;
