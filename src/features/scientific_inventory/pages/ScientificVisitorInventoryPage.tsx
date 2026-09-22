import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../auth";
import { getEmployees } from "../../employees/services/employeesApi";
import type { Employee } from "../../employees/types/employee";
import { getInventory } from "../../inventory/services/inventoryApi";
import type { InventoryBatch } from "../../inventory/types/inventory";
import { assignScientificInventory, getScientificInventory } from "../services/scientificInventoryApi";
import type { ScientificInventoryItem } from "../types/scientificInventory";

const numberFormat = new Intl.NumberFormat("fa-IR");

export function ScientificVisitorInventoryPage() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isManager = roles.includes("admin") || roles.includes("accountant");
  const isScientificVisitor = roles.includes("scientific visitor");
  const [items, setItems] = useState<ScientificInventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
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
        const response = await getScientificInventory({ available_only: isScientificVisitor, per_page: 100, sort: "-last_received_at" });
        if (!cancelled) setItems(response.data);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "خطا در دریافت موجودی نمونه ویزیتور علمی.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [refreshKey, isScientificVisitor]);

  useEffect(() => {
    if (!isManager) return;
    let cancelled = false;
    Promise.all([
      getEmployees({ activity_type: "scientific_visitor", status: "active", per_page: 100 }),
      getInventory({ sort: "-created_at", per_page: 100 }),
    ]).then(([employeeResponse, inventoryResponse]) => {
      if (cancelled) return;
      setEmployees(employeeResponse.data);
      setBatches(inventoryResponse.data.filter((batch) => batch.available_quantity > 0 && !batch.is_expired));
    }).catch((err: unknown) => {
      if (!cancelled) setError(err instanceof ApiError ? err.message : "خطا در دریافت اطلاعات تحویل محصول.");
    });
    return () => { cancelled = true; };
  }, [isManager, refreshKey]);

  const selectedBatch = useMemo(() => batches.find((batch) => batch.id === batchId) ?? null, [batches, batchId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!employeeId || !batchId || quantity < 1 || quantity > (selectedBatch?.available_quantity ?? 0)) return;
    setSaving(true);
    setError(null);
    try {
      await assignScientificInventory({ employee_id: employeeId, inventory_batch_id: batchId, quantity, description });
      setQuantity(1);
      setDescription("");
      setBatchId("");
      setRefreshKey((value) => value + 1);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "خطا در تحویل محصول به ویزیتور علمی.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold">موجودی ویزیتور علمی</h1>
        <p className="text-sm text-gray-500">محصولات تحویل‌شده و موجودی قابل استفاده برای ثبت نمونه</p>
      </header>

      {error ? <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {isManager ? (
        <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <select required disabled={saving} value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="rounded-lg border px-3 py-2">
              <option value="">انتخاب ویزیتور علمی</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.code} — {employee.first_name} {employee.last_name}</option>)}
            </select>
            <select required disabled={saving} value={batchId} onChange={(event) => setBatchId(event.target.value)} className="rounded-lg border px-3 py-2">
              <option value="">انتخاب محصول / بچ</option>
              {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.product?.title ?? "محصول"}{batch.batch_number ? " — بچ " + batch.batch_number : ""} — موجودی {numberFormat.format(batch.available_quantity)}</option>)}
            </select>
            <input required min={1} max={selectedBatch?.available_quantity ?? undefined} type="number" disabled={saving} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} className="rounded-lg border px-3 py-2" placeholder="تعداد تحویل" />
            <input disabled={saving} value={description} onChange={(event) => setDescription(event.target.value)} className="rounded-lg border px-3 py-2" placeholder="توضیحات" />
          </div>
          {selectedBatch ? <p className="text-xs text-gray-500">موجودی قابل تحویل این بچ: {numberFormat.format(selectedBatch.available_quantity)} عدد</p> : null}
          <button disabled={saving || !employeeId || !batchId || quantity < 1 || quantity > (selectedBatch?.available_quantity ?? 0)} className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50">{saving ? "در حال ثبت..." : "تحویل محصول"}</button>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-gray-50">
            <tr>{(isManager ? ["ویزیتور علمی", "محصول", "دریافتی", "مصرف‌شده", "موجودی قابل استفاده", "آخرین تحویل"] : ["محصول", "دریافتی", "مصرف‌شده", "موجودی قابل استفاده", "آخرین تحویل"]).map((title) => <th key={title} className="px-4 py-3">{title}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {loading && !items.length ? <tr><td colSpan={isManager ? 6 : 5} className="p-10 text-center">در حال دریافت...</td></tr> :
              !items.length ? <tr><td colSpan={isManager ? 6 : 5} className="p-10 text-center">موجودی نمونه‌ای ثبت نشده است.</td></tr> :
              items.map((item) => <tr key={item.id}>
                {isManager ? <td className="px-4 py-3">{item.employee?.name ?? "—"}<div className="text-xs text-gray-500">{item.employee?.code ?? ""}</div></td> : null}
                <td className="px-4 py-3 font-medium">{item.product?.title ?? "—"}<div className="text-xs text-gray-500">{item.product?.code ?? ""}</div></td>
                <td className="px-4 py-3">{numberFormat.format(item.received_quantity)}</td>
                <td className="px-4 py-3">{numberFormat.format(item.used_quantity)}</td>
                <td className="px-4 py-3 font-semibold">{numberFormat.format(item.available_quantity)}</td>
                <td className="px-4 py-3">{item.last_received_at ? new Date(item.last_received_at).toLocaleDateString("fa-IR") : "—"}</td>
              </tr>)
            }
          </tbody>
        </table>
      </div>
    </section>
  );
}