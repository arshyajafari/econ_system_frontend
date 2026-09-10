import { OrderStatusActions } from "./OrderStatusActions";

import { canEditOrder, getOrderStatusLabel } from "../types/order";

import type { Order, OrderStatusAction } from "../types/order";

type OrderTableProps = {
  orders: Order[];
  isLoading: boolean;
  pendingOrderId: string | null;
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onAction: (order: Order, action: OrderStatusAction) => void;
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
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getOrderTotal(order: Order): number {
  return order.items.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0,
  );
}

function statusClass(status: Order["status"]): string {
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

export function OrderTable({
  orders,
  isLoading,
  pendingOrderId,
  onView,
  onEdit,
  onAction,
}: OrderTableProps) {
  if (isLoading && orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        در حال دریافت سفارش‌ها...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        سفارشی برای نمایش وجود ندارد.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-50 text-right text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">سفارش</th>

              <th className="px-4 py-3 font-medium">مشتری</th>

              <th className="px-4 py-3 font-medium">کارشناس فروش</th>

              <th className="px-4 py-3 font-medium">وضعیت</th>

              <th className="px-4 py-3 font-medium">اقلام</th>

              <th className="px-4 py-3 font-medium">مبلغ</th>

              <th className="px-4 py-3 font-medium">تاریخ</th>

              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => {
              const isPending = pendingOrderId === order.id;

              return (
                <tr key={order.id}>
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold text-gray-900">
                      {order.code}
                    </div>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-gray-800">
                      {order.customer?.customer_name ?? "—"}
                    </div>

                    {order.customer?.code ? (
                      <div className="mt-1 text-xs text-gray-500">
                        {order.customer.code}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="text-gray-800">
                      {order.sales_employee?.name ?? "—"}
                    </div>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                        order.status,
                      )}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>

                  <td className="px-4 py-4 align-top">
                    {formatNumber(order.items.length)}
                  </td>

                  <td
                    dir="ltr"
                    className="px-4 py-4 align-top font-medium text-gray-800"
                  >
                    {formatNumber(getOrderTotal(order))}
                  </td>

                  <td className="px-4 py-4 align-top text-gray-600">
                    {formatDate(order.ordered_at)}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => onView(order)}
                        disabled={isPending}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        مشاهده
                      </button>

                      {canEditOrder(order.status) ? (
                        <button
                          type="button"
                          onClick={() => onEdit(order)}
                          disabled={isPending}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ویرایش
                        </button>
                      ) : null}

                      <OrderStatusActions
                        order={order}
                        disabled={isPending}
                        onAction={(action) => onAction(order, action)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isLoading && orders.length > 0 ? (
        <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
          در حال بروزرسانی...
        </div>
      ) : null}
    </div>
  );
}
