import { useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../auth";
import { getEmployeeLocations, type EmployeeLocation } from "../api/employeeLocations";

export function EmployeeLocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<EmployeeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user?.roles.includes("admin") ?? false;

  async function refresh() {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getEmployeeLocations();
      setLocations(Array.isArray(response?.data) ? response.data : []);
    } catch (e: unknown) {
      setLocations([]);
      setError(e instanceof ApiError ? e.message : "خطا در دریافت موقعیت کارکنان.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [isAdmin]);

  if (!isAdmin) return <section className="p-6"><div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-600">دسترسی به موقعیت کارکنان فقط برای مدیر سیستم فعال است.</div></section>;

  return <section className="space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-gray-900">موقعیت کارکنان</h1><p className="mt-1 text-sm text-gray-500">آخرین موقعیت ثبت‌شده هر کارمند فعال.</p></div><button type="button" onClick={() => { void refresh(); }} disabled={loading} className="rounded-lg border bg-white px-4 py-2.5 text-sm disabled:opacity-60">{loading ? "در حال بروزرسانی..." : "بروزرسانی"}</button></div>
    {error ? <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {locations.length === 0 && !loading ? <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500 md:col-span-2 xl:col-span-3">هنوز موقعیتی ثبت نشده است.</div> : null}
      {locations.map((item) => <div key={item.employee_id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="font-medium">{item.employee_name}</div><div className="mt-2 text-xs text-gray-500">دقت: {item.accuracy ? `${Math.round(item.accuracy)} متر` : "نامشخص"}</div><div className="mt-1 text-xs text-gray-500">آخرین دریافت: {item.captured_at ? new Date(item.captured_at).toLocaleString("fa-IR") : "نامشخص"}</div><a className="mt-3 inline-flex rounded-lg border px-3 py-2 text-xs font-medium text-blue-700" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=16/${item.latitude}/${item.longitude}`}>مشاهده روی نقشه</a></div>)}
    </div>
  </section>;
}
