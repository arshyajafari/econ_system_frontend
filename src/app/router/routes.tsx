import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "../../features/auth";
import { CustomersPage } from "../../features/customers";
import { DashboardPage } from "../../features/dashboard";
import { ProductsPage } from "../../features/products";
import { OrderDetailsPage, OrdersPage } from "../../features/orders";

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

          <Route path="/products" element={<ProductsPage />} />

          <Route path="/orders" element={<OrdersPage />} />

          <Route path="/orders/:id" element={<OrderDetailsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
