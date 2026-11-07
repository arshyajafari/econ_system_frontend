import { useCallback, useEffect, useState, type FormEvent } from "react";
import { normalizeApiError } from "../../../api/client";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import {
  createDailyActivityReport,
  exportDailyActivityReports,
  getDailyActivityReports,
  updateDailyActivityReport,
  type ActivityResult,
  type ContactType,
  type DailyActivityReport,
  type DailyActivityReportInput,
} from "../api/dailyActivityReports";

type FormState = DailyActivityReportInput & { edit_reason: string };
const today = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
};
const emptyForm = (): FormState => ({
  visit_date: today(), visit_time: "", organization_name: "", contact_name: "",
  contact_type: "in_person", purpose: "", discussion: "", employee_question: "",
  audience_feedback: "", outcome: "", result: "neutral", edit_reason: "",
});
const resultLabels: Record<ActivityResult, string> = {
  positive: "مثبت", neutral: "خنثی", negative: "منفی", follow_up: "نیازمند پیگیری",
};
const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("fa-IR-u-ca-persian");

export function DailyActivityReportsPage() {
  const [rows, setRows] = useState<DailyActivityReport[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<DailyActivityReport | null>(null);
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
        contact_type: contactType, result,
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
      visit_date: row.visit_date, visit_time: row.visit_time ?? "",
      organization_name: row.organization_name, contact_name: row.contact_name ?? "",
      contact_type: row.contact_type, purpose: row.purpose, discussion: row.discussion,
      employee_question: row.employee_question ?? "", audience_feedback: row.audience_feedback ?? "",
      outcome: row.outcome, result: row.result, edit_reason: "",
    });
    setFormOpen(true);
    setError(null);
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
        contact_name: form.contact_name.trim() || null,
        employee_question: form.employee_question.trim() || null,
        audience_feedback: form.audience_feedback.trim() || null,
      };
      if (editing) {
        await updateDailyActivityReport(editing.id, payload);
        setSuccess("گزارش با ثبت سابقه ویرایش به‌روزرسانی شد.");
      } else {
        const { edit_reason: _editReason, ...createPayload } = payload;
        await createDailyActivityReport(createPayload);
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
    <section className="mx-auto max-w-7xl space-y-5 p-4 md:p-6" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">گزارش فعالیت روزانه</h1>
          <p className="mt-1 text-sm text-slate-500">ثبت خلاصه مراجعه‌ها و مذاکرات؛ بدون وابستگی به پرونده پزشک یا داروخانه</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void exportRows()} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">خروجی Excel</button>
          <button onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">ثبت گزارش جدید</button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      {formOpen && (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
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
          {editing && <label className="block space-y-1 text-sm"><span className="font-semibold text-slate-700">دلیل ویرایش (اجباری)</span><input required minLength={5} maxLength={500} value={form.edit_reason} onChange={(e) => updateField("edit_reason", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" placeholder="علت اصلاح اطلاعات ثبت‌شده را بنویسید" /></label>}
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">انصراف</button><button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "در حال ذخیره..." : editing ? "ذخیره و ثبت سابقه ویرایش" : "ثبت گزارش"}</button></div>
        </form>
      )}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="جست‌وجو در نام کارمند، مجموعه، مخاطب و مذاکرات" className="min-w-56 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <div className="w-40"><JalaliDateInput value={from} onChange={(v) => { setPage(1); setFrom(v); }} placeholder="از تاریخ" className="w-full" /></div>
        <div className="w-40"><JalaliDateInput value={to} onChange={(v) => { setPage(1); setTo(v); }} placeholder="تا تاریخ" className="w-full" /></div>
        <select value={contactType} onChange={(e) => { setPage(1); setContactType(e.target.value as ContactType | ""); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">همه روش‌ها</option><option value="in_person">حضوری</option><option value="phone">تلفنی</option></select>
        <select value={result} onChange={(e) => { setPage(1); setResult(e.target.value as ActivityResult | ""); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">همه نتایج</option><option value="positive">مثبت</option><option value="neutral">خنثی</option><option value="negative">منفی</option><option value="follow_up">نیازمند پیگیری</option></select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm"><strong className="text-slate-800">گزارش‌های قابل مشاهده</strong><span className="text-slate-500">{new Intl.NumberFormat("fa-IR").format(total)} مورد</span></div>
        {loading ? <p className="p-8 text-center text-sm text-slate-500">در حال دریافت گزارش‌ها...</p> : rows.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">گزارشی برای نمایش وجود ندارد.</p> : (
          <div className="divide-y divide-slate-100">
            {rows.map((row) => <article key={row.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><div className="font-bold text-slate-900">{row.organization_name}{row.contact_name ? ` — ${row.contact_name}` : ""}</div><div className="mt-1 text-xs text-slate-500">{dateLabel(row.visit_date)}{row.visit_time ? ` · ${row.visit_time}` : ""} · {row.contact_type === "phone" ? "تلفنی" : "حضوری"} · {row.employee.name}</div></div>
                <div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{resultLabels[row.result]}</span><button onClick={() => openEdit(row)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">ویرایش</button></div>
              </div>
              <p className="text-sm text-slate-700"><strong>هدف:</strong> {row.purpose}</p>
              <p className="whitespace-pre-wrap text-sm text-slate-600"><strong>مذاکرات:</strong> {row.discussion}</p>
              <p className="whitespace-pre-wrap text-sm text-slate-600"><strong>نتیجه:</strong> {row.outcome}</p>
            </article>)}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">قبلی</button><span className="text-slate-500">صفحه {page} از {lastPage}</span><button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">بعدی</button></div>
      </div>
    </section>
  );
}
