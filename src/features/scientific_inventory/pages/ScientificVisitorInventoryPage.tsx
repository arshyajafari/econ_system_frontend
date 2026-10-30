import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../../api/client';
import { Pagination } from '../../../components/Pagination';
import { useAuth } from '../../auth';
import { getEmployees } from '../../employees/services/employeesApi';
import type { Employee } from '../../employees/types/employee';
import { getInventory } from '../../inventory/services/inventoryApi';
import type { InventoryBatch } from '../../inventory/types/inventory';
import { assignScientificInventory, getScientificInventoryTransfers, updateScientificInventoryTransfer, deleteScientificInventoryTransfer } from '../services/scientificInventoryApi';
import type { ScientificInventoryTransfer } from '../types/scientificInventory';

const nf = new Intl.NumberFormat('fa-IR');

export function ScientificVisitorInventoryPage() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isManager = roles.includes('admin') || roles.includes('accountant');
  const [rows, setRows] = useState<ScientificInventoryTransfer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState<ScientificInventoryTransfer | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [deleting, setDeleting] = useState<ScientificInventoryTransfer | null>(null);

  const selectedBatch = useMemo(() => batches.find(x => x.id === batchId) ?? null, [batches, batchId]);

  useEffect(() => {
    let active = true;
    getScientificInventoryTransfers({ page, per_page: 20 })
      .then(result => {
        if (!active) return;
        setRows(result.data);
        setLastPage(result.last_page);
        setTotal(result.total);
      })
      .catch((err: unknown) => { if (active) setError(err instanceof ApiError ? err.message : 'خطا در دریافت سوابق تحویل.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, refresh]);

  useEffect(() => {
    if (!isManager) return;
    let active = true;
    Promise.all([
      getEmployees({ activity_type: 'scientific_visitor', status: 'active', per_page: 100 }),
      getInventory({ sort: '-created_at', per_page: 100 }),
    ]).then(([e, b]) => {
      if (!active) return;
      setEmployees(e.data);
      setBatches(b.data.filter(x => x.available_quantity > 0 && !x.is_expired));
    }).catch((err: unknown) => { if (active) setError(err instanceof ApiError ? err.message : 'خطا در دریافت اطلاعات انبار.'); });
    return () => { active = false; };
  }, [isManager, refresh]);

  async function submitAssign(event: FormEvent) {
    event.preventDefault();
    if (!employeeId || !batchId || !selectedBatch || quantity < 1 || quantity > selectedBatch.available_quantity) return;
    setSaving(true); setError(null);
    try {
      await assignScientificInventory({ employee_id: employeeId, inventory_batch_id: batchId, quantity, description });
      setEmployeeId(''); setBatchId(''); setQuantity(1); setDescription(''); setRefresh(x => x + 1);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'ثبت تحویل ناموفق بود.'); }
    finally { setSaving(false); }
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing || !Number.isInteger(editQuantity) || editQuantity < editing.used_quantity) {
      setError('تعداد تحویل نمی‌تواند کمتر از مقدار مصرف‌شده این ردیف باشد.'); return;
    }
    const activeQuantity = editing.quantity - editing.returned_quantity;
    if (editQuantity > activeQuantity) {
      setError('برای افزایش تعداد، از فرم «ثبت تحویل جدید» استفاده کنید تا تاریخ و بچ انبار جداگانه ثبت شود.'); return;
    }
    setSaving(true); setError(null);
    try {
      await updateScientificInventoryTransfer(editing.inventory_id, editing.id, { quantity: editQuantity });
      setEditing(null); setRefresh(x => x + 1);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'ویرایش ردیف تحویل ناموفق بود.'); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true); setError(null);
    try {
      await deleteScientificInventoryTransfer(deleting.inventory_id, deleting.id);
      setDeleting(null); setRefresh(x => x + 1);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'حذف ردیف تحویل ناموفق بود.'); }
    finally { setSaving(false); }
  }

  return <section className="space-y-5 p-4 md:p-6">
    <header><h1 className="text-2xl font-bold">موجودی ویزیتور علمی</h1><p className="mt-1 text-sm text-gray-500">هر نوبت تحویل، مستقل و با تاریخ و سابقه انبار خودش نمایش داده می‌شود.</p></header>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {isManager && <form onSubmit={submitAssign} className="space-y-3 rounded-xl border bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <select required disabled={saving} value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="rounded-lg border px-3 py-2">
          <option value="">انتخاب ویزیتور علمی</option>{employees.map(e => <option key={e.id} value={e.id}>{e.code} — {e.first_name} {e.last_name}</option>)}
        </select>
        <select required disabled={saving} value={batchId} onChange={e => setBatchId(e.target.value)} className="rounded-lg border px-3 py-2">
          <option value="">انتخاب محصول / بچ</option>{batches.map(b => <option key={b.id} value={b.id}>{b.product?.title ?? 'محصول'} {b.batch_number ? '— بچ '+b.batch_number : ''} (موجودی {nf.format(b.available_quantity)})</option>)}
        </select>
        <input type="number" min={1} max={selectedBatch?.available_quantity} required value={quantity} onChange={e => setQuantity(Number(e.target.value))} disabled={saving} placeholder="تعداد تحویل" className="rounded-lg border px-3 py-2" />
        <input value={description} onChange={e => setDescription(e.target.value)} disabled={saving} placeholder="توضیحات" className="rounded-lg border px-3 py-2" />
      </div>
      <button disabled={saving || !employeeId || !batchId || !selectedBatch || quantity < 1 || quantity > selectedBatch.available_quantity} className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50">{saving ? 'در حال ثبت...' : 'ثبت تحویل جدید'}</button>
    </form>}
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-full text-right text-sm">
      <thead className="bg-gray-50"><tr>{(isManager ? ['ویزیتور علمی','محصول','تاریخ تحویل','تحویل خالص','مصرف‌شده','برگشتی','موجودی باقی‌مانده','عملیات'] : ['محصول','تاریخ تحویل','تحویل خالص','مصرف‌شده','برگشتی','موجودی باقی‌مانده']).map(x => <th key={x} className="whitespace-nowrap px-4 py-3">{x}</th>)}</tr></thead>
      <tbody className="divide-y">{loading && !rows.length ? <tr><td colSpan={isManager ? 8 : 6} className="p-10 text-center">در حال دریافت...</td></tr> : !rows.length ? <tr><td colSpan={isManager ? 8 : 6} className="p-10 text-center">سابقه تحویلی ثبت نشده است.</td></tr> : rows.map(row => <tr key={row.id}>
        {isManager && <td className="px-4 py-3">{row.employee_name}<div className="text-xs text-gray-500">{row.employee_code}</div></td>}
        <td className="px-4 py-3 font-medium">{row.product_title}<div className="text-xs text-gray-500">{row.product_code}</div></td>
        <td className="whitespace-nowrap px-4 py-3">{row.delivered_at ? new Date(row.delivered_at).toLocaleDateString('fa-IR') : '—'}</td>
        <td className="px-4 py-3">{nf.format(row.received_quantity)}</td><td className="px-4 py-3">{nf.format(row.used_quantity)}</td><td className="px-4 py-3">{nf.format(row.returned_quantity)}</td><td className="px-4 py-3 font-semibold">{nf.format(row.available_quantity)}</td>
        {isManager && <td className="px-4 py-3"><div className="flex gap-2"><button type="button" disabled={saving} onClick={() => { setEditing(row); setEditQuantity(row.received_quantity); }} className="ui-btn-edit rounded-lg border px-3 py-1.5">ویرایش</button><button type="button" disabled={saving || row.used_quantity > 0} title={row.used_quantity > 0 ? 'به دلیل وجود مصرف قابل حذف نیست' : 'حذف و برگشت به انبار اصلی'} onClick={() => setDeleting(row)} className="ui-btn-delete rounded-lg border px-3 py-1.5 disabled:opacity-40">حذف</button></div></td>}
      </tr>)}</tbody>
    </table></div>
    <Pagination page={page} lastPage={lastPage} isLoading={loading} total={total} onPageChange={setPage} />
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={saveEdit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl">
      <h2 className="text-lg font-bold">ویرایش تحویل مستقل</h2><p className="text-sm text-gray-500">{editing.employee_name} — {editing.product_title} — {editing.delivered_at ? new Date(editing.delivered_at).toLocaleDateString('fa-IR') : ''}</p>
      <div className="rounded-lg bg-gray-50 p-3 text-sm">مصرف این تحویل: {nf.format(editing.used_quantity)} | برگشتی قبلی: {nf.format(editing.returned_quantity)} | موجودی: {nf.format(editing.available_quantity)}</div>
      <label className="block text-sm">مقدار نهایی تحویل (پس از اصلاح)<input type="number" min={editing.used_quantity} max={editing.received_quantity} step={1} required value={editQuantity} onChange={e => setEditQuantity(Number(e.target.value))} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} disabled={saving} className="rounded-lg border px-4 py-2">انصراف</button><button disabled={saving} className="rounded-lg bg-gray-900 px-4 py-2 text-white">{saving ? 'در حال ذخیره...' : 'ذخیره'}</button></div>
    </form></div>}
    {deleting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5"><h2 className="font-bold">حذف نوبت تحویل</h2><p className="text-sm text-gray-600">مقدار استفاده‌نشده این تحویل به همان بچ انبار اصلی برمی‌گردد. سابقه تحویل حذف فیزیکی نمی‌شود.</p><div className="flex justify-end gap-2"><button onClick={() => setDeleting(null)} className="rounded-lg border px-4 py-2">انصراف</button><button onClick={() => void confirmDelete()} disabled={saving} className="ui-btn-delete rounded-lg border px-4 py-2">{saving ? 'در حال حذف...' : 'تأیید حذف'}</button></div></div></div>}
  </section>;
}
