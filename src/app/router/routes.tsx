import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "../../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

const LoginPage = lazy(() =>
  import("../../features/auth").then((module) => ({ default: module.LoginPage })),
);
const CatalogPage = lazy(() =>
  import("../../features/catalog").then((module) => ({ default: module.CatalogPage })),
);
const CustomerLedgerPage = lazy(() =>
  import("../../features/customer_ledger").then((module) => ({ default: module.CustomerLedgerPage })),
);
const CustomersPage = lazy(() =>
  import("../../features/customers").then((module) => ({ default: module.CustomersPage })),
);
const DashboardPage = lazy(() =>
  import("../../features/dashboard").then((module) => ({ default: module.DashboardPage })),
);
const DailyActivityReportsPage = lazy(() =>
  import("../../features/daily_activity_reports/pages/DailyActivityReportsPage").then((module) => ({ default: module.DailyActivityReportsPage })),
);
const DataCleanupPage = lazy(() =>
  import("../../features/data_cleanup/pages/DataCleanupPage").then((module) => ({
    default: module.DataCleanupPage,
  })),
);
const DeliveriesPage = lazy(() =>
  import("../../features/deliveries").then((module) => ({ default: module.DeliveriesPage })),
);
const DoctorsPage = lazy(() =>
  import("../../features/doctors").then((module) => ({ default: module.DoctorsPage })),
);
const EmployeesPage = lazy(() =>
  import("../../features/employees").then((module) => ({ default: module.EmployeesPage })),
);
const EmployeeBankingPage = lazy(() =>
  import("../../features/employees/pages/EmployeeBankingPage").then((module) => ({
    default: module.EmployeeBankingPage,
  })),
);
const ExpensesPage = lazy(() =>
  import("../../features/expenses").then((module) => ({ default: module.ExpensesPage })),
);
const EmployeeLocationsPage = lazy(() =>
  import("../../features/employee_locations/pages/EmployeeLocationsPage").then((module) => ({
    default: module.EmployeeLocationsPage,
  })),
);
const InventoryPage = lazy(() =>
  import("../../features/inventory").then((module) => ({ default: module.InventoryPage })),
);
const InvoiceCreatePage = lazy(() =>
  import("../../features/invoices").then((module) => ({ default: module.InvoiceCreatePage })),
);
const InvoiceDetailsPage = lazy(() =>
  import("../../features/invoices").then((module) => ({ default: module.InvoiceDetailsPage })),
);
const InvoicesPage = lazy(() =>
  import("../../features/invoices").then((module) => ({ default: module.InvoicesPage })),
);
const NotificationsPage = lazy(() =>
  import("../../features/notifications").then((module) => ({ default: module.NotificationsPage })),
);
const OrderReturnDetailsPage = lazy(() =>
  import("../../features/order_returns").then((module) => ({ default: module.OrderReturnDetailsPage })),
);
const OrderReturnFormPage = lazy(() =>
  import("../../features/order_returns").then((module) => ({ default: module.OrderReturnFormPage })),
);
const OrderReturnsPage = lazy(() =>
  import("../../features/order_returns").then((module) => ({ default: module.OrderReturnsPage })),
);
const OrderDetailsPage = lazy(() =>
  import("../../features/orders").then((module) => ({ default: module.OrderDetailsPage })),
);
const OrdersPage = lazy(() =>
  import("../../features/orders").then((module) => ({ default: module.OrdersPage })),
);
const PaymentDetailsPage = lazy(() =>
  import("../../features/payments").then((module) => ({ default: module.PaymentDetailsPage })),
);
const PaymentsPage = lazy(() =>
  import("../../features/payments").then((module) => ({ default: module.PaymentsPage })),
);
const ProductsPage = lazy(() =>
  import("../../features/products").then((module) => ({ default: module.ProductsPage })),
);
const ReportsPage = lazy(() =>
  import("../../features/reports").then((module) => ({ default: module.ReportsPage })),
);
const ScientificVisitorInventoryPage = lazy(() =>
  import("../../features/scientific_inventory").then((module) => ({
    default: module.ScientificVisitorInventoryPage,
  })),
);
const VisitsPage = lazy(() =>
  import("../../features/visits").then((module) => ({ default: module.VisitsPage })),
);

function RouteLoadingFallback() {
  return (
    <div
      role="status"
      className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-6 text-sm text-slate-500"
    >
      در حال بارگذاری صفحه...
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/data-cleanup" element={<DataCleanupPage />} />
            <Route path="/daily-activity-reports" element={<DailyActivityReportsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id/ledger" element={<CustomerLedgerPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employee-banking" element={<EmployeeBankingPage />} />
            <Route path="/employee-locations" element={<EmployeeLocationsPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/new" element={<InvoiceCreatePage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/order-returns" element={<OrderReturnsPage />} />
            <Route path="/order-returns/new" element={<OrderReturnFormPage />} />
            <Route path="/order-returns/:id" element={<OrderReturnDetailsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/payments/:id" element={<PaymentDetailsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/visits" element={<VisitsPage />} />
            <Route path="/samples" element={<Navigate to="/visits" replace />} />
            <Route path="/scientific-inventory" element={<ScientificVisitorInventoryPage />} />
            <Route path="/deliveries" element={<DeliveriesPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
