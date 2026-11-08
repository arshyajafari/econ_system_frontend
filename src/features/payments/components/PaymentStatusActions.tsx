import { Button } from "../../../design-system/components/Button";
import type { Payment, PaymentStatusAction } from '../types/payment';

type PaymentStatusActionsProps = {
    payment: Payment;
    disabled?: boolean;
    canConfirm?: boolean;
    canCancel?: boolean;
    onAction: (action: PaymentStatusAction) => void;
};

export function PaymentStatusActions({
    payment,
    disabled = false,
    canConfirm = false,
    canCancel = false,
    onAction,
}: PaymentStatusActionsProps) {
    if (payment.status !== 'pending' || (!canConfirm && !canCancel)) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {canConfirm ? (
                <Button
                    size="sm"
                    variant="success"
                    disabled={disabled}
                    onClick={() => onAction('confirm')}
                >
                    تأیید پرداخت
                </Button>
            ) : null}

            {canCancel ? (
                <Button
                    size="sm"
                    variant="danger"
                    disabled={disabled}
                    onClick={() => onAction('cancel')}
                >
                    لغو پرداخت
                </Button>
            ) : null}
        </div>
    );
}
