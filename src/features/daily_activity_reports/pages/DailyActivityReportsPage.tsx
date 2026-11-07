import { useCallback, useEffect, useState, type FormEvent } from "react";
import { normalizeApiError } from "../../../api/client";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import {
  createDailyActivityReport,
  deleteDailyActivityReport,
  getDailyActivityReport,
  exportDailyActivityReports,
  getDailyActivityReports,
  updateDailyActivityReport,
  type ActivityResult,
  type ContactType,
  type DailyActivityReport,
  type DailyActivityReportInput,
} from "../services/dailyActivityReportsApi";

type FormState = DailyActivityReportInput;
const today = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
};
const emptyForm = (): FormState => ({
  visit_date: today(), visit_time: "", organization_name: "", contact_name: "",
  contact_type: "in_person", purpose: "", discussion: "", employee_question: "",
  audience_feedback: "", outcome: "", result: "neutral",
});
const resultLabels: Record<ActivityResult, string> = {
  positive: "مثبت", neutral: "خنثی", negative: "منفی", follow_up: "نیازمند پیگیری",
};
const resultStyles: Record<ActivityResult, string> = { positive: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", neutral: "bg-slate-100 text-slate-700 ring-slate-500/20", negative: "bg-rose-50 text-rose-700 ring-rose-600/20", follow_up: "bg-amber-50 text-amber-800 ring-amber-600/20" };
const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("fa-IR-u-ca-persian");

export function DailyActivityReportsPage() {
  const [rows, setRows] = useState<DailyActivityReport[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<DailyActivityReport | null>(null);
  const [viewing, setViewing] = useState<DailyActivityReport | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DailyActivityReport | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [contactType, setContactType] = useState<ContactType | "">("");
  const [result, setResult] = useState<ActivityResult | "">("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDailyActivityReports({
        page, per_page: 20, search: search.trim() || undefined,
        from: from || undefined, to: to || undefined, contact_type: contactType, result,
      });
      setRows(response.data);
      setLastPage(response.meta?.last_page ?? 1);
      setTotal(response.meta?.total ?? response.data.length);
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, from, to, contactType, result]);


  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await getDailyActivityReports({
          page, per_page: 20, search: search.trim() || undefined,
          from: from || undefined, to: to || undefined,
          contact_type: contactType, result,
        });
        if (!active) return;
        setRows(response.data);
        setLastPage(response.meta?.last_page ?? 1);
        setTotal(response.meta?.total ?? response.data.length);
      } catch (e) {
        if (active) setError(normalizeApiError(e).message);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [page, search, from, to, contactType, result]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
    setError(null);
  };

  const openEdit = (row: DailyActivityReport) => {
    setEditing(row);
    setForm({
      visit_date: row.visit_date, visit_time: row.visit_time?.slice(0, 5) ?? "",
      organization_name: row.organization_name, contact_name: row.contact_name ?? "",
      contact_type: row.contact_type, purpose: row.purpose, discussion: row.discussion,
      employee_question: row.employee_question ?? "", audience_feedback: row.audience_feedback ?? "",
      outcome: row.outcome, result: row.result,
    });
    setFormOpen(true);
    setError(null);
  };

  const openView = async (row: DailyActivityReport) => {
    setViewLoading(true);
    setViewing(row);
    try {
      const detail = await getDailyActivityReport(row.id);
      setViewing(detail);
    } catch (e) {
      setError(normalizeApiError(e).message);
      setViewing(null);
    } finally {
      setViewLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteDailyActivityReport(deleteTarget.id);
      setSuccess("گزارش فعالیت با موفقیت حذف شد.");
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setDeleting(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...form,
        visit_time: form.visit_time || null,
        contact_name: (form.contact_name ?? '').trim() || null,
        employee_question: (form.employee_question ?? '').trim() || null,
        audience_feedback: (form.audience_feedback ?? '').trim() || null,
      };
      if (editing) {
        await updateDailyActivityReport(editing.id, payload);
        setSuccess("گزارش با موفقیت به‌روزرسانی شد.");
      } else {
        await createDailyActivityReport(payload);
        setSuccess("گزارش فعالیت با موفقیت ثبت شد.");
      }
      setFormOpen(false);
      setEditing(null);
      await refresh();
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setSaving(false);
    }
  };

  const exportRows = async () => {
    try {
      await exportDailyActivityReports({ search, from: from || undefined, to: to || undefined, contact_type: contactType, result });
    } catch (e) {
      setError(normalizeApiError(e).message);
    }
  };

  return (
    <section className="space-y-5 p-4 md:p-6" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">گزارش فعالیت روزانه</h1>
          <p className="mt-1 text-sm text-slate-500">ثبت خلاصه مراجعه‌ها و مذاکرات؛ بدون وابستگی به پرونده پزشک یا داروخانه</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void exportRows()} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">خروجی Excel</button>
          <button onClick={openCreate} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">ثبت گزارش جدید</button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      {formOpen && (
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">{editing ? "ویرایش گزارش فعالیت" : "ثبت گزارش فعالیت"}</h2>
            <button type="button" onClick={() => setFormOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">بستن</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1 text-sm"><span className="font-semibold text-slate-700">تاریخ مراجعه</span><JalaliDateInput value={form.visit_date} onChange={(v) => updateField("visit_date", v)} required className="w-full" /></label>
            <label className="space-y-1 text-sm"><span className="font-semibold text-slate-700">ساعت مراجعه (اختیاری)</span><input type="time" value={form.visit_time ?? ""} onChange={(e) => updateField("visit_time", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
            <label className="space-y-1 text-sm"><span className="font-semibold text-slate-700">نوع ارتباط</span><select value={form.contact_type} onChange={(e) => updateField("contact_type", e.target.value as ContactType)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="in_person">حضوری</option><option value="phone">تلفنی</option></select></label>
            <label className="space-y-1 text-sm"><span className="font-semibold text-slate-700">نام مجموعه / محل مراجعه</span><input required maxLength={180} value={form.organization_name} onChange={(e) => updateField("organization_name", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
            <label className="space-y-1 text-sm"><span className="font-semibold text-slate-700">نام مخاطب</span><input maxLength={160} value={form.contact_name ?? ""} onChange={(e) => updateField("contact_name", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
            <label className="space-y-1 text-sm"><span className="font-semibold text-slate-700">نتیجه استاندارد</span><select value={form.result} onChange={(e) => updateField("result", e.target.value as ActivityResult)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="positive">مثبت</option><option value="neutral">خنثی</option><option value="negative">منفی</option><option value="follow_up">نیازمند پیگیری</option></select></label>
          </div>
          {([
            ["purpose", "هدف از مراجعه", true],
            ["discussion", "شرح مذاکرات", true],
            ["employee_question", "سؤال یا موضوع مطرح‌شده توسط کارمند (اختیاری)", false],
            ["audience_feedback", "بازخورد مخاطب (اختیاری)", false],
            ["outcome", "نتیجه و جمع‌بندی مراجعه", true],
          ] as const).map(([key, label, required]) => (
            <label key={key} className="block space-y-1 text-sm"><span className="font-semibold text-slate-700">{label}</span><textarea required={required} rows={key === "discussion" || key === "audience_feedback" ? 3 : 2} value={form[key] ?? ""} onChange={(e) => updateField(key, e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400" /></label>
          ))}

          <div className="flex justify-end gap-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">انصراف</button><button disabled={saving} className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "ثبت گزارش"}</button></div>
        </form>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="جست‌وجو در نام کارمند، مجموعه، مخاطب و مذاکرات" className="min-w-56 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <div className="w-40"><JalaliDateInput value={from} onChange={(v) => { setPage(1); setFrom(v); }} placeholder="از تاریخ" className="w-full" /></div>
        <div className="w-40"><JalaliDateInput value={to} onChange={(v) => { setPage(1); setTo(v); }} placeholder="تا تاریخ" className="w-full" /></div>
        <select value={contactType} onChange={(e) => { setPage(1); setContactType(e.target.value as ContactType | ""); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">همه روش‌ها</option><option value="in_person">حضوری</option><option value="phone">تلفنی</option></select>
        <select value={result} onChange={(e) => { setPage(1); setResult(e.target.value as ActivityResult | ""); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">همه نتایج</option><option value="positive">مثبت</option><option value="neutral">خنثی</option><option value="negative">منفی</option><option value="follow_up">نیازمند پیگیری</option></select>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 md:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewing(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="daily-report-detail-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl md:p-7">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4"><div><h2 id="daily-report-detail-title" className="text-lg font-bold text-slate-900">جزئیات گزارش فعالیت</h2><p className="mt-1 text-sm text-slate-500">{viewing.organization_name} · {dateLabel(viewing.visit_date)}</p></div><button type="button" onClick={() => setViewing(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600">بستن</button></div>
            {viewLoading ? <p className="py-10 text-center text-sm text-slate-500">در حال دریافت جزئیات...</p> : <div className="mt-5 space-y-4 text-sm">
              <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3"><div><span className="text-xs text-slate-500">کارمند</span><p className="mt-1 font-semibold text-slate-800">{viewing.employee.name}</p></div><div><span className="text-xs text-slate-500">مخاطب</span><p className="mt-1 font-semibold text-slate-800">{viewing.contact_name || "—"}</p></div><div><span className="text-xs text-slate-500">نوع ارتباط</span><p className="mt-1 font-semibold text-slate-800">{viewing.contact_type === "phone" ? "تلفنی" : "حضوری"}</p></div><div><span className="text-xs text-slate-500">ساعت</span><p className="mt-1 font-semibold text-slate-800">{viewing.visit_time || "ثبت نشده"}</p></div><div><span className="text-xs text-slate-500">نتیجه</span><p className="mt-1"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${resultStyles[viewing.result]}`}>{resultLabels[viewing.result]}</span></p></div><div><span className="text-xs text-slate-500">تاریخ مراجعه</span><p className="mt-1 font-semibold text-slate-800">{dateLabel(viewing.visit_date)}</p></div></div>
              {([["هدف از مراجعه", viewing.purpose], ["شرح مذاکرات", viewing.discussion], ["سؤال یا موضوع مطرح‌شده توسط کارمند", viewing.employee_question], ["بازخورد مخاطب", viewing.audience_feedback], ["نتیجه و جمع‌بندی", viewing.outcome]] as Array<[string, string | null | undefined]>).map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 p-4"><h3 className="mb-2 font-bold text-slate-800">{label}</h3><p className="whitespace-pre-wrap leading-7 text-slate-600">{value?.trim() || "موردی ثبت نشده است."}</p></div>)}
            </div>}
          </section>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 className="font-bold text-slate-900">حذف گزارش فعالیت</h2><p className="mt-2 text-sm leading-7 text-slate-600">آیا از حذف گزارش «{deleteTarget.organization_name}» در تاریخ {dateLabel(deleteTarget.visit_date)} مطمئن هستید؟ این عملیات قابل بازگشت نیست.</p><div className="mt-5 flex justify-end gap-2"><button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">انصراف</button><button type="button" disabled={deleting} onClick={() => void confirmDelete()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{deleting ? "در حال حذف..." : "حذف گزارش"}</button></div></section>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 text-sm"><strong className="text-slate-800">فهرست گزارش‌های فعالیت</strong><span className="text-slate-500">{new Intl.NumberFormat("fa-IR").format(total)} مورد</span></div>
        {loading ? <p className="p-8 text-center text-sm text-slate-500">در حال دریافت گزارش‌ها...</p> : rows.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">گزارشی برای نمایش وجود ندارد.</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600"><tr><th className="whitespace-nowrap px-4 py-3">تاریخ</th><th className="px-4 py-3">مجموعه / مخاطب</th><th className="px-4 py-3">کارمند</th><th className="px-4 py-3">ارتباط</th><th className="px-4 py-3">نتیجه</th><th className="px-4 py-3">خلاصه</th><th className="px-4 py-3">عملیات</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.id} className="align-top hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{dateLabel(row.visit_date)}{row.visit_time ? <span className="block text-xs text-slate-400">{row.visit_time}</span> : null}</td>
                <td className="max-w-56 px-4 py-3"><strong className="block text-slate-800">{row.organization_name}</strong>{row.contact_name ? <span className="mt-1 block text-xs text-slate-500">{row.contact_name}</span> : null}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.employee.name}</td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.contact_type === "phone" ? "تلفنی" : "حضوری"}</td>
                <td className="whitespace-nowrap px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${resultStyles[row.result]}`}>{resultLabels[row.result]}</span></td>
                <td className="max-w-72 px-4 py-3"><p className="line-clamp-2 text-slate-600">{row.purpose} — {row.outcome}</p></td>
                <td className="whitespace-nowrap px-4 py-3"><div className="flex items-center gap-1.5"><button type="button" onClick={() => void openView(row)} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">مشاهده</button><button type="button" onClick={() => openEdit(row)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">ویرایش</button><button type="button" onClick={() => setDeleteTarget(row)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">حذف</button></div></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">قبلی</button><span className="text-slate-500">صفحه {new Intl.NumberFormat("fa-IR").format(page)} از {new Intl.NumberFormat("fa-IR").format(lastPage)}</span><button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">بعدی</button></div>
      </div>
    </section>
  );
}
