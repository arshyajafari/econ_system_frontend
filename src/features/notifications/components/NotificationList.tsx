import { Button } from "../../../design-system/components/Button";
import { Pagination } from "../../../components/Pagination";
import { sortTableRecords } from "../../../utils/date";
import type { SystemNotification, SendSystemMessagePayload } from "../services/notificationsApi";

type NotificationListProps = {
  notifications: SystemNotification[];
  loading: boolean;
  actionLoading: boolean;
  canManageMessages: boolean;
  page: number;
  lastPage: number;
  total: number;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onMarkRead: (notification: SystemNotification) => void;
  onEdit: (notification: SystemNotification) => void;
  onDelete: (notification: SystemNotification) => void;
  targetSummary: (notification: SystemNotification) => string;
  priorityLabel: (priority: SendSystemMessagePayload["priority"]) => string;
  priorityClass: (priority: SystemNotification["priority"]) => string;
  formatDate: (value: string) => string;
};

export function NotificationList({
  notifications, loading, actionLoading, canManageMessages, page, lastPage, total,
  onRefresh, onPageChange, onMarkRead, onEdit, onDelete, targetSummary,
  priorityLabel, priorityClass, formatDate,
}: NotificationListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-slate-900">صندوق پیام‌ها</h2>
        <Button variant="secondary" size="md" type="button" onClick={onRefresh} disabled={loading || actionLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label="بروزرسانی پیام‌ها">بروزرسانی</Button>
      </div>
      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">در حال دریافت پیام‌ها...</div>
      ) : notifications.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">پیامی برای نمایش وجود ندارد.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sortTableRecords(notifications).map((notification) => (
            <div key={notification.id} className={`block w-full p-5 text-right transition hover:bg-slate-50 ${notification.is_read ? "bg-white" : "bg-blue-50/40"}`} onClick={() => onMarkRead(notification)}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {!notification.is_read ? <span className="h-2 w-2 rounded-full bg-blue-600" aria-label="خوانده نشده" /> : null}
                    {notification.is_sent ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">ارسالی</span> : null}
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityClass(notification.priority)}`}>{priorityLabel(notification.priority)}</span>
                    {canManageMessages ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">مخاطب: {targetSummary(notification)}</span> : null}
                  </div>
                  <div className="mt-2.5">
                    <h3 className={`text-sm ${notification.is_read ? "font-semibold text-slate-800" : "font-bold text-slate-900"}`}>{notification.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600">{notification.body}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <time className="text-xs text-slate-400">{formatDate(notification.created_at)}</time>
                  {canManageMessages && notification.can_manage ? (
                    <>
                      <Button variant="edit" size="md" type="button" onClick={(event) => { event.stopPropagation(); onEdit(notification); }} className="ui-btn-edit rounded-lg border px-2 py-1 text-xs">ویرایش</Button>
                      <Button variant="danger" size="md" type="button" onClick={(event) => { event.stopPropagation(); onDelete(notification); }} className="ui-btn-delete rounded-lg border px-2 py-1 text-xs">حذف</Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} lastPage={lastPage} isLoading={loading} total={total} onPageChange={onPageChange} />
    </div>
  );
}
