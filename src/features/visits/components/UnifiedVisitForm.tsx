import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/client';
import { JalaliDateInput } from '../../../components/JalaliDateInput';
import {
    SearchableDoctorSelect,
    type SearchableDoctor,
} from '../../../components/SearchableDoctorSelect';
import { SearchableProductSelect } from '../../../components/SearchableProductSelect';
import { DoctorForm } from '../../doctors/components/DoctorForm';
import { createDoctor } from '../../doctors/services/doctorsApi';
import type { DoctorFormData } from '../../doctors/types/doctor';
import type { SampleProduct, SampleFormData } from '../../samples/types/sample';
import { createSample, getSampleProducts } from '../../samples/services/samplesApi';
import { createVisit, getVisitDoctors } from '../services/visitsApi';
import type { Visit, VisitFormData } from '../types/visit';

type DraftSample = {
    key: string;
    product_id: string;
    product_title: string;
    quantity: string;
    description: string;
    saved: boolean;
};
type Props = {
    isScientificVisitor: boolean;
    onSaved: (visit: Visit) => void;
    onCancel: () => void;
};

const today = () => {
    const date = new Date();
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:bg-gray-100';

export function UnifiedVisitForm({ isScientificVisitor, onSaved, onCancel }: Props) {
    const [doctor, setDoctor] = useState<SearchableDoctor | null>(null);
    const [date, setDate] = useState(today());
    const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
    const [purpose, setPurpose] = useState('');
    const [description, setDescription] = useState('');
    const [products, setProducts] = useState<SampleProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [samples, setSamples] = useState<DraftSample[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [doctorFormOpen, setDoctorFormOpen] = useState(false);
    const [doctorSaving, setDoctorSaving] = useState(false);
    const [doctorError, setDoctorError] = useState<string | null>(null);
    const [savedVisit, setSavedVisit] = useState<Visit | null>(null);

    useEffect(() => {
        let active = true;
        void getSampleProducts(isScientificVisitor)
            .then((result) => {
                if (active) {
                    setProducts(result as SampleProduct[]);
                    if (isScientificVisitor && result.length > 0) {
                        setSamples((current) => current.length ? current : [{
                            key: crypto.randomUUID(),
                            product_id: '',
                            product_title: '',
                            quantity: '1',
                            description: '',
                            saved: false,
                        }]);
                    }
                }
            })
            .catch((e: unknown) => {
                if (active)
                    setError(
                        e instanceof ApiError ? e.message : 'دریافت فهرست محصولات ناموفق بود.'
                    );
            })
            .finally(() => {
                if (active) setProductsLoading(false);
            });
        return () => {
            active = false;
        };
    }, [isScientificVisitor]);

    function addSample() {
        setSamples((current) => {
            if (isScientificVisitor && current.length > 0) return current;
            return [...current, {
                key: crypto.randomUUID(),
                product_id: '',
                product_title: '',
                quantity: '1',
                description: '',
                saved: false,
            }];
        });
    }
    function updateSample(key: string, patch: Partial<DraftSample>) {
        setSamples((current) =>
            current.map((sample) => (sample.key === key ? { ...sample, ...patch } : sample))
        );
    }
    function removeSample(key: string) {
        setSamples((current) => current.filter((sample) => sample.key !== key));
    }

    async function saveDoctor(data: DoctorFormData) {
        setDoctorSaving(true);
        setDoctorError(null);
        try {
            const created = await createDoctor(data);
            setDoctor({
                id: created.id,
                first_name: created.first_name,
                last_name: created.last_name,
                code: created.code,
                phone_number: created.phone_number,
                clinic_name: created.clinic_name,
                specialty: created.specialty,
            });
            setDoctorFormOpen(false);
        } catch (e: unknown) {
            setDoctorError(e instanceof ApiError ? e.message : 'ثبت پزشک انجام نشد.');
        } finally {
            setDoctorSaving(false);
        }
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setNotice(null);
        if (!doctor) {
            setError('ابتدا پزشک را انتخاب کنید یا پزشک جدید ثبت کنید.');
            return;
        }
        if (!date || !time || !purpose.trim()) {
            setError('تاریخ، ساعت و هدف ویزیت الزامی است.');
            return;
        }
        if (isScientificVisitor && (samples.length !== 1 || !samples[0]?.product_id)) {
            setError('برای ثبت ویزیت، یک محصول از موجودی قابل استفاده خود انتخاب کنید.');
            return;
        }
        if (
            samples.some((sample) => {
                if (sample.saved) return false;
                const quantity = Number(sample.quantity);
                const product = products.find((item) => item.id === sample.product_id);
                return (
                    !product ||
                    !sample.product_id ||
                    !Number.isInteger(quantity) ||
                    quantity < 1 ||
                    (product.available_quantity !== undefined &&
                        quantity > product.available_quantity)
                );
            })
        ) {
            setError(
                isScientificVisitor
                    ? 'برای هر سمپل محصولی از موجودی قابل استفاده خودتان و تعداد صحیح در محدوده موجودی انتخاب کنید.'
                    : 'برای هر ردیف سمپل، محصول و تعداد صحیحِ بزرگ‌تر از صفر انتخاب کنید.'
            );
            return;
        }
        if (new Set(samples.map((sample) => sample.product_id)).size !== samples.length) {
            setError(
                'هر محصول را فقط یک بار در فهرست وارد کنید؛ برای همان محصول تعداد را در همان ردیف اصلاح کنید.'
            );
            return;
        }
        setSaving(true);
        try {
            let visit = savedVisit;
            if (!visit) {
                const data: VisitFormData = {
                    doctor_id: doctor.id,
                    visit_date: `${date}T${time}`,
                    purpose: purpose.trim(),
                    description: description.trim(),
                };
                visit = await createVisit(data);
                setSavedVisit(visit);
            }
            for (const sample of samples) {
                if (sample.saved) continue;
                const data: SampleFormData = {
                    visit_id: visit.id,
                    product_id: sample.product_id,
                    quantity: Number(sample.quantity),
                    description: sample.description.trim(),
                };
                await createSample(data);
                updateSample(sample.key, { saved: true });
                if (isScientificVisitor) {
                    setProducts((current) =>
                        current
                            .map((product) =>
                                product.id === sample.product_id &&
                                product.available_quantity !== undefined
                                    ? {
                                          ...product,
                                          available_quantity: Math.max(
                                              0,
                                              product.available_quantity - Number(sample.quantity)
                                          ),
                                      }
                                    : product
                            )
                            .filter(
                                (product) =>
                                    product.available_quantity === undefined ||
                                    product.available_quantity > 0
                            )
                    );
                }
            }
            onSaved(visit);
        } catch (e: unknown) {
            setError(e instanceof ApiError ? e.message : 'ذخیره اطلاعات کامل نشد.');
            if (savedVisit || samples.some((sample) => sample.saved)) {
                setNotice(
                    'ویزیت ثبت شده است. ردیف‌های ذخیره‌شده حفظ شده‌اند؛ پس از رفع خطا دوباره ثبت را بزنید تا فقط ردیف‌های باقی‌مانده ارسال شوند.'
                );
            } else {
                setNotice(
                    'اگر خطا هنگام ثبت سمپل رخ داده باشد، ویزیت ایجادشده حفظ می‌شود و با تلاش مجدد از همان ویزیت ادامه می‌دهیم.'
                );
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="space-y-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">ثبت ویزیت</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        ابتدا پزشک و اطلاعات ویزیت را وارد کنید؛ سپس محصولات تحویلی را به ویزیت
                        اضافه کنید.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="rounded-lg border bg-white px-4 py-2 text-sm"
                >
                    بستن فرم
                </button>
            </header>

            {doctorFormOpen ? (
                <DoctorForm
                    isSubmitting={doctorSaving}
                    error={doctorError}
                    onSubmit={(data) => void saveDoctor(data)}
                    onCancel={() => {
                        if (!doctorSaving) {
                            setDoctorFormOpen(false);
                            setDoctorError(null);
                        }
                    }}
                />
            ) : null}

            <form onSubmit={(event) => void submit(event)} className="space-y-5">
                <section className="rounded-xl border bg-white p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">۱. انتخاب پزشک</h3>
                        <button
                            type="button"
                            disabled={saving || Boolean(savedVisit)}
                            onClick={() => {
                                setDoctorError(null);
                                setDoctorFormOpen(true);
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                            + پزشک جدید
                        </button>
                    </div>
                    <SearchableDoctorSelect
                        value={doctor?.id ?? ''}
                        selectedDoctor={doctor}
                        searchDoctors={getVisitDoctors}
                        disabled={saving || Boolean(savedVisit)}
                        onChange={setDoctor}
                        placeholder="جستجو با نام، کد یا شماره تماس پزشک..."
                        emptyLabel="پزشکی پیدا نشد"
                    />
                    {doctor ? (
                        <p className="mt-2 text-sm text-gray-600">
                            {doctor.specialty || 'تخصص ثبت نشده'}
                            {doctor.clinic_name ? ` · ${doctor.clinic_name}` : ''}
                        </p>
                    ) : null}
                </section>

                <section className="rounded-xl border bg-white p-4">
                    <h3 className="mb-4 font-semibold">۲. اطلاعات ویزیت و محصولات تحویلی</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1 text-sm">
                            <span>تاریخ ویزیت *</span>
                            <JalaliDateInput
                                value={date}
                                onChange={setDate}
                                required
                                disabled={saving || Boolean(savedVisit)}
                                className={inputClass}
                            />
                        </label>
                        <label className="space-y-1 text-sm">
                            <span>ساعت *</span>
                            <input
                                type="time"
                                required
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                disabled={saving || Boolean(savedVisit)}
                                className={inputClass}
                            />
                        </label>
                        <label className="space-y-1 text-sm md:col-span-2">
                            <span>هدف ویزیت *</span>
                            <input
                                required
                                maxLength={150}
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                disabled={saving || Boolean(savedVisit)}
                                placeholder="مثلاً معرفی محصول یا پیگیری"
                                className={inputClass}
                            />
                        </label>
                        <label className="space-y-1 text-sm md:col-span-2">
                            <span>توضیحات</span>
                            <textarea
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={saving || Boolean(savedVisit)}
                                className={inputClass}
                            />
                        </label>
                    </div>
                    <div className="mt-6 border-t border-gray-300 pt-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h4 className="font-semibold">{isScientificVisitor ? 'محصول تحویلی و تعداد' : 'سمپل‌های تحویلی'}</h4>
                                {isScientificVisitor ? <p className="mt-1 text-xs text-gray-500">در هر ویزیت یک محصول انتخاب می‌شود؛ برای محصول متفاوت، ویزیت جداگانه ثبت کنید.</p> : null}
                            </div>
                            {!isScientificVisitor ? (
                                <button
                                    type="button"
                                    onClick={addSample}
                                    disabled={saving || productsLoading || products.length === 0}
                                    className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                                >
                                    + افزودن سمپل
                                </button>
                            ) : null}
                        </div>
                        {productsLoading ? (
                            <p className="py-4 text-sm text-gray-500">در حال دریافت محصولات...</p>
                        ) : null}
                        {!productsLoading && products.length === 0 ? (
                            <p className="py-4 text-sm text-amber-700">
                                {isScientificVisitor
                                    ? 'در حال حاضر موجودی قابل استفاده‌ای برای حساب شما ثبت نشده است؛ پس از تخصیص موجودی، محصولات در این فهرست نمایش داده می‌شوند.'
                                    : 'فهرست محصولی برای انتخاب دریافت نشد. می‌توانید ویزیت را بدون سمپل ثبت کنید.'}
                            </p>
                        ) : null}
                        {samples.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-5 text-center text-sm text-gray-500">
                                هنوز سمپلی اضافه نشده است.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {samples.map((sample, index) => (
                                    <div
                                        key={sample.key}
                                        className="grid gap-3 rounded-xl border p-3 md:grid-cols-[minmax(0,2fr)_100px_minmax(0,1fr)_auto] md:items-end"
                                    >
                                        <div className="space-y-1 text-sm">
                                            <span className="block">محصول {index + 1} *</span>
                                            {sample.saved ? (
                                                <div className="rounded-lg border bg-gray-50 px-3 py-2.5">
                                                    {sample.product_title || 'محصول ثبت‌شده'}
                                                </div>
                                            ) : isScientificVisitor ? (
                                                <select
                                                    required
                                                    value={sample.product_id}
                                                    disabled={saving || products.length === 0}
                                                    onChange={(event) => {
                                                        const product_id = event.target.value;
                                                        updateSample(sample.key, {
                                                            product_id,
                                                            product_title: products.find((product) => product.id === product_id)?.title ?? '',
                                                            quantity: '1',
                                                        });
                                                    }}
                                                    className={inputClass}
                                                >
                                                    <option value="">انتخاب محصول از موجودی شما</option>
                                                    {products.filter((product) => product.available_quantity === undefined || product.available_quantity > 0).map((product) => (
                                                        <option key={product.id} value={product.id}>
                                                            {product.title} {product.available_quantity !== undefined ? `(موجودی: ${product.available_quantity})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <SearchableProductSelect
                                                    value={sample.product_id}
                                                    products={products}
                                                    usedProductIds={samples
                                                        .filter(
                                                            (x) =>
                                                                x.key !== sample.key && x.product_id
                                                        )
                                                        .map((x) => x.product_id)}
                                                    disabled={saving || products.length === 0}
                                                    onChange={(product_id) =>
                                                        updateSample(sample.key, {
                                                            product_id,
                                                            product_title:
                                                                products.find(
                                                                    (product) =>
                                                                        product.id === product_id
                                                                )?.title ?? '',
                                                            quantity: '1',
                                                        })
                                                    }
                                                    placeholder={
                                                        products.length
                                                            ? 'جستجوی محصول...'
                                                            : 'محصولی در موجودی نیست'
                                                    }
                                                />
                                            )}
                                        </div>
                                        <label className="space-y-1 text-sm">
                                            <span>
                                                تعداد *
                                                {products.find(
                                                    (product) => product.id === sample.product_id
                                                )?.available_quantity !== undefined
                                                    ? ` (موجودی: ${
                                                          products.find(
                                                              (product) =>
                                                                  product.id === sample.product_id
                                                          )?.available_quantity
                                                      })`
                                                    : ''}
                                            </span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={
                                                    products.find(
                                                        (product) =>
                                                            product.id === sample.product_id
                                                    )?.available_quantity
                                                }
                                                step={1}
                                                required
                                                value={sample.quantity}
                                                disabled={saving || sample.saved}
                                                onChange={(e) =>
                                                    updateSample(sample.key, {
                                                        quantity: e.target.value,
                                                    })
                                                }
                                                className={inputClass}
                                            />
                                        </label>
                                        <label className="space-y-1 text-sm">
                                            <span>توضیحات</span>
                                            <input
                                                value={sample.description}
                                                disabled={saving || sample.saved}
                                                onChange={(e) =>
                                                    updateSample(sample.key, {
                                                        description: e.target.value,
                                                    })
                                                }
                                                className={inputClass}
                                            />
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {sample.saved ? (
                                                <span className="text-xs font-medium text-green-700">
                                                    ثبت شد
                                                </span>
                                            ) : null}
                                            {!isScientificVisitor ? (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSample(sample.key)}
                                                    disabled={saving || sample.saved}
                                                    className="rounded-lg border px-3 py-2 text-sm text-red-700 disabled:opacity-40"
                                                >
                                                    حذف
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                {notice ? (
                    <div
                        role="status"
                        className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
                    >
                        {notice}
                    </div>
                ) : null}
                {error ? (
                    <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="submit"
                        disabled={saving || doctorFormOpen || productsLoading}
                        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {saving
                            ? 'در حال ثبت...'
                            : savedVisit
                            ? 'ادامه ثبت سمپل‌های باقی‌مانده'
                            : 'ثبت ویزیت و سمپل‌ها'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="rounded-lg border bg-white px-5 py-2.5 text-sm"
                    >
                        انصراف
                    </button>
                </div>
            </form>
        </section>
    );
}
