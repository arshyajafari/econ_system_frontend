import type { CustomerLedgerTransaction } from "../types/customerLedger";

type CustomerLedgerTableProps = {
  transactions: CustomerLedgerTransaction[];
  isLoading: boolean;
};

const numberFormatter = new Intl.NumberFormat("fa-IR");

const sourceLabels = {
  invoice: "فاکتور",
  payment: "پرداخت",
  order_return: "مرجوعی",
} as const;

function formatAmount(value: number | string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount === 0) {
    return "—";
  }

  return numberFormatter.format(amount);
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
    timeStyle: "short",
  }).format(date);
}

function getSourceLabel(transaction: CustomerLedgerTransaction): string {
  if (!transaction.source) {
    return "—";
  }

  const label = sourceLabels[transaction.source.type];

  if (!label) {
    return "—";
  }

  if (transaction.source.type === "invoice") {
    return transaction.source.code
      ? `${label} ${transaction.source.code}`
      : label;
  }

  if (transaction.source.type === "payment") {
    return transaction.source.reference_number
      ? `${label} ${transaction.source.reference_number}`
      : label;
  }

  return transaction.source.code
    ? `${label} ${transaction.source.code}`
    : label;
}

export function CustomerLedgerTable({
  transactions,
  isLoading,
}: CustomerLedgerTableProps) {
  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
        <p className="text-sm text-gray-500">در حال دریافت گردش حساب...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
        <div>
          <p className="font-medium text-gray-700">
            تراکنشی برای نمایش وجود ندارد.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            برای این مشتری و بازه انتخاب‌شده گردش حسابی ثبت نشده است.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-right text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                تاریخ
              </th>

              <th className="min-w-64 px-4 py-3 font-semibold text-gray-700">
                شرح
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                بدهکار
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                بستانکار
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                مانده
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                منبع
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {formatDate(transaction.transaction_at)}
                </td>

                <td className="px-4 py-3 text-gray-900">
                  {transaction.description || "—"}
                </td>

                <td
                  dir="ltr"
                  className="whitespace-nowrap px-4 py-3 font-medium text-red-700"
                >
                  {formatAmount(transaction.debit)}
                </td>

                <td
                  dir="ltr"
                  className="whitespace-nowrap px-4 py-3 font-medium text-green-700"
                >
                  {formatAmount(transaction.credit)}
                </td>

                <td
                  dir="ltr"
                  className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900"
                >
                  {formatAmount(transaction.balance)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {getSourceLabel(transaction)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isLoading ? (
        <div className="border-t border-gray-100 px-4 py-3 text-center text-xs text-gray-400">
          در حال بروزرسانی...
        </div>
      ) : null}
    </div>
  );
}
