import { sortTableRecords } from '../../../utils/date';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../../api/client';
import { Pagination } from '../../../components/Pagination';
import { useAuth } from '../../auth';
import { getEmployees } from '../../employees/services/employeesApi';
import type { Employee } from '../../employees/types/employee';
import { getInventory } from '../../inventory/services/inventoryApi';
import type { InventoryBatch } from '../../inventory/types/inventory';
import {
    assignScientificInventory,
    deleteScientificInventory,
    getScientificInventory,
    updateScientificInventory,
} from '../services/scientificInventoryApi';
import type { ScientificInventoryItem } from '../types/scientificInventory';

const numberFormat = new Intl.NumberFormat('fa-IR');

export function ScientificVisitorInventoryPage() {
    const { user } = useAuth();
    const roles = user?.roles ?? [];
    const isManager = roles.includes('admin') || roles.includes('accountant');
    const isScientificVisitor = roles.includes('scientific visitor');

    const [items, setItems] = useState<ScientificInventoryItem[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [batches, setBatches] = useState<InventoryBatch[]>([]);
    const [employeeId, setEmployeeId] = useState('');
    const [batchId, setBatchId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [description, setDescription] = useState('');
    const [editingItem, setEditingItem] = useState<ScientificInventoryItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ScientificInventoryItem | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editQuantity, setEditQuantity] = useState(0);
    const [editBatchId, setEditBatchId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getScientificInventory({
                    page,
                    per_page: 20,
                    sort: '-last_received_at',
                });
                if (!cancelled) {
                    setItems(response.data);
                    setLastPage(response.meta.last_page);
                    setTotal(response.meta.total);
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(
                        err instanceof ApiError
                            ? err.message
                            : 'خطا در دریافت موجودی تحویلی ویزیتور علمی.'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void run();
        return () => {
            cancelled = true;
        };
    }, [page, refreshKey, isScientificVisitor]);

    useEffect(() => {
        if (!isManager) return;

        let cancelled = false;
        Promise.all([
            getEmployees({
                activity_type: 'scientific_visitor',
                status: 'active',
                per_page: 100,
            }),
            getInventory({ sort: '-created_at', per_page: 100 }),
        ])
            .then(([employeeResponse, inventoryResponse]) => {
                if (cancelled) return;
                setEmployees(employeeResponse.data);
                setBatches(
                    inventoryResponse.data.filter(
                        (batch) => batch.available_quantity > 0 && !batch.is_expired
                    )
                );
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(
                        err instanceof ApiError ? err.message : 'خطا در دریافت اطلاعات تحویل محصول.'
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isManager, refreshKey]);

    const selectedBatch = useMemo(
        () => batches.find((batch) => batch.id === batchId) ?? null,
        [batches, batchId]
    );
    const selectedEditBatch = useMemo(
        () => batches.find((batch) => batch.id === editBatchId) ?? null,
        [batches, editBatchId]
    );

    function openEdit(item: ScientificInventoryItem) {
        setEditingItem(item);
        setEditDescription(item.description ?? '');
        setEditQuantity(item.received_quantity);
        setEditBatchId('');
        setError(null);
    }

    function closeEdit() {
        if (saving) return;
        setEditingItem(null);
        setEditDescription('');
        setEditQuantity(0);
        setEditBatchId('');
    }

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (
            !employeeId ||
            !batchId ||
            quantity < 1 ||
            quantity > (selectedBatch?.available_quantity ?? 0)
        )
            return;

        setSaving(true);
        setError(null);
        try {
            await assignScientificInventory({
                employee_id: employeeId,
                inventory_batch_id: batchId,
                quantity,
                description,
            });
            setQuantity(1);
            setDescription('');
            setBatchId('');
            setRefreshKey((value) => value + 1);
        } catch (err: unknown) {
            setError(err instanceof ApiError ? err.message : 'خطا در تحویل محصول به ویزیتور علمی.');
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;

        setSaving(true);
        setError(null);
        try {
            await deleteScientificInventory(deleteTarget.id);
            setDeleteTarget(null);
            setRefreshKey((value) => value + 1);
        } catch (err: unknown) {
            setError(err instanceof ApiError ? err.message : 'خطا در حذف موجودی ویزیتور علمی.');
        } finally {
            setSaving(false);
        }
    }

    async function submitEdit(event: FormEvent) {
        event.preventDefault();
        if (!editingItem) return;

        if (!Number.isInteger(editQuantity) || editQuantity < editingItem.used_quantity) {
            setError(
                `تعداد دریافتی نمی‌تواند کمتر از مصرف‌شده باشد (${editingItem.used_quantity} عدد).`
            );
            return;
        }
        if (editQuantity > editingItem.received_quantity) {
            const increase = editQuantity - editingItem.received_quantity;
            if (
                !selectedEditBatch ||
                selectedEditBatch.product?.id !== editingItem.product?.id ||
                increase > selectedEditBatch.available_quantity
            ) {
                setError(
                    'برای افزایش تعداد، بچ معتبر همین محصول را انتخاب کنید و موجودی کافی داشته باشد.'
                );
                return;
            }
        }

        setSaving(true);
        setError(null);
        try {
            await updateScientificInventory(editingItem.id, {
                quantity: editQuantity,
                inventory_batch_id:
                    editQuantity > editingItem.received_quantity ? editBatchId : undefined,
                description: editDescription,
            });
            closeEdit();
            setRefreshKey((value) => value + 1);
        } catch (err: unknown) {
            setError(err instanceof ApiError ? err.message : 'خطا در ویرایش موجودی تحویلی.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="space-y-5 p-4 md:p-6">
            <header>
                <h1 className="text-2xl font-bold">موجودی ویزیتور علمی</h1>
            </header>

            {error ? (
                <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            {isManager ? (
                <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <select
                            required
                            disabled={saving}
                            value={employeeId}
                            onChange={(event) => setEmployeeId(event.target.value)}
                            className="rounded-lg border px-3 py-2"
                        >
                            <option value="">انتخاب ویزیتور علمی</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.code} — {employee.first_name} {employee.last_name}
                                </option>
                            ))}
                        </select>

                        <select
                            required
                            disabled={saving}
                            value={batchId}
                            onChange={(event) => setBatchId(event.target.value)}
                            className="rounded-lg border px-3 py-2"
                        >
                            <option value="">انتخاب محصول</option>
                            {batches.map((batch) => (
                                <option
                                    key={batch.id}
                                    value={batch.id}
                                    disabled={batch.available_quantity <= 0}
                                >
                                    {batch.product?.title ?? 'محصول'}
                                    {batch.batch_number ? ' — بچ ' + batch.batch_number : ''}
                                </option>
                            ))}
                        </select>

                        <input
                            required
                            min={1}
                            max={selectedBatch?.available_quantity ?? undefined}
                            type="number"
                            disabled={saving}
                            value={quantity}
                            onChange={(event) =>
                                setQuantity(Math.max(1, Number(event.target.value)))
                            }
                            className="rounded-lg border px-3 py-2"
                            placeholder="تعداد تحویل"
                        />

                        <input
                            disabled={saving}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            className="rounded-lg border px-3 py-2"
                            placeholder="توضیحات"
                        />
                    </div>

                    {selectedBatch ? (
                        <p className="text-xs text-gray-500">
                            موجودی قابل تحویل این بچ:{' '}
                            {numberFormat.format(selectedBatch.available_quantity)} عدد
                        </p>
                    ) : null}

                    <button
                        disabled={
                            saving ||
                            !employeeId ||
                            !batchId ||
                            quantity < 1 ||
                            quantity > (selectedBatch?.available_quantity ?? 0)
                        }
                        className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
                    >
                        {saving ? 'در حال ثبت...' : 'تحویل محصول'}
                    </button>
                </form>
            ) : null}

            <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-full text-right text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {(isManager
                                ? [
                                      'ویزیتور علمی',
                                      'محصول',
                                      'دریافتی',
                                      'مصرف‌شده',
                                      'موجودی قابل استفاده',
                                      'آخرین تحویل',
                                      'عملیات',
                                  ]
                                : [
                                      'محصول',
                                      'دریافتی',
                                      'مصرف‌شده',
                                      'موجودی قابل استفاده',
                                      'آخرین تحویل',
                                  ]
                            ).map((title) => (
                                <th key={title} className="px-4 py-3">
                                    {title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading && !items.length ? (
                            <tr>
                                <td colSpan={isManager ? 7 : 5} className="p-10 text-center">
                                    در حال دریافت...
                                </td>
                            </tr>
                        ) : !items.length ? (
                            <tr>
                                <td colSpan={isManager ? 7 : 5} className="p-10 text-center">
                                    موجودی تحویلی ثبت نشده است.
                                </td>
                            </tr>
                        ) : (
                            sortTableRecords(items).map((item) => (
                                <tr key={item.id}>
                                    {isManager ? (
                                        <td className="px-4 py-3">
                                            {item.employee?.name ?? '—'}
                                            <div className="text-xs text-gray-500">
                                                {item.employee?.code ?? ''}
                                            </div>
                                        </td>
                                    ) : null}

                                    <td className="px-4 py-3 font-medium">
                                        {item.product?.title ?? '—'}
                                        <div className="text-xs text-gray-500">
                                            {item.product?.code ?? ''}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {numberFormat.format(item.received_quantity)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {numberFormat.format(item.used_quantity)}
                                    </td>
                                    <td className="px-4 py-3 font-semibold">
                                        {numberFormat.format(item.available_quantity)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.last_received_at
                                            ? new Date(item.last_received_at).toLocaleDateString(
                                                  'fa-IR'
                                              )
                                            : '—'}
                                    </td>

                                    {isManager ? (
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(item)}
                                                    disabled={saving}
                                                    className="ui-btn-edit rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                                                >
                                                    ویرایش
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(item)}
                                                    disabled={saving}
                                                    title="حذف ردیف و بازگشت موجودی استفاده‌نشده به انبار اصلی"
                                                    className="ui-btn-delete rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                                                >
                                                    حذف
                                                </button>
                                            </div>
                                        </td>
                                    ) : null}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editingItem ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-scientific-inventory-title"
                >
                    <form
                        onSubmit={submitEdit}
                        className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-xl"
                    >
                        <div>
                            <h2 id="edit-scientific-inventory-title" className="text-lg font-bold">
                                ویرایش موجودی تحویلی
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {editingItem.employee?.name ?? '—'} —{' '}
                                {editingItem.product?.title ?? '—'}
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3 text-sm">
                            <div>
                                دریافتی فعلی:{' '}
                                <strong>
                                    {numberFormat.format(editingItem.received_quantity)}
                                </strong>{' '}
                                عدد
                            </div>
                            <div>
                                مصرف‌شده:{' '}
                                <strong>{numberFormat.format(editingItem.used_quantity)}</strong>{' '}
                                عدد
                            </div>
                            <div>
                                موجودی قابل استفاده:{' '}
                                <strong>
                                    {numberFormat.format(editingItem.available_quantity)}
                                </strong>{' '}
                                عدد
                            </div>
                        </div>

                        <label className="block space-y-1">
                            <span className="text-sm font-medium">تعداد دریافتی جدید</span>
                            <input
                                required
                                type="number"
                                min={editingItem.used_quantity}
                                max={
                                    editQuantity > editingItem.received_quantity &&
                                    selectedEditBatch
                                        ? editingItem.received_quantity +
                                          selectedEditBatch.available_quantity
                                        : undefined
                                }
                                step={1}
                                disabled={saving}
                                value={editQuantity}
                                onChange={(event) => setEditQuantity(Number(event.target.value))}
                                className="w-full rounded-lg border px-3 py-2"
                            />
                            <span className="text-xs text-gray-500">
                                حداقل تعداد مجاز برابر با مصرف‌شده است. کاهش تعداد فقط از موجودی
                                استفاده‌نشده برمی‌گردد.
                            </span>
                        </label>

                        {editQuantity > editingItem.received_quantity ? (
                            <label className="block space-y-1">
                                <span className="text-sm font-medium">
                                    بچ انبار اصلی برای افزایش موجودی
                                </span>
                                <select
                                    required
                                    disabled={saving}
                                    value={editBatchId}
                                    onChange={(event) => setEditBatchId(event.target.value)}
                                    className="w-full rounded-lg border px-3 py-2"
                                >
                                    <option value="">انتخاب بچ محصول</option>
                                    {batches
                                        .filter(
                                            (batch) => batch.product?.id === editingItem.product?.id
                                        )
                                        .map((batch) => (
                                            <option
                                                key={batch.id}
                                                value={batch.id}
                                                disabled={batch.available_quantity <= 0}
                                            >
                                                {batch.batch_number
                                                    ? `بچ ${batch.batch_number} — `
                                                    : ''}
                                                موجودی:{' '}
                                                {numberFormat.format(batch.available_quantity)}
                                            </option>
                                        ))}
                                </select>
                                <span className="text-xs text-gray-500">
                                    افزایش تعداد به همان میزان از موجودی بچ انتخاب‌شده کم می‌کند.
                                </span>
                            </label>
                        ) : null}

                        <label className="block space-y-1">
                            <span className="text-sm font-medium">توضیحات</span>
                            <input
                                disabled={saving}
                                value={editDescription}
                                onChange={(event) => setEditDescription(event.target.value)}
                                className="w-full rounded-lg border px-3 py-2"
                            />
                        </label>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeEdit}
                                disabled={saving}
                                className="rounded-lg border px-4 py-2"
                            >
                                انصراف
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
                            >
                                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}
            {deleteTarget ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-scientific-inventory-title"
                >
                    <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl">
                        <div>
                            <h2
                                id="delete-scientific-inventory-title"
                                className="text-lg font-bold"
                            >
                                حذف موجودی ویزیتور علمی
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                آیا می‌خواهید ردیف موجودی «{deleteTarget.product?.title ?? 'محصول'}»
                                برای «{deleteTarget.employee?.name ?? 'ویزیتور علمی'}» را حذف کنید؟
                                موجودی استفاده‌نشده به بچ‌های انبار اصلی برمی‌گردد؛ مقدار مصرف‌شده و
                                سوابق نمونه برای گزارش و حسابرسی حفظ می‌شود.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={saving}
                                className="ui-btn-secondary rounded-lg border px-4 py-2 disabled:opacity-50"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmDelete()}
                                disabled={saving}
                                className="ui-btn-delete rounded-lg border px-4 py-2 disabled:opacity-50"
                            >
                                {saving ? 'در حال حذف...' : 'حذف موجودی'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <Pagination
                page={page}
                lastPage={lastPage}
                isLoading={loading}
                total={total}
                onPageChange={setPage}
            />
        </section>
    );
}
