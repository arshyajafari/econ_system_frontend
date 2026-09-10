import { useEffect, useMemo, useState } from "react";

import type { FormEvent } from "react";

import { ApiError } from "../../../api/client";

import { getPayments } from "../services/paymentsApi";

import { PAYMENT_METHOD_OPTIONS } from "../types/payment";

import type {
  Payment,
  PaymentFormData,
  PaymentInvoiceOption,
  PaymentMethod,
} from "../types/payment";

type PaymentFormProps = {
  payment: Payment | null;
  invoices: PaymentInvoiceOption[];
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
};

const numberFormatter = new Intl.NumberFormat("fa-IR");

export function PaymentForm({
  payment,
  invoices,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [invoiceId, setInvoiceId] = useState(payment?.invoice?.id ?? "");

  const [method, setMethod] = useState<PaymentMethod>(
    payment?.method ?? "cash",
  );

  const [amount, setAmount] = useState(payment ? String(payment.amount) : "");

  const [referenceNumber, setReferenceNumber] = useState(
    payment?.reference_number ?? "",
  );

  const [paymentDate, setPaymentDate] = useState(
    payment?.payment_date ?? new Date().toISOString().slice(0, 10),
  );

  const [description, setDescription] = useState(payment?.description ?? "");

  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([]);

  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const [balanceError, setBalanceError] = useState<string | null>(null);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === invoiceId) ?? null,
    [invoiceId, invoices],
  );

  useEffect(() => {
    let cancelled = false;

    if (!invoiceId) {
      const timeoutId = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        setInvoicePayments([]);
        setBalanceError(null);
        setIsLoadingBalance(false);
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(timeoutId);
      };
    }

    async function loadInvoicePayments() {
      setIsLoadingBalance(true);
      setBalanceError(null);

      try {
        const response = await getPayments({
          invoice_id: invoiceId,
          per_page: 500,
        });

        if (!cancelled) {
          setInvoicePayments(response.data);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setBalanceError(
            error instanceof ApiError && error.message
              ? error.message
              : "خطا در دریافت وضعیت پرداخت فاکتور.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBalance(false);
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadInvoicePayments();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [invoiceId]);

  const confirmedAmount = invoicePayments
    .filter((item) => item.status === "confirmed")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const pendingAmount = invoicePayments
    .filter((item) => item.status === "pending" && item.id !== payment?.id)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const remainingAmount = selectedInvoice
    ? Math.max(
        0,
        Number(selectedInvoice.total_amount || 0) -
          confirmedAmount -
          pendingAmount,
      )
    : 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!invoiceId) {
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    onSubmit({
      invoice_id: invoiceId,
      method,
      amount: amount.trim(),
      reference_number: referenceNumber,
      payment_date: paymentDate,
      description,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {payment ? "ویرایش پرداخت" : "پرداخت جدید"}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          فقط فاکتورهای صادرشده قابل پرداخت هستند.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {balanceError ? (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700"
        >
          {balanceError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            فاکتور
          </label>

          <select
            required
            disabled={isSubmitting || Boolean(payment)}
            value={invoiceId}
            onChange={(event) => setInvoiceId(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option value="">انتخاب فاکتور</option>

            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.code} —{" "}
                {numberFormatter.format(Number(invoice.total_amount || 0))}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            روش پرداخت
          </label>

          <select
            required
            disabled={isSubmitting}
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            مبلغ
          </label>

          <input
            required
            min="0.01"
            step="any"
            type="number"
            disabled={isSubmitting}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          {selectedInvoice ? (
            <div className="mt-2 text-xs text-gray-500">
              {isLoadingBalance
                ? "در حال محاسبه مانده..."
                : `مانده قابل پرداخت: ${numberFormatter.format(
                    remainingAmount,
                  )}`}
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            تاریخ پرداخت
          </label>

          <input
            required
            type="date"
            disabled={isSubmitting}
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            شماره مرجع
          </label>

          <input
            type="text"
            maxLength={100}
            disabled={isSubmitting}
            value={referenceNumber}
            onChange={(event) => setReferenceNumber(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="شماره پیگیری، چک و..."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            توضیحات
          </label>

          <input
            type="text"
            disabled={isSubmitting}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !invoiceId}
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "در حال ذخیره..." : "ذخیره پرداخت"}
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}
