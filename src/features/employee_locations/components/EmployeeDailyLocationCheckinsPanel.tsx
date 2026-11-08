import { useEffect, useState } from "react";
import { TableContainer } from "../../../design-system/components/TableContainer";
import { Button } from "../../../design-system/components/Button";
import { ApiError } from "../../../api/client";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import { getEmployeeDailyLocationCheckins, type EmployeeLocation } from "../services/employeeLocationsApi";

function todayInTehran(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function time(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" });
}

export function EmployeeDailyLocationCheckinsPanel() {
  const [date, setDate] = useState(todayInTehran);
  const [rows, setRows] = useState<EmployeeLocation[]>([]);
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const loading = loadedDate !== date;
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getEmployeeDailyLocationCheckins(date)
      .then((result) => {
        if (cancelled) return;
        setRows(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof ApiError ? cause.message : "دریافت ثبت‌های روزانه ناموفق بود.");
      })
      .finally(() => {
        if (!cancelled) setLoadedDate(date);
      });
    return () => { cancelled = true; };
  }, [date, refreshKey]);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
        <div>
          <h2 className="font-semibold text-gray-900">ثبت روزانه موقعیت کارکنان</h2>
          <p className="mt-1 text-xs text-gray-500">فقط نقاطی که کارمند به‌صورت دستی ثبت کرده است؛ بدون ردیابی خودکار.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500" htmlFor="daily-location-date">تاریخ</label>
          <JalaliDateInput id="daily-location-date" value={date} onChange={setDate} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="۱۴۰۵/۰۸/۱۴" />
          <Button size="sm" variant="secondary" type="button" onClick={() => { setLoadedDate(null); setRefreshKey((value) => value + 1); }} disabled={loading} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-50">بروزرسانی</Button>
        </div>
      </div>
      {error ? <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="p-5 text-sm text-gray-500">در حال دریافت اطلاعات...</p> : rows.length === 0 ? <p className="p-5 text-sm text-gray-500">برای این تاریخ موقعیت روزانه‌ای ثبت نشده است.</p> : (
        <TableContainer className="ui-table-container--embedded" aria-label="ثبت موقعیت روزانه">
<table className="w-full min-w-[700px] text-right text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500"><tr>
              <th className="px-4 py-3 font-medium">کارمند</th><th className="px-4 py-3 font-medium">زمان ثبت</th><th className="px-4 py-3 font-medium">دقت GPS</th><th className="px-4 py-3 font-medium">مختصات</th><th className="px-4 py-3 font-medium">نقشه</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{row.employee_name || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{time(row.captured_at)}</td>
                <td className="px-4 py-3 text-gray-700">{row.accuracy == null ? "نامشخص" : `${Math.round(row.accuracy).toLocaleString("fa-IR")} متر`}</td>
                <td dir="ltr" className="px-4 py-3 text-left text-xs text-gray-600">{row.latitude.toFixed(6)}, {row.longitude.toFixed(6)}</td>
                <td className="px-4 py-3"><a href={`https://www.openstreetmap.org/?mlat=${row.latitude}&mlon=${row.longitude}#map=16/${row.latitude}/${row.longitude}`} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">مشاهده موقعیت</a></td>
              </tr>)}
            </tbody>
          </table>
</TableContainer>
      )}
    </section>
  );
}
