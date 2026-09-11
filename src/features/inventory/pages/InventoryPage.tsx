import { useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import { getProducts } from "../../products/services/productsApi";
import type { Product } from "../../products/types/product";
import { deleteInventoryBatch, getInventory, receiveInventory } from "../services/inventoryApi";
import type { InventoryBatch, ReceiveInventoryData } from "../types/inventory";

const empty: ReceiveInventoryData = { product_id: "", batch_number: "", expire_date: "", quantity: 1, received_at: "", description: "" };

export function InventoryPage() {
  const [items, setItems] = useState<InventoryBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [expired, setExpired] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let dead = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getInventory({ search: search.trim() || undefined, expired: expired === "" ? undefined : expired === "true", sort: "-created_at", page, per_page: 100 });
        if (!dead) { setItems(response.data); setLastPage(response.meta?.last_page ?? 1); }
      } catch (e: unknown) {
        if (!dead) setError(e instanceof ApiError ? e.message : "خطا در دریافت موجودی.");
      } finally { if (!dead) setLoading(false); }
    };
    void run();
    return () => { dead = true; };
  }, [expired, page, refreshKey, search]);

  useEffect(() => {
    getProducts({ per_page: 500 }).then((response) => setProducts(response.data)).catch(() => setProducts([]));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(null);
    try { await receiveInventory(form); setForm(empty); setPage(1); setRefreshKey((current) => current + 1); }
    catch (e: unknown) { setError(e instanceof ApiError ? e.message : "خطا در ثبت ورود موجودی."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("این بچ حذف شود؟")) return;
    try { await deleteInventoryBatch(id); setRefreshKey((current) => current + 1); }
    catch (e: unknown) { setError(e instanceof ApiError ? e.message : "خطا در حذف موجودی."); }
  };

  return (
    <section className="space-y-5 p-4 md:p-6">
      <header><h1 className="text-2xl font-bold">موجودی</h1><p className="text-sm text-gray-500">مدیریت بچ‌ها، موجودی قابل‌استفاده و تاریخ انقضا</p></header>
      {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <select required disabled={saving} value={form.product_id} onChange={(event) => setForm({ ...form, product_id: event.target.value })} className="rounded-lg border px-3 py-2"><option value="">انتخاب محصول</option>{products.map((product) => <option key={product.id} value={product.id}>{product.code} — {product.title}</option>)}</select>
          <input disabled={saving} value={form.batch_number} onChange={(event) => setForm({ ...form, batch_number: event.target.value })} placeholder="شماره بچ" className="rounded-lg border px-3 py-2" />
          <input required min={1} type="number" disabled={saving} value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Math.max(1, Number(event.target.value)) })} placeholder="تعداد" className="rounded-lg border px-3 py-2" />
          <input type="date" disabled={saving} value={form.expire_date} onChange={(event) => setForm({ ...form, expire_date: event.target.value })} className="rounded-lg border px-3 py-2" />
          <input type="datetime-local" disabled={saving} value={form.received_at} onChange={(event) => setForm({ ...form, received_at: event.target.value })} className="rounded-lg border px-3 py-2" />
          <input disabled={saving} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="توضیحات" className="rounded-lg border px-3 py-2" />
        </div>
        <button disabled={saving} className="rounded-lg bg-gray-900 px-4 py-2 text-white">ثبت ورود موجودی</button>
      </form>
      <div className="flex gap-3">
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="جستجوی شماره بچ" className="flex-1 rounded-lg border px-3 py-2" />
        <select value={expired} onChange={(event) => { setExpired(event.target.value); setPage(1); }} className="rounded-lg border px-3 py-2"><option value="">همه</option><option value="true">منقضی</option><option value="false">غیرمنقضی</option></select>
        <button type="button" disabled={loading} onClick={() => setRefreshKey((current) => current + 1)} className="rounded-lg border px-4 disabled:opacity-50">بروزرسانی</button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-right text-sm"><thead className="bg-gray-50"><tr>{["محصول", "بچ", "کل", "رزرو", "قابل استفاده", "انقضا", "عملیات"].map((title) => <th key={title} className="px-4 py-3">{title}</th>)}</tr></thead>
          <tbody className="divide-y">
            {loading && !items.length ? <tr><td colSpan={7} className="p-10 text-center">در حال دریافت…</td></tr> : !items.length ? <tr><td colSpan={7} className="p-10 text-center">موجودی‌ای پیدا نشد.</td></tr> : items.map((item) => <tr key={item.id}>
              <td className="px-4 py-3">{item.product?.title ?? "—"}<div className="text-xs text-gray-500">{item.product?.code ?? ""}</div></td><td className="px-4 py-3">{item.batch_number || "—"}</td><td className="px-4 py-3">{item.quantity}</td><td className="px-4 py-3">{item.reserved_quantity}</td><td className="px-4 py-3 font-medium">{Math.max(0, item.available_quantity)}</td>
              <td className="px-4 py-3">{item.expire_date ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(new Date(item.expire_date)) : "—"}{item.is_expired && <span className="mr-2 text-red-600">منقضی</span>}{!item.is_expired && item.is_near_expire && <span className="mr-2 text-amber-600">نزدیک انقضا</span>}</td>
              <td className="px-4 py-3"><button type="button" onClick={() => void remove(item.id)} className="rounded border px-2 py-1 text-xs">حذف</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {lastPage > 1 && <div className="flex items-center justify-center gap-3"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border px-3 py-2 disabled:opacity-50">قبلی</button><span className="text-sm text-gray-600">صفحه {page} از {lastPage}</span><button type="button" disabled={page >= lastPage || loading} onClick={() => setPage((current) => Math.min(lastPage, current + 1))} className="rounded-lg border px-3 py-2 disabled:opacity-50">بعدی</button></div>}
    </section>
  );
}
