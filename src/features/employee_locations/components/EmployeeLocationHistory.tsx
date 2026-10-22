import { useCallback, useMemo, useState } from 'react';
import { ApiError } from '../../../api/client';
import { getEmployeeLocationHistory, type EmployeeLocation } from '../api/employeeLocations';

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
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(value: string | null): string {
    if (!value) return 'زمان نامشخص';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'زمان نامشخص' : date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(milliseconds: number): string {
    const minutes = Math.round(milliseconds / 60_000);
    if (minutes < 60) return `${minutes.toLocaleString('fa-IR')} دقیقه`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours.toLocaleString('fa-IR')} ساعت و ${remainder.toLocaleString('fa-IR')} دقیقه` : `${hours.toLocaleString('fa-IR')} ساعت`;
}

function distanceMeters(a: EmployeeLocation, b: EmployeeLocation): number {
    const radians = (degrees: number) => degrees * Math.PI / 180;
    const latitudeDelta = radians(b.latitude - a.latitude);
    const longitudeDelta = radians(b.longitude - a.longitude);
    const value = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
    return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(Math.max(0, 1 - value)));
}

function timestamp(point: EmployeeLocation): number {
    return point.captured_at ? new Date(point.captured_at).getTime() : Number.NaN;
}

function validPoint(point: EmployeeLocation): boolean {
    return Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
        && point.latitude >= -90 && point.latitude <= 90
        && point.longitude >= -180 && point.longitude <= 180
        && Number.isFinite(timestamp(point));
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
        const withinRadius = distanceMeters(points[anchorIndex], points[index]) <= STOP_RADIUS_METERS;
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
    const latitudeRadians = Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI / 180;
    return {
        x: ((longitude + 180) / 360) * scale,
        y: (1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2 * scale,
    };
}

function RouteMap({ points }: { points: EmployeeLocation[] }) {
    const map = useMemo(() => {
        if (!points.length) return null;
        let zoom = 16;
        let projected = points.map((point) => project(point.latitude, point.longitude, zoom));
        for (let candidate = 16; candidate >= 3; candidate -= 1) {
            const values = points.map((point) => project(point.latitude, point.longitude, candidate));
            const xs = values.map((point) => point.x);
            const ys = values.map((point) => point.y);
            const width = Math.max(...xs) - Math.min(...xs);
            const height = Math.max(...ys) - Math.min(...ys);
            zoom = candidate;
            projected = values;
            if (width <= 2.45 && height <= 1.45) break;
        }
        const centerX = (Math.min(...projected.map((point) => point.x)) + Math.max(...projected.map((point) => point.x))) / 2;
        const centerY = (Math.min(...projected.map((point) => point.y)) + Math.max(...projected.map((point) => point.y))) / 2;
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
                tiles.push({ key: `${zoom}-${x}-${rawY}`, url: `https://tile.openstreetmap.org/${zoom}/${x}/${rawY}.png`, left: rawX * TILE_SIZE - originX, top: rawY * TILE_SIZE - originY });
            }
        }
        const coordinates = projected.map((point) => ({ x: point.x * TILE_SIZE - originX, y: point.y * TILE_SIZE - originY }));
        const segments: { x: number; y: number }[][] = [];
        let segment: { x: number; y: number }[] = [];
        for (let index = 0; index < points.length; index += 1) {
            if (index > 0) {
                const gap = timestamp(points[index]) - timestamp(points[index - 1]);
                const distance = distanceMeters(points[index - 1], points[index]);
                const speed = gap > 0 ? distance / gap * 3_600 : Number.POSITIVE_INFINITY;
                if (gap > MAX_GAP_MS || gap <= 0 || speed > MAX_SPEED_KMH) {
                    if (segment.length) segments.push(segment);
                    segment = [];
                }
            }
            segment.push(coordinates[index]);
        }
        if (segment.length) segments.push(segment);
        return { zoom, tiles, coordinates, segments };
    }, [points]);

    if (!map) return null;
    return (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100" role="img" aria-label="نقشه مسیر ثبت‌شده">
            {map.tiles.map((tile) => (
                <img key={tile.key} src={tile.url} alt="" draggable={false} className="absolute h-64 w-64 max-w-none" style={{ left: tile.left, top: tile.top }} loading="lazy" />
            ))}
            <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
                {map.segments.map((segment, index) => (
                    <polyline key={index} points={segment.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {map.coordinates.map((point, index) => (
                    <circle key={index} cx={point.x} cy={point.y} r={index === 0 || index === map.coordinates.length - 1 ? 7 : 3.5} fill={index === 0 ? '#16a34a' : index === map.coordinates.length - 1 ? '#dc2626' : '#ffffff'} stroke="#1d4ed8" strokeWidth="2" />
                ))}
            </svg>
            <div className="absolute bottom-2 left-2 rounded bg-white/95 px-2 py-1 text-[10px] text-gray-600 shadow">© OpenStreetMap · بزرگ‌نمایی {map.zoom}</div>
        </div>
    );
}

export function EmployeeLocationHistory({ employeeId, employeeName }: Props) {
    const [date, setDate] = useState(localDateValue);
    const [points, setPoints] = useState<EmployeeLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        setHasSearched(true);
        try {
            const result = await getEmployeeLocationHistory(employeeId, date);
            const valid = Array.isArray(result) ? result.filter(validPoint).sort((a, b) => timestamp(a) - timestamp(b)) : [];
            setPoints(valid);
        } catch (e: unknown) {
            setError(e instanceof ApiError ? e.message : 'دریافت تاریخچه موقعیت ناموفق بود. اتصال شبکه را بررسی کنید.');
            setPoints([]);
        } finally {
            setLoading(false);
        }
    }, [date, employeeId]);

    const summary = useMemo(() => {
        let meters = 0;
        let connectedSegments = 0;
        let gaps = 0;
        for (let index = 1; index < points.length; index += 1) {
            const gap = timestamp(points[index]) - timestamp(points[index - 1]);
            const distance = distanceMeters(points[index - 1], points[index]);
            const speed = gap > 0 ? distance / gap * 3_600 : Number.POSITIVE_INFINITY;
            if (gap > MAX_GAP_MS || gap <= 0 || speed > MAX_SPEED_KMH) {
                gaps += 1;
                continue;
            }
            meters += distance;
            connectedSegments += 1;
        }
        const duration = points.length > 1 ? Math.max(0, timestamp(points[points.length - 1]) - timestamp(points[0])) : 0;
        return { meters, connectedSegments, gaps, duration, stops: findStops(points) };
    }, [points]);

    return (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="font-semibold text-gray-900">مسیر و تاریخچه روزانه</h2>
                    <p className="mt-1 text-xs text-gray-500">کارمند: {employeeName} · توقف‌ها و مسافت به‌صورت تقریبی محاسبه می‌شوند.</p>
                </div>
                <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); void loadHistory(); }}>
                    <label className="block">
                        <span className="mb-1 block text-xs text-gray-600">تاریخ</span>
                        <input type="date" value={date} max={localDateValue()} onChange={(event) => setDate(event.target.value)} required className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </label>
                    <button type="submit" disabled={loading || !date} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{loading ? 'در حال دریافت...' : 'نمایش مسیر'}</button>
                </form>
            </div>

            {error ? <div role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            {!hasSearched ? <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">تاریخ را انتخاب کنید و «نمایش مسیر» را بزنید تا مسیر و توقف‌های ثبت‌شده نمایش داده شود.</p> : null}
            {hasSearched && !loading && !error && points.length === 0 ? <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">برای این کارمند در تاریخ انتخاب‌شده نقطه‌ای ثبت نشده است.</p> : null}

            {points.length > 0 ? (
                <>
                    <RouteMap points={points} />
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <div className="rounded-lg border border-gray-100 p-3"><div className="text-xs text-gray-500">مسافت تخمینی</div><div className="mt-1 text-lg font-semibold text-gray-900">{(summary.meters / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} کیلومتر</div></div>
                        <div className="rounded-lg border border-gray-100 p-3"><div className="text-xs text-gray-500">نقاط ثبت‌شده</div><div className="mt-1 text-lg font-semibold text-gray-900">{points.length.toLocaleString('fa-IR')}</div></div>
                        <div className="rounded-lg border border-gray-100 p-3"><div className="text-xs text-gray-500">مدت بین اولین و آخرین ثبت</div><div className="mt-1 text-lg font-semibold text-gray-900">{formatDuration(summary.duration)}</div></div>
                        <div className="rounded-lg border border-gray-100 p-3"><div className="text-xs text-gray-500">توقف‌های احتمالی</div><div className="mt-1 text-lg font-semibold text-gray-900">{summary.stops.length.toLocaleString('fa-IR')}</div></div>
                    </div>
                    {summary.gaps > 0 ? <p className="text-xs leading-5 text-amber-700">بین برخی نقاط فاصله زمانی زیاد یا پرش غیرواقعی وجود داشته است؛ این بخش‌ها برای جلوگیری از برآورد گمراه‌کننده از مسافت و خط مسیر کنار گذاشته شده‌اند ({summary.gaps.toLocaleString('fa-IR')} بخش).</p> : null}
                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-800">توقف‌های احتمالی (حداقل ۵ دقیقه در شعاع ۵۰ متری)</h3>
                        {summary.stops.length ? (
                            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                                {summary.stops.map((stop, index) => (
                                    <div key={`${stop.start}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm">
                                        <div><span className="font-medium text-gray-800">{formatTime(stop.start)} تا {formatTime(stop.end)}</span><div className="mt-1 text-xs text-gray-500">مختصات: {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}</div></div>
                                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">حدود {formatDuration(stop.durationMs)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">توقف قابل تشخیصی با این معیارها ثبت نشده است.</p>}
                    </div>
                    <p className="text-xs leading-5 text-gray-500">خطوط بین نقاط با فاصله زمانی حداکثر ۵ دقیقه رسم می‌شوند. مسافت فقط از بخش‌های دارای فاصله زمانی قابل قبول و سرعت محاسباتی کمتر از ۱۸۰ کیلومتر بر ساعت محاسبه می‌شود. این گزارش تخمینی است و در صورت قطع GPS یا اینترنت کامل نیست.</p>
                </>
            ) : null}
        </section>
    );
}
