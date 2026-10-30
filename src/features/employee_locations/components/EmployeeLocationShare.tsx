import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../api/client';
import { sendMyLocation } from '../api/employeeLocations';

const MIN_SEND_INTERVAL_MS = 30_000;
const SEND_RETRY_TICK_MS = 5_000;
const MAX_FIX_AGE_MS = 90_000;

function formatTime(timestamp: number | null): string {
    if (!timestamp) return 'هنوز ثبت نشده';
    return new Date(timestamp).toLocaleTimeString('fa-IR');
}

export function EmployeeLocationShare() {
    const [enabled, setEnabled] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [lastSentAt, setLastSentAt] = useState<number | null>(null);
    const [hasFix, setHasFix] = useState(false);
    const watchId = useRef<number | null>(null);
    const retryTimer = useRef<number | null>(null);
    const latestPosition = useRef<GeolocationPosition | null>(null);
    const lastSentAtRef = useRef(0);
    const lastSentPositionTimestampRef = useRef(0);
    const operationRef = useRef<{ timestamp: number; id: string } | null>(null);
    const sending = useRef(false);
    const active = useRef(false);

    const sendPosition = useCallback(async (position: GeolocationPosition) => {
        if (!active.current) return;
        latestPosition.current = position;

        if (Date.now() - position.timestamp > MAX_FIX_AGE_MS) {
            setHasFix(false);
            setMessage('مختصات دریافتی قدیمی است؛ تا دریافت موقعیت تازه، مختصات قبلی دوباره ثبت نمی‌شود.');
            return;
        }
        setHasFix(true);

        // A GPS fix is one event: reuse its operation ID during retries and never store
        // the same fix repeatedly as if it were a new movement.
        if (!operationRef.current || operationRef.current.timestamp !== position.timestamp) {
            operationRef.current = { timestamp: position.timestamp, id: crypto.randomUUID() };
        }
        if (position.timestamp <= lastSentPositionTimestampRef.current || sending.current) return;
        if (Date.now() - lastSentAtRef.current < MIN_SEND_INTERVAL_MS) return;
        sending.current = true;
        try {
            await sendMyLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                source: 'browser',
                captured_at: new Date(position.timestamp).toISOString(),
                client_operation_id: operationRef.current.id,
            });
            const sentAt = Date.now();
            lastSentAtRef.current = sentAt;
            lastSentPositionTimestampRef.current = position.timestamp;
            setLastSentAt(sentAt);
            setMessage('موقعیت با موفقیت ثبت شد و برای مدیر قابل مشاهده است.');
        } catch (error: unknown) {
            setMessage(
                error instanceof ApiError
                    ? error.message
                    : 'ارسال موقعیت انجام نشد؛ اتصال بررسی می‌شود و ارسال دوباره تلاش خواهد شد.'
            );
        } finally {
            sending.current = false;
        }
    }, []);

    const stop = useCallback((notice = 'اشتراک‌گذاری موقعیت متوقف شد.') => {
        active.current = false;
        if (watchId.current !== null && 'geolocation' in navigator) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        if (retryTimer.current !== null) {
            window.clearInterval(retryTimer.current);
            retryTimer.current = null;
        }
        latestPosition.current = null;
        setEnabled(false);
        setBusy(false);
        setHasFix(false);
        setMessage(notice);
    }, []);

    const start = useCallback(() => {
        if (active.current || busy) return;
        if (!('geolocation' in navigator)) {
            setMessage('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند.');
            return;
        }
        if (!window.isSecureContext) {
            setMessage(
                'برای استفاده از موقعیت مکانی، صفحه باید از طریق HTTPS یا localhost باز شود.'
            );
            return;
        }

        active.current = true;
        lastSentAtRef.current = 0;
        lastSentPositionTimestampRef.current = 0;
        operationRef.current = null;
        latestPosition.current = null;
        setBusy(true);
        setHasFix(false);
        setMessage('در انتظار دریافت موقعیت GPS از دستگاه...');
        watchId.current = navigator.geolocation.watchPosition(
            (position) => {
                if (!active.current) return;
                setBusy(false);
                latestPosition.current = position;
                void sendPosition(position);
            },
            (error) => {
                if (!active.current) return;
                setBusy(false);
                if (error.code === error.PERMISSION_DENIED) {
                    stop(
                        'اجازه دسترسی به موقعیت مکانی داده نشد؛ مجوز مکان‌یابی مرورگر را بررسی کنید.'
                    );
                } else if (error.code === error.TIMEOUT) {
                    setMessage('دریافت موقعیت طول کشید؛ در حال انتظار برای تلاش بعدی GPS هستیم.');
                } else {
                    setMessage(
                        'موقعیت GPS فعلاً در دسترس نیست؛ GPS و تنظیمات مکان‌یابی دستگاه را بررسی کنید.'
                    );
                }
            },
            { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 }
        );

        // watchPosition can be quiet for long periods on some devices. Re-check the latest
        // fix periodically so failed sends are retried and the 30-second cadence is enforced.
        retryTimer.current = window.setInterval(() => {
            const position = latestPosition.current;
            if (!active.current || !position || sending.current) return;
            if (Date.now() - position.timestamp > MAX_FIX_AGE_MS) {
                setHasFix(false);
                setMessage('موقعیت GPS تازه دریافت نمی‌شود؛ GPS و مجوز مکان‌یابی دستگاه را بررسی کنید.');
                return;
            }
            void sendPosition(position);
        }, SEND_RETRY_TICK_MS);
        setEnabled(true);
    }, [busy, sendPosition, stop]);

    useEffect(
        () => () => {
            active.current = false;
            if (watchId.current !== null && 'geolocation' in navigator) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
            if (retryTimer.current !== null) {
                window.clearInterval(retryTimer.current);
                retryTimer.current = null;
            }
        },
        []
    );

    return (
        <div className="mx-3 mb-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span
                            aria-hidden="true"
                            className={`h-2 w-2 rounded-full ${
                                enabled
                                    ? hasFix
                                        ? 'bg-emerald-500'
                                        : 'animate-pulse bg-amber-500'
                                    : 'bg-gray-400'
                            }`}
                        />
                        <div className="text-sm font-semibold text-slate-800">موقعیت مکانی</div>
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                        {enabled
                            ? hasFix
                                ? 'مکان‌یابی فعال است؛ آخرین مختصات هر ۳۰ ثانیه ارسال می‌شود.'
                                : 'اشتراک‌گذاری فعال است؛ منتظر دریافت مختصات GPS...'
                            : 'اشتراک‌گذاری فقط با فعال‌کردن شما آغاز می‌شود.'}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => (enabled ? stop() : start())}
                    disabled={busy && !enabled}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                        enabled
                            ? 'bg-slate-600 hover:bg-slate-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {busy ? 'در انتظار GPS...' : enabled ? 'توقف' : 'اشتراک موقعیت'}
                </button>
            </div>
            {lastSentAt ? (
                <div className="mt-1 text-xs text-slate-500">
                    آخرین ارسال موفق: {formatTime(lastSentAt)}
                </div>
            ) : null}
            {message ? (
                <p role="status" className="mt-2 text-xs leading-5 text-slate-600">
                    {message}
                </p>
            ) : null}
        </div>
    );
}
