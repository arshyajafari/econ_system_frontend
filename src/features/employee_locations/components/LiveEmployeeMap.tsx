import { useEffect, useMemo, useRef, useState } from 'react';
import { getEmployeeLocationLive, type EmployeeLocation } from '../api/employeeLocations';

type LeafletMap = {
    remove(): void;
    setView(center: number[], zoom: number, options?: Record<string, unknown>): LeafletMap;
    getZoom(): number;
    invalidateSize(): void;
    fitBounds(bounds: unknown, options?: Record<string, unknown>): void;
};
type LeafletLayer = {
    addTo(map: LeafletMap | LeafletLayer): LeafletLayer;
    clearLayers(): void;
};
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

declare global {
    interface Window {
        L?: LeafletApi;
    }
}

type Props = {
    locations: EmployeeLocation[];
    selectedEmployeeId: string | null;
};

const POLL_MS = 5_000;
const MAX_GAP_MS = 5 * 60_000;
const MAX_SPEED_KMH = 180;

function pointTime(point: EmployeeLocation): number {
    return point.captured_at ? new Date(point.captured_at).getTime() : 0;
}

function distanceMeters(a: EmployeeLocation, b: EmployeeLocation): number {
    const radians = (value: number) => (value * Math.PI) / 180;
    const dLat = radians(b.latitude - a.latitude);
    const dLon = radians(b.longitude - a.longitude);
    const value =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(radians(a.latitude)) *
            Math.cos(radians(b.latitude)) *
            Math.sin(dLon / 2) ** 2;
    return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(Math.max(0, 1 - value)));
}

