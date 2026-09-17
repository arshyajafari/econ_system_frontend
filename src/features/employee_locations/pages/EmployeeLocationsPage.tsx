import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../auth";
import { getEmployeeLocations, sendMyLocation, type EmployeeLocation } from "../api/employeeLocations";

function distanceInMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const earthRadius = 6371000;
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

export function EmployeeLocationsPage() {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("اشتراک موقعیت خاموش است.");
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<EmployeeLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const lastSent = useRef<{ latitude: number; longitude: number; at: number } | null>(null);
  const watchId = useRef<number | null>(null);

  const canViewTeam = user?.permissions.includes("employees.view") || user?.roles.includes("admin");

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  async function refreshTeam() {
    if (!canViewTeam) return;
    setLoading(true);
    try {
      const response = await getEmployeeLocations();
      setLocations(response.data);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در دریافت موقعیت کارکنان.");
    } finally {
      setLoading(false);
    }
  }

  function startSharing() {
    setError(null);
    if (!navigator.geolocation) { setError("مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند."); return; }
    if (!window.isSecureContext) { setError("برای اشتراک موقعیت، سایت باید روی HTTPS یا localhost اجرا شود."); return; }
    setSharing(true);
    setStatus("در حال دریافت موقعیت شما...");
    watchId.current = navigator.geolocation.watchPosition(async (position) => {
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      const previous = lastSent.current;
      const enoughTime = !previous || Date.now() - previous.at >= 30000;
      const enoughDistance = !previous || distanceInMeters(previous, point) >= 100;
      if (!enoughTime && !enoughDistance) return;
      try {
        const saved = await sendMyLocation({ latitude: point.latitude, longitude: point.longitude, accuracy: position.coords.accuracy, source: "browser" });
        lastSent.current = { ...point, at: Date.now() };
        setStatus(`آخرین ارسال: ${saved.captured_at ? new Date(saved.captured_at).toLocaleTimeString("fa-IR") : "اکنون"}`);
        if (canViewTeam) setLocations((current) => [saved, ...current.filter((item) => item.employee_id !== saved.employee_id)]);
      } catch (e: unknown) {
        setError(e instanceof ApiError ? e.message : "ارسال موقعیت انجام نشد.");
      }
    }, (positionError) => {
      setSharing(false);
      setError(positionError.code === positionError.PERMISSION_DENIED ? "اجازه دسترسی به موقعیت مکانی داده نشد." : "دریافت موقعیت مکانی ناموفق بود.");
    }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
  }

  function stopSharing() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setSharing(false);
    setStatus("اشتراک موقعیت خاموش است.");
  }

  return <section className="space-y-6 p-4 md:p-6">
    <div><h1 className="text-2xl font-bold text-gray-900">موقعیت کارکنان</h1><p className="mt-1 text-sm text-gray-500">اشتراک موقعیت فقط با فعال‌سازی صریح کارمند انجام می‌شود.</p></div>
    <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="font-semibold">موقعیت من</h2><p className="mt-1 text-sm text-gray-500">{user?.employee.full_name ?? "کاربر"} — {status}</p></div><button type="button" onClick={sharing ? stopSharing : startSharing} className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white ${sharing ? "bg-red-600" : "bg-gray-900"}`}>{sharing ? "توقف اشتراک موقعیت" : "شروع اشتراک موقعیت"}</button></div></div>
    {error ? <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    {canViewTeam ? <div className="space-y-4 rounded-xl border bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">آخرین موقعیت تیم</h2><p className="mt-1 text-xs text-gray-500">فقط کارکنانی که حداقل یک موقعیت ثبت کرده‌اند نمایش داده می‌شوند.</p></div><button type="button" onClick={() => { void refreshTeam(); }} disabled={loading} className="rounded-lg border px-3 py-2 text-sm">{loading ? "در حال بروزرسانی..." : "بروزرسانی"}</button></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{locations.length === 0 ? <p className="py-8 text-center text-sm text-gray-500 md:col-span-2 xl:col-span-3">هنوز موقعیتی ثبت نشده است.</p> : locations.map((item) => <div key={item.employee_id} className="rounded-xl border border-gray-100 p-4"><div className="font-medium">{item.employee_name}</div><div className="mt-2 text-xs text-gray-500">دقت: {item.accuracy ? `${Math.round(item.accuracy)} متر` : "نامشخص"}</div><div className="mt-1 text-xs text-gray-500">آخرین دریافت: {item.captured_at ? new Date(item.captured_at).toLocaleString("fa-IR") : "نامشخص"}</div><a className="mt-3 inline-flex rounded-lg border px-3 py-2 text-xs font-medium text-blue-700" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=16/${item.latitude}/${item.longitude}`}>مشاهده روی نقشه</a></div>)}</div></div> : null}
  </section>;
}
