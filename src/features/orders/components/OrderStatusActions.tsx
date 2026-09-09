import type { Order, OrderStatus } from "../types/order";

type OrderStatusActionsProps = {
  order: Order;
  disabled?: boolean;
  onAction: (action: OrderStatusAction) => void;
};

export type OrderStatusAction = "submit" | "confirm" | "complete" | "cancel";

export function OrderStatusActions({
  order,
  disabled = false,
  onAction,
}: OrderStatusActionsProps) {
  const actions: Array<{
    action: OrderStatusAction;
    label: string;
    className: string;
  }> = [];

  if (order.status === "draft") {
    actions.push({
      action: "submit",
      label: "ارسال برای تأیید",
      className: "border-blue-200 text-blue-700 hover:bg-blue-50",
    });
  }

  if (order.status === "pending") {
    actions.push({
      action: "confirm",
      label: "تأیید سفارش",
      className: "border-green-200 text-green-700 hover:bg-green-50",
    });
  }

  if (order.status === "confirmed") {
    actions.push({
      action: "complete",
      label: "تکمیل سفارش",
      className: "border-purple-200 text-purple-700 hover:bg-purple-50",
    });
  }

  if (order.status !== "completed" && order.status !== "cancelled") {
    actions.push({
      action: "cancel",
      label: "لغو",
      className: "border-red-200 text-red-700 hover:bg-red-50",
    });
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((item) => (
        <button
          key={item.action}
          type="button"
          disabled={disabled}
          onClick={() => onAction(item.action)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${item.className}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function canEditOrder(status: OrderStatus): boolean {
  return status === "draft";
}
