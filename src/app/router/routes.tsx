import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "../../features/auth";
import { CustomerLedgerPage } from "../../features/customer_ledger";
import { CustomersPage } from "../../features/customers";
import { DashboardPage } from "../../features/dashboard";
import { DoctorsPage } from "../../features/doctors";
import {
  OrderReturnDetailsPage,
  OrderReturnFormPage,
  OrderReturnsPage,
} from "../../features/order_returns";
import { OrdersPage, OrderDetailsPage } from "../../features/orders";
import { PaymentsPage, PaymentDetailsPage } from "../../features/payments";
import { ProductsPage } from "../../features/products";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id/ledger" element={<CustomerLedgerPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/payments/:id" element={<PaymentDetailsPage />} />
          <Route path="/order-returns" element={<OrderReturnsPage />} />
          <Route path="/order-returns/new" element={<OrderReturnFormPage />} />
          <Route path="/order-returns/:id" element={<OrderReturnDetailsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
