import { Button } from "../../../design-system/components/Button";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { normalizeApiError } from "../../../api/client";
import { formatJalaliDateTime } from "../../../utils/date";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { NotificationList } from "../components/NotificationList";
import { useAuth } from "../../auth";
import {
  deleteSystemMessage,
  getNotificationRecipients,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendSystemMessage,
  updateSystemMessage,
  type NotificationRecipients,
  type SendSystemMessagePayload,
  type SystemNotification,
} from "../services/notificationsApi";
const priorityLabels: Record<SendSystemMessagePayload["priority"], string> = {
  low: "کم",
  normal: "عادی",
  high: "مهم",
  urgent: "فوری",
};
function priorityClass(priority: SystemNotification["priority"]): string {
  if (priority === "urgent") return "bg-red-50 text-red-700";
  if (priority === "high") return "bg-amber-50 text-amber-700";
  if (priority === "low") return "bg-slate-100 text-slate-600";
  return "bg-blue-50 text-blue-700";
}
const initialForm: SendSystemMessagePayload = {
  target_type: "all",
  title: "",
  body: "",
  priority: "normal",
};
export function NotificationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;
  const isAccountant = user?.roles.includes("accountant") ?? false;
  const canManageMessages = isAdmin || isAccountant;
  const [notifications, setNotifications] = useState<SystemNotification[]>([]),
    [page, setPage] = useState(1),
    [lastPage, setLastPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [actionLoading, setActionLoading] = useState(false),
    [error, setError] = useState<string | null>(null),
    [recipients, setRecipients] = useState<NotificationRecipients | null>(null),
    [canSend, setCanSend] = useState(false),
    [form, setForm] = useState<SendSystemMessagePayload>(initialForm),
    [success, setSuccess] = useState<string | null>(null),
    [editing, setEditing] = useState<SystemNotification | null>(null),
    [deleteTarget, setDeleteTarget] = useState<SystemNotification | null>(null);
  const selectedUserIds = form.user_ids ?? [],
    selectedPositions = form.position_types ?? [];
  const loadNotifications = async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getNotifications(targetPage);
      setNotifications(result.data);
      setPage(result.meta.current_page);
      setLastPage(result.meta.last_page);
      setTotal(result.meta.total);
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void getNotifications(1)
      .then((result) => {
        setNotifications(result.data);
        setPage(result.meta.current_page);
        setLastPage(result.meta.last_page);
        setTotal(result.meta.total);
      })
      .catch((requestError) =>
        setError(normalizeApiError(requestError).message),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    getNotificationRecipients()
      .then((result) => {
        setRecipients(result);
        setCanSend(true);
      })
      .catch(() => setCanSend(false));
  }, []);
  const selectedRecipientLabel = useMemo(
    () =>
      form.target_type === "all"
        ? "همه کاربران فعال"
        : form.target_type === "positions"
          ? `${selectedPositions.length} پوزیشن انتخاب شده`
          : `${selectedUserIds.length} کاربر انتخاب شده`,
    [form.target_type, selectedPositions.length, selectedUserIds.length],
  );
  const targetSummary = (notification: SystemNotification) => {
    if (notification.target_type === "all" || notification.target_type === null)
      return "همه کاربران فعال";
    if (notification.target_type === "positions") {
      const labels = notification.target_values.map(
        (value) =>
          recipients?.positions.find((position) => position.value === value)
            ?.label ?? value,
      );
      return labels.length ? labels.join("، ") : "پوزیشن نامشخص";
    }
    const names = notification.target_values.map(
      (value) =>
        recipients?.users.find((recipient) => recipient.id === value)?.name ??
        value,
    );
    return names.length ? names.join("، ") : "شخص نامشخص";
  };
  const canSubmit =
    form.title.trim().length > 0 &&
    form.body.trim().length > 0 &&
    (form.target_type === "all" ||
      (form.target_type === "users" && selectedUserIds.length > 0) ||
      (form.target_type === "positions" && selectedPositions.length > 0));
  const markRead = async (notification: SystemNotification) => {
    if (notification.is_read) return;
    try {
      const updated = await markNotificationRead(notification.id);
      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    }
  };
  const markAllRead = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true })),
      );
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setActionLoading(false);
    }
  };
  const removeMessage = async () => {
    if (!deleteTarget?.message_id) return;
    setActionLoading(true);
    setError(null);
    try {
      await deleteSystemMessage(deleteTarget.message_id);
      setDeleteTarget(null);
      await loadNotifications(page);
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setActionLoading(false);
    }
  };
  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (editing) {
        await updateSystemMessage(editing.message_id ?? editing.id, {
          title: form.title,
          body: form.body,
          priority: form.priority,
        });
        setEditing(null);
        setSuccess("اعلان با موفقیت ویرایش شد.");
        await loadNotifications(page);
        setForm(initialForm);
        return;
      }
      const payload: SendSystemMessagePayload = {
        ...form,
        ...(form.target_type === "users" ? { user_ids: selectedUserIds } : {}),
        ...(form.target_type === "positions"
          ? { position_types: selectedPositions }
          : {}),
      };
      const result = await sendSystemMessage(payload);
      setSuccess(
        `پیام با موفقیت برای ${result.recipients_count.toLocaleString("fa-IR")} کاربر ارسال شد.`,
      );
      setForm(initialForm);
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setActionLoading(false);
    }
  };
  return (
    <>
      <ConfirmModal
        open={deleteTarget !== null}
        title="حذف اعلان"
        description="آیا از حذف این اعلان برای همه دریافت‌کنندگان مطمئن هستید؟"
        confirmLabel="حذف اعلان"
        variant="danger"
        isLoading={actionLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void removeMessage()}
      />

      <section className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              پیام‌ها و اعلان‌ها
            </h1>
          </div>
          <Button variant="secondary" size="md"
            type="button"
            onClick={() => void markAllRead()}
            disabled={
              actionLoading || !notifications.some((item) => !item.is_read)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            علامت همه به‌عنوان خوانده‌شده
          </Button>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            role="status"
            className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {success}
          </div>
        ) : null}

        {canSend ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                ارسال پیام مدیریتی
              </h2>
            </div>

            <form className="space-y-5" onSubmit={sendMessage}>
              <div className="grid gap-4 md:grid-cols-3">
                {(["all", "users", "positions"] as const).map((target) => {
                  const labels = {
                    all: "همه کاربران",
                    users: "شخص خاص",
                    positions: "پوزیشن کاری خاص",
                  };

                  return (
                    <Button variant="secondary" size="md"
                      key={target}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          target_type: target,
                        }))
                      }
                      className={`rounded-xl border p-4 text-right transition ${form.target_type === target ? "border-blue-300 bg-blue-300 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                    >
                      <span className="block text-sm font-bold">
                        {labels[target]}
                      </span>
                      <span className="mt-1 block text-xs text-white-200">
                        {target === "all"
                          ? "ارسال برای تمام کاربران فعال"
                          : target === "users"
                            ? "انتخاب یک یا چند کاربر"
                            : "انتخاب پوزیشن کاری دریافت‌کننده"}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {form.target_type === "users" && recipients ? (
                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    کاربران دریافت‌کننده
                  </span>
                  <div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-2 lg:grid-cols-3">
                    {recipients.users.map((recipient) => (
                      <label
                        key={recipient.id}
                        className="flex items-center gap-2 rounded-lg p-3 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(recipient.id)}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              user_ids: event.target.checked
                                ? [...(current.user_ids ?? []), recipient.id]
                                : (current.user_ids ?? []).filter(
                                    (item) => item !== recipient.id,
                                  ),
                            }))
                          }
                        />
                        {recipient.name}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {form.target_type === "positions" && recipients ? (
                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    پوزیشن‌های دریافت‌کننده
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {recipients.positions.map((position) => (
                      <label
                        key={position.value}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPositions.includes(position.value)}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              position_types: event.target.checked
                                ? [
                                    ...(current.position_types ?? []),
                                    position.value,
                                  ]
                                : (current.position_types ?? []).filter(
                                    (item) => item !== position.value,
                                  ),
                            }))
                          }
                        />
                        {position.label}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    عنوان پیام
                  </span>
                  <input
                    required
                    maxLength={120}
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="مثلاً تغییر ساعت جلسه فردا"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    اولویت
                  </span>
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priority: event.target
                          .value as SendSystemMessagePayload["priority"],
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="w-full">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  متن پیام
                </span>
                <textarea
                  required
                  maxLength={5000}
                  rows={1}
                  value={form.body}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                  placeholder="متن پیام مدیریتی را وارد کنید..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-slate-400">
                  گیرندگان: {selectedRecipientLabel}
                </span>
                <Button variant="primary" size="md"
                  type="submit"
                  disabled={actionLoading || !canSubmit}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? "در حال ارسال..." : "ارسال پیام"}
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        <NotificationList
          notifications={notifications}
          loading={loading}
          actionLoading={actionLoading}
          canManageMessages={canManageMessages}
          page={page}
          lastPage={lastPage}
          total={total}
          onRefresh={() => void loadNotifications(page)}
          onPageChange={(nextPage) => void loadNotifications(nextPage)}
          onMarkRead={(notification) => void markRead(notification)}
          onEdit={(notification) => {
            setEditing(notification);
            setForm({
              target_type: "all",
              title: notification.title,
              body: notification.body,
              priority: notification.priority,
            });
          }}
          onDelete={(notification) => setDeleteTarget(notification)}
          targetSummary={targetSummary}
          priorityLabel={(priority) => priorityLabels[priority]}
          priorityClass={priorityClass}
          formatDate={formatJalaliDateTime}
        />
      </section>
    </>
  );
}
