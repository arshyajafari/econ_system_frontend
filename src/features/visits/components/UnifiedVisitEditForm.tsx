import { useState, type FormEvent } from 'react';
import { JalaliDateInput } from '../../../components/JalaliDateInput';
import type { Sample } from '../../samples/types/sample';
import type { Visit, VisitFormData } from '../types/visit';

type SampleDraft = { id: string; productName: string; quantity: string; description: string };
type Props = {
    visit: Visit;
    samples: Sample[];
    isSubmitting: boolean;
    error: string | null;
    onSubmit: (
        visitData: VisitFormData,
        samples: { id: string; quantity: number; description: string }[]
    ) => void;
    onCancel: () => void;
};

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm disabled:bg-gray-100';

export function UnifiedVisitEditForm({
    visit,
    samples,
    isSubmitting,
    error,
    onSubmit,
    onCancel,
}: Props) {
    const initialDateTime = visit.visit_date?.slice(0, 16) ?? '';
    const [date, setDate] = useState(initialDateTime.slice(0, 10));
    const [time, setTime] = useState(initialDateTime.slice(11, 16));
    const [purpose, setPurpose] = useState(visit.purpose ?? '');
    const [description, setDescription] = useState(visit.description ?? '');
    const [sampleDrafts, setSampleDrafts] = useState<SampleDraft[]>(() =>
        samples.map((sample) => ({
            id: sample.id,
            productName: sample.product_name ?? sample.product?.title ?? 'محصول نامشخص',
            quantity: String(sample.quantity),
            description: sample.description ?? '',
        }))
    );

    function updateSample(id: string, patch: Partial<SampleDraft>) {
        setSampleDrafts((current) =>
            current.map((sample) => (sample.id === id ? { ...sample, ...patch } : sample))
        );
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!date || !time || !purpose.trim()) return;
        if (
            sampleDrafts.some(
                (sample) =>
                    !Number.isInteger(Number(sample.quantity)) || Number(sample.quantity) < 1
            )
        )
            return;
        onSubmit(
            {
                doctor_id: visit.doctor?.id ?? '',
                visit_date: `${date}T${time}`,
                purpose: purpose.trim(),
                description: description.trim(),
            },
            sampleDrafts.map((sample) => ({
                id: sample.id,
                quantity: Number(sample.quantity),
                description: sample.description,
            }))
        );
    }

    return (
        <form
            onSubmit={submit}
            className="space-y-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-6"
        >
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">ویرایش ویزیت</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        اطلاعات ویزیت و همه نمونه‌های مرتبط را از همین فرم ویرایش کنید.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="rounded-lg border bg-white px-4 py-2 text-sm"
                >
                    انصراف
                </button>
            </header>

            <section className="rounded-xl border bg-white p-4">
                <h3 className="mb-4 font-semibold">۱. اطلاعات ویزیت</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1 text-sm">
                        <span>پزشک</span>
                        <div className={`${inputClass} flex items-center`}>
                            {visit.doctor?.name ?? visit.doctor_name ?? 'پزشک نامشخص'}
                        </div>
                        <span className="block text-xs text-gray-500">
                            پزشک این ویزیت در این فرم قابل تغییر نیست.
                        </span>
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>تاریخ ویزیت *</span>
                        <JalaliDateInput
                            value={date}
                            onChange={setDate}
                            required
                            disabled={isSubmitting}
                            className={inputClass}
                        />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>ساعت *</span>
                        <input
                            type="time"
                            required
                            value={time}
                            onChange={(event) => setTime(event.target.value)}
                            disabled={isSubmitting}
                            className={inputClass}
                        />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>هدف ویزیت *</span>
                        <input
                            required
                            maxLength={150}
                            value={purpose}
                            onChange={(event) => setPurpose(event.target.value)}
                            disabled={isSubmitting}
                            className={inputClass}
                        />
                    </label>
                    <label className="space-y-1 text-sm md:col-span-2">
                        <span>توضیحات ویزیت</span>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            disabled={isSubmitting}
                            className={inputClass}
                        />
                    </label>
                </div>
            </section>

            <section className="rounded-xl border bg-white p-4">
                <h3 className="mb-1 font-semibold">۲. نمونه‌های ثبت‌شده</h3>
                {sampleDrafts.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-5 text-center text-sm text-gray-500">
                        برای این ویزیت نمونه‌ای ثبت نشده است.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {sampleDrafts.map((sample) => (
                            <div
                                key={sample.id}
                                className="grid gap-3 rounded-xl p-3 md:grid-cols-3 md:items-end"
                            >
                                <div className="space-y-1 text-sm">
                                    <span className="block">نام محصول *</span>
                                    <div className={`${inputClass} flex items-center`}>
                                        {sample.productName}
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <span>تعداد *</span>
                                    <input
                                        required
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={sample.quantity}
                                        disabled={isSubmitting}
                                        onChange={(event) =>
                                            updateSample(sample.id, {
                                                quantity: event.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-1 text-sm">
                                    <span>توضیحات نمونه</span>
                                    <input
                                        value={sample.description}
                                        disabled={isSubmitting}
                                        onChange={(event) =>
                                            updateSample(sample.id, {
                                                description: event.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {error ? (
                <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
                <button
                    type="submit"
                    disabled={
                        isSubmitting ||
                        !date ||
                        !time ||
                        !purpose.trim() ||
                        sampleDrafts.some(
                            (sample) =>
                                !Number.isInteger(Number(sample.quantity)) ||
                                Number(sample.quantity) < 1
                        )
                    }
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {isSubmitting ? 'در حال ذخیره...' : 'ذخیره همه تغییرات'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="rounded-lg border bg-white px-5 py-2.5 text-sm"
                >
                    انصراف
                </button>
            </div>
        </form>
    );
}
