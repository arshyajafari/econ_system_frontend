import { useCallback, useEffect, useState } from "react";
import { normalizeApiError } from "../../../api/client";
import {
  cleanupDailyActivityReports,
  exportManagedDailyActivityReports,
  getActivityCleanupHistory,
  getManagedDailyActivityReports,
  type ActivityCleanupRun,
  type DailyActivityReport,
} from "../../daily_activity_reports/services/dailyActivityReportsApi";

const faNumber = new Intl.NumberFormat("fa-IR");
const jalali = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("fa-IR-u-ca-persian");
export function DailyActivityReportCleanupSection() {
  const [rows, setRows] = useState<DailyActivityReport[]>([]);
  const [history, setHistory] = useState<ActivityCleanupRun[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [archive, runs] = await Promise.all([
        getManagedDailyActivityReports({ search: search.trim() || undefined, per_page: 100, page }),
        getActivityCleanupHistory(),
      ]);
      setRows(archive.data);
      setLastPage(archive.meta?.last_page ?? 1);
      setHistory(runs);
      setSelected([]);
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [archive, runs] = await Promise.all([
          getManagedDailyActivityReports({ search: search.trim() || undefined, per_page: 100, page }),
          getActivityCleanupHistory(),
        ]);
        if (!active) return;
        setRows(archive.data);
        setLastPage(archive.meta?.last_page ?? 1);
        setHistory(runs);
        setSelected([]);
      } catch (e) {
        if (active) setError(normalizeApiError(e).message);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [search, page]);

  const toggle = (id: number, checked: boolean) =>
    setSelected((current) => checked ? [...current, id] : current.filter((item) => item !== id));

  const runCleanup = async () => {
    setRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await cleanupDailyActivityReports({
        report_ids: selected, reason: reason.trim(), confirmation: "DELETE",
      });
      setSuccess(`${faNumber.format(response.data.deleted_count)} گزارش با موفقیت پاک‌سازی شد.`);
      setReason("");
      setConfirmation("");
      await refresh();
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setRunning(false);
    }
  };

  const exportArchive = async () => {
    try {
      await exportManagedDailyActivityReports();
    } catch (e) {
      setError(normalizeApiError(e).message);
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-5 p-4 md:p-6" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-slate-900">مدیریت و حذف گزارش‌های فعالیت</h1><p className="mt-1 text-sm text-slate-500">گزارش‌های فعال و منقضی‌شده را یکجا بررسی و در صورت نیاز به‌صورت متمرکز حذف کنید.</p></div>
        <button onClick={() => void exportArchive()} disabled={rows.length === 0} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40">خروجی Excel همه گزارش‌ها</button>
      </header>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">گزارش‌های منقضی‌شده با توجه به ماه شمسی تاریخ مراجعه مشخص شده‌اند. گزارش‌ها به‌صورت خودکار حذف نمی‌شوند و فقط با تأیید مدیر پاک خواهند شد.</div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="جست‌وجو در گزارش‌های منقضی‌شده" className="min-w-56 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <span className="text-sm text-slate-500">{faNumber.format(rows.length)} گزارش در این صفحه</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? <p className="p-8 text-center text-sm text-slate-500">در حال دریافت...</p> : rows.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">گزارشی برای بررسی یا حذف وجود ندارد.</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-[850px] w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="w-12 px-4 py-3"><input aria-label="انتخاب همه گزارش‌های این صفحه" type="checkbox" checked={rows.length > 0 && rows.every((row) => selected.includes(row.id))} onChange={(e) => setSelected(e.target.checked ? rows.map((row) => row.id) : [])} /></th>
                  <th className="px-4 py-3">مجموعه / مخاطب</th><th className="px-4 py-3">تاریخ مراجعه</th><th className="px-4 py-3">کارمند</th><th className="px-4 py-3">وضعیت نگهداری</th><th className="px-4 py-3">خلاصه گزارش</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => <tr key={row.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-4 py-3"><input aria-label={`انتخاب گزارش ${row.id}`} type="checkbox" checked={selected.includes(row.id)} onChange={(e) => toggle(row.id, e.target.checked)} className="h-4 w-4" /></td>
                  <td className="max-w-56 px-4 py-3"><strong className="block text-slate-800">{row.organization_name}</strong>{row.contact_name ? <span className="mt-1 block text-xs text-slate-500">{row.contact_name}</span> : null}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{jalali(row.visit_date)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.employee.name}<span className="mt-1 block text-xs text-slate-400">{row.contact_type === "phone" ? "تلفنی" : "حضوری"}</span></td>
                  <td className="whitespace-nowrap px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${row.is_archived ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{row.is_archived ? "منقضی‌شده" : "فعال"}</span><span className="mt-1 block text-xs text-slate-400">مهلت: {jalali(row.retention_until)}</span></td>
                  <td className="max-w-72 px-4 py-3"><p className="line-clamp-2 text-slate-600">{row.purpose} — {row.outcome}</p></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">قبلی</button><span className="text-slate-500">صفحه {faNumber.format(page)} از {faNumber.format(lastPage)}</span><button disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">بعدی</button></div>
      </div>
      <div className="rounded-xl border border-red-200 bg-white p-4 md:p-5">
        <h2 className="font-bold text-slate-900">پاک‌سازی نهایی گزارش‌های انتخاب‌شده</h2>
        <p className="mt-1 text-sm text-slate-500">این عملیات حذف دائمی است. پیشنهاد می‌شود پیش از اجرا خروجی Excel را ذخیره کنید.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm md:col-span-2"><span className="font-semibold text-slate-700">دلیل پاک‌سازی</span><textarea rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" placeholder="حداقل ۵ نویسه؛ علت انجام عملیات را بنویسید" /></label>
          <label className="space-y-1 text-sm"><span className="font-semibold text-slate-700">برای تأیید عبارت DELETE را وارد کنید</span><input dir="ltr" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left tracking-widest" /></label>
          <div className="flex items-end"><button disabled={running || loading || selected.length === 0 || reason.trim().length < 5 || confirmation !== "DELETE"} onClick={() => void runCleanup()} className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{running ? "در حال پاک‌سازی..." : `حذف دائمی ${faNumber.format(selected.length)} گزارش انتخاب‌شده`}</button></div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">سوابق پاک‌سازی گزارش فعالیت</h2>
        {history.length === 0 ? <p className="py-5 text-sm text-slate-500">هنوز پاک‌سازی‌ای ثبت نشده است.</p> : <div className="mt-3 divide-y divide-slate-100">{history.map((run) => <div key={run.id} className="py-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>عملیات #{faNumber.format(run.id)}</strong><span className="text-xs text-slate-500">{new Date(run.created_at).toLocaleString("fa-IR")}</span></div><p className="mt-1 text-slate-600">تعداد حذف: {faNumber.format(run.deleted_count)} · اجراکننده: {run.performed_by ?? "کاربر حذف‌شده"}</p><p className="mt-1 text-xs text-slate-500">دلیل: {run.reason}</p></div>)}</div>}
      </div>
    </section>
  );
}
