import { useState, type FormEvent } from "react";
import type { Product } from "../../products/types/product";
import type { Visit } from "../../visits/types/visit";
import type { Sample, SampleFormData } from "../types/sample";

type Props = {
  visits: Visit[];
  products: Product[];
  sample?: Sample | null;
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: (data: SampleFormData) => void;
  onCancel: () => void;
};

export function SampleForm({ visits, products, sample, isSubmitting, error, onSubmit, onCancel }: Props) {
  const [visitId, setVisitId] = useState(sample?.visit?.id ?? "");
  const [productId, setProductId] = useState(sample?.product?.id ?? "");
  const [quantity, setQuantity] = useState(String(sample?.quantity ?? 1));
  const [description, setDescription] = useState(sample?.description ?? "");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    onSubmit({
      visit_id: sample?.visit?.id ?? visitId,
      product_id: sample?.product?.id ?? productId,
      quantity: parsedQuantity,
      description,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{sample ? "ویرایش نمونه" : "ثبت نمونه جدید"}</h2>
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded border px-3 py-1 text-sm">بستن</button>
      </div>
      {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {!sample && (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm"><span>بازدید تکمیل‌شده</span><select required value={visitId} onChange={(e) => setVisitId(e.target.value)} className="w-full rounded-lg border px-3 py-2"><option value="">انتخاب بازدید</option>{visits.map((visit) => <option key={visit.id} value={visit.id}>{visit.doctor?.name ?? "پزشک نامشخص"} — {formatDate(visit.visit_date)}</option>)}</select></label>
          <label className="space-y-1 text-sm"><span>محصول</span><select required value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-lg border px-3 py-2"><option value="">انتخاب محصول</option>{products.map((product) => <option key={product.id} value={product.id}>{product.title}{product.code ? ` — ${product.code}` : ""}</option>)}</select></label>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm"><span>تعداد</span><input required min={1} type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></label>
        <label className="space-y-1 text-sm"><span>توضیحات</span><input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></label>
      </div>
      <div className="flex gap-2"><button type="submit" disabled={isSubmitting || (!sample && (!visitId || !productId || Number(quantity) < 1))} className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50">{isSubmitting ? "در حال ذخیره…" : "ذخیره"}</button><button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border px-4 py-2">انصراف</button></div>
    </form>
  );
}

function formatDate(value: string | null) {
  if (!value) return "بدون تاریخ";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "بدون تاریخ" : new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(date);
}
