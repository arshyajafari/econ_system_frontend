import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../features/auth";

function getHomePath(roles: string[]): string {
  if (roles.includes("admin")) return "/dashboard";
  if (roles.includes("accountant")) return "/orders";

  // Prefer the combined operational landing page when an employee has both roles.
  if (roles.includes("delivery operator") && roles.includes("settlement operator")) return "/customers";
  if (roles.includes("scientific visitor")) return "/scientific-inventory";
  if (roles.includes("sales visitor")) return "/products";
  if (roles.includes("delivery operator")) return "/deliveries";
  if (roles.includes("settlement operator")) return "/customers";
  return "/customers";
}

function canAccessPath(pathname: string, roles: string[], permissions: string[], hasScientificVisitorActivity: boolean): boolean {
  const isAdmin = roles.includes("admin");
  const isAccountant = roles.includes("accountant");
  const isSalesVisitor = roles.includes("sales visitor");
  const isScientificVisitor = roles.includes("scientific visitor");
  const isDeliveryOperator = roles.includes("delivery operator");
  const isSettlementOperator = roles.includes("settlement operator");
  const hasRestrictedOperationalRole =
    isSalesVisitor || isScientificVisitor || isDeliveryOperator || isSettlementOperator;
  const can = (permission: string) => isAdmin || permissions.includes(permission);

  // Notifications are available to every authenticated role.
  if (pathname === "/notifications" || pathname.startsWith("/notifications/")) return true;

  // Admin/accountant rules below retain their broader access model.
  if (hasRestrictedOperationalRole && !isAdmin && !isAccountant) {
    const allowedByAssignedRole =
      (isSalesVisitor && (
        pathname === "/products" || pathname.startsWith("/products/") ||
        pathname === "/orders" || pathname.startsWith("/orders/")
      )) ||
      (isScientificVisitor && (
        pathname === "/visits" || pathname.startsWith("/visits/") ||
        pathname === "/samples" || pathname.startsWith("/samples/") ||
        pathname === "/scientific-inventory" || pathname.startsWith("/scientific-inventory/")
      )) ||
      (isDeliveryOperator && (
        pathname === "/deliveries" || pathname.startsWith("/deliveries/") ||
        pathname === "/order-returns" || pathname.startsWith("/order-returns/")
      )) ||
      (isSettlementOperator && (
        pathname === "/customers" || pathname.startsWith("/customers/") ||
        pathname === "/deliveries" || pathname.startsWith("/deliveries/") ||
        pathname === "/order-returns" || pathname.startsWith("/order-returns/") ||
        pathname === "/payments" || pathname.startsWith("/payments/")
      ));

    if (allowedByAssignedRole) return true;

    // Preserve permission-based access for non-role-specific pages where explicitly granted.
    if (pathname === "/doctors" || pathname.startsWith("/doctors/")) return can("doctors.view") || hasScientificVisitorActivity;
    if (pathname === "/employees" || pathname.startsWith("/employees/")) return can("employees.view");
    if (pathname === "/employee-banking" || pathname.startsWith("/employee-banking/")) return can("employees.view");
    if (pathname === "/invoices" || pathname.startsWith("/invoices/")) return can("invoices.view");
    if (pathname === "/reports" || pathname.startsWith("/reports/")) return can("reports.view");
    if (pathname === "/expenses" || pathname.startsWith("/expenses/")) return can("expenses.view");
    return false;
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return isAdmin || isAccountant;
  if (pathname === "/expenses" || pathname.startsWith("/expenses/")) return isAdmin || isAccountant;
  if (pathname === "/invoices/new") return isAdmin || (isAccountant && permissions.includes("invoices.create"));
  if (pathname === "/employee-locations" || pathname.startsWith("/employee-locations/")) return isAdmin;
  if (pathname === "/catalog" || pathname.startsWith("/catalog/")) return isAdmin || isAccountant;
  if (pathname === "/products" || pathname.startsWith("/products/")) return isAdmin || isAccountant || isSalesVisitor;
  if (pathname === "/inventory" || pathname.startsWith("/inventory/")) return isAdmin || isAccountant;
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
    if (rule[0] === "/doctors" && hasScientificVisitorActivity) return true;
    if (isScientificVisitor && (rule[0] === "/visits" || rule[0] === "/samples")) return true;
    return can(rule[1]);
  }

  return false;
}

export function ProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>در حال بررسی وضعیت ورود...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  const hasScientificVisitorActivity =
    user?.employee.activities?.includes("scientific_visitor") === true ||
    user?.employee.activity_type === "scientific_visitor";

  if (!canAccessPath(location.pathname, roles, permissions, hasScientificVisitorActivity)) {
    return <Navigate to={getHomePath(roles)} replace />;
  }

  return <Outlet />;
}