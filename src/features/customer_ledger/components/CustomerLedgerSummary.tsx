import { formatJalaliDate } from "../../../utils/date";

type CustomerLedgerSummaryProps = {
  openingBalance: number | string;
  totalDebit: number | string;
  totalCredit: number | string;
  closingBalance: number | string;
  averageDueDate: string | null;
};

const numberFormatter = new Intl.NumberFormat("fa-IR");

function formatAmount(value: number | string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "۰";
  }

  return numberFormatter.format(amount);
}

export function CustomerLedgerSummary({
  openingBalance,
  totalDebit,
  totalCredit,
  closingBalance,
  averageDueDate,
}: CustomerLedgerSummaryProps) {
  const items = [
    {
      title: "مانده ابتدای بازه",
      value: formatAmount(openingBalance),
      valueClass: "text-gray-900",
    },
    {
      title: "مجموع بدهکار",
      value: formatAmount(totalDebit),
      valueClass: "text-red-700",
    },
    {
      title: "مجموع بستانکار",
      value: formatAmount(totalCredit),
      valueClass: "text-green-700",
    },
  ];

  const averageDueDateItem = {
    title: "میانگین سررسید مانده",
    value: averageDueDate ? formatJalaliDate(averageDueDate) : "—",
    valueClass: "text-blue-700",
  };

  const signedClosingBalance = Number(closingBalance);
  const closingBalanceItem = !Number.isFinite(signedClosingBalance)
    ? {
        title: "مانده نهایی",
        value: formatAmount(closingBalance),
        valueClass: "text-gray-900",
      }
    : {
        title:
          signedClosingBalance > 0
            ? "مانده قابل پرداخت مشتری"
            : signedClosingBalance < 0
              ? "اعتبار مشتری"
              : "وضعیت حساب",
        value: formatAmount(Math.abs(signedClosingBalance)),
        valueClass:
          signedClosingBalance > 0
            ? "text-red-700"
            : signedClosingBalance < 0
              ? "text-green-700"
              : "text-gray-900",
      };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {[...items, averageDueDateItem, closingBalanceItem].map((item) => (
        <div
          key={item.title}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <p className="text-sm text-gray-500">{item.title}</p>
          <p className={`mt-2 text-xl font-bold ${item.valueClass}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
