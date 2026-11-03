import { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeApiError } from '../../../api/client';
import {
    executeCleanup,
    getCleanupHistory,
    getCleanupPreview,
    type CleanupPreview,
    type CleanupRun,
} from '../api/dataCleanup';

const numberFormat = new Intl.NumberFormat('fa-IR');
const dateFormat = (value: string | null) =>
    value ? new Date(value).toLocaleString('fa-IR') : '—';

export function DataCleanupPage() {
    const [preview, setPreview] = useState<CleanupPreview | null>(null);
    const [history, setHistory] = useState<CleanupRun[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [reason, setReason] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [nextPreview, nextHistory] = await Promise.all([
                getCleanupPreview(),
                getCleanupHistory(),
            ]);
            setPreview(nextPreview);
            setHistory(nextHistory);
        } catch (requestError) {
            setError(normalizeApiError(requestError).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let active = true;

        const loadInitialData = async () => {
            try {
                const [nextPreview, nextHistory] = await Promise.all([
                    getCleanupPreview(),
                    getCleanupHistory(),
                ]);
                if (!active) return;
                setPreview(nextPreview);
                setHistory(nextHistory);
            } catch (requestError) {
                if (active) setError(normalizeApiError(requestError).message);
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadInitialData();
        return () => {
            active = false;
        };
    }, []);

    const selectedCount = useMemo(
        () => selected.reduce((sum, key) => sum + (preview?.categories[key]?.count ?? 0), 0),
        [selected, preview]
    );
    const toggleCategory = (key: string, checked: boolean) =>
        setSelected((current) =>
            checked ? [...current, key] : current.filter((item) => item !== key)
        );

    const runCleanup = async () => {
        if (!selected.length || reason.trim().length < 5 || confirmation !== 'DELETE') return;
        setRunning(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await executeCleanup({
                categories: selected,
                reason: reason.trim(),
                confirmation: 'DELETE',
            });
            const total = Object.values(result.data.deleted_counts).reduce(
                (sum, value) => sum + value,
                0
            );
            setSuccess(
                `عملیات شماره ${numberFormat.format(result.data.run_id)} انجام شد؛ ${numberFormat.format(total)} رکورد حذف شد.`
            );
            setSelected([]);
            setReason('');
            setConfirmation('');
            await refresh();
        } catch (requestError) {
            setError(normalizeApiError(requestError).message);
        } finally {
            setRunning(false);
        }
    };

    return (
        <section className="space-y-6 p-4 md:p-6" dir="rtl">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">مدیریت و پاک‌سازی اطلاعات</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        پاک‌سازی کنترل‌شده اطلاعات موقت و منقضی‌شده
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void refresh()}
                    disabled={loading || running}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    به‌روزرسانی
                </button>
            </header>

            {error && (
                <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}
            {success && (
                <div
                    role="status"
                    className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
                >
                    {success}
                </div>
            )}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                <strong>توجه:</strong> این عملیات حذف دائمی است. ابتدا تعداد رکوردها را بررسی کنید و
                فقط دسته‌هایی را انتخاب کنید که از حذف آن‌ها مطمئن هستید.
                {preview && (
                    <div className="mt-1 text-xs text-amber-800">
                        بازه نگهداری: {numberFormat.format(preview.retention_days)} روز · اطلاعات
                        قدیمی‌تر از {dateFormat(preview.cutoff_at)}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-bold text-slate-900">پیش‌نمایش اطلاعات قابل پاک‌سازی</h2>
                    <span className="text-xs text-slate-500">
                        {preview ? 'تعداد فعلی رکوردها' : 'در حال دریافت...'}
                    </span>
                </div>
                {loading && !preview ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                        در حال دریافت اطلاعات...
                    </p>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {preview &&
                            Object.entries(preview.categories).map(([key, item]) => (
                                <label
                                    key={key}
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${selected.includes(key) ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(key)}
                                        onChange={(event) =>
                                            toggleCategory(key, event.target.checked)
                                        }
                                        disabled={running || item.count === 0}
                                        className="h-4 w-4"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold text-slate-800">
                                            {item.label}
                                        </span>
                                        <span className="mt-1 block text-xs text-slate-500">
                                            {item.count === 0
                                                ? 'رکوردی برای حذف وجود ندارد'
                                                : 'قابل بررسی و انتخاب'}
                                        </span>
                                    </span>
                                    <strong className="text-lg tabular-nums text-slate-900">
                                        {numberFormat.format(item.count)}
                                    </strong>
                                </label>
                            ))}
                    </div>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm">
                    <span className="text-slate-600">مجموع رکوردهای انتخاب‌شده در پیش‌نمایش</span>
                    <strong className="text-lg tabular-nums text-slate-900">
                        {numberFormat.format(selectedCount)}
                    </strong>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-slate-900">تأیید و اجرای پاک‌سازی</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                            دلیل انجام عملیات
                        </span>
                        <textarea
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            maxLength={500}
                            rows={2}
                            placeholder="مثلاً پاک‌سازی دوره‌ای داده‌های موقت برای کاهش حجم دیتابیس"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                            برای تأیید، عبارت DELETE را وارد کنید
                        </span>
                        <input
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            autoComplete="off"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm tracking-widest outline-none focus:border-blue-300"
                            dir="ltr"
                        />
                    </label>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => void runCleanup()}
                            disabled={
                                running ||
                                loading ||
                                selected.length === 0 ||
                                selectedCount === 0 ||
                                reason.trim().length < 5 ||
                                confirmation !== 'DELETE'
                            }
                            className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {running ? 'در حال اجرای عملیات...' : 'اجرای پاک‌سازی انتخاب‌شده'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-bold text-slate-900">گزارش عملیات اخیر</h2>
                {history.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                        هنوز عملیات پاک‌سازی ثبت نشده است.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {history.map((run) => (
                            <article
                                key={run.id}
                                className="rounded-xl border border-slate-100 p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <strong className="text-sm text-slate-800">
                                        عملیات #{numberFormat.format(run.id)}
                                    </strong>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${run.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : run.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}
                                    >
                                        {run.status === 'completed'
                                            ? 'موفق'
                                            : run.status === 'failed'
                                              ? 'ناموفق'
                                              : 'در حال اجرا'}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    اجراکننده: {run.performed_by ?? 'کاربر حذف‌شده'} ·{' '}
                                    {dateFormat(run.started_at)}
                                </p>
                                <p className="mt-2 text-sm text-slate-700">دلیل: {run.reason}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {run.categories.map((key) => (
                                        <span
                                            key={key}
                                            className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600"
                                        >
                                            {preview?.categories[key]?.label ?? key}:{' '}
                                            {numberFormat.format(run.deleted_counts[key] ?? 0)}
                                        </span>
                                    ))}
                                    {run.categories.includes('devices') &&
                                        run.deleted_counts.device_tokens !== undefined && (
                                            <span
                                                key="device_tokens"
                                                className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600"
                                            >
                                                توکن‌های مرتبط: {numberFormat.format(run.deleted_counts.device_tokens)}
                                            </span>
                                        )}
                                </div>
                                {run.failure_message && (
                                    <p className="mt-2 break-words text-xs text-red-600">
                                        {run.failure_message}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
