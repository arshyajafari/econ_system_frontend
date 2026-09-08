import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../features/auth";

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>در حال بررسی وضعیت ورود...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
