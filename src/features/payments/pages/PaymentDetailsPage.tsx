import { useCallback, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../../../api/client";

import { PaymentStatusActions } from "../components/PaymentStatusActions";

import {
  getPayment,
  performPaymentStatusAction,
} from "../services/paymentsApi";

import type { Payment, PaymentStatusAction } from "../types/payment";

import { getPaymentMethodLabel, getPaymentStatusLabel } from "../types/payment";

const numberFormatter = new Intl.NumberFormat("fa-IR");

function formatNumber(value: number) {
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
  }).format(date);
}

function statusClass(status: Payment["status"]): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "confirmed":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";
  }
}

export function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [payment, setPayment] = useState<Payment | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [pendingAction, setPendingAction] =
    useState<PaymentStatusAction | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadPayment = useCallback(async () => {
    if (!id) {
      setError("شناسه پرداخت نامعتبر است.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getPayment(id);

      setPayment(response);
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در دریافت اطلاعات پرداخت.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPayment();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadPayment]);

  async function handleAction(action: PaymentStatusAction) {
    if (!payment || pendingAction) {
      return;
    }

    if (action === "cancel") {
      const confirmed = window.confirm("آیا از لغو این پرداخت مطمئن هستید؟");

      if (!confirmed) {
        return;
      }
    }

    setPendingAction(action);
    setError(null);

    try {
      const updated = await performPaymentStatusAction(payment.id, action);

      setPayment(updated);
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "عملیات پرداخت انجام نشد.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  if (isLoading) {
    return (
      <section className="p-4 md:p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          در حال دریافت اطلاعات پرداخت...
        </div>
      </section>
    );
  }

  if (!payment) {
    return (
      <section className="space-y-4 p-4 md:p-6">
        <button
          type="button"
          onClick={() => navigate("/payments")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          بازگشت به پرداخت‌ها
        </button>

        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error ?? "پرداخت پیدا نشد."}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div>
        <button
          type="button"
          onClick={() => navigate("/payments")}
          className="mb-3 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← بازگشت به پرداخت‌ها
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">پرداخت</h1>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClass(
              payment.status,
            )}`}
          >
            {getPaymentStatusLabel(payment.status)}
          </span>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => {
              void loadPayment();
            }}
            className="rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100"
          >
            تلاش مجدد
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            اطلاعات فاکتور
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">شماره فاکتور</span>

              <span className="font-medium">
                {payment.invoice?.code ?? "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">مبلغ فاکتور</span>

              <span dir="ltr">
                {formatNumber(Number(payment.invoice?.total_amount ?? 0))}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">اطلاعات مشتری</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">نام</span>

              <span className="font-medium">
                {payment.customer?.name ?? "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">کد</span>

              <span>{payment.customer?.code ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">جزئیات پرداخت</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-xs text-gray-500">مبلغ</span>

            <div dir="ltr" className="mt-1 text-lg font-bold">
              {formatNumber(Number(payment.amount || 0))}
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500">روش پرداخت</span>

            <div className="mt-1 font-medium">
              {getPaymentMethodLabel(payment.method)}
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500">تاریخ پرداخت</span>

            <div className="mt-1">{formatDate(payment.payment_date)}</div>
          </div>

          <div>
            <span className="text-xs text-gray-500">شماره مرجع</span>

            <div className="mt-1">{payment.reference_number ?? "—"}</div>
          </div>

          <div>
            <span className="text-xs text-gray-500">ثبت‌کننده</span>

            <div className="mt-1">{payment.employee?.name ?? "—"}</div>
          </div>

          <div>
            <span className="text-xs text-gray-500">توضیحات</span>

            <div className="mt-1 whitespace-pre-wrap">
              {payment.description ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {payment.status === "pending" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            عملیات پرداخت
          </h2>

          <PaymentStatusActions
            payment={payment}
            disabled={pendingAction !== null}
            onAction={(action) => {
              void handleAction(action);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
