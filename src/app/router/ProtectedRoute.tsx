import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../features/auth";

function getHomePath(roles: string[]): string {
  if (roles.includes("admin")) return "/dashboard";
  if (roles.includes("scientific visitor")) return "/scientific-inventory";
  if (roles.includes("sales visitor")) return "/products";
  return "/orders";
}

function canAccessPath(pathname: string, roles: string[], permissions: string[]): boolean {
  const isAdmin = roles.includes("admin");
  const isAccountant = roles.includes("accountant");
  const isSalesVisitor = roles.includes("sales visitor");
  const isScientificVisitor = roles.includes("scientific visitor");
  const can = (permission: string) => isAdmin || permissions.includes(permission);

  // Notifications are an authenticated system feature and must remain reachable for every role,\n  // including scientific visitors. Keep this check before the role-specific home restriction.\n  if (pathname === "/notifications" || pathname.startsWith("/notifications/")) return true;\n\n  if (isScientificVisitor && !isAdmin && !isAccountant) {\n    return pathname === "/visits" || pathname.startsWith("/visits/") || pathname === "/samples" || pathname.startsWith("/samples/") || pathname === "/scientific-inventory" || pathname.startsWith("/scientific-inventory/");\n  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return isAdmin;
  if (pathname === "/invoices/new") return isAdmin || (isAccountant && permissions.includes("invoices.create"));
  if (pathname === "/employee-locations" || pathname.startsWith("/employee-locations/")) return isAdmin;
  if (pathname === "/catalog" || pathname.startsWith("/catalog/")) return isAdmin;
  if (pathname === "/products" || pathname.startsWith("/products/")) return isAdmin || isSalesVisitor;
  if (pathname === "/inventory" || pathname.startsWith("/inventory/")) return isAdmin || isSalesVisitor || isAccountant;
  if (pathname === "/scientific-inventory" || pathname.startsWith("/scientific-inventory/")) {
    return isAdmin || isAccountant || isScientificVisitor;
  }
  if (pathname === "/orders" || pathname.startsWith("/orders/")) {
    return isAdmin || isAccountant || isSalesVisitor;
  }

  const permissionRules: Array<[string, string]> = [
    ["/customers", "customers.view"],
    ["/doctors", "doctors.view"],
    ["/employees", "employees.view"],
    ["/employee-banking", "employees.view"],
    ["/invoices", "invoices.view"],
    ["/reports", "reports.view"],
    ["/order-returns", "order_returns.view"],
    ["/payments", "payments.view"],
    ["/visits", "visits.view"],
    ["/samples", "samples.view"],
    ["/deliveries", "deliveries.view"],
  ];

  const rule = permissionRules.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"));
  if (rule) {
    if (isScientificVisitor && (rule[0] === "/visits" || rule[0] === "/samples")) return true;
    return can(rule[1]);
  }

  return pathname === "/notifications" || pathname.startsWith("/notifications/");
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