import { useCallback, useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import { ApiError } from "../../../api/client";

import { OrderFilters } from "../components/OrderFilters";
import { OrderForm } from "../components/OrderForm";
import { OrderTable } from "../components/OrderTable";

import {
  createOrder,
  getOrderCustomers,
  getOrderEmployees,
  getOrderProducts,
  getOrders,
  performOrderStatusAction,
  updateOrder,
} from "../services/ordersApi";

import type {
  Order,
  OrderCustomerOption,
  OrderEmployeeOption,
  OrderFormData,
  OrderProductOption,
  OrderStatus,
  OrderStatusAction,
} from "../types/order";

export function OrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);

  const [customers, setCustomers] = useState<OrderCustomerOption[]>([]);

  const [employees, setEmployees] = useState<OrderEmployeeOption[]>([]);

  const [products, setProducts] = useState<OrderProductOption[]>([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<OrderStatus | "">("");

  const [customerId, setCustomerId] = useState("");

  const [salesEmployeeId, setSalesEmployeeId] = useState("");

  const [page, setPage] = useState(1);

  const [lastPage, setLastPage] = useState(1);

  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const [isLoadingLookups, setIsLoadingLookups] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const requestIdRef = useRef(0);

  const loadLookups = useCallback(async () => {
    setIsLoadingLookups(true);

    try {
      const [customersResponse, employeesResponse, productsResponse] =
        await Promise.all([
          getOrderCustomers(),
          getOrderEmployees(),
          getOrderProducts(),
        ]);

      setCustomers(customersResponse);

      setEmployees(employeesResponse);

      setProducts(productsResponse);
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در دریافت اطلاعات مورد نیاز سفارش.",
      );
    } finally {
      setIsLoadingLookups(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getOrders({
        search: search.trim() || undefined,

        status: status || undefined,

        customer_id: customerId || undefined,

        sales_employee_id: salesEmployeeId || undefined,

        page,
        per_page: 20,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setOrders(response.data);

      setLastPage(response.meta.last_page);

      setTotal(response.meta.total);
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در دریافت سفارش‌ها.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [customerId, page, salesEmployeeId, search, status]);

  useEffect(() => {
    let cancelled = false;

    async function fetchLookups() {
      try {
        setIsLoadingLookups(true);

        const [customersResponse, employeesResponse, productsResponse] =
          await Promise.all([
            getOrderCustomers(),
            getOrderEmployees(),
            getOrderProducts(),
          ]);

        if (cancelled) {
          return;
        }

        setCustomers(customersResponse);
        setEmployees(employeesResponse);
        setProducts(productsResponse);
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof ApiError && error.message
            ? error.message
            : "خطا در دریافت اطلاعات مورد نیاز سفارش.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingLookups(false);
        }
      }
    }

    void fetchLookups();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        void loadOrders();
      },
      search.trim() ? 300 : 0,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadOrders, search]);

  function resetFilters() {
    setSearch("");
    setStatus("");
    setCustomerId("");
    setSalesEmployeeId("");
    setPage(1);
  }

  function openCreateForm() {
    setEditingOrder(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(order: Order) {
    if (order.status !== "draft") {
      return;
    }

    setEditingOrder(order);
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
    setEditingOrder(null);
    setFormError(null);
  }

  async function handleSubmit(data: OrderFormData) {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingOrder) {
        const updated = await updateOrder(editingOrder.id, data);

        setOrders((current) =>
          current.map((order) => (order.id === updated.id ? updated : order)),
        );
      } else {
        await createOrder(data);

        if (page !== 1) {
          setPage(1);
        } else {
          await loadOrders();
        }
      }

      setIsFormOpen(false);
      setEditingOrder(null);
      setFormError(null);
    } catch (error: unknown) {
      setFormError(
        error instanceof ApiError ? error.message : "خطا در ذخیره سفارش.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAction(order: Order, action: OrderStatusAction) {
    if (pendingOrderId) {
      return;
    }

    if (action === "cancel") {
      const confirmed = window.confirm(
        `آیا از لغو سفارش «${order.code}» مطمئن هستید؟`,
      );

      if (!confirmed) {
        return;
      }
    }

    setPendingOrderId(order.id);

    setError(null);

    try {
      const updated = await performOrderStatusAction(order.id, action);

      if (status && updated.status !== status) {
        setOrders((current) =>
          current.filter((item) => item.id !== updated.id),
        );

        setTotal((current) => Math.max(0, current - 1));

        if (orders.length === 1 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
        }
      } else {
        setOrders((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }
    } catch (error: unknown) {
      setError(
        error instanceof ApiError ? error.message : "عملیات سفارش انجام نشد.",
      );
    } finally {
      setPendingOrderId(null);
    }
  }

  const canCreate =
    !isLoadingLookups &&
    customers.length > 0 &&
    employees.length > 0 &&
    products.length > 0;

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">سفارش‌ها</h1>

          <p className="mt-1 text-sm text-gray-500">
            مدیریت سفارش‌ها و فرآیند تأیید و تکمیل آن‌ها
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void loadOrders();
            }}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            بروزرسانی
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            disabled={!canCreate}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            سفارش جدید
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="flex flex-col gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => {
              void Promise.all([loadOrders(), loadLookups()]);
            }}
            className="self-start rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100 sm:self-auto"
          >
            تلاش مجدد
          </button>
        </div>
      ) : null}

      {isFormOpen ? (
        <OrderForm
          key={editingOrder?.id ?? "new"}
          order={editingOrder}
          customers={customers}
          employees={employees}
          products={products}
          isSubmitting={isSubmitting}
          error={formError}
          onSubmit={(data) => {
            void handleSubmit(data);
          }}
          onCancel={closeForm}
        />
      ) : null}

      <OrderFilters
        search={search}
        status={status}
        customerId={customerId}
        salesEmployeeId={salesEmployeeId}
        customers={customers}
        employees={employees}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onCustomerChange={(value) => {
          setCustomerId(value);
          setPage(1);
        }}
        onSalesEmployeeChange={(value) => {
          setSalesEmployeeId(value);
          setPage(1);
        }}
        onClear={resetFilters}
      />

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Intl.NumberFormat("fa-IR").format(total)} سفارش</span>

        {isLoading && orders.length > 0 ? (
          <span>در حال بروزرسانی...</span>
        ) : null}
      </div>

      <OrderTable
        orders={orders}
        isLoading={isLoading}
        pendingOrderId={pendingOrderId}
        onView={(order) => {
          navigate(`/orders/${order.id}`);
        }}
        onEdit={openEditForm}
        onAction={(order, action) => {
          void handleAction(order, action);
        }}
      />

      {lastPage > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            قبلی
          </button>

          <span className="text-sm text-gray-600">
            صفحه {new Intl.NumberFormat("fa-IR").format(page)} از{" "}
            {new Intl.NumberFormat("fa-IR").format(lastPage)}
          </span>

          <button
            type="button"
            disabled={page >= lastPage || isLoading}
            onClick={() =>
              setPage((current) => Math.min(lastPage, current + 1))
            }
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            بعدی
          </button>
        </div>
      ) : null}
    </section>
  );
}
