import type { OrderReturn, OrderReturnStatus } from "../types/orderReturn";

type OrderReturnAction = "submit" | "confirm" | "complete" | "cancel";

type Props = {
  orderReturn: OrderReturn;

  disabled?: boolean;

  onAction: (action: OrderReturnAction) => void;
};

const actionLabels: Record<OrderReturnAction, string> = {
  submit: "ارسال برای بررسی",
  confirm: "تأیید مرجوعی",
  complete: "تکمیل مرجوعی",
  cancel: "لغو مرجوعی",
};

function getAvailableActions(status: OrderReturnStatus): OrderReturnAction[] {
  switch (status) {
    case "draft":
      return ["submit", "cancel"];

    case "pending":
      return ["confirm", "cancel"];

    case "confirmed":
      return ["complete", "cancel"];

    case "completed":
    case "cancelled":
      return [];

    default:
      return [];
  }
}

export function OrderReturnStatusActions({
  orderReturn,
  disabled = false,
  onAction,
}: Props) {
  const actions = getAvailableActions(orderReturn.status);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const isDanger = action === "cancel";

        const isPrimary = action === "complete" || action === "confirm";

        return (
          <button
            key={action}
            type="button"
            disabled={disabled}
            onClick={() => onAction(action)}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isDanger
                ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                : isPrimary
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
            ].join(" ")}
          >
            {actionLabels[action]}
          </button>
        );
      })}
    </div>
  );
}
