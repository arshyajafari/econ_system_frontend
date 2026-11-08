import { useCallback, useEffect, useState } from 'react';
import { Button } from "../../../design-system/components/Button";
import { TableContainer } from "../../../design-system/components/TableContainer";
import { Pagination } from '../../../components/Pagination';
import { normalizeApiError } from '../../../api/client';
import {
    cleanupDailyActivityReports,
    exportManagedDailyActivityReports,
    getActivityCleanupHistory,
    getManagedDailyActivityReports,
    type ActivityCleanupRun,
    type DailyActivityReport,
} from '../../daily_activity_reports/services/dailyActivityReportsApi';

const faNumber = new Intl.NumberFormat('fa-IR');
const resultLabels = {
    positive: 'مثبت',
    neutral: 'خنثی',
    negative: 'منفی',
    follow_up: 'نیازمند پیگیری',
} as const;
const resultStyles = {
    positive: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    negative: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    follow_up: 'bg-amber-50 text-amber-800 ring-amber-600/20',
} as const;
const jalali = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString('fa-IR-u-ca-persian');
export function DailyActivityReportCleanupSection() {
    const [rows, setRows] = useState<DailyActivityReport[]>([]);
    const [history, setHistory] = useState<ActivityCleanupRun[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [confirmation, setConfirmation] = useState('');
    const [viewing, setViewing] = useState<DailyActivityReport | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DailyActivityReport | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [archive, runs] = await Promise.all([
                getManagedDailyActivityReports({
                    search: search.trim() || undefined,
                    per_page: 20,
                    page,
                }),
                getActivityCleanupHistory(),
            ]);
            setRows(archive.data);
            setLastPage(archive.meta?.last_page ?? 1);
            setTotal(archive.meta?.total ?? archive.data.length);
            setHistory(runs);
            setSelected([]);
        } catch (e) {
            setError(normalizeApiError(e).message);
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            try {
                const [archive, runs] = await Promise.all([
                    getManagedDailyActivityReports({
                        search: search.trim() || undefined,
                        per_page: 20,
                        page,
                    }),
                    getActivityCleanupHistory(),
                ]);
                if (!active) return;
                setRows(archive.data);
                setLastPage(archive.meta?.last_page ?? 1);
                setTotal(archive.meta?.total ?? archive.data.length);
                setHistory(runs);
                setSelected([]);
            } catch (e) {
                if (active) setError(normalizeApiError(e).message);
            } finally {
                if (active) setLoading(false);
            }
        };
        void load();
        return () => {
            active = false;
        };
    }, [search, page]);

    const toggle = (id: number, checked: boolean) =>
        setSelected((current) =>
            checked ? [...current, id] : current.filter((item) => item !== id)
        );

    const runCleanup = async () => {
        setRunning(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await cleanupDailyActivityReports({
                report_ids: selected,
                confirmation: 'DELETE',
            });
            setSuccess(
                `${faNumber.format(response.data.deleted_count)} گزارش با موفقیت پاک‌سازی شد.`
            );
            setConfirmation('');
            await refresh();
        } catch (e) {
            setError(normalizeApiError(e).message);
        } finally {
            setRunning(false);
        }
    };

    const deleteOne = async () => {
        if (!deleteTarget) return;
        setRunning(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await cleanupDailyActivityReports({
                report_ids: [deleteTarget.id],
                confirmation: 'DELETE',
            });
            setSuccess(`${faNumber.format(response.data.deleted_count)} گزارش حذف شد.`);
            setDeleteTarget(null);
            await refresh();
        } catch (e) {
            setError(normalizeApiError(e).message);
        } finally {
            setRunning(false);
        }
    };

    const exportArchive = async () => {
        try {
            await exportManagedDailyActivityReports();
        } catch (e) {
            setError(normalizeApiError(e).message);
        }
    };

    return (
        <section className="mx-auto max-w-7xl space-y-5 p-4 md:p-6" dir="rtl">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        مدیریت و حذف گزارش‌های فعالیت
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        گزارش‌های فعال و منقضی‌شده را یکجا بررسی و در صورت نیاز به‌صورت متمرکز حذف
                        کنید.
                    </p>
                </div>
                <Button variant="secondary"
                    onClick={() => void exportArchive()}
                    disabled={rows.length === 0}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"
                >
                    خروجی Excel همه گزارش‌ها
                </Button>
            </header>
            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}
            {success && (
                <div
                    role="status"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                >
                    {success}
                </div>
            )}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
                <input
                    value={search}
                    onChange={(e) => {
                        setPage(1);
                        setSearch(e.target.value);
                    }}
                    placeholder="جست‌وجو در گزارش‌های فعالیت"
                    className="min-w-56 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <span className="text-sm text-slate-500">
                    {faNumber.format(rows.length)} گزارش در این صفحه
                </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {loading ? (
                    <p className="p-8 text-center text-sm text-slate-500">در حال دریافت...</p>
                ) : rows.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-500">
                        گزارشی برای بررسی یا حذف وجود ندارد.
                    </p>
                ) : (
                    <TableContainer className="ui-table-container--embedded" aria-label="گزارش‌های فعالیت روزانه">
<table className="min-w-full text-right text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="w-12 whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                                        <input
                                            aria-label="انتخاب همه گزارش‌های این صفحه"
                                            type="checkbox"
                                            checked={
                                                rows.length > 0 &&
                                                rows.every((row) => selected.includes(row.id))
                                            }
                                            onChange={(e) =>
                                                setSelected(
                                                    e.target.checked
                                                        ? rows.map((row) => row.id)
                                                        : []
                                                )
                                            }
                                        />
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">مجموعه / مخاطب</th>
                                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">تاریخ مراجعه</th>
                                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">کارمند</th>
                                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">وضعیت نگهداری</th>
                                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">نتیجه</th>
                                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <input
                                                aria-label={`انتخاب گزارش ${row.id}`}
                                                type="checkbox"
                                                checked={selected.includes(row.id)}
                                                onChange={(e) => toggle(row.id, e.target.checked)}
                                                className="h-4 w-4"
                                            />
                                        </td>
                                        <td className="max-w-56 px-4 py-3">
                                            <strong className="block text-slate-800">
                                                {row.organization_name}
                                            </strong>
                                            {row.contact_name ? (
                                                <span className="mt-1 block text-xs text-slate-500">
                                                    {row.contact_name}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                            {jalali(row.visit_date)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                            {row.employee.name}
                                            <span className="mt-1 block text-xs text-slate-400">
                                                {row.contact_type === 'phone' ? 'تلفنی' : 'حضوری'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs ${row.is_archived ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}
                                            >
                                                {row.is_archived ? 'منقضی‌شده' : 'فعال'}
                                            </span>
                                            <span className="mt-1 block text-xs text-slate-400">
                                                مهلت: {jalali(row.retention_until)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${resultStyles[row.result]}`}
                                            >
                                                {resultLabels[row.result]}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <Button variant="view"
                                                    type="button"
                                                    onClick={() => setViewing(row)}
                                                    className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    مشاهده
                                                </Button>
                                                <Button variant="danger"
                                                    type="button"
                                                    onClick={() => setDeleteTarget(row)}
                                                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                                >
                                                    حذف
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
</TableContainer>
                )}

            </div>
            <Pagination page={page} lastPage={lastPage} isLoading={loading || running} total={total} perPage={20} onPageChange={setPage} />
            {viewing && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 md:p-6"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setViewing(null);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="managed-report-detail-title"
                        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl md:p-7"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                            <div>
                                <h2
                                    id="managed-report-detail-title"
                                    className="text-lg font-bold text-slate-900"
                                >
                                    جزئیات گزارش فعالیت
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {viewing.organization_name} · {jalali(viewing.visit_date)}
                                </p>
                            </div>
                            <Button variant="secondary"
                                type="button"
                                onClick={() => setViewing(null)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
                            >
                                بستن
                            </Button>
                        </div>
                        <div className="mt-5 space-y-4 text-sm">
                            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <span className="text-xs text-slate-500">کارمند</span>
                                    <p className="mt-1 font-semibold text-slate-800">
                                        {viewing.employee.name}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500">مخاطب</span>
                                    <p className="mt-1 font-semibold text-slate-800">
                                        {viewing.contact_name || '—'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500">نوع ارتباط</span>
                                    <p className="mt-1 font-semibold text-slate-800">
                                        {viewing.contact_type === 'phone' ? 'تلفنی' : 'حضوری'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500">نتیجه</span>
                                    <p className="mt-1">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${resultStyles[viewing.result]}`}
                                        >
                                            {resultLabels[viewing.result]}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500">وضعیت نگهداری</span>
                                    <p className="mt-1 font-semibold text-slate-800">
                                        {viewing.is_archived ? 'منقضی‌شده' : 'فعال'}
                                    </p>
                                </div>
                            </div>
                            {(
                                [
                                    ['هدف از مراجعه', viewing.purpose],
                                    ['شرح مذاکرات', viewing.discussion],
                                    [
                                        'سؤال یا موضوع مطرح‌شده توسط کارمند',
                                        viewing.employee_question,
                                    ],
                                    ['بازخورد مخاطب', viewing.audience_feedback],
                                    ['نتیجه و جمع‌بندی', viewing.outcome],
                                ] as Array<[string, string | null | undefined]>
                            ).map(([label, value]) => (
                                <div key={label} className="rounded-xl border border-slate-200 p-4">
                                    <h3 className="mb-2 font-bold text-slate-800">{label}</h3>
                                    <p className="whitespace-pre-wrap leading-7 text-slate-600">
                                        {value?.trim() || 'موردی ثبت نشده است.'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
                    >
                        <h2 className="font-bold text-slate-900">حذف گزارش فعالیت</h2>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                            آیا از حذف گزارش «{deleteTarget.organization_name}» در تاریخ{' '}
                            {jalali(deleteTarget.visit_date)} مطمئن هستید؟ این عملیات دائمی است و در
                            سوابق مدیریت ثبت می‌شود.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <Button variant="secondary"
                                type="button"
                                disabled={running}
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                            >
                                انصراف
                            </Button>
                            <Button variant="dangerSolid"
                                type="button"
                                disabled={running}
                                onClick={() => void deleteOne()}
                                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                {running ? 'در حال حذف...' : 'حذف گزارش'}
                            </Button>
                        </div>
                    </section>
                </div>
            )}
            <div className="rounded-xl border border-red-200 bg-white p-4 md:p-5">
                <h2 className="font-bold text-slate-900">پاک‌سازی نهایی گزارش‌های انتخاب‌شده</h2>
                <div className="mt-4 grid gap-3 grid-cols-1">
                    <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                        <div>
                            <label className="space-y-1 text-sm font-semibold text-slate-700">
                                برای تأیید عبارت DELETE را وارد کنید
                            </label>
                            <input
                                dir="ltr"
                                value={confirmation}
                                onChange={(e) => setConfirmation(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left tracking-widest"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button variant="dangerSolid"
                                disabled={
                                    running ||
                                    loading ||
                                    selected.length === 0 ||
                                    confirmation !== 'DELETE'
                                }
                                onClick={() => void runCleanup()}
                                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {running
                                    ? 'در حال پاک‌سازی...'
                                    : `حذف دائمی ${faNumber.format(selected.length)} گزارش انتخاب‌شده`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="font-bold text-slate-900">سوابق حذف و پاک‌سازی گزارش فعالیت</h2>
                {history.length === 0 ? (
                    <p className="py-5 text-sm text-slate-500">هنوز پاک‌سازی‌ای ثبت نشده است.</p>
                ) : (
                    <div className="mt-3 divide-y divide-slate-100">
                        {history.map((run) => (
                            <div key={run.id} className="py-3 text-sm">
                                <div className="flex flex-wrap justify-between gap-2">
                                    <strong>عملیات #{faNumber.format(run.id)}</strong>
                                    <span className="text-xs text-slate-500">
                                        {new Date(run.created_at).toLocaleString('fa-IR')}
                                    </span>
                                </div>
                                <p className="mt-1 text-slate-600">
                                    تعداد حذف: {faNumber.format(run.deleted_count)} · اجراکننده:{' '}
                                    {run.performed_by ?? 'کاربر حذف‌شده'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
