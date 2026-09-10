import { useNavigate } from "react-router-dom";

import type { OrderReturn } from "../types/orderReturn";

type Props = {
  orderReturns: OrderReturn[];

  isLoading?: boolean;
};

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

function getStatusLabel(status: OrderReturn["status"]): string {
  switch (status) {
    case "draft":
      return "پیش‌نویس";

    case "pending":
      return "در انتظار تأیید";

    case "confirmed":
      return "تأیید شده";

    case "completed":
      return "تکمیل شده";

    case "cancelled":
      return "لغو شده";
  }
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

function getReturnTotal(orderReturn: OrderReturn): number {
  return orderReturn.items.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0,
  );
}

export function OrderReturnTable({ orderReturns, isLoading = false }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        در حال دریافت مرجوعی‌ها...
      </div>
    );
  }

  if (orderReturns.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        هنوز مرجوعی‌ای ثبت نشده است.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 text-right text-gray-600">
            <tr>
              <th className="px-5 py-3 font-medium">کد مرجوعی</th>

              <th className="px-5 py-3 font-medium">سفارش</th>

              <th className="px-5 py-3 font-medium">مشتری</th>

              <th className="px-5 py-3 font-medium">تعداد اقلام</th>

              <th className="px-5 py-3 font-medium">مبلغ</th>

              <th className="px-5 py-3 font-medium">وضعیت</th>

              <th className="px-5 py-3 font-medium">تاریخ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {orderReturns.map((orderReturn) => (
              <tr
                key={orderReturn.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/order-returns/${orderReturn.id}`)}
              >
                <td className="px-5 py-4 font-medium text-gray-900">
                  {orderReturn.code}
                </td>

                <td className="px-5 py-4 text-gray-700">
                  {orderReturn.order?.code ?? "—"}
                </td>

                <td className="px-5 py-4 text-gray-700">
                  {orderReturn.customer?.name ?? "—"}
                </td>

                <td className="px-5 py-4">
                  {formatNumber(
                    orderReturn.items.reduce(
                      (sum, item) => sum + Number(item.quantity || 0),
                      0,
                    ),
                  )}
                </td>

                <td dir="ltr" className="px-5 py-4 font-medium text-gray-900">
                  {formatNumber(getReturnTotal(orderReturn))}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                      orderReturn.status,
                    )}`}
                  >
                    {getStatusLabel(orderReturn.status)}
                  </span>
                </td>

                <td className="px-5 py-4 text-gray-500">
                  {formatDate(orderReturn.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
