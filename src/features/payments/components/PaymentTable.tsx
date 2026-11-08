import { Button } from "../../../design-system/components/Button";
import { TableContainer } from "../../../design-system/components/TableContainer";
import { StatusBadge } from "../../../design-system/components/StatusBadge";
import { PaymentStatusActions } from './PaymentStatusActions';
import type { Payment, PaymentStatusAction } from '../types/payment';
import { getPaymentMethodLabel, getPaymentStatusLabel } from '../types/payment';
import { formatJalaliDate } from '../../../utils/date';

type PaymentTableProps = {
    payments: Payment[];
    isLoading: boolean;
    pendingPaymentId: string | null;
    onView: (payment: Payment) => void;
    onEdit: (payment: Payment) => void;
    onAction: (payment: Payment, action: PaymentStatusAction) => void;
    canEdit?: boolean;
    canConfirm?: boolean;
    canCancel?: boolean;
};

const numberFormatter = new Intl.NumberFormat('fa-IR');

function formatNumber(value: number) {
    return numberFormatter.format(value);
}

function statusVariant(status: Payment["status"]): "warning" | "success" | "danger" {
    switch (status) {
        case "pending":
            return "warning";
        case "confirmed":
            return "success";
        case "cancelled":
            return "danger";
    }
}

export function PaymentTable({
    payments,
    isLoading,
    pendingPaymentId,
    onView,
    onEdit,
    onAction,
    canEdit = false,
    canConfirm = false,
    canCancel = false,
}: PaymentTableProps) {
    const sortedPayments = [...payments].sort((a, b) => {
        const rank = (status: string) =>
            status === 'pending' ? 0 : status === 'confirmed' ? 1 : 2;
        const statusOrder = rank(a.status) - rank(b.status);
        if (statusOrder !== 0) return statusOrder;
        const dateValue = (item: Payment) => {
            const row = item as Payment & {
                confirmed_at?: string | null;
                created_at?: string | null;
            };
            return Date.parse(row.confirmed_at || item.payment_date || row.created_at || '') || 0;
        };
        return dateValue(b) - dateValue(a);
    });

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
            <TableContainer className="ui-table-container--embedded" aria-label="جدول پرداخت‌ها">
<table className="min-w-[1150px] w-full text-sm">
                    <thead className="bg-gray-50 text-right text-gray-600">
                        <tr>
                            {[
                                'مشتری',
                                'مبلغ',
                                'تخفیف تسویه',
                                'روش',
                                'وضعیت',
                                'تاریخ',
                                'عملیات',
                            ].map((label) => (
                                <th key={label} className="px-4 py-3 font-medium">
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedPayments.map((payment) => (
                            <tr key={payment.id}>
                                <td className="px-4 py-4 align-top">
                                    <div className="font-medium text-gray-800">
                                        {payment.customer?.name ?? '—'}
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
                                <td dir="ltr" className="px-4 py-4 align-top">
                                    {Number(payment.settlement_discount_amount || 0) > 0
                                        ? formatNumber(Number(payment.settlement_discount_amount))
                                        : '—'}
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <div>{getPaymentMethodLabel(payment.method)}</div>
                                    {payment.method === 'cheque' && payment.cheque_details ? (
                                        <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                                            <div>
                                                چک: {payment.cheque_details.number || '—'} ·{' '}
                                                {payment.cheque_details.bank_name || '—'}
                                            </div>
                                            <div>
                                                سررسید: {payment.cheque_details.due_date || '—'}
                                            </div>
                                            <div>
                                                {payment.cheque_details.status === 'cleared'
                                                    ? 'وصول‌شده'
                                                    : payment.cheque_details.status === 'cancelled'
                                                      ? 'لغوشده'
                                                      : 'در انتظار وصول'}
                                            </div>
                                        </div>
                                    ) : null}
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <StatusBadge variant={statusVariant(payment.status)}>{getPaymentStatusLabel(payment.status)}</StatusBadge>
                                </td>
                                <td className="px-4 py-4 align-top text-gray-600">
                                    {formatJalaliDate(payment.payment_date)}
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <Button size="sm" variant="view" disabled={pendingPaymentId === payment.id} onClick={() => onView(payment)}>مشاهده</Button>
                                        {canEdit && payment.status === 'pending' ? (
                                            <Button size="sm" variant="edit" disabled={pendingPaymentId === payment.id} onClick={() => onEdit(payment)}>ویرایش</Button>
                                        ) : null}
                                        <PaymentStatusActions
                                            payment={payment}
                                            canConfirm={canConfirm}
                                            canCancel={canCancel}
                                            disabled={pendingPaymentId === payment.id}
                                            onAction={(action) => onAction(payment, action)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
</TableContainer>
            {isLoading && payments.length > 0 ? (
                <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
                    در حال بروزرسانی...
                </div>
            ) : null}
        </div>
    );
}
