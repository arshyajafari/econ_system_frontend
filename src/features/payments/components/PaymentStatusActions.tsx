import type { Payment, PaymentStatusAction } from "../types/payment";

type PaymentStatusActionsProps = {
  payment: Payment;
  disabled?: boolean;
  onAction: (action: PaymentStatusAction) => void;
};

export function PaymentStatusActions({
  payment,
  disabled = false,
  onAction,
}: PaymentStatusActionsProps) {
  if (payment.status !== "pending") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction("confirm")}
        className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        تأیید پرداخت
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction("cancel")}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        لغو پرداخت
      </button>
    </div>
  );
}
