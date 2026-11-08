import { Button } from "../../../design-system/components/Button";
import { sortTableRecords } from "../../../utils/date";
import { getDeliveryStatusLabel } from "../types/delivery";
import type { Delivery, DeliveryStatus } from "../types/delivery";

type DeliveryAction = "prepare" | "ship" | "cancel";

type DeliveriesTableProps = {
  items: Delivery[];
  loading: boolean;
  canOperate: boolean;
  isAdmin: boolean;
  isDeliveryOperator: boolean;
  canApproveDelivery: boolean;
  detailsLoading: boolean;
  actionId: string | null;
  getStatusClass: (status: DeliveryStatus) => string;
  onOpenDetails: (delivery: Delivery) => void;
  onEdit: (delivery: Delivery) => void;
  onDelete: (delivery: Delivery) => void;
  onAction: (delivery: Delivery, action: DeliveryAction) => void;
  onHandoff: (delivery: Delivery) => void;
  formatDate: (value: string | null) => string;
};

export function DeliveriesTable({
  items, loading, canOperate, isAdmin, isDeliveryOperator, canApproveDelivery,
  detailsLoading, actionId, getStatusClass, onOpenDetails, onEdit, onDelete,
  onAction, onHandoff, formatDate,
}: DeliveriesTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full text-right text-sm">
        <thead className="bg-gray-50">
          <tr>{["سفارش", "گیرنده", "کارمند", "وضعیت", "زمان", "عملیات"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {loading && !items.length ? <tr><td colSpan={6} className="p-10 text-center">در حال دریافت…</td></tr> : !items.length ? <tr><td colSpan={6} className="p-10 text-center">ارسالی پیدا نشد.</td></tr> : sortTableRecords(items).map((delivery) => (
            <tr key={delivery.id}>
              <td className="px-4 py-3">{delivery.order?.code ?? "—"}<div className="text-xs text-gray-500">{delivery.customer?.name ?? ""}</div></td>
              <td className="px-4 py-3">{delivery.recipient_name || "در انتظار ثبت گیرنده"}<div className="text-xs text-gray-500">{delivery.recipient_phone ?? "—"}</div></td>
              <td className="px-4 py-3">{delivery.employee?.name ?? "—"}</td>
              <td className="px-4 py-3"><span className={`ui-status-pill ${getStatusClass(delivery.status)}`}>{getDeliveryStatusLabel(delivery.status)}</span></td>
              <td className="px-4 py-3">{formatDate(delivery.delivered_at ?? delivery.shipped_at ?? delivery.prepared_at ?? delivery.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {canOperate ? (
                    <>
                      <Button variant="view" size="sm" type="button" disabled={detailsLoading} onClick={() => onOpenDetails(delivery)} className="ui-btn-view rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60">مشاهده</Button>
                      {delivery.status === "pending" ? (
                        <>
                          {isAdmin ? <Button variant="edit" size="sm" type="button" onClick={() => onEdit(delivery)} className="ui-btn-edit rounded-lg border px-2.5 py-1.5 text-xs font-medium">ویرایش</Button> : null}
                          {isAdmin ? <Button variant="danger" size="sm" type="button" onClick={() => onDelete(delivery)} disabled={actionId === delivery.id} className="ui-btn-delete rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60">حذف</Button> : null}
                          {canApproveDelivery ? <Button variant="success" size="sm" type="button" disabled={actionId === delivery.id} onClick={() => onAction(delivery, "prepare")} className="ui-btn-success rounded-lg border px-2.5 py-1.5 text-xs font-medium">آماده‌سازی</Button> : null}
                          {canApproveDelivery ? <Button variant="danger" size="sm" type="button" disabled={actionId === delivery.id} onClick={() => onAction(delivery, "cancel")} className="ui-btn-delete rounded-lg border px-2.5 py-1.5 text-xs font-medium">لغو</Button> : null}
                        </>
                      ) : null}
                      {delivery.status === "preparing" && canApproveDelivery ? (
                        <>
                          <Button variant="success" size="sm" type="button" disabled={actionId === delivery.id} onClick={() => onAction(delivery, "ship")} className="ui-btn-success rounded-lg border px-2.5 py-1.5 text-xs font-medium">ارسال شد</Button>
                          <Button variant="danger" size="sm" type="button" disabled={actionId === delivery.id} onClick={() => onAction(delivery, "cancel")} className="ui-btn-delete rounded-lg border px-2.5 py-1.5 text-xs font-medium">لغو</Button>
                        </>
                      ) : null}
                      {delivery.status === "shipped" && (isDeliveryOperator || isAdmin) ? <Button variant="success" size="sm" type="button" disabled={actionId === delivery.id} onClick={() => onHandoff(delivery)} className="ui-btn-success rounded-lg border px-2.5 py-1.5 text-xs font-medium">تکمیل شد</Button> : null}
                    </>
                  ) : <span className="text-xs text-gray-400">فقط ادمین یا مسئول تحویل مجاز به ثبت تحویل نهایی است</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
