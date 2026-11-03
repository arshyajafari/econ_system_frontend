import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../api/client';
import { JalaliDateInput } from '../../../components/JalaliDateInput';
import {
    correctEmployeeWorkSession,
    getEmployeeWorkSessions,
    getEmployeeWorkSessionLocations,
    type EmployeeLocation,
    type EmployeeWorkSession,
} from '../api/employeeLocations';

type LeafletMap = {
    remove(): void;
    setView(center: number[], zoom: number, options?: Record<string, unknown>): LeafletMap;
    fitBounds(bounds: unknown, options?: Record<string, unknown>): void;
    invalidateSize(): void;
};
type LeafletLayer = { addTo(map: LeafletMap | LeafletLayer): LeafletLayer; clearLayers(): void };
type LeafletMarker = LeafletLayer & {
    bindTooltip(content: string, options?: Record<string, unknown>): LeafletMarker;
};
type LeafletApi = {
    map(element: HTMLElement, options?: Record<string, unknown>): LeafletMap;
    tileLayer(url: string, options?: Record<string, unknown>): LeafletLayer;
    layerGroup(): LeafletLayer;
    circleMarker(center: number[], options?: Record<string, unknown>): LeafletMarker;
    polyline(points: number[][], options?: Record<string, unknown>): LeafletLayer;
    latLngBounds(points: number[][]): unknown;
};

const EMPTY_ROUTE_POINTS: EmployeeLocation[] = [];

