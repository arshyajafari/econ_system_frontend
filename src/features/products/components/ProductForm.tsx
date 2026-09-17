import { useRef, useState } from "react";
import { FormattedNumberInput } from "../../../components/FormattedNumberInput";
import type { Product, ProductBrand, ProductCategory, ProductFormData } from "../types/product";
import { PRODUCT_STATUS_OPTIONS } from "../types/product";

type ProductFormProps = { product?: Product | null; brands: ProductBrand[]; categories: ProductCategory[]; isSubmitting: boolean; error: string | null; onSubmit: (data: ProductFormData) => void; onCancel: () => void };
const emptyForm: ProductFormData = { brand_id: "", product_category_id: "", title: "", sale_price: "", barcode: "", sort_order: 0, status: "active", image: "", description: "" };
function productToForm(product: Product): ProductFormData { return { brand_id: product.brand?.id ?? "", product_category_id: product.category?.id ?? "", title: product.title, sale_price: product.current_price?.sale_price ?? "", barcode: product.barcode ?? "", sort_order: product.sort_order, status: product.status, image: product.image ?? "", description: product.description ?? "" }; }

export function ProductForm({ product, brands, categories, isSubmitting, error, onSubmit, onCancel }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(() => product ? productToForm(product) : emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);
  function update<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!form.title.trim() || !form.brand_id || !form.product_category_id || form.sale_price === "" || Number(form.sale_price) < 0) return; onSubmit(form); }
  const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100";
  const selectedFile = form.image_file;
  return <section className="rounded-xl border border-gray-200 bg-white p-5">
    <div className="mb-6"><h2 className="text-lg font-semibold text-gray-900">{product ? "ویرایش محصول" : "محصول جدید"}</h2></div>
    {error ? <p role="alert" aria-live="polite" className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="نام محصول" required><input value={form.title} onChange={(event) => update("title", event.target.value)} disabled={isSubmitting} className={inputClass} /></Field>
        <Field label="برند" required><select value={form.brand_id} onChange={(event) => update("brand_id", event.target.value)} disabled={isSubmitting} className={inputClass}><option value="">انتخاب برند</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.title}</option>)}</select></Field>
        <Field label="دسته‌بندی" required><select value={form.product_category_id} onChange={(event) => update("product_category_id", event.target.value)} disabled={isSubmitting} className={inputClass}><option value="">انتخاب دسته‌بندی</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></Field>
        <Field label="قیمت فروش" required><FormattedNumberInput dir="ltr" min={0} step="0.01" value={form.sale_price} onValueChange={(value) => update("sale_price", value)} disabled={isSubmitting} className={`${inputClass} text-right`} placeholder="قیمت به ریال" /></Field>
        <Field label="بارکد"><input dir="ltr" value={form.barcode} onChange={(event) => update("barcode", event.target.value)} disabled={isSubmitting} className={`${inputClass} text-right`} /></Field>
        <Field label="ترتیب نمایش"><input dir="ltr" type="number" min={0} value={form.sort_order} onChange={(event) => update("sort_order", Math.max(0, Number(event.target.value) || 0))} disabled={isSubmitting} className={`${inputClass} text-right`} /></Field>
        <Field label="وضعیت"><select value={form.status} onChange={(event) => update("status", event.target.value as ProductFormData["status"])} disabled={isSubmitting} className={inputClass}>{PRODUCT_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <Field label="تصویر محصول"><div className="group relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-gray-400 hover:bg-gray-100"><button type="button" disabled={isSubmitting} onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center justify-center px-5 py-6 text-center disabled:cursor-not-allowed disabled:opacity-60"><span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm">📷</span><span className="text-sm font-semibold text-gray-800">{selectedFile ? selectedFile.name : "انتخاب تصویر محصول"}</span><span className="mt-1 text-xs text-gray-500">JPG، PNG یا WEBP · برای تغییر تصویر کلیک کنید</span></button><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => update("image_file", event.target.files?.[0] ?? null)} disabled={isSubmitting} className="hidden" />{selectedFile ? <div className="border-t border-gray-200 bg-white px-4 py-2 text-xs text-gray-600">فایل جدید آماده ارسال است.</div> : form.image ? <div className="border-t border-gray-200 bg-white px-4 py-2 text-xs text-gray-600">تصویر فعلی حفظ می‌شود مگر تصویر جدید انتخاب کنید.</div> : null}</div></Field>
      </div>
      <Field label="توضیحات"><textarea value={form.description} onChange={(event) => update("description", event.target.value)} disabled={isSubmitting} rows={4} className={inputClass} /></Field>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">بازگشت به محصولات</button><button type="submit" disabled={isSubmitting || !form.title.trim() || !form.brand_id || !form.product_category_id || form.sale_price === "" || Number(form.sale_price) < 0} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "در حال ذخیره..." : product ? "ذخیره تغییرات" : "ثبت محصول"}</button></div>
    </form>
  </section>;
}
function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div><label className="mb-2 block text-sm font-medium text-gray-700">{label}{required ? <span className="mr-1 text-red-600">*</span> : null}</label>{children}</div>; }
