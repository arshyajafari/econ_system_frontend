import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../api/client';
import { getEmployeeWorkSessions, type EmployeeWorkSession } from '../api/employeeLocations';

type LeafletMap = {
    remove(): void;
    setView(center: number[], zoom: number, options?: Record<string, unknown>): LeafletMap;
    fitBounds(bounds: unknown, options?: Record<string, unknown>): void;
    invalidateSize(): void;
};
type LeafletLayer = { addTo(map: LeafletMap | LeafletLayer): LeafletLayer; clearLayers(): void };
type LeafletMarker = LeafletLayer & { bindTooltip(content: string, options?: Record<string, unknown>): LeafletMarker };
type LeafletApi = {
    map(element: HTMLElement, options?: Record<string, unknown>): LeafletMap;
    tileLayer(url: string, options?: Record<string, unknown>): LeafletLayer;
    layerGroup(): LeafletLayer;
    circleMarker(center: number[], options?: Record<string, unknown>): LeafletMarker;
    polyline(points: number[][], options?: Record<string, unknown>): LeafletLayer;
    latLngBounds(points: number[][]): unknown;
};

function localDate(): string {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
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
    return hours > 0 ? `${hours.toLocaleString('fa-IR')} ساعت و ${minutes.toLocaleString('fa-IR')} دقیقه` : `${minutes.toLocaleString('fa-IR')} دقیقه`;
}

export function EmployeeWorkSessionsPanel() {
    const [date, setDate] = useState(localDate);
    const [sessions, setSessions] = useState<EmployeeWorkSession[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loadedDate, setLoadedDate] = useState<string | null>(null);
    const loading = loadedDate !== date;
    const [error, setError] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<EmployeeWorkSession | null>(null);
    const mapElement = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markersRef = useRef<LeafletLayer | null>(null);

    useEffect(() => {
        let cancelled = false;
        getEmployeeWorkSessions(date).then(value => {
            if (!cancelled) {
                setSessions(value);
                setSelectedSession(current => current && value.some(item => item.id === current.id) ? current : null);
                setError(null);
            }
        }).catch((cause: unknown) => {
            if (!cancelled) setError(cause instanceof ApiError ? cause.message : 'دریافت سوابق مأموریت ناموفق بود.');
        }).finally(() => { if (!cancelled) setLoadedDate(date); });
        return () => { cancelled = true; };
    }, [date, refreshKey]);

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
        const end = selectedSession.end ? [selectedSession.end.latitude, selectedSession.end.longitude] : null;
        L.circleMarker(start, { radius: 9, color: '#fff', weight: 2, fillColor: '#16a34a', fillOpacity: 1 })
            .bindTooltip('محل شروع مأموریت').addTo(layer);
        if (end) {
            L.circleMarker(end, { radius: 9, color: '#fff', weight: 2, fillColor: '#dc2626', fillOpacity: 1 })
                .bindTooltip('محل پایان مأموریت').addTo(layer);
            L.polyline([start, end], { color: '#2563eb', weight: 4, opacity: 0.8, dashArray: '7 7' }).addTo(layer);
            map.fitBounds(L.latLngBounds([start, end]), { padding: [40, 40], maxZoom: 16 });
        } else {
            map.setView(start, 16);
        }
        window.setTimeout(() => map.invalidateSize(), 100);
    }, [selectedSession]);

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
                <div>
                    <h2 className="font-semibold text-gray-900">سوابق مأموریت‌ها</h2>
                    <p className="mt-1 text-xs text-gray-500">برای دیدن محل شروع و پایان هر مأموریت، دکمه نقشه همان ردیف را بزنید.</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500" htmlFor="work-session-date">تاریخ</label>
                    <input id="work-session-date" type="date" value={date} onChange={event => setDate(event.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-sm" />
                    <button type="button" onClick={() => setRefreshKey(value => value + 1)} disabled={loading} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-50">بروزرسانی</button>
                </div>
            </div>
            {loading ? <p className="p-5 text-sm text-gray-500">در حال دریافت سوابق...</p> : sessions.length === 0 ? <p className="p-5 text-sm text-gray-500">برای این تاریخ مأموریتی ثبت نشده است.</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-right text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500"><tr>
                            <th className="px-4 py-3 font-medium">کارمند</th>
                            <th className="px-4 py-3 font-medium">شروع</th>
                            <th className="px-4 py-3 font-medium">پایان</th>
                            <th className="px-4 py-3 font-medium">مدت مأموریت</th>
                            <th className="px-4 py-3 font-medium">وضعیت</th>
                            <th className="px-4 py-3 font-medium">نقشه</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {sessions.map(session => (
                                <tr key={session.id} className={selectedSession?.id === session.id ? 'bg-blue-50/70' : ''}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{session.employee_name}</td>
                                    <td className="px-4 py-3 text-gray-700">{time(session.started_at)}</td>
                                    <td className="px-4 py-3 text-gray-700">{time(session.ended_at)}</td>
                                    <td className="px-4 py-3 text-gray-700">{formatDuration(session.duration_seconds)}</td>
                                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${session.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>{session.status === 'completed' ? 'پایان‌یافته' : 'در حال فعالیت'}</span></td>
                                    <td className="px-4 py-3"><button type="button" onClick={() => setSelectedSession(session)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${selectedSession?.id === session.id ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>نمایش روی نقشه</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="relative">
                <div ref={mapElement} className="h-[300px] w-full bg-slate-100 sm:h-[380px]" />
                {selectedSession ? (
                    <div className="absolute bottom-3 right-3 z-[500] rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow">
                        <span className="ml-3 text-emerald-700">● شروع</span>
                        <span className="text-red-600">● پایان</span>
                        <span className="mr-3 text-gray-500">{selectedSession.employee_name}</span>
                    </div>
                ) : (
                    <div className="absolute inset-0 z-[400] flex items-center justify-center bg-white/65 text-sm text-gray-600 pointer-events-none">
                        برای نمایش مختصات، دکمه «نقشه» یکی از ردیف‌ها را انتخاب کنید.
                    </div>
                )}
            </div>

        </section>
    );
}
