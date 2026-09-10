import { PaymentStatusActions } from "./PaymentStatusActions";

import type { Payment, PaymentStatusAction } from "../types/payment";

import { getPaymentMethodLabel, getPaymentStatusLabel } from "../types/payment";

type PaymentTableProps = {
  payments: Payment[];
  isLoading: boolean;
  pendingPaymentId: string | null;
  onView: (payment: Payment) => void;
  onEdit: (payment: Payment) => void;
  onAction: (payment: Payment, action: PaymentStatusAction) => void;
};

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
    dateStyle: "short",
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

export function PaymentTable({
  payments,
  isLoading,
  pendingPaymentId,
  onView,
  onEdit,
  onAction,
}: PaymentTableProps) {
  if (isLoading && payments.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        در حال دریافت پرداخت‌ها...
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        پرداختی برای نمایش وجود ندارد.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[1150px] w-full text-sm">
          <thead className="bg-gray-50 text-right text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">فاکتور</th>

              <th className="px-4 py-3 font-medium">مشتری</th>

              <th className="px-4 py-3 font-medium">مبلغ</th>

              <th className="px-4 py-3 font-medium">روش</th>

              <th className="px-4 py-3 font-medium">وضعیت</th>

              <th className="px-4 py-3 font-medium">تاریخ</th>

              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {payments.map((payment) => {
              const isPending = pendingPaymentId === payment.id;

              return (
                <tr key={payment.id}>
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold text-gray-900">
                      {payment.invoice?.code ?? "—"}
                    </div>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-gray-800">
                      {payment.customer?.name ?? "—"}
                    </div>

                    {payment.customer?.code ? (
                      <div className="mt-1 text-xs text-gray-500">
                        {payment.customer.code}
                      </div>
                    ) : null}
                  </td>

                  <td
                    dir="ltr"
                    className="px-4 py-4 align-top font-semibold text-gray-900"
                  >
                    {formatNumber(Number(payment.amount || 0))}
                  </td>

                  <td className="px-4 py-4 align-top">
                    {getPaymentMethodLabel(payment.method)}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                        payment.status,
                      )}`}
                    >
                      {getPaymentStatusLabel(payment.status)}
                    </span>
                  </td>

                  <td className="px-4 py-4 align-top text-gray-600">
                    {formatDate(payment.payment_date)}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onView(payment)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        مشاهده
                      </button>

                      {payment.status === "pending" ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => onEdit(payment)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          ویرایش
                        </button>
                      ) : null}

                      <PaymentStatusActions
                        payment={payment}
                        disabled={isPending}
                        onAction={(action) => onAction(payment, action)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isLoading && payments.length > 0 ? (
        <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
          در حال بروزرسانی...
        </div>
      ) : null}
    </div>
  );
}
