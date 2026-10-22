import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../auth";
import { getEmployeeLocations, type EmployeeLocation } from "../api/employeeLocations";

const REFRESH_INTERVAL_MS = 30_000;
const STALE_AFTER_MS = 5 * 60_000;

function formatCapturedAt(value: string | null): string {
  if (!value) return "زمان نامشخص";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "زمان نامشخص" : date.toLocaleString("fa-IR");
}

function isLocationFresh(value: string | null, now: number): boolean {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp <= now + 60_000 && now - timestamp < STALE_AFTER_MS;
}

function mapEmbedUrl(location: EmployeeLocation): string {
  const { latitude, longitude } = location;
  const offset = 0.012;
  const west = (longitude - offset).toFixed(6);
  const east = (longitude + offset).toFixed(6);
  const south = (latitude - offset).toFixed(6);
  const north = (latitude + offset).toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export function EmployeeLocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<EmployeeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const requestInFlight = useRef(false);
  const isAdmin = user?.roles.includes("admin") ?? false;

  const refreshLocations = useCallback(async (showLoading = false) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await getEmployeeLocations();
      const nextLocations = Array.isArray(response) ? response.filter((item) =>
        Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
        && item.latitude >= -90 && item.latitude <= 90
        && item.longitude >= -180 && item.longitude <= 180
      ) : [];
      setLocations(nextLocations);
      setLastUpdatedAt(Date.now());
      setError(null);
      setSelectedEmployeeId((current) =>
        current && nextLocations.some((item) => item.employee_id === current)
          ? current
          : nextLocations[0]?.employee_id ?? null
      );
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "دریافت موقعیت کارکنان ناموفق بود. اتصال شبکه را بررسی کنید.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void refreshLocations(true);
    const refreshTimer = window.setInterval(() => void refreshLocations(), REFRESH_INTERVAL_MS);
    const clockTimer = window.setInterval(() => setClock(Date.now()), 15_000);
    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [isAdmin, refreshLocations]);

  const filteredLocations = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fa-IR");
    if (!normalizedSearch) return locations;
    return locations.filter((item) =>
      item.employee_name.toLocaleLowerCase("fa-IR").includes(normalizedSearch)
      || item.employee_id.toLocaleLowerCase("fa-IR").includes(normalizedSearch)
    );
  }, [locations, search]);

  const selectedLocation = filteredLocations.find((item) => item.employee_id === selectedEmployeeId)
    ?? filteredLocations[0]
    ?? null;
  const freshCount = locations.filter((item) => isLocationFresh(item.captured_at, clock)).length;
  const staleCount = locations.length - freshCount;

  if (!isAdmin) {
    return <section className="p-6"><div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-600">دسترسی به موقعیت کارکنان فقط برای مدیر سیستم فعال است.</div></section>;
  }

  return (
    <section className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">موقعیت کارکنان</h1>
          <p className="mt-1 text-sm text-gray-500">آخرین موقعیت ثبت‌شده کارکنان؛ اطلاعات هر ۳۰ ثانیه بررسی می‌شود.</p>
        </div>
        <button type="button" onClick={() => void refreshLocations()} disabled={loading || refreshing} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
          <span aria-hidden="true" className={refreshing ? "animate-spin" : ""}>↻</span>
          {loading ? "در حال دریافت..." : refreshing ? "در حال بروزرسانی..." : "بروزرسانی"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">کارکنان دارای موقعیت</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{locations.length.toLocaleString("fa-IR")}</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4">
          <div className="text-xs text-gray-500">موقعیت تازه (کمتر از ۵ دقیقه)</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{freshCount.toLocaleString("fa-IR")}</div>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-4">
          <div className="text-xs text-gray-500">موقعیت قدیمی یا نامشخص</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{staleCount.toLocaleString("fa-IR")}</div>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div>{error}</div>
          {locations.length > 0 ? <p className="mt-1 text-xs text-red-600">آخرین اطلاعات دریافت‌شده حفظ شده است؛ پس از برقراری اتصال دوباره تلاش می‌شود.</p> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">نقشه موقعیت</h2>
              <p className="mt-1 text-xs text-gray-500">{selectedLocation ? `نمایش موقعیت ${selectedLocation.employee_name}` : "برای نمایش موقعیت، یک کارمند انتخاب کنید."}</p>
            </div>
            {selectedLocation ? <a className="inline-flex w-fit items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${selectedLocation.latitude}&mlon=${selectedLocation.longitude}#map=16/${selectedLocation.latitude}/${selectedLocation.longitude}`}>بازکردن نقشه در صفحه جدا</a> : null}
          </div>
          {selectedLocation ? (
            <iframe
              title={`نقشه موقعیت ${selectedLocation.employee_name}`}
              src={mapEmbedUrl(selectedLocation)}
              className="h-[320px] w-full border-0 sm:h-[390px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center px-6 text-center text-sm text-gray-500">
              {loading ? "در حال دریافت موقعیت‌ها..." : "موقعیتی برای نمایش روی نقشه وجود ندارد."}
            </div>
          )}
          {selectedLocation ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
              <span>عرض: {selectedLocation.latitude.toFixed(5)}، طول: {selectedLocation.longitude.toFixed(5)}</span>
              <span>دقت GPS: {selectedLocation.accuracy != null ? `${Math.round(selectedLocation.accuracy).toLocaleString("fa-IR")} متر` : "نامشخص"}</span>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900">فهرست کارکنان</h2>
            <p className="mt-1 text-xs text-gray-500">برای دیدن موقعیت هر فرد، ردیف او را انتخاب کنید.</p>
            <label className="mt-3 block">
              <span className="sr-only">جست‌وجوی کارمند</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجوی نام کارمند..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>
          <div className="max-h-[430px] divide-y divide-gray-100 overflow-y-auto">
            {filteredLocations.map((item) => {
              const fresh = isLocationFresh(item.captured_at, clock);
              const selected = selectedLocation?.employee_id === item.employee_id;
              return (
                <button key={item.employee_id} type="button" onClick={() => setSelectedEmployeeId(item.employee_id)} aria-pressed={selected} className={`block w-full px-4 py-3 text-right transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${selected ? "bg-blue-50/70" : "bg-white"}`}>
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">{item.employee_name}</span>
                      <span className="mt-1 block text-xs text-gray-500">آخرین ثبت: {formatCapturedAt(item.captured_at)}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${fresh ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{fresh ? "تازه" : "قدیمی"}</span>
                  </span>
                  <span className="mt-2 block text-xs text-gray-500">دقت: {item.accuracy != null ? `${Math.round(item.accuracy).toLocaleString("fa-IR")} متر` : "نامشخص"}</span>
                </button>
              );
            })}
            {filteredLocations.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                {loading ? "در حال دریافت اطلاعات..." : search ? "کارمندی با این عبارت پیدا نشد." : "هنوز موقعیتی ثبت نشده است."}
              </div>
            ) : null}
          </div>
          <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3 text-xs text-gray-500">
            {lastUpdatedAt ? `آخرین بروزرسانی فهرست: ${new Date(lastUpdatedAt).toLocaleTimeString("fa-IR")}` : "هنوز بروزرسانی انجام نشده است."}
            <span className="mx-1">·</span>
            بروزرسانی خودکار هر ۳۰ ثانیه
          </div>
        </div>
      </div>
      <p className="text-xs leading-6 text-gray-500">توجه: «تازه» بودن بر اساس زمان ثبت آخرین موقعیت محاسبه می‌شود؛ این وضعیت به‌تنهایی تضمین نمی‌کند که کارمند همین لحظه آنلاین است. دریافت موقعیت نیز به فعال بودن اشتراک‌گذاری و اجازه مکان‌یابی دستگاه وابسته است.</p>
    </section>
  );
}
