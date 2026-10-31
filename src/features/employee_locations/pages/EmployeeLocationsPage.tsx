import { sortTableRecords } from "../../../utils/date";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../../../api/client';
import { useAuth } from '../../auth';
import { getEmployeeLocations, type EmployeeLocation } from '../api/employeeLocations';
import { EmployeeLocationHistory } from '../components/EmployeeLocationHistory';
import { LiveEmployeeMap } from '../components/LiveEmployeeMap';
import { EmployeeWorkSessionsPanel } from '../components/EmployeeWorkSessionsPanel';

const REFRESH_INTERVAL_MS = 10_000;
const STALE_AFTER_MS = 5 * 60_000;

function formatCapturedAt(value: string | null): string {
    if (!value) return 'زمان نامشخص';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'زمان نامشخص' : date.toLocaleString('fa-IR');
}

function isLocationFresh(value: string | null, now: number): boolean {
    if (!value) return false;
    const timestamp = new Date(value).getTime();
    return (
        Number.isFinite(timestamp) && timestamp <= now + 60_000 && now - timestamp < STALE_AFTER_MS
    );
}


export function EmployeeLocationsPage() {
    const { user } = useAuth();
    const [locations, setLocations] = useState<EmployeeLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
    const [clock, setClock] = useState(() => Date.now());
    const requestInFlight = useRef(false);
    const isAdmin = user?.roles.includes('admin') ?? false;

    const refreshLocations = useCallback(async (showLoading = false) => {
        if (requestInFlight.current) return;
        requestInFlight.current = true;
        if (showLoading) setLoading(true);
        else setRefreshing(true);
        try {
            const response = await getEmployeeLocations();
            const nextLocations = Array.isArray(response)
                ? response.filter(
                      (item) =>
                          Number.isFinite(item.latitude) &&
                          Number.isFinite(item.longitude) &&
                          item.latitude >= -90 &&
                          item.latitude <= 90 &&
                          item.longitude >= -180 &&
                          item.longitude <= 180
                  )
                : [];
            setLocations(nextLocations);
            setLastUpdatedAt(Date.now());
            setError(null);
            setSelectedEmployeeId((current) =>
                current && nextLocations.some((item) => item.employee_id === current)
                    ? current
                    : nextLocations[0]?.employee_id ?? null
            );
        } catch (e: unknown) {
            setError(
                e instanceof ApiError
                    ? e.message
                    : 'دریافت موقعیت کارکنان ناموفق بود. اتصال شبکه را بررسی کنید.'
            );
        } finally {
            requestInFlight.current = false;
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (!isAdmin) return;
        const initialTimer = window.setTimeout(() => void refreshLocations(true), 0);
        const refreshTimer = window.setInterval(() => void refreshLocations(), REFRESH_INTERVAL_MS);
        const clockTimer = window.setInterval(() => setClock(Date.now()), 15_000);
        return () => {
            window.clearTimeout(initialTimer);
            window.clearInterval(refreshTimer);
            window.clearInterval(clockTimer);
        };
    }, [isAdmin, refreshLocations]);

    const filteredLocations = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase('fa-IR');
        if (!normalizedSearch) return locations;
        return locations.filter(
            (item) =>
                item.employee_name.toLocaleLowerCase('fa-IR').includes(normalizedSearch) ||
                item.employee_id.toLocaleLowerCase('fa-IR').includes(normalizedSearch)
        );
    }, [locations, search]);

    const selectedLocation =
        filteredLocations.find((item) => item.employee_id === selectedEmployeeId) ??
        filteredLocations[0] ??
        null;
    const freshCount = locations.filter((item) => isLocationFresh(item.captured_at, clock)).length;
    const staleCount = locations.length - freshCount;

    if (!isAdmin) {
        return (
            <section className="p-6">
                <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-600">
                    دسترسی به موقعیت کارکنان فقط برای مدیر سیستم فعال است.
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-4 bg-gray-50/40 p-3 md:space-y-5 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-gray-900 md:text-2xl">
                        موقعیت کارکنان
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={() => void refreshLocations()}
                    disabled={loading || refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span aria-hidden="true" className={refreshing ? 'animate-spin' : ''}>
                        ↻
                    </span>
                    {loading
                        ? 'در حال دریافت...'
                        : refreshing
                        ? 'در حال بروزرسانی...'
                        : 'بروزرسانی'}
                </button>
            </div>

            <EmployeeWorkSessionsPanel />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">کارکنان دارای موقعیت</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">
                        {locations.length.toLocaleString('fa-IR')}
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">موقعیت تازه (کمتر از ۵ دقیقه)</div>
                    <div className="mt-1 text-2xl font-bold text-emerald-700">
                        {freshCount.toLocaleString('fa-IR')}
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">موقعیت قدیمی یا نامشخص</div>
                    <div className="mt-1 text-2xl font-bold text-amber-700">
                        {staleCount.toLocaleString('fa-IR')}
                    </div>
                </div>
            </div>

            {error ? (
                <div
                    role="alert"
                    className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <div>{error}</div>
                    {locations.length > 0 ? (
                        <p className="mt-1 text-xs text-red-600">
                            آخرین اطلاعات دریافت‌شده حفظ شده است؛ پس از برقراری اتصال دوباره تلاش
                            می‌شود.
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
                <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-900">نقشه موقعیت</h2>
                            <p className="mt-1 text-xs text-gray-500">
                                {selectedLocation
                                    ? `نمایش موقعیت ${selectedLocation.employee_name}`
                                    : 'برای نمایش موقعیت، یک کارمند انتخاب کنید.'}
                            </p>
                        </div>
                        {selectedLocation ? (
                            <a
                                className="inline-flex w-fit items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                target="_blank"
                                rel="noreferrer"
                                href={`https://www.openstreetmap.org/?mlat=${selectedLocation.latitude}&mlon=${selectedLocation.longitude}#map=16/${selectedLocation.latitude}/${selectedLocation.longitude}`}
                            >
                                بازکردن نقشه
                            </a>
                        ) : null}
                    </div>
                    {selectedLocation ? (
                        <LiveEmployeeMap
                            key={selectedLocation.employee_id}
                            locations={filteredLocations}
                            selectedEmployeeId={selectedLocation.employee_id}
                        />
                    ) : (
                        <div className="flex h-[280px] items-center justify-center px-6 text-center text-sm text-gray-500">
                            {loading
                                ? 'در حال دریافت موقعیت‌ها...'
                                : 'موقعیتی برای نمایش روی نقشه وجود ندارد.'}
                        </div>
                    )}
                    {selectedLocation ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
                            <span>
                                عرض: {selectedLocation.latitude.toFixed(5)}، طول:{' '}
                                {selectedLocation.longitude.toFixed(5)}
                            </span>
                            <span>
                                آخرین ثبت: {formatCapturedAt(selectedLocation.captured_at)}
                            </span>
                            <span>
                                دقت GPS:{' '}
                                {selectedLocation.accuracy != null
                                    ? `${Math.round(selectedLocation.accuracy).toLocaleString(
                                          'fa-IR'
                                      )} متر`
                                    : 'نامشخص'}
                            </span>
                        </div>
                    ) : null}
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 p-4">
                        <h2 className="font-semibold text-gray-900">فهرست کارکنان</h2>
                        <label className="ui-filter-field mt-3">
                            <span className="ui-filter-label">جست‌وجوی کارمند</span>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="جست‌وجوی نام کارمند..."
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                        <div className="ui-filter-actions">
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                disabled={!search}
                                className="ui-filter-clear disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                پاک کردن فیلترها
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[430px] divide-y divide-gray-100 overflow-y-auto">
                        {sortTableRecords(filteredLocations).map((item) => {
                            const fresh = isLocationFresh(item.captured_at, clock);
                            const selected = selectedLocation?.employee_id === item.employee_id;
                            return (
                                <button
                                    key={item.employee_id}
                                    type="button"
                                    onClick={() => setSelectedEmployeeId(item.employee_id)}
                                    aria-pressed={selected}
                                    className={`block w-full px-4 py-3 text-right transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                                        selected ? 'bg-blue-50/70' : 'bg-white'
                                    }`}
                                >
                                    <span className="flex items-start justify-between gap-3">
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-gray-900">
                                                {item.employee_name}
                                            </span>
                                            <span className="mt-1 block text-xs text-gray-900">
                                                آخرین ثبت: {formatCapturedAt(item.captured_at)}
                                            </span>
                                        </span>
                                        <span
                                            className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${
                                                fresh
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {fresh ? 'تازه' : 'قدیمی'}
                                        </span>
                                    </span>
                                    <span className="mt-2 block text-xs text-gray-900">
                                        دقت:{' '}
                                        {item.accuracy != null
                                            ? `${Math.round(item.accuracy).toLocaleString(
                                                  'fa-IR'
                                              )} متر`
                                            : 'نامشخص'}
                                    </span>
                                </button>
                            );
                        })}
                        {filteredLocations.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-500">
                                {loading
                                    ? 'در حال دریافت اطلاعات...'
                                    : search
                                    ? 'کارمندی با این عبارت پیدا نشد.'
                                    : 'هنوز موقعیتی ثبت نشده است.'}
                            </div>
                        ) : null}
                    </div>
                    <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3 text-xs text-gray-500">
                        {lastUpdatedAt
                            ? `آخرین بروزرسانی فهرست: ${new Date(lastUpdatedAt).toLocaleTimeString(
                                  'fa-IR'
                              )}`
                            : 'هنوز بروزرسانی انجام نشده است.'}
                    </div>
                </div>
            </div>

            {selectedLocation ? (
                <EmployeeLocationHistory
                    key={selectedLocation.employee_id}
                    employeeId={selectedLocation.employee_id}
                    employeeName={selectedLocation.employee_name}
                />
            ) : null}
        </section>
    );
}
