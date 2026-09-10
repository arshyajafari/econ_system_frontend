import { useCallback, useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import { ApiError } from "../../../api/client";

import { PaymentFilters } from "../components/PaymentFilters";
import { PaymentForm } from "../components/PaymentForm";
import { PaymentTable } from "../components/PaymentTable";

import {
  cancelPayment,
  confirmPayment,
  createPayment,
  getPaymentInvoices,
  getPayments,
  updatePayment,
} from "../services/paymentsApi";

import type {
  Payment,
  PaymentFormData,
  PaymentInvoiceOption,
  PaymentMethod,
  PaymentStatus,
  PaymentStatusAction,
} from "../types/payment";

export function PaymentsPage() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState<Payment[]>([]);

  const [invoices, setInvoices] = useState<PaymentInvoiceOption[]>([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<PaymentStatus | "">("");

  const [method, setMethod] = useState<PaymentMethod | "">("");

  const [page, setPage] = useState(1);

  const [lastPage, setLastPage] = useState(1);

  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const requestIdRef = useRef(0);

  const loadInvoices = useCallback(async () => {
    setIsLoadingInvoices(true);

    try {
      const response = await getPaymentInvoices();

      setInvoices(response);
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در دریافت فاکتورها.",
      );
    } finally {
      setIsLoadingInvoices(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getPayments({
        search: search.trim() || undefined,
        status: status || undefined,
        method: method || undefined,
        page,
        per_page: 20,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setPayments(response.data);

      setLastPage(response.meta.last_page);

      setTotal(response.meta.total);
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در دریافت پرداخت‌ها.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [method, page, search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadInvoices();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadInvoices]);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        void loadPayments();
      },
      search.trim() ? 300 : 0,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadPayments, search]);

  function resetFilters() {
    setSearch("");
    setStatus("");
    setMethod("");
    setPage(1);
  }

  function openCreateForm() {
    setEditingPayment(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(payment: Payment) {
    if (payment.status !== "pending") {
      return;
    }

    setEditingPayment(payment);
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
    setEditingPayment(null);
    setFormError(null);
  }

  async function handleSubmit(data: PaymentFormData) {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id, data);
      } else {
        await createPayment(data);
      }

      setIsFormOpen(false);
      setEditingPayment(null);
      setFormError(null);

      await loadPayments();
    } catch (error: unknown) {
      setFormError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در ذخیره پرداخت.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAction(payment: Payment, action: PaymentStatusAction) {
    if (pendingPaymentId) {
      return;
    }

    if (action === "cancel") {
      const confirmed = window.confirm("آیا از لغو این پرداخت مطمئن هستید؟");

      if (!confirmed) {
        return;
      }
    }

    setPendingPaymentId(payment.id);

    setError(null);

    try {
      if (action === "confirm") {
        await confirmPayment(payment.id);
      } else {
        await cancelPayment(payment.id);
      }

      await loadPayments();
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "عملیات پرداخت انجام نشد.",
      );
    } finally {
      setPendingPaymentId(null);
    }
  }

  const canCreate = !isLoadingInvoices && invoices.length > 0;

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">پرداخت‌ها</h1>

          <p className="mt-1 text-sm text-gray-500">
            مدیریت پرداخت‌های مشتریان و تأیید آن‌ها
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              void loadPayments();
            }}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            بروزرسانی
          </button>

          <button
            type="button"
            disabled={!canCreate}
            onClick={openCreateForm}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            پرداخت جدید
          </button>
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
              void Promise.all([loadPayments(), loadInvoices()]);
            }}
            className="rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100"
          >
            تلاش مجدد
          </button>
        </div>
      ) : null}

      {isFormOpen ? (
        <PaymentForm
          key={editingPayment?.id ?? "new"}
          payment={editingPayment}
          invoices={invoices}
          isSubmitting={isSubmitting}
          error={formError}
          onSubmit={(data) => {
            void handleSubmit(data);
          }}
          onCancel={closeForm}
        />
      ) : null}

      <PaymentFilters
        search={search}
        status={status}
        method={method}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onMethodChange={(value) => {
          setMethod(value);
          setPage(1);
        }}
        onClear={resetFilters}
      />

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Intl.NumberFormat("fa-IR").format(total)} پرداخت</span>
      </div>

      <PaymentTable
        payments={payments}
        isLoading={isLoading}
        pendingPaymentId={pendingPaymentId}
        onView={(payment) => {
          navigate(`/payments/${payment.id}`);
        }}
        onEdit={openEditForm}
        onAction={(payment, action) => {
          void handleAction(payment, action);
        }}
      />

      {lastPage > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
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
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            بعدی
          </button>
        </div>
      ) : null}
    </section>
  );
}
