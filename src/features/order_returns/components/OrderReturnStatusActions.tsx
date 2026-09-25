import type { OrderReturn, OrderReturnStatus } from "../types/orderReturn";

type OrderReturnAction = "submit" | "confirm" | "complete" | "cancel";

type Props = {
  orderReturn: OrderReturn;
  disabled?: boolean;
  canConfirm?: boolean;
  canComplete?: boolean;
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
    case "draft": return ["submit", "cancel"];
    case "pending": return ["confirm", "cancel"];
    case "confirmed": return ["complete", "cancel"];
    case "completed":
    case "cancelled":
    default: return [];
  }
}

export function OrderReturnStatusActions({
  orderReturn,
  disabled = false,
  canConfirm = false,
  canComplete = false,
  onAction,
}: Props) {
  const actions = getAvailableActions(orderReturn.status).filter((action) => {
    if (action === "confirm") return canConfirm;
    if (action === "complete") return canComplete;
    return true;
  });

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
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
                ? "ui-btn-delete border"
                : isPrimary
                  ? "ui-btn-primary border"
                  : "ui-btn-view border",
            ].join(" ")}
          >
            {actionLabels[action]}
          </button>
        );
      })}
    </div>
  );
}
