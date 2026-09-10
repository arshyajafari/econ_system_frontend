import { useCallback, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../../../api/client";

import { OrderStatusActions } from "../components/OrderStatusActions";

import { getOrder, performOrderStatusAction } from "../services/ordersApi";

import type { Order, OrderStatusAction } from "../types/order";

import { getOrderStatusLabel } from "../types/order";

const numberFormatter = new Intl.NumberFormat("fa-IR");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getOrderTotal(order: Order): number {
  return order.items.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0,
  );
}

function getStatusClass(status: Order["status"]): string {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "confirmed":
      return "bg-blue-100 text-blue-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "completed":
      return "bg-green-100 text-green-700";
  }
}

export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [pendingAction, setPendingAction] = useState<OrderStatusAction | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) {
      setError("شناسه سفارش نامعتبر است.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getOrder(id);
      setOrder(response);
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در دریافت اطلاعات سفارش.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrder();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadOrder]);

  async function handleAction(action: OrderStatusAction) {
    if (!order || pendingAction) {
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

    setPendingAction(action);
    setError(null);

    try {
      const updated = await performOrderStatusAction(order.id, action);

      setOrder(updated);
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "عملیات سفارش انجام نشد.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  if (isLoading) {
    return (
      <section className="p-4 md:p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          در حال دریافت اطلاعات سفارش...
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="space-y-4 p-4 md:p-6">
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          بازگشت به سفارش‌ها
        </button>

        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error ?? "سفارش پیدا نشد."}
        </div>
      </section>
    );
  }

  const total = getOrderTotal(order);

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="mb-3 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            ← بازگشت به سفارش‌ها
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              سفارش {order.code}
            </h1>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                order.status,
              )}`}
            >
              {getOrderStatusLabel(order.status)}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            ثبت شده در {formatDate(order.created_at)}
          </p>
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
              void loadOrder();
            }}
            className="self-start rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100 sm:self-auto"
          >
            تلاش مجدد
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">اطلاعات مشتری</h2>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">نام</span>

              <span className="font-medium text-gray-900">
                {order.customer?.customer_name ?? "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">کد</span>

              <span className="text-gray-800">
                {order.customer?.code ?? "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">کارشناس فروش</h2>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">نام</span>

              <span className="font-medium text-gray-900">
                {order.sales_employee?.name ?? "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">کد</span>

              <span className="text-gray-800">
                {order.sales_employee?.code ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">اقلام سفارش</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full text-sm">
            <thead className="bg-gray-50 text-right text-gray-600">
              <tr>
                <th className="px-5 py-3 font-medium">محصول</th>

                <th className="px-5 py-3 font-medium">تعداد</th>

                <th className="px-5 py-3 font-medium">قیمت واحد</th>

                <th className="px-5 py-3 font-medium">مبلغ کل</th>

                <th className="px-5 py-3 font-medium">تخصیص</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {order.items.map((item) => {
                const allocatedQuantity =
                  item.allocations?.reduce(
                    (sum, allocation) => sum + Number(allocation.quantity || 0),
                    0,
                  ) ?? 0;

                return (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {item.product?.title ?? "—"}
                      </div>

                      {item.product?.code ? (
                        <div className="mt-1 text-xs text-gray-500">
                          {item.product.code}
                        </div>
                      ) : null}

                      {item.description ? (
                        <div className="mt-1 text-xs text-gray-500">
                          {item.description}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-5 py-4">{formatNumber(item.quantity)}</td>

                    <td dir="ltr" className="px-5 py-4">
                      {formatNumber(Number(item.unit_price || 0))}
                    </td>

                    <td
                      dir="ltr"
                      className="px-5 py-4 font-medium text-gray-900"
                    >
                      {formatNumber(Number(item.total_price || 0))}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatNumber(allocatedQuantity)} از{" "}
                      {formatNumber(item.quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="border-t border-gray-200">
                <td
                  colSpan={3}
                  className="px-5 py-4 text-left font-semibold text-gray-900"
                >
                  جمع سفارش
                </td>

                <td dir="ltr" className="px-5 py-4 font-bold text-gray-900">
                  {formatNumber(total)}
                </td>

                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {order.description ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">توضیحات</h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">
            {order.description}
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          عملیات سفارش
        </h2>

        <OrderStatusActions
          order={order}
          disabled={pendingAction !== null}
          onAction={(action) => {
            void handleAction(action);
          }}
        />
      </div>
    </section>
  );
}
