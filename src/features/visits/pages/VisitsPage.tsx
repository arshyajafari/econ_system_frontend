import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../../../api/client";
import type { Doctor } from "../../doctors/types/doctor";
import { VisitForm } from "../components/VisitForm";
import { cancelVisit, completeVisit, createVisit, getVisitDoctors, getVisitStatusLabel, getVisits, updateVisit } from "../services/visitsApi";
import type { Visit, VisitFormData, VisitStatus } from "../types/visit";

const statuses: VisitStatus[] = ["draft", "completed", "cancelled"];

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState<VisitStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Visit | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getVisits({ search: search.trim() || undefined, doctor_id: doctorId || undefined, status: status || undefined, visit_from: from || undefined, visit_to: to || undefined, sort: "-visit_date", page, per_page: 20 });
      setVisits(response.data);
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (requestError: unknown) {
      setError(requestError instanceof ApiError ? requestError.message : "خطا در دریافت بازدیدها.");
    } finally { setLoading(false); }
  }, [doctorId, from, page, search, status, to]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { getVisitDoctors().then(setDoctors).catch(() => setDoctors([])); }, []);

  function resetFilters() { setSearch(""); setDoctorId(""); setStatus(""); setFrom(""); setTo(""); setPage(1); }
  function openCreate() { setEditing(null); setFormError(null); setFormOpen(true); }
  function openEdit(visit: Visit) { setEditing(visit); setFormError(null); setFormOpen(true); }
  function closeForm() { if (!saving) { setFormOpen(false); setEditing(null); setFormError(null); } }

  async function handleSubmit(data: VisitFormData) {
    setSaving(true); setFormError(null);
    try {
      const saved = editing ? await updateVisit(editing.id, { visit_date: data.visit_date, purpose: data.purpose, description: data.description }) : await createVisit(data);
      if (editing) setVisits((current) => current.map((item) => item.id === saved.id ? saved : item));
      else { setVisits((current) => [saved, ...current].slice(0, 20)); setTotal((current) => current + 1); }
      setFormOpen(false); setEditing(null); setFormError(null);
    } catch (requestError: unknown) {
      setFormError(requestError instanceof ApiError ? requestError.message : "خطا در ذخیره بازدید.");
    } finally { setSaving(false); }
  }

  async function handleAction(visit: Visit, action: "complete" | "cancel") {
    if (actionId) return;
    if (!window.confirm(action === "complete" ? "بازدید تکمیل شود؟" : "بازدید لغو شود؟")) return;
    setActionId(visit.id); setError(null);
    try {
      const updated = action === "complete" ? await completeVisit(visit.id) : await cancelVisit(visit.id);
      setVisits((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError: unknown) {
      setError(requestError instanceof ApiError ? requestError.message : "خطا در تغییر وضعیت بازدید.");
    } finally { setActionId(null); }
  }

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">بازدیدها</h1><p className="mt-1 text-sm text-gray-500">ثبت و پیگیری بازدیدهای پزشکان</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-60">بروزرسانی</button><button type="button" onClick={openCreate} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white">بازدید جدید</button></div>
      </div>
      {error ? <div role="alert" aria-live="polite" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {formOpen ? <VisitForm doctors={doctors} visit={editing} isSubmitting={saving} error={formError} onSubmit={(data) => void handleSubmit(data)} onCancel={closeForm} /> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="جستجوی هدف یا توضیحات" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm lg:col-span-2" />
        <select value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="">همه پزشکان</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.first_name} {doctor.last_name}</option>)}</select>
        <select value={status} onChange={(e) => { setStatus(e.target.value as VisitStatus | ""); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"><option value="">همه وضعیت‌ها</option>{statuses.map((item) => <option key={item} value={item}>{getVisitStatusLabel(item)}</option>)}</select>
        <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
        <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
      </div>
      <div className="flex justify-between text-sm text-gray-500"><span>{new Intl.NumberFormat("fa-IR").format(total)} بازدید</span><button type="button" onClick={resetFilters} className="font-medium text-gray-700 hover:underline">پاک کردن فیلترها</button></div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-right text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3">تاریخ</th><th className="px-4 py-3">پزشک</th><th className="px-4 py-3">هدف</th><th className="px-4 py-3">کارمند</th><th className="px-4 py-3">وضعیت</th><th className="px-4 py-3">عملیات</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{loading && !visits.length ? <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">در حال دریافت بازدیدها...</td></tr> : !visits.length ? <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">بازدیدی پیدا نشد.</td></tr> : visits.map((visit) => <tr key={visit.id} className="hover:bg-gray-50"><td dir="ltr" className="whitespace-nowrap px-4 py-3">{formatDate(visit.visit_date)}</td><td className="px-4 py-3 font-medium">{visit.doctor?.name ?? "—"}<div className="text-xs font-normal text-gray-500">{visit.doctor?.clinic_name ?? ""}</div></td><td className="max-w-xs px-4 py-3">{visit.purpose || "—"}</td><td className="px-4 py-3">{visit.employee?.name ?? "—"}</td><td className="px-4 py-3">{getVisitStatusLabel(visit.status)}</td><td className="whitespace-nowrap px-4 py-3"><div className="flex gap-2">{visit.status === "draft" ? <><button type="button" onClick={() => openEdit(visit)} disabled={Boolean(actionId)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs">ویرایش</button><button type="button" onClick={() => void handleAction(visit, "complete")} disabled={actionId === visit.id} className="rounded-md border border-green-200 px-3 py-1.5 text-xs text-green-700">تکمیل</button><button type="button" onClick={() => void handleAction(visit, "cancel")} disabled={actionId === visit.id} className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-700">لغو</button></> : <span className="text-xs text-gray-400">بدون عملیات</span>}</div></td></tr>)}</tbody>
        </table>
      </div>
      {lastPage > 1 ? <div className="flex items-center justify-center gap-3"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">قبلی</button><span className="text-sm text-gray-600">صفحه {new Intl.NumberFormat("fa-IR").format(page)} از {new Intl.NumberFormat("fa-IR").format(lastPage)}</span><button type="button" disabled={page >= lastPage || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">بعدی</button></div> : null}
    </section>
  );
}
