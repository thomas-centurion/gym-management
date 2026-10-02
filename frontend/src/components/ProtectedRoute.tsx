import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/useAuth";

interface ProtectedRouteProps {
  allowedRole?: "admin" | "member";
}

const ProtectedRoute = ({
  allowedRole,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
