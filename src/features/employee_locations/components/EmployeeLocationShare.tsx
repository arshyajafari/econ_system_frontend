import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../api/client';
import {
    endMyWorkSession,
    getMyWorkSession,
    startMyWorkSession,
    type EmployeeWorkSession,
} from '../api/employeeLocations';

type Action = 'start' | 'end';

function formatTime(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('fa-IR');
}

function currentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new Error('مرورگر از GPS پشتیبانی نمی‌کند.'));
            return;
        }
        if (!window.isSecureContext) {
            reject(new Error('برای دریافت GPS باید برنامه از طریق HTTPS باز شود.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 25_000,
        });
    });
}

function errorMessage(error: unknown): string {
    if (error instanceof ApiError) return error.message;
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = Number((error as { code: unknown }).code);
        if (code === 1) return 'دسترسی GPS رد شده است. مجوز مکان‌یابی مرورگر را فعال کنید.';
        if (code === 3) return 'دریافت موقعیت بیش از حد طول کشید؛ دوباره تلاش کنید.';
        if (code === 2) return 'موقعیت GPS در دسترس نیست. GPS دستگاه را بررسی کنید.';
    }
    return error instanceof Error ? error.message : 'ثبت موقعیت انجام نشد؛ دوباره تلاش کنید.';
}

export function EmployeeLocationShare() {
    const [session, setSession] = useState<EmployeeWorkSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const startOperationId = useRef<string | null>(null);
    const endOperationId = useRef<string | null>(null);
    const pendingStart = useRef<{ latitude: number; longitude: number; accuracy: number | null; client_operation_id: string } | null>(null);
    const pendingEnd = useRef<{ latitude: number; longitude: number; accuracy: number | null; client_operation_id: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        getMyWorkSession()
            .then(value => {
                if (!cancelled) setSession(value);
            })
            .catch((error: unknown) => {
                if (!cancelled) setMessage(errorMessage(error));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const submit = async (action: Action) => {
        if (busy || loading) return;
        setBusy(true);
        setMessage(action === 'start' ? 'در حال دریافت موقعیت شروع...' : 'در حال دریافت موقعیت پایان...');
        try {
            const pending = action === 'start' ? pendingStart : pendingEnd;
            let accuracy: number | null;
            if (!pending.current) {
                const position = await currentPosition();
                accuracy = position.coords.accuracy;
                pending.current = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: Number.isFinite(accuracy) ? accuracy : null,
                    client_operation_id: action === 'start'
                        ? (startOperationId.current ??= crypto.randomUUID())
                        : (endOperationId.current ??= crypto.randomUUID()),
                };
            } else {
                accuracy = pending.current.accuracy;
            }
            const saved = action === 'start'
                ? await startMyWorkSession(pending.current)
                : await endMyWorkSession(pending.current);
            setSession(saved);
            pending.current = null;
            if (action === 'start') startOperationId.current = null;
            else endOperationId.current = null;
            setMessage(
                accuracy > 100
                    ? `ثبت انجام شد؛ دقت GPS حدود ${Math.round(accuracy)} متر است و ممکن است موقعیت دقیق نباشد.`
                    : action === 'start'
                        ? 'شروع کار با موفقیت ثبت شد.'
                        : 'پایان کار با موفقیت ثبت شد.'
            );
        } catch (error: unknown) {
            if (error instanceof ApiError && error.status === 422) {
                if (action === 'start') {
                    pendingStart.current = null;
                    startOperationId.current = null;
                } else {
                    pendingEnd.current = null;
                    endOperationId.current = null;
                }
                getMyWorkSession().then(setSession).catch(() => undefined);
            }
            setMessage(errorMessage(error));
        } finally {
            setBusy(false);
        }
    };

    const completed = session?.status === 'completed';
    const started = session?.status === 'in_progress';

    return (
        <div className="mx-3 mb-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-800">ثبت حضور مکانی</div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${completed ? 'bg-slate-100 text-slate-600' : started ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {loading ? 'در حال بررسی' : completed ? 'پایان‌یافته' : started ? 'در حال فعالیت' : 'شروع‌نشده'}
                </span>
            </div>
            {session ? (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>شروع: <strong>{formatTime(session.started_at)}</strong></div>
                    <div>پایان: <strong>{formatTime(session.ended_at)}</strong></div>
                </div>
            ) : null}
            <button
                type="button"
                onClick={() => void submit(started ? 'end' : 'start')}
                disabled={loading || busy || completed}
                className={`mt-3 w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${started ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {loading ? 'در حال بررسی وضعیت...' : busy ? 'در حال دریافت و ثبت GPS...' : completed ? 'فعالیت امروز پایان یافته است' : started ? 'ثبت پایان کار' : 'ثبت شروع کار'}
            </button>
            {message ? <p role="status" className="mt-2 text-xs leading-5 text-slate-600">{message}</p> : null}
            <p className="mt-2 text-[10px] leading-4 text-slate-500">
                فقط یک نوبت کاری در روز ثبت می‌شود. زمان از سرور گرفته می‌شود و مختصات فقط هنگام فشردن دکمه ارسال خواهد شد.
            </p>
        </div>
    );
}
