import { useCallback, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../../../api/client";

import {
  cancelOrderReturn,
  completeOrderReturn,
  confirmOrderReturn,
  getOrderReturn,
  submitOrderReturn,
} from "../services/orderReturnsApi";

import type { OrderReturn } from "../types/orderReturn";

import { getOrderReturnStatusLabel } from "../types/orderReturn";

import { OrderReturnStatusActions } from "../components/OrderReturnStatusActions";

import { OrderReturnAllocationForm } from "../components/OrderReturnAllocationForm";

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

function getStatusClass(status: OrderReturn["status"]): string {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "confirmed":
      return "bg-blue-100 text-blue-700";

    case "completed":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";
  }
}

function getTotal(orderReturn: OrderReturn): number {
  return orderReturn.items.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0,
  );
}

type Action = "submit" | "confirm" | "complete" | "cancel";

export function OrderReturnDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [orderReturn, setOrderReturn] = useState<OrderReturn | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [pendingAction, setPendingAction] = useState<Action | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadOrderReturn = useCallback(async () => {
    if (!id) {
      setError("شناسه مرجوعی نامعتبر است.");

      setIsLoading(false);

      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getOrderReturn(id);

      setOrderReturn(response);
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "دریافت اطلاعات مرجوعی ناموفق بود.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrderReturn();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadOrderReturn]);

  async function handleAction(action: Action) {
    if (!orderReturn || pendingAction) {
      return;
    }

    if (action === "cancel") {
      const confirmed = window.confirm(
        `آیا از لغو مرجوعی «${orderReturn.code}» مطمئن هستید؟`,
      );

      if (!confirmed) {
        return;
      }
    }

    if (action === "complete") {
      const confirmed = window.confirm(
        "با تکمیل مرجوعی، موجودی انبار و اعتبار مشتری ثبت می‌شود. ادامه می‌دهید؟",
      );

      if (!confirmed) {
        return;
      }
    }

    setPendingAction(action);
    setError(null);

    try {
      let updated: OrderReturn;

      switch (action) {
        case "submit":
          updated = await submitOrderReturn(orderReturn.id);
          break;

        case "confirm":
          updated = await confirmOrderReturn(orderReturn.id);
          break;

        case "complete":
          updated = await completeOrderReturn(orderReturn.id);
          break;

        case "cancel":
          updated = await cancelOrderReturn(orderReturn.id);
          break;
      }

      setOrderReturn(updated);
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "عملیات مرجوعی ناموفق بود.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  if (isLoading) {
    return (
      <section className="p-4 md:p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          در حال دریافت اطلاعات مرجوعی...
        </div>
      </section>
    );
  }

  if (!orderReturn) {
    return (
      <section className="space-y-4 p-4 md:p-6">
        <button
          type="button"
          onClick={() => navigate("/order-returns")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          بازگشت به مرجوعی‌ها
        </button>

        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error ?? "مرجوعی پیدا نشد."}
        </div>
      </section>
    );
  }

  const total = getTotal(orderReturn);

  const canAllocate = orderReturn.status === "confirmed";

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div>
        <button
          type="button"
          onClick={() => navigate("/order-returns")}
          className="mb-3 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← بازگشت به مرجوعی‌ها
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            مرجوعی {orderReturn.code}
          </h1>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
              orderReturn.status,
            )}`}
          >
            {getOrderReturnStatusLabel(orderReturn.status)}
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          ثبت شده در {formatDate(orderReturn.created_at)}
        </p>
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
              void loadOrderReturn();
            }}
            className="self-start rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100 sm:self-auto"
          >
            تلاش مجدد
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-xs text-gray-500">سفارش</div>

          <div className="mt-2 font-semibold text-gray-900">
            {orderReturn.order?.code ?? "—"}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-xs text-gray-500">مشتری</div>

          <div className="mt-2 font-semibold text-gray-900">
            {orderReturn.customer?.name ?? "—"}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-xs text-gray-500">مبلغ مرجوعی</div>

          <div dir="ltr" className="mt-2 font-semibold text-gray-900">
            {formatNumber(total)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">اقلام مرجوعی</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full text-sm">
            <thead className="bg-gray-50 text-right text-gray-600">
              <tr>
                <th className="px-5 py-3 font-medium">محصول</th>

                <th className="px-5 py-3 font-medium">تعداد</th>

                <th className="px-5 py-3 font-medium">قیمت واحد</th>

                <th className="px-5 py-3 font-medium">مبلغ</th>

                <th className="px-5 py-3 font-medium">تخصیص</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {orderReturn.items.map((item) => {
                const allocated =
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
                    </td>

                    <td className="px-5 py-4">
                      {formatNumber(Number(item.quantity))}
                    </td>

                    <td dir="ltr" className="px-5 py-4">
                      {formatNumber(Number(item.unit_price || 0))}
                    </td>

                    <td dir="ltr" className="px-5 py-4 font-medium">
                      {formatNumber(Number(item.total_price || 0))}
                    </td>

                    <td className="px-5 py-4">
                      {formatNumber(allocated)} از{" "}
                      {formatNumber(Number(item.quantity))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {canAllocate
        ? orderReturn.items.map((item) => (
            <OrderReturnAllocationForm
              key={item.id}
              orderReturn={orderReturn}
              item={item}
              disabled={pendingAction !== null}
              onUpdated={setOrderReturn}
            />
          ))
        : null}

      {orderReturn.description ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">توضیحات</h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">
            {orderReturn.description}
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          عملیات مرجوعی
        </h2>

        <OrderReturnStatusActions
          orderReturn={orderReturn}
          disabled={pendingAction !== null}
          onAction={(action) => {
            void handleAction(action);
          }}
        />
      </div>
    </section>
  );
}
