import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../features/auth";

function getHomePath(roles: string[]): string {
  if (roles.includes("admin")) return "/dashboard";
  if (roles.includes("sales visitor")) return "/products";
  return "/orders";
}

function canAccessPath(pathname: string, roles: string[], permissions: string[]): boolean {
  const isAdmin = roles.includes("admin");
  const isSalesVisitor = roles.includes("sales visitor");
  const can = (permission: string) => isAdmin || permissions.includes(permission);

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return isAdmin;
  if (pathname === "/catalog" || pathname.startsWith("/catalog/")) return isAdmin;
  if (pathname === "/products" || pathname.startsWith("/products/")) return isAdmin || isSalesVisitor;
  if (pathname === "/inventory" || pathname.startsWith("/inventory/")) return isAdmin || isSalesVisitor;

  const permissionRules: Array<[string, string]> = [
    ["/customers", "customers.view"],
    ["/doctors", "doctors.view"],
    ["/employees", "employees.view"],
    ["/orders", "orders.view"],
    ["/invoices", "invoices.view"],
    ["/reports", "reports.view"],
    ["/order-returns", "order_returns.view"],
    ["/payments", "payments.view"],
    ["/visits", "visits.view"],
    ["/samples", "samples.view"],
    ["/deliveries", "deliveries.view"],
  ];

  const rule = permissionRules.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"));
  return rule ? can(rule[1]) : true;
}

export function ProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>در حال بررسی وضعیت ورود...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];

  if (!canAccessPath(location.pathname, roles, permissions)) {
    return <Navigate to={getHomePath(roles)} replace />;
  }

  return <Outlet />;
}