export function LiveEmployeeMap({ locations, selectedEmployeeId }: Props) {
    const mapElement = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const employeeLayer = useRef<LeafletLayer | null>(null);
    const routeLayer = useRef<LeafletLayer | null>(null);
    const mapInitialized = useRef(false);
    const [routePoints, setRoutePoints] = useState<EmployeeLocation[]>([]);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [followSelected, setFollowSelected] = useState(true);
    const selectedLocation = useMemo(
        () => locations.find((item) => item.employee_id === selectedEmployeeId) ?? null,
        [locations, selectedEmployeeId]
    );

    useEffect(() => {
        if (!mapElement.current || !window.L || mapRef.current) return;
        const L = window.L;
        const map = L.map(mapElement.current, { zoomControl: true, preferCanvas: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);
        mapRef.current = map;
        employeeLayer.current = L.layerGroup().addTo(map);
        routeLayer.current = L.layerGroup().addTo(map);
        map.setView([35.7, 51.4], 6);
        const resizeTimer = window.setTimeout(() => map.invalidateSize(), 100);
        return () => {
            window.clearTimeout(resizeTimer);
            map.remove();
            mapRef.current = null;
            employeeLayer.current = null;
            routeLayer.current = null;
        };
    }, []);

    useEffect(() => {
        if (!selectedEmployeeId) {
            return;
        }
        let cancelled = false;
        let timer: number | null = null;
        let cursor: string | null = null;
        const seen = new Set<string>();

        const poll = async (initial: boolean) => {
            try {
                const fresh = await getEmployeeLocationLive(selectedEmployeeId, initial ? null : cursor);
                if (cancelled) return;
                const ordered = fresh
                    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
                    .sort((a, b) => pointTime(a) - pointTime(b));
                const additions = ordered.filter((point) => !seen.has(point.id));
                additions.forEach((point) => seen.add(point.id));
                if (additions.length) {
                    setRoutePoints((current) => {
                        const merged = new Map(current.map((point) => [point.id, point]));
                        additions.forEach((point) => merged.set(point.id, point));
                        return Array.from(merged.values())
                            .sort((a, b) => pointTime(a) - pointTime(b))
                            .slice(-5000);
                    });
                    const last = ordered[ordered.length - 1];
                    if (last?.captured_at) cursor = last.captured_at;
                }
                setRouteError(null);
            } catch {
                if (!cancelled) setRouteError('دریافت مسیر زنده با مشکل مواجه شد؛ تلاش مجدد ادامه دارد.');
            } finally {
                if (!cancelled) {
                    timer = window.setTimeout(() => void poll(false), POLL_MS);
                }
            }
        };

        void poll(true);
        return () => {
            cancelled = true;
            if (timer !== null) window.clearTimeout(timer);
        };
    }, [selectedEmployeeId]);

    useEffect(() => {
        const map = mapRef.current;
        const L = window.L;
        if (!map || !L || !employeeLayer.current || !routeLayer.current) return;

        employeeLayer.current.clearLayers();
        routeLayer.current.clearLayers();

        locations.forEach((item) => {
            const selected = item.employee_id === selectedEmployeeId;
            const marker = L.circleMarker([item.latitude, item.longitude], {
                radius: selected ? 10 : 7,
                color: selected ? '#1d4ed8' : '#475569',
                weight: 3,
                fillColor: selected ? '#3b82f6' : '#94a3b8',
                fillOpacity: 0.95,
            });
            marker.bindTooltip(item.employee_name, { direction: 'top', offset: [0, -8] });
            marker.addTo(employeeLayer.current!);
        });

        const segments: EmployeeLocation[][] = [];
        let current: EmployeeLocation[] = [];
        routePoints.forEach((point, index) => {
            if (index > 0) {
                const previous = routePoints[index - 1];
                const gap = pointTime(point) - pointTime(previous);
                const distance = distanceMeters(previous, point);
                const speed = gap > 0 ? (distance / gap) * 3_600 : Number.POSITIVE_INFINITY;
                if (gap <= 0 || gap > MAX_GAP_MS || speed > MAX_SPEED_KMH) {
                    if (current.length > 1) segments.push(current);
                    current = [];
                }
            }
            current.push(point);
        });
        if (current.length > 1) segments.push(current);

        segments.forEach((segment) => {
            L.polyline(segment.map((point) => [point.latitude, point.longitude]), {
                color: '#2563eb',
                weight: 5,
                opacity: 0.82,
                lineCap: 'round',
                lineJoin: 'round',
            }).addTo(routeLayer.current!);
        });

        if (selectedLocation) {
            const currentMarker = L.circleMarker(
                [selectedLocation.latitude, selectedLocation.longitude],
                { radius: 11, color: '#ffffff', weight: 3, fillColor: '#16a34a', fillOpacity: 1 }
            );
            currentMarker.bindTooltip(`موقعیت فعلی: ${selectedLocation.employee_name}`, {
                permanent: false,
                direction: 'top',
            });
            currentMarker.addTo(routeLayer.current!);
            if (followSelected) {
                map.setView([selectedLocation.latitude, selectedLocation.longitude], Math.max(map.getZoom(), 15), {
                    animate: true,
                    duration: 0.6,
                });
            } else if (!mapInitialized.current) {
                map.setView([selectedLocation.latitude, selectedLocation.longitude], 14);
            }
            mapInitialized.current = true;
        } else if (locations.length > 0 && !mapInitialized.current) {
            const bounds = L.latLngBounds(locations.map((item) => [item.latitude, item.longitude]));
            map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
            mapInitialized.current = true;
        }
    }, [locations, routePoints, selectedEmployeeId, selectedLocation, followSelected]);

    useEffect(() => {
        mapInitialized.current = false;
    }, [selectedEmployeeId]);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    موقعیت آخر
                    <span className="mr-2 inline-block h-1 w-5 rounded bg-blue-600" />
                    مسیر ثبت‌شده امروز
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                    <input
                        type="checkbox"
                        checked={followSelected}
                        onChange={(event) => setFollowSelected(event.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    دنبال‌کردن خودکار کارمند
                </label>
            </div>
            <div ref={mapElement} className="h-[360px] w-full bg-slate-100 sm:h-[480px]" />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
                <span>
                    {routePoints.length ? `نقاط مسیر: ${routePoints.length.toLocaleString('fa-IR')}` : 'در انتظار دریافت مسیر...'}
                </span>
                {routeError ? <span role="status" className="text-amber-700">{routeError}</span> : null}
                <span>به‌روزرسانی مسیر: هر ۵ ثانیه</span>
            </div>
        </div>
    );
}
