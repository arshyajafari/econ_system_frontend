import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../api/client';
import {
    getEmployeeLocationDailySummary,
    getEmployeeLocationHistory,
    type EmployeeLocation,
    type EmployeeLocationDailySummary,
} from '../api/employeeLocations';

const MAX_GAP_MS = 5 * 60_000;
const STOP_GAP_MS = 3 * 60_000;
const STOP_RADIUS_METERS = 50;
const MIN_STOP_MS = 5 * 60_000;
const MAX_SPEED_KMH = 180;
const TILE_SIZE = 256;
const MAP_WIDTH = 1024;
const MAP_HEIGHT = 768;

type Props = {
    employeeId: string;
    employeeName: string;
};

type Stop = {
    start: string;
    end: string;
    durationMs: number;
    latitude: number;
    longitude: number;
};

function localDateValue(): string {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tehran',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);
    const year = parts.find((part) => part.type === 'year')?.value ?? String(now.getFullYear());
    const month =
        parts.find((part) => part.type === 'month')?.value ??
        String(now.getMonth() + 1).padStart(2, '0');
    const day =
        parts.find((part) => part.type === 'day')?.value ?? String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    return date.toLocaleDateString('fa-IR', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatDuration(milliseconds: number): string {
    const minutes = Math.round(milliseconds / 60_000);
    if (minutes < 60) return `${minutes.toLocaleString('fa-IR')} دقیقه`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder
        ? `${hours.toLocaleString('fa-IR')} ساعت و ${remainder.toLocaleString('fa-IR')} دقیقه`
        : `${hours.toLocaleString('fa-IR')} ساعت`;
}

function distanceMeters(a: EmployeeLocation, b: EmployeeLocation): number {
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitudeDelta = radians(b.latitude - a.latitude);
    const longitudeDelta = radians(b.longitude - a.longitude);
    const value =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(radians(a.latitude)) *
            Math.cos(radians(b.latitude)) *
            Math.sin(longitudeDelta / 2) ** 2;
    return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(Math.max(0, 1 - value)));
}

function timestamp(point: EmployeeLocation): number {
    return point.captured_at ? new Date(point.captured_at).getTime() : Number.NaN;
}

function validPoint(point: EmployeeLocation): boolean {
    return (
        Number.isFinite(point.latitude) &&
        Number.isFinite(point.longitude) &&
        point.latitude >= -90 &&
        point.latitude <= 90 &&
        point.longitude >= -180 &&
        point.longitude <= 180 &&
        Number.isFinite(timestamp(point))
    );
}

function findStops(points: EmployeeLocation[]): Stop[] {
    const stops: Stop[] = [];
    let anchorIndex = 0;
    let lastInRangeIndex = 0;

    const saveStop = () => {
        const start = timestamp(points[anchorIndex]);
        const end = timestamp(points[lastInRangeIndex]);
        if (end - start >= MIN_STOP_MS) {
            stops.push({
                start: points[anchorIndex].captured_at ?? '',
                end: points[lastInRangeIndex].captured_at ?? '',
                durationMs: end - start,
                latitude: points[anchorIndex].latitude,
                longitude: points[anchorIndex].longitude,
            });
        }
    };

    for (let index = 1; index < points.length; index += 1) {
        const gap = timestamp(points[index]) - timestamp(points[lastInRangeIndex]);
        const withinRadius =
            distanceMeters(points[anchorIndex], points[index]) <= STOP_RADIUS_METERS;
        if (gap >= 0 && gap <= STOP_GAP_MS && withinRadius) {
            lastInRangeIndex = index;
            continue;
        }
        saveStop();
        anchorIndex = index;
        lastInRangeIndex = index;
    }
    if (points.length > 1) saveStop();
    return stops;
}

function project(latitude: number, longitude: number, zoom: number): { x: number; y: number } {
    const scale = 2 ** zoom;
    const latitudeRadians =
        (Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI) / 180;
    return {
        x: ((longitude + 180) / 360) * scale,
        y: ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * scale,
    };
}

function RouteMap({ points }: { points: EmployeeLocation[] }) {
    const [zoomOffset, setZoomOffset] = useState(0);

    const map = useMemo(() => {
        if (!points.length) return null;
        let zoom = 16;
        let projected: { x: number; y: number }[];
        for (let candidate = 16; candidate >= 3; candidate -= 1) {
            const values = points.map((point) =>
                project(point.latitude, point.longitude, candidate)
            );
            const xs = values.map((point) => point.x);
            const ys = values.map((point) => point.y);
            const width = Math.max(...xs) - Math.min(...xs);
            const height = Math.max(...ys) - Math.min(...ys);
            zoom = candidate;
            if (width <= 2.45 && height <= 1.45) break;
        }
        zoom = Math.max(3, Math.min(19, zoom + zoomOffset));
        projected = points.map((point) => project(point.latitude, point.longitude, zoom));
        const centerX =
            (Math.min(...projected.map((point) => point.x)) +
                Math.max(...projected.map((point) => point.x))) /
            2;
        const centerY =
            (Math.min(...projected.map((point) => point.y)) +
                Math.max(...projected.map((point) => point.y))) /
            2;
        const originX = centerX * TILE_SIZE - MAP_WIDTH / 2;
        const originY = centerY * TILE_SIZE - MAP_HEIGHT / 2;
        const firstTileX = Math.floor(originX / TILE_SIZE);
        const firstTileY = Math.floor(originY / TILE_SIZE);
        const tileCount = 2 ** zoom;
        const tiles = [];
        for (let row = 0; row < 3; row += 1) {
            for (let column = 0; column < 4; column += 1) {
                const rawX = firstTileX + column;
                const rawY = firstTileY + row;
                if (rawY < 0 || rawY >= tileCount) continue;
                const x = ((rawX % tileCount) + tileCount) % tileCount;
                tiles.push({
                    key: `${zoom}-${x}-${rawY}`,
                    url: `https://tile.openstreetmap.org/${zoom}/${x}/${rawY}.png`,
                    left: rawX * TILE_SIZE - originX,
                    top: rawY * TILE_SIZE - originY,
                });
            }
        }
        const coordinates = projected.map((point) => ({
            x: point.x * TILE_SIZE - originX,
            y: point.y * TILE_SIZE - originY,
        }));
        const segments: { x: number; y: number }[][] = [];
        let segment: { x: number; y: number }[] = [];
        for (let index = 0; index < points.length; index += 1) {
            if (index > 0) {
                const gap = timestamp(points[index]) - timestamp(points[index - 1]);
                const distance = distanceMeters(points[index - 1], points[index]);
                const speed = gap > 0 ? (distance / gap) * 3_600 : Number.POSITIVE_INFINITY;
                if (gap > MAX_GAP_MS || gap <= 0 || speed > MAX_SPEED_KMH) {
                    if (segment.length) segments.push(segment);
                    segment = [];
                }
            }
            segment.push(coordinates[index]);
        }
        if (segment.length) segments.push(segment);
        return { zoom, tiles, coordinates, segments };
    }, [points, zoomOffset]);

    if (!map) return null;
    return (
        <div
            className="relative mx-auto aspect-[4/3] w-full overflow-hidden bg-slate-100"
            aria-label="نقشه مسیر ثبت‌شده"
        >
            {map.tiles.map((tile) => (
                <img
                    key={tile.key}
                    src={tile.url}
                    alt=""
                    draggable={false}
                    className="absolute max-w-none"
                    style={{
                        left: `${(tile.left / MAP_WIDTH) * 100}%`,
                        top: `${(tile.top / MAP_HEIGHT) * 100}%`,
                        width: `${(TILE_SIZE / MAP_WIDTH) * 100}%`,
                        height: `${(TILE_SIZE / MAP_HEIGHT) * 100}%`,
                    }}
                    loading="lazy"
                />
            ))}
            <svg
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {map.segments.map((segment, index) => (
                    <polyline
                        key={index}
                        points={segment.map((point) => `${point.x},${point.y}`).join(' ')}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ))}
                {map.coordinates.map((point, index) => (
                    <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r={index === 0 || index === map.coordinates.length - 1 ? 7 : 3.5}
                        fill={
                            index === 0
                                ? '#16a34a'
                                : index === map.coordinates.length - 1
                                ? '#dc2626'
                                : '#ffffff'
                        }
                        stroke="#1d4ed8"
                        strokeWidth="2"
                    />
                ))}
            </svg>
            <div className="absolute right-2 top-2 z-10 flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white/95 shadow" aria-label="کنترل بزرگ‌نمایی نقشه">
                <button
                    type="button"
                    onClick={() => setZoomOffset((value) => Math.min(4, value + 1))}
                    disabled={zoomOffset >= 4 || map.zoom >= 19}
                    className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                    aria-label="بزرگ‌نمایی نقشه"
                    title="بزرگ‌نمایی"
                >
                    +
                </button>
                <div className="h-px bg-gray-200" />
                <button
                    type="button"
                    onClick={() => setZoomOffset((value) => Math.max(-4, value - 1))}
                    disabled={zoomOffset <= -4 || map.zoom <= 3}
                    className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                    aria-label="کوچک‌نمایی نقشه"
                    title="کوچک‌نمایی"
                >
                    −
                </button>
                <div className="h-px bg-gray-200" />
                <button
                    type="button"
                    onClick={() => setZoomOffset(0)}
                    disabled={zoomOffset === 0}
                    className="px-1 py-1 text-[10px] text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    aria-label="بازنشانی بزرگ‌نمایی"
                    title="بازنشانی"
                >
                    بازنشانی
                </button>
            </div>
            <div className="absolute bottom-2 left-2 rounded bg-white/95 px-2 py-1 text-[10px] text-gray-600 shadow">
                © OpenStreetMap · بزرگ‌نمایی {map.zoom}
            </div>
        </div>
    );
}

export function EmployeeLocationHistory({ employeeId, employeeName }: Props) {
    const [date, setDate] = useState(localDateValue);
    const [points, setPoints] = useState<EmployeeLocation[]>([]);
    const [dailySummaries, setDailySummaries] = useState<EmployeeLocationDailySummary[]>([]);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [mapVisible, setMapVisible] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getEmployeeLocationDailySummary(employeeId)
            .then((result) => {
                if (!cancelled) setDailySummaries(Array.isArray(result) ? result : []);
            })
            .catch((e: unknown) => {
                if (!cancelled) {
                    setSummaryError(e instanceof ApiError ? e.message : 'دریافت گزارش ناموفق بود.');
                    setDailySummaries([]);
                }
            })
            .finally(() => {
                if (!cancelled) setSummaryLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [employeeId]);

    const loadHistory = useCallback(
        async (requestedDate = date) => {
            setLoading(true);
            setError(null);
            setHasSearched(true);
            try {
                const result = await getEmployeeLocationHistory(employeeId, requestedDate);
                const valid = Array.isArray(result)
                    ? result.filter(validPoint).sort((a, b) => timestamp(a) - timestamp(b))
                    : [];
                setPoints(valid);
            } catch (e: unknown) {
                setError(
                    e instanceof ApiError
                        ? e.message
                        : 'دریافت تاریخچه موقعیت ناموفق بود. اتصال شبکه را بررسی کنید.'
                );
                setPoints([]);
            } finally {
                setLoading(false);
            }
        },
        [date, employeeId]
    );

    const summary = useMemo(() => {
        let meters = 0;
        let connectedSegments = 0;
        let gaps = 0;
        for (let index = 1; index < points.length; index += 1) {
            const gap = timestamp(points[index]) - timestamp(points[index - 1]);
            const distance = distanceMeters(points[index - 1], points[index]);
            const speed = gap > 0 ? (distance / gap) * 3_600 : Number.POSITIVE_INFINITY;
            if (gap > MAX_GAP_MS || gap <= 0 || speed > MAX_SPEED_KMH) {
                gaps += 1;
                continue;
            }
            meters += distance;
            connectedSegments += 1;
        }
        const duration =
            points.length > 1
                ? Math.max(0, timestamp(points[points.length - 1]) - timestamp(points[0]))
                : 0;
        const stops = findStops(points);
        return {
            meters,
            connectedSegments,
            gaps,
            duration,
            stops,
            stopDurationMs: stops.reduce((total, stop) => total + stop.durationMs, 0),
        };
    }, [points]);

    return (
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/40 p-3 md:p-4">
            <div>
                <h2 className="font-semibold tracking-tight text-gray-900">
                    مسیر و تاریخچه روزانه
                </h2>
                <p className="mt-1 text-xs text-gray-500">کارمند: {employeeName}</p>
            </div>

            {error ? (
                <div
                    role="alert"
                    className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                >
                    {error}
                </div>
            ) : null}
            {hasSearched && !loading && !error && points.length === 0 ? (
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                    برای این کارمند در تاریخ انتخاب‌شده نقطه‌ای ثبت نشده است.
                </p>
            ) : null}

            {points.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50/70 p-3 sm:grid-cols-3 lg:grid-cols-5">
                        <div className="rounded-xl border border-gray-100 bg-white p-3">
                            <div className="text-xs text-gray-500">مسافت تخمینی</div>
                            <div className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                                {(summary.meters / 1000).toLocaleString('fa-IR', {
                                    maximumFractionDigits: 2,
                                })}{' '}
                                <span className="text-xs font-normal">کیلومتر</span>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-white p-3">
                            <div className="text-xs text-gray-500">مجموع زمان توقف</div>
                            <div className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                                {formatDuration(summary.stopDurationMs)}
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-white p-3">
                            <div className="text-xs text-gray-500">نقاط ثبت‌شده</div>
                            <div className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                                {points.length.toLocaleString('fa-IR')}
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-white p-3">
                            <div className="text-xs text-gray-500">مدت ثبت مسیر</div>
                            <div className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                                {formatDuration(summary.duration)}
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-white p-3">
                            <div className="text-xs text-gray-500">توقف‌های احتمالی</div>
                            <div className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                                {summary.stops.length.toLocaleString('fa-IR')}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                        <span className="text-xs text-gray-600">نقشه مسیر روز انتخاب‌شده</span>
                        <button
                            type="button"
                            onClick={() => setMapVisible((visible) => !visible)}
                            aria-expanded={mapVisible}
                            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            {mapVisible ? 'بستن نقشه' : 'نمایش نقشه'}
                        </button>
                    </div>
                    {mapVisible ? <RouteMap key={points.map(timestamp).join(',')} points={points} /> : null}
                </>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">گزارش روزانه</h3>
                    </div>
                    <span className="text-xs text-gray-500">
                        {dailySummaries.length.toLocaleString('fa-IR')} روز دارای اطلاعات
                    </span>
                </div>
                {summaryError ? (
                    <p role="alert" className="m-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {summaryError}
                    </p>
                ) : null}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-right text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-medium">
                                    تاریخ
                                </th>
                                <th scope="col" className="px-4 py-3 font-medium">
                                    مسافت تقریبی
                                </th>
                                <th scope="col" className="px-4 py-3 font-medium">
                                    مجموع زمان توقف
                                </th>
                                <th scope="col" className="px-4 py-3 font-medium">
                                    نقاط
                                </th>
                                <th scope="col" className="px-4 py-3 font-medium">
                                    مسیر
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {dailySummaries
                                .slice()
                                .reverse()
                                .map((item) => (
                                    <tr
                                        key={item.date}
                                        className={
                                            item.date === date && hasSearched
                                                ? 'bg-blue-50/70'
                                                : 'hover:bg-gray-50'
                                        }
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                                            {formatDateLabel(item.date)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                            {(item.distance_meters / 1000).toLocaleString('fa-IR', {
                                                maximumFractionDigits: 2,
                                            })}{' '}
                                            کیلومتر
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                            {formatDuration(item.stop_duration_seconds * 1000)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {item.points_count.toLocaleString('fa-IR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDate(item.date);
                                                    setMapVisible(true);
                                                    void loadHistory(item.date);
                                                }}
                                                disabled={loading}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                                            >
                                                نمایش مسیر
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            {!summaryLoading && !summaryError && dailySummaries.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-sm text-gray-500"
                                    >
                                        در ۳۰ روز اخیر گزارشی برای این کارمند ثبت نشده است.
                                    </td>
                                </tr>
                            ) : null}
                            {summaryLoading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-sm text-gray-500"
                                    >
                                        در حال دریافت گزارش روزانه...
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-gray-100 px-4 py-3 text-xs leading-5 text-gray-500">
                    سوابق مکانی قدیمی‌تر از ۳۰ روز طبق پاک‌سازی خودکار سرور حذف می‌شوند.
                </div>
            </div>
        </section>
    );
}
