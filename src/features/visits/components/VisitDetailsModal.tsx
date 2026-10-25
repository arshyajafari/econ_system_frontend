import { formatJalaliDateTime } from '../../../utils/date';
import { getVisitStatusLabel, type Visit } from '../types/visit';

type Props = {
    visit: Visit | null;
    onClose: () => void;
};

const valueClass = 'rounded-lg bg-gray-50 px-3 py-2 text-sm whitespace-pre-wrap break-words';

export function VisitDetailsModal({ visit, onClose }: Props) {
    if (!visit) return null;

    const samples = visit.samples ?? [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="visit-details-title"
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            >
                <header className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <h2 id="visit-details-title" className="text-xl font-bold">
                            جزئیات ویزیت
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        بستن
                    </button>
                </header>

                <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <dt className="mb-1 text-xs text-gray-500">تاریخ و ساعت</dt>
                        <dd className={valueClass}>{formatJalaliDateTime(visit.visit_date)}</dd>
                    </div>
                    <div>
                        <dt className="mb-1 text-xs text-gray-500">پزشک</dt>
                        <dd className={valueClass}>
                            {visit.doctor_name ?? visit.doctor?.name ?? '—'}
                        </dd>
                    </div>
                    <div>
                        <dt className="mb-1 text-xs text-gray-500">ویزیتور / کارمند</dt>
                        <dd className={valueClass}>{visit.employee?.name ?? '—'}</dd>
                    </div>
                    <div>
                        <dt className="mb-1 text-xs text-gray-500">وضعیت</dt>
                        <dd className={valueClass}>{getVisitStatusLabel(visit.status)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="mb-1 text-xs text-gray-500">هدف ویزیت</dt>
                        <dd className={valueClass}>{visit.purpose || '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="mb-1 text-xs text-gray-500">توضیحات ویزیت</dt>
                        <dd className={valueClass}>{visit.description || '—'}</dd>
                    </div>
                </dl>

                <section className="mt-6">
                    <h3 className="mb-3 font-semibold">
                        محصولات و نمونه‌ها ({new Intl.NumberFormat('fa-IR').format(samples.length)})
                    </h3>
                    {samples.length === 0 ? (
                        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-gray-500">
                            نمونه‌ای برای این ویزیت ثبت نشده است.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-full text-right text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2">محصول</th>
                                        <th className="px-3 py-2">تعداد</th>
                                        <th className="px-3 py-2">توضیحات نمونه</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {samples.map((sample) => (
                                        <tr key={sample.id}>
                                            <td className="px-3 py-2">
                                                {sample.product_name ??
                                                    sample.product?.title ??
                                                    'محصول نامشخص'}
                                            </td>
                                            <td className="px-3 py-2">
                                                {new Intl.NumberFormat('fa-IR').format(
                                                    sample.quantity
                                                )}
                                            </td>
                                            <td className="px-3 py-2 whitespace-pre-wrap">
                                                {sample.description || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </section>
        </div>
    );
}
