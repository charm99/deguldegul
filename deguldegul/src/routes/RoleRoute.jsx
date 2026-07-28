import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { hasRole } from "../shared/model/permissions";

function RoleRoute({ roles, redirectTo = "/home" }) {
  const { loading, profile } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!hasRole(profile, roles)) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default RoleRoute;
