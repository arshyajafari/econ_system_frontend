import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth";

type PermissionRouteProps = {
  permission: string;
  adminOnly?: boolean;
};

export function PermissionRoute({ permission, adminOnly = false }: PermissionRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  const isAdmin = user.roles.includes("admin");
  const allowed = isAdmin || (!adminOnly && user.permissions.includes(permission));

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
