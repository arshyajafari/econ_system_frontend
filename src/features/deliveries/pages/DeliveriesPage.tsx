import { useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../auth";
import { IranAddressFields } from "../../../components/IranAddressFields";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { formatJalaliDateTime } from "../../../utils/date";
import {
  cancelDelivery,
  completeDelivery,
  createDelivery,
  getDeliveries,
  getAvailableOrders,
  prepareDelivery,
  shipDelivery,
  updateDelivery,
  getDelivery,
} from "../services/deliveriesApi";
import {
  DELIVERY_STATUS_OPTIONS,
  getDeliveryStatusLabel,
} from "../types/delivery";
import type {
  Delivery,
  DeliveryFormData,
  DeliveryStatus,
} from "../types/delivery";
import type { DeliveryOrderSource } from "../services/deliveriesApi";

const empty: DeliveryFormData = {
  order_id: "",
  recipient_name: "",
  recipient_phone: "",
  province: "",
  city: "",
  address: "",
  description: "",
};

export function DeliveriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;
  const isDeliveryOperator = user?.roles.includes("delivery operator") ?? false;
  const isAccountant = user?.roles.includes("accountant") ?? false;
  const canOperate = isAdmin || isAccountant || isDeliveryOperator;
  const canApproveDelivery = isAdmin;
  const canManageForm = isAdmin || isDeliveryOperator;
  const [items, setItems] = useState<Delivery[]>([]),
    [availableOrders, setAvailableOrders] = useState<DeliveryOrderSource[]>([]),
    [status, setStatus] = useState<DeliveryStatus | "">(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [last, setLast] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [saving, setSaving] = useState(false),
    [actionId, setActionId] = useState<string | null>(null),
    [form, setForm] = useState<DeliveryFormData>(empty),
    [editing, setEditing] = useState<Delivery | null>(null),
    [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null),
    [detailsLoading, setDetailsLoading] = useState(false),
    [actionTarget, setActionTarget] = useState<{
      delivery: Delivery;
      action: "prepare" | "ship" | "complete" | "cancel";
    } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getDeliveries({
        search: search.trim() || undefined,
        status: status || undefined,
        sort: "-created_at",
        page,
        per_page: 20,
      });
      setItems(r.data);
      setLast(r.meta.last_page);
      setTotal(r.meta.total);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در دریافت ارسال‌ها.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let dead = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await getDeliveries({
          search: search.trim() || undefined,
          status: status || undefined,
          sort: "-created_at",
          page,
          per_page: 20,
        });
        if (!dead) {
          setItems(r.data);
          setLast(r.meta.last_page);
          setTotal(r.meta.total);
        }
      } catch (e: unknown) {
        if (!dead)
          setError(
            e instanceof ApiError ? e.message : "خطا در دریافت ارسال‌ها",
          );
      } finally {
        if (!dead) setLoading(false);
      }
    };
    void run();
    return () => {
      dead = true;
    };
  }, [page, search, status]);
  useEffect(() => {
    if (!canManageForm) return;

    getAvailableOrders()
      .then(setAvailableOrders)
      .catch((e: unknown) => {
        setAvailableOrders([]);
        setError(
          e instanceof ApiError
            ? e.message
            : "خطا در دریافت سفارش‌های آماده ارسال.",
        );
      });
  }, [canManageForm]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = editing
        ? await updateDelivery(editing.id, form)
        : await createDelivery(form);
      setItems((x) =>
        editing
          ? x.map((i) => (i.id === saved.id ? saved : i))
          : [saved, ...x].slice(0, 20),
      );
      if (!editing) {
        setTotal((x) => x + 1);
        setAvailableOrders((x) => x.filter((order) => order.id !== form.order_id));
      }
      setForm(empty);
      setEditing(null);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در ذخیره ارسال.");
    } finally {
      setSaving(false);
    }
  };
  const action = async (
    d: Delivery,
    a: "prepare" | "ship" | "complete" | "cancel",
  ) => {
    if (actionId) return;
    setActionId(d.id);
    try {
      const u =
        a === "prepare"
          ? await prepareDelivery(d.id)
          : a === "ship"
            ? await shipDelivery(d.id)
            : a === "complete"
              ? await completeDelivery(d.id)
              : await cancelDelivery(d.id);
      setItems((x) => x.map((i) => (i.id === u.id ? u : i)));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در تغییر وضعیت ارسال.");
    } finally {
      setActionId(null);
    }
  };
  const openDetails = async (d: Delivery) => {
    setDetailsLoading(true);
    setError(null);
    try {
      const details = await getDelivery(d.id);
      setSelectedDelivery(details);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در دریافت جزئیات ارسال.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const startEdit = (d: Delivery) => {
    setEditing(d);
    setForm({
      order_id: d.order?.id ?? "",
      recipient_name: d.recipient_name,
      recipient_phone: d.recipient_phone ?? "",
      province: d.province ?? "",
      city: d.city ?? "",
      address: d.address ?? "",
      description: d.description ?? "",
    });
  };

  return (
    <section className="space-y-5 p-4 md:p-6">
      <header className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">ارسال‌ها</h1>
          <p className="text-sm text-gray-500">
            مدیریت آماده‌سازی، ارسال و تحویل سفارش‌ها
          </p>
        </div>
        {canManageForm ? (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm(empty);
            }}
            className="rounded-lg bg-gray-900 px-4 py-2 text-white"
          >
            ارسال جدید
          </button>
        ) : null}
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {canManageForm ? (
      <form
        onSubmit={submit}
        className="space-y-3 rounded-xl border bg-white p-4"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <select
            required
            disabled={Boolean(editing) || saving}
            value={form.order_id}
            onChange={(e) => setForm({ ...form, order_id: e.target.value })}
            className="rounded-lg border px-3 py-2"
          >
            <option value="">انتخاب سفارش آماده ارسال</option>
            {availableOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.code} — {order.customer?.name ?? "بدون مشتری"}
              </option>
            ))}
          </select>
          <input
            required
            disabled={saving}
            value={form.recipient_name}
            onChange={(e) =>
              setForm({ ...form, recipient_name: e.target.value })
            }
            placeholder="نام گیرنده"
            className="rounded-lg border px-3 py-2"
          />
          <IranAddressFields
            province={form.province}
            city={form.city}
            onProvinceChange={(province) =>
              setForm((current) => ({ ...current, province, city: "" }))
            }
            onCityChange={(city) =>
              setForm((current) => ({ ...current, city }))
            }
            disabled={saving}
            className="md:col-span-1"
          />
          <input
            disabled={saving}
            value={form.recipient_phone}
            onChange={(e) =>
              setForm({ ...form, recipient_phone: e.target.value })
            }
            placeholder="تلفن گیرنده"
            className="rounded-lg border px-3 py-2"
          />
          <input
            disabled={saving}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="آدرس"
            className="rounded-lg border px-3 py-2 md:col-span-1"
          />
          <textarea
            disabled={saving}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="توضیحات"
            className="rounded-lg border px-3 py-2 md:col-span-2"
          />
        </div>
        <div className="flex gap-2">
          <button
            disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-2 text-white"
          >
            {editing ? "ذخیره تغییرات" : "ثبت ارسال"}
          </button>
          {editing && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
              className="rounded-lg border px-4 py-2"
            >
              انصراف
            </button>
          )}
        </div>
      </form>
      ) : null}
      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="جستجوی گیرنده یا توضیحات"
          className="flex-1 rounded-lg border px-3 py-2"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as DeliveryStatus | "");
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2"
        >
          <option value="">همه وضعیت‌ها</option>
          {DELIVERY_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border px-4"
        >
          بروزرسانی
        </button>
      </div>
      <div className="text-sm text-gray-500">
        {new Intl.NumberFormat("fa-IR").format(total)} ارسال
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["سفارش", "گیرنده", "کارمند", "وضعیت", "زمان", "عملیات"].map(
                (x) => (
                  <th key={x} className="px-4 py-3">
                    {x}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && !items.length ? (
              <tr>
                <td colSpan={6} className="p-10 text-center">
                  در حال دریافت…
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td colSpan={6} className="p-10 text-center">
                  ارسالی پیدا نشد.
                </td>
              </tr>
            ) : (
              items.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3">
                    {d.order?.code ?? "—"}
                    <div className="text-xs text-gray-500">
                      {d.customer?.name ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {d.recipient_name}
                    <div className="text-xs text-gray-500">
                      {d.recipient_phone ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">{d.employee?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {getDeliveryStatusLabel(d.status)}
                  </td>
                  <td className="px-4 py-3">
                    {formatJalaliDateTime(
                      d.delivered_at ??
                        d.shipped_at ??
                        d.prepared_at ??
                        d.created_at,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canOperate ? (
                        <>
                          <button
                            type="button"
                            disabled={detailsLoading}
                            onClick={() => void openDetails(d)}
                            className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            مشاهده
                          </button>
                          {d.status === "pending" && (
                            <>
                              {canManageForm ? (
                                <button
                                  type="button"
                                  onClick={() => startEdit(d)}
                                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  ویرایش
                                </button>
                              ) : null}
{canApproveDelivery ? <button
                                type="button"
                                disabled={actionId === d.id}
                                onClick={() => setActionTarget({ delivery: d, action: "prepare" })}
                                className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                              >آماده‌سازی</button> : null}
                              {canApproveDelivery ? <button
                                type="button"
                                disabled={actionId === d.id}
                                onClick={() =>
                                  setActionTarget({
                                    delivery: d,
                                    action: "cancel",
                                  })
                                }
                                className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                              >
                                لغو
                              </button> : null}
                            </>
                          )}
                          {d.status === "preparing" && canApproveDelivery && (
                            <>
                              <button
                                type="button"
                                disabled={actionId === d.id}
                                onClick={() =>
                                  setActionTarget({
                                    delivery: d,
                                    action: "ship",
                                  })
                                }
                                className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                              >
                                ارسال
                              </button>
                              <button
                                type="button"
                                disabled={actionId === d.id}
                                onClick={() =>
                                  setActionTarget({
                                    delivery: d,
                                    action: "cancel",
                                  })
                                }
                                className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                              >
                                لغو
                              </button>
                            </>
                          )}
                          {d.status === "shipped" && isDeliveryOperator && (
                            <button
                              type="button"
                              disabled={actionId === d.id}
                              onClick={() =>
                                setActionTarget({
                                  delivery: d,
                                  action: "complete",
                                })
                              }
                              className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                            >
                              تحویل
                            </button>
                          )}
                          {canApproveDelivery && d.status !== "shipped" && d.status !== "delivered" ? null : null}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">
                          فقط نقش مسئول تحویل یا ادمین مجاز است
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {last > 1 && (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((x) => x - 1)}
            className="rounded border px-4 py-2"
          >
            قبلی
          </button>
          <span className="py-2">
            {page} / {last}
          </span>
          <button
            type="button"
            disabled={page >= last || loading}
            onClick={() => setPage((x) => x + 1)}
            className="rounded border px-4 py-2"
          >
            بعدی
          </button>
        </div>
      )}
      {selectedDelivery ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="delivery-details-title">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 id="delivery-details-title" className="text-lg font-bold text-gray-900">جزئیات ارسال</h2>
                <p className="mt-1 text-sm text-gray-500">{selectedDelivery.order?.code ?? "بدون سفارش"}</p>
              </div>
              <button type="button" onClick={() => setSelectedDelivery(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">بستن</button>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4"><div className="text-xs text-gray-500">وضعیت</div><div className="mt-1 font-semibold">{getDeliveryStatusLabel(selectedDelivery.status)}</div></div>
              <div className="rounded-xl bg-gray-50 p-4"><div className="text-xs text-gray-500">مشتری</div><div className="mt-1 font-semibold">{selectedDelivery.customer?.name ?? "—"}</div></div>
              <div className="rounded-xl bg-gray-50 p-4"><div className="text-xs text-gray-500">کارمند</div><div className="mt-1 font-semibold">{selectedDelivery.employee?.name ?? "—"}</div></div>
              <div className="rounded-xl bg-gray-50 p-4"><div className="text-xs text-gray-500">گیرنده</div><div className="mt-1 font-semibold">{selectedDelivery.recipient_name || "—"}</div></div>
              <div className="rounded-xl bg-gray-50 p-4"><div className="text-xs text-gray-500">تلفن گیرنده</div><div dir="ltr" className="mt-1 text-right font-semibold">{selectedDelivery.recipient_phone || "—"}</div></div>
              <div className="rounded-xl bg-gray-50 p-4"><div className="text-xs text-gray-500">استان / شهر</div><div className="mt-1 font-semibold">{[selectedDelivery.province, selectedDelivery.city].filter(Boolean).join(" / ") || "—"}</div></div>
              <div className="rounded-xl bg-gray-50 p-4 md:col-span-2"><div className="text-xs text-gray-500">آدرس</div><div className="mt-1 leading-7">{selectedDelivery.address || "—"}</div></div>
              <div className="rounded-xl bg-gray-50 p-4 md:col-span-2"><div className="text-xs text-gray-500">توضیحات</div><div className="mt-1 leading-7">{selectedDelivery.description || "—"}</div></div>
              <div className="rounded-xl border p-4"><div className="text-xs text-gray-500">زمان ایجاد</div><div className="mt-1">{formatJalaliDateTime(selectedDelivery.created_at)}</div></div>
              <div className="rounded-xl border p-4"><div className="text-xs text-gray-500">آماده‌سازی</div><div className="mt-1">{formatJalaliDateTime(selectedDelivery.prepared_at)}</div></div>
              <div className="rounded-xl border p-4"><div className="text-xs text-gray-500">ارسال</div><div className="mt-1">{formatJalaliDateTime(selectedDelivery.shipped_at)}</div></div>
              <div className="rounded-xl border p-4"><div className="text-xs text-gray-500">تحویل</div><div className="mt-1">{formatJalaliDateTime(selectedDelivery.delivered_at)}</div></div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={actionTarget !== null}
        title="تأیید عملیات ارسال"
        description={
          actionTarget
            ? `آیا از انجام عملیات «${actionTarget.action === "prepare" ? "آماده‌سازی" : actionTarget.action === "ship" ? "ارسال" : actionTarget.action === "complete" ? "تحویل" : "لغو"}» برای این ارسال مطمئن هستید؟`
            : ""
        }
        confirmLabel="تأیید"
        cancelLabel="انصراف"
        variant={actionTarget?.action === "cancel" ? "danger" : "primary"}
        isLoading={actionId !== null}
        onCancel={() => setActionTarget(null)}
        onConfirm={() => {
          if (actionTarget) {
            void action(actionTarget.delivery, actionTarget.action).finally(
              () => setActionTarget(null),
            );
          }
        }}
      />
    </section>
  );
}
