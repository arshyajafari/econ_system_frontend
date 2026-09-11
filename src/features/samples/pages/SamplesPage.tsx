import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import type { Product } from "../../products/types/product";
import type { Visit } from "../../visits/types/visit";
import { SampleForm } from "../components/SampleForm";
import { createSample, deleteSample, getSampleProducts, getSampleVisits, getSamples, updateSample } from "../services/samplesApi";
import type { Sample, SampleFormData } from "../types/sample";

function dateText(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function SamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sample | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSamples({ search: search.trim() || undefined, product_id: productId || undefined, sort: "-created_at", page, per_page: 20 });
      setSamples(response.data);
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت نمونه‌ها.");
    } finally {
      setLoading(false);
    }
  }, [page, productId, search]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getSamples({ search: search.trim() || undefined, product_id: productId || undefined, sort: "-created_at", page, per_page: 20 });
        if (!cancelled) {
          setSamples(response.data);
          setLastPage(response.meta.last_page);
          setTotal(response.meta.total);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "خطا در دریافت نمونه‌ها.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [page, productId, search]);

  useEffect(() => {
    let cancelled = false;
    const loadOptions = async () => {
      try {
        const [visitData, productData] = await Promise.all([getSampleVisits(), getSampleProducts()]);
        if (!cancelled) {
          setVisits(visitData);
          setProducts(productData);
        }
      } catch {
        if (!cancelled) {
          setVisits([]);
          setProducts([]);
        }
      }
    };
    void loadOptions();
    return () => { cancelled = true; };
  }, []);

  async function submit(data: SampleFormData) {
    setSaving(true);
    setFormError(null);
    try {
      const saved = editing ? await updateSample(editing.id, data) : await createSample(data);
      if (editing) setSamples((items) => items.map((item) => item.id === saved.id ? saved : item));
      else { setSamples((items) => [saved, ...items].slice(0, 20)); setTotal((value) => value + 1); }
      setFormOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      setFormError(err instanceof ApiError ? err.message : "خطا در ذخیره نمونه.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(sample: Sample) {
    if (deletingId || !window.confirm("این نمونه حذف شود؟")) return;
    setDeletingId(sample.id);
    setError(null);
    try {
      await deleteSample(sample.id);
      setSamples((items) => items.filter((item) => item.id !== sample.id));
      setTotal((value) => Math.max(0, value - 1));
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف نمونه.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-5 p-4 md:p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold">نمونه‌ها</h1><p className="text-sm text-gray-500">ثبت و پیگیری نمونه‌های تحویلی در بازدیدها</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg border px-4 py-2">بروزرسانی</button><button type="button" onClick={() => { setEditing(null); setFormError(null); setFormOpen(true); }} className="rounded-lg bg-gray-900 px-4 py-2 text-white">نمونه جدید</button></div>
      </header>
      {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {formOpen && <SampleForm visits={visits} products={products} sample={editing} isSubmitting={saving} error={formError} onSubmit={submit} onCancel={() => { if (!saving) { setFormOpen(false); setEditing(null); } }} />}
      <div className="grid gap-3 md:grid-cols-3"><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="جستجوی توضیحات" className="rounded-lg border px-3 py-2" /><select value={productId} onChange={(e) => { setProductId(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2"><option value="">همه محصولات</option>{products.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}</select><div className="flex items-center justify-end text-sm text-gray-500">{new Intl.NumberFormat("fa-IR").format(total)} نمونه</div></div>
      <div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-full text-right text-sm"><thead className="bg-gray-50"><tr>{["تاریخ","پزشک","محصول","تعداد","کارمند","توضیحات","عملیات"].map((title) => <th key={title} className="px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">{loading && !samples.length ? <tr><td colSpan={7} className="p-10 text-center">در حال دریافت…</td></tr> : !samples.length ? <tr><td colSpan={7} className="p-10 text-center">نمونه‌ای پیدا نشد.</td></tr> : samples.map((sample) => <tr key={sample.id}><td className="whitespace-nowrap px-4 py-3">{dateText(sample.created_at)}</td><td className="px-4 py-3">{sample.doctor?.name ?? "—"}</td><td className="px-4 py-3">{sample.product?.title ?? "—"}</td><td className="px-4 py-3">{new Intl.NumberFormat("fa-IR").format(sample.quantity)}</td><td className="px-4 py-3">{sample.employee?.name ?? "—"}</td><td className="max-w-xs px-4 py-3">{sample.description || "—"}</td><td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => { setEditing(sample); setFormError(null); setFormOpen(true); }} className="rounded border px-2 py-1 text-xs">ویرایش</button><button type="button" disabled={deletingId === sample.id} onClick={() => void remove(sample)} className="rounded border px-2 py-1 text-xs">حذف</button></div></td></tr>)}</tbody></table></div>
      {lastPage > 1 && <div className="flex justify-center gap-3"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border px-4 py-2">قبلی</button><span className="py-2">صفحه {page} از {lastPage}</span><button type="button" disabled={page >= lastPage || loading} onClick={() => setPage((value) => value + 1)} className="rounded border px-4 py-2">بعدی</button></div>}
    </section>
  );
}
