import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../features/auth";

function getHomePath(roles: string[]): string {
  if (roles.includes("admin")) return "/dashboard";
  if (roles.includes("sales visitor")) return "/products";
  return "/orders";
}

export function PublicRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>در حال بررسی وضعیت ورود...</div>;
  if (isAuthenticated) return <Navigate to={getHomePath(user?.roles ?? [])} replace />;

  return <Outlet />;
}