function localDate(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tehran',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}
function time(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('fa-IR');
}
function formatDuration(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    return hours > 0
        ? `${hours.toLocaleString('fa-IR')} ساعت و ${minutes.toLocaleString('fa-IR')} دقیقه`
        : `${minutes.toLocaleString('fa-IR')} دقیقه`;
}

export function EmployeeWorkSessionsPanel() {
    const [date, setDate] = useState(localDate);
    const [sessions, setSessions] = useState<EmployeeWorkSession[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loadedDate, setLoadedDate] = useState<string | null>(null);
    const loading = loadedDate !== date;
    const [error, setError] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<EmployeeWorkSession | null>(null);
    const [routeState, setRouteState] = useState<{
        sessionId: string;
        points: EmployeeLocation[];
        error: string | null;
    } | null>(null);
    const routePoints =
        selectedSession && routeState?.sessionId === selectedSession.id
            ? routeState.points
            : EMPTY_ROUTE_POINTS;
    const routeLoading = Boolean(selectedSession && routeState?.sessionId !== selectedSession.id);
    const routeError =
        selectedSession && routeState?.sessionId === selectedSession.id ? routeState.error : null;
    const [correctionSession, setCorrectionSession] = useState<EmployeeWorkSession | null>(null);
    const [correctionReason, setCorrectionReason] = useState('');
    const [savingCorrection, setSavingCorrection] = useState(false);
    const mapElement = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markersRef = useRef<LeafletLayer | null>(null);

    useEffect(() => {
        let cancelled = false;
        getEmployeeWorkSessions(date)
            .then((value) => {
                if (!cancelled) {
                    setSessions(value);
                    setSelectedSession((current) =>
                        current && value.some((item) => item.id === current.id) ? current : null
                    );
                    setError(null);
                }
            })
            .catch((cause: unknown) => {
                if (!cancelled)
                    setError(
                        cause instanceof ApiError
                            ? cause.message
                            : 'دریافت سوابق مأموریت ناموفق بود.'
                    );
            })
            .finally(() => {
                if (!cancelled) setLoadedDate(date);
            });
        return () => {
            cancelled = true;
        };
    }, [date, refreshKey]);

    useEffect(() => {
        const sessionId = selectedSession?.id;
        if (!sessionId) return;

        let cancelled = false;
        let timer: number | null = null;

        const loadRoute = async () => {
            try {
                const points = await getEmployeeWorkSessionLocations(sessionId);
                if (!cancelled) {
                    setRouteState({
                        sessionId,
                        points: Array.isArray(points) ? points : [],
                        error: null,
                    });
                }
            } catch (cause: unknown) {
                if (!cancelled) {
                    setRouteState({
                        sessionId,
                        points: [],
                        error:
                            cause instanceof ApiError
                                ? cause.message
                                : 'دریافت مسیر این مأموریت ناموفق بود.',
                    });
                }
            } finally {
                if (!cancelled && selectedSession?.status === 'in_progress') {
                    timer = window.setTimeout(() => void loadRoute(), 10_000);
                }
            }
        };

        void loadRoute();

        return () => {
            cancelled = true;
            if (timer !== null) window.clearTimeout(timer);
        };
    }, [selectedSession?.id, selectedSession?.status, refreshKey]);


    useEffect(() => {
        const L = (window as Window & { L?: LeafletApi }).L;
        if (!mapElement.current || !L || mapRef.current) return;
        const map = L.map(mapElement.current, { zoomControl: true, preferCanvas: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        mapRef.current = map;
        markersRef.current = L.layerGroup().addTo(map);
        map.setView([35.7, 51.4], 5);
        const resize = window.setTimeout(() => map.invalidateSize(), 150);
        return () => {
            window.clearTimeout(resize);
            map.remove();
            mapRef.current = null;
            markersRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        const L = (window as Window & { L?: LeafletApi }).L;
        const layer = markersRef.current;
        if (!map || !L || !layer) return;
        layer.clearLayers();
        if (!selectedSession) return;

        const start = [selectedSession.start.latitude, selectedSession.start.longitude];
        const end = selectedSession.end
            ? [selectedSession.end.latitude, selectedSession.end.longitude]
            : null;
        const recordedPoints = routePoints
            .filter(
                (point) =>
                    Number.isFinite(point.latitude) &&
                    Number.isFinite(point.longitude) &&
                    point.latitude >= -90 &&
                    point.latitude <= 90 &&
                    point.longitude >= -180 &&
                    point.longitude <= 180
            )
            .map((point) => [point.latitude, point.longitude]);
        const path = [start, ...recordedPoints, ...(end ? [end] : [])];

        L.circleMarker(start, {
            radius: 9,
            color: '#fff',
            weight: 2,
            fillColor: '#16a34a',
            fillOpacity: 1,
        })
            .bindTooltip('محل شروع مأموریت')
            .addTo(layer);

        if (end) {
            L.circleMarker(end, {
                radius: 9,
                color: '#fff',
                weight: 2,
                fillColor: '#dc2626',
                fillOpacity: 1,
            })
                .bindTooltip('محل پایان مأموریت')
                .addTo(layer);
        }

        if (recordedPoints.length > 0) {
            L.polyline(path, {
                color: '#2563eb',
                weight: 4,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
            }).addTo(layer);
            map.fitBounds(L.latLngBounds(path), { padding: [40, 40], maxZoom: 16 });
        } else if (end) {
            // Legacy sessions have only start/end coordinates; show a dashed estimate.
            L.polyline([start, end], {
                color: '#64748b',
                weight: 4,
                opacity: 0.8,
                dashArray: '7 7',
            }).addTo(layer);
            map.fitBounds(L.latLngBounds([start, end]), { padding: [40, 40], maxZoom: 16 });
        } else {
            map.setView(start, 16);
        }

        window.setTimeout(() => map.invalidateSize(), 100);
    }, [selectedSession, routePoints]);
    const submitCorrection = async () => {
        if (!correctionSession || correctionReason.trim().length < 5 || savingCorrection) return;
        setSavingCorrection(true);
        setError(null);
        try {
            const corrected = await correctEmployeeWorkSession(
                correctionSession.id,
                correctionReason.trim()
            );
            setSessions((current) =>
                current.map((item) => (item.id === corrected.id ? corrected : item))
            );
            setSelectedSession((current) => (current?.id === corrected.id ? corrected : current));
            setCorrectionSession(null);
            setCorrectionReason('');
        } catch (cause: unknown) {
            setError(cause instanceof ApiError ? cause.message : 'اصلاح مأموریت انجام نشد.');
        } finally {
            setSavingCorrection(false);
        }
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
                <div>
                    <h2 className="font-semibold text-gray-900">سوابق مأموریت‌ها</h2>
                    <p className="mt-1 text-xs text-gray-500">
                        برای دیدن موقعیت مکانی هر ماموریت، دکمه نمایش نقشه را بزنید.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500" htmlFor="work-session-date">
                        تاریخ
                    </label>
                    <JalaliDateInput
                        id="work-session-date"
                        value={date}
                        onChange={setDate}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="۱۴۰۵/۰۸/۱۰"
                    />
                    <button
                        type="button"
                        onClick={() => setRefreshKey((value) => value + 1)}
                        disabled={loading}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-50"
                    >
                        بروزرسانی
                    </button>
                </div>
            </div>
            {error ? (
                <div
                    role="alert"
                    className="mx-4 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                    {error}
                </div>
            ) : null}
            {loading ? (
                <p className="p-5 text-sm text-gray-500">در حال دریافت سوابق...</p>
            ) : sessions.length === 0 ? (
                <p className="p-5 text-sm text-gray-500">برای این تاریخ مأموریتی ثبت نشده است.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-right text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">کارمند</th>
                                <th className="px-4 py-3 font-medium">شرح مأموریت</th>
                                <th className="px-4 py-3 font-medium">شروع / دقت GPS</th>
                                <th className="px-4 py-3 font-medium">پایان / دقت GPS</th>
                                <th className="px-4 py-3 font-medium">مدت مأموریت</th>
                                <th className="px-4 py-3 font-medium">وضعیت</th>
                                <th className="px-4 py-3 font-medium">اقدامات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sessions.map((session) => (
                                <tr
                                    key={session.id}
                                    className={
                                        selectedSession?.id === session.id ? 'bg-blue-50/70' : ''
                                    }
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {session.employee_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {session.description || '—'}
                                        {session.admin_correction_reason ? (
                                            <p className="mt-1 text-xs text-amber-700">
                                                دلیل اصلاح: {session.admin_correction_reason}
                                            </p>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {time(session.started_at)}
                                        <p className="mt-1 text-xs text-gray-500">
                                            دقت:{' '}
                                            {session.start.accuracy === null
                                                ? 'نامشخص'
                                                : `${Math.round(session.start.accuracy)} متر`}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {time(session.ended_at)}
                                        <p className="mt-1 text-xs text-gray-500">
                                            دقت:{' '}
                                            {session.end?.accuracy == null
                                                ? 'ثبت نشده'
                                                : `${Math.round(session.end.accuracy)} متر`}
                                        </p>
                                        {session.admin_corrected_at ? (
                                            <p className="mt-1 text-xs text-amber-700">
                                                اصلاح‌شده توسط مدیر
                                            </p>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {formatDuration(session.duration_seconds)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs ${session.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}
                                        >
                                            {session.status === 'completed'
                                                ? 'پایان‌یافته'
                                                : 'در حال فعالیت'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSession(session)}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${selectedSession?.id === session.id ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}
                                            >
                                                نمایش روی نقشه
                                            </button>
                                            {session.status === 'in_progress' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCorrectionSession(session);
                                                        setCorrectionReason('');
                                                    }}
                                                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                                                >
                                                    اصلاح مأموریت ناقص
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {correctionSession ? (
                <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="text-sm font-semibold text-amber-900">
                        تکمیل مأموریت ناقص: {correctionSession.employee_name}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                        این کار مأموریت را با زمان فعلی سرور پایان می‌دهد. اگر مختصات پایان در دسترس
                        نیست، مختصاتی ساخته نمی‌شود؛ دلیل اصلاح برای پیگیری ثبت خواهد شد.
                    </p>
                    <label className="mt-3 block text-sm text-gray-700">
                        دلیل اصلاح (اجباری)
                        <textarea
                            value={correctionReason}
                            onChange={(event) => setCorrectionReason(event.target.value)}
                            maxLength={2000}
                            rows={3}
                            placeholder="مثلاً کارمند پایان مأموریت را فراموش کرده؛ زمان پایان با تأیید سرپرست ثبت شد."
                            className="mt-1 w-full rounded-lg border border-amber-200 bg-white p-3 text-sm outline-none focus:border-amber-400"
                        />
                    </label>
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={() => void submitCorrection()}
                            disabled={savingCorrection || correctionReason.trim().length < 5}
                            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {savingCorrection ? 'در حال ثبت...' : 'ثبت اصلاح و پایان مأموریت'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCorrectionSession(null)}
                            disabled={savingCorrection}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
                        >
                            انصراف
                        </button>
                    </div>
                </div>
            ) : null}
            {selectedSession ? (
                <div className="mx-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {routeLoading
                        ? 'در حال دریافت مسیر ثبت‌شده مأموریت...'
                        : routeError
                          ? routeError
                          : routePoints.length > 0
                            ? `مسیر واقعی مأموریت با ${routePoints.length.toLocaleString('fa-IR')} نقطه میانی ثبت‌شده نمایش داده می‌شود.`
                            : 'برای این مأموریت نقطه میانی ثبت نشده است؛ فقط مختصات شروع و پایان موجود است.'}
                </div>
            ) : null}
            <div className="relative isolate z-0">
                <div ref={mapElement} className="relative z-0 h-[300px] w-full bg-slate-100 sm:h-[380px]" />
                {selectedSession ? (
                    <div className="absolute bottom-3 right-3 z-10 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow">
                        <span className="ml-3 text-emerald-700">● شروع</span>
                        <span className="text-red-600">● پایان</span>
                        <span className="mr-3 text-gray-500">{selectedSession.employee_name}</span>
                    </div>
                ) : (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/65 text-sm text-gray-600 pointer-events-none">
                        برای نمایش مختصات، دکمه «نقشه» یکی از ردیف‌ها را انتخاب کنید.
                    </div>
                )}
            </div>
        </section>
    );
}
