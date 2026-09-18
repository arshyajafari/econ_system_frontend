import { useState } from "react";
import { FormattedNumberInput } from "../../../components/FormattedNumberInput";
import { useAuth } from "../../auth";
import { OrderItemsEditor } from "./OrderItemsEditor";
import type { Order, OrderCustomerOption, OrderDiscountType, OrderFormData, OrderProductOption } from "../types/order";

type OrderFormProps = {
  order?: Order | null;
  customers: OrderCustomerOption[];
  employees?: { id: string; code: string; first_name: string; last_name: string; status: string }[];
  products: OrderProductOption[];
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
};

const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100";
const numberFormatter = new Intl.NumberFormat("fa-IR");

function orderToForm(order: Order): OrderFormData {
  return {
    customer_id: order.customer?.id ?? "",
    sales_employee_id: order.sales_employee?.id ?? "",
    description: order.description ?? "",
    discount_type: order.discount_type ?? "none",
    discount_value: String(order.discount_value ?? 0),
    offer_title: order.offer_title ?? "",
    offer_description: order.offer_description ?? "",
    items: order.items.map((item) => ({
      product_id: item.product?.id ?? "",
      quantity: item.quantity,
      unit_price: String(item.unit_price),
      description: item.description ?? "",
    })),
  };
}

function getDiscountAmount(form: OrderFormData): number {
  const subtotal = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);
  if (form.discount_type === "percentage") {
    return Math.min(subtotal, Math.round(subtotal * ((Number(form.discount_value) || 0) / 100) * 100) / 100);
  }
  if (form.discount_type === "fixed") {
    return Math.min(subtotal, Math.max(0, Number(form.discount_value) || 0));
  }
  return 0;
}

export function OrderForm({ order, customers, products, isSubmitting, error, onSubmit, onCancel }: OrderFormProps) {
  const { user } = useAuth();
  const currentEmployee = user?.employee ?? null;
  const [form, setForm] = useState<OrderFormData>(() => order ? orderToForm(order) : {
    customer_id: "",
    sales_employee_id: currentEmployee?.id ?? "",
    description: "",
    discount_type: "none",
    discount_value: "0",
    offer_title: "",
    offer_description: "",
    items: [{ product_id: "", quantity: 1, unit_price: "", description: "" }],
  });

  function update<K extends keyof OrderFormData>(key: K, value: OrderFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.customer_id || !form.sales_employee_id) return;
    if (form.items.length === 0 || form.items.some((item) => !item.product_id || item.quantity < 1 || item.unit_price === "" || Number(item.unit_price) < 0)) return;
    const discountValue = Number(form.discount_value);
    if (form.discount_type === "percentage" && (!Number.isFinite(discountValue) || discountValue < 0 || discountValue > 100)) return;
    if (form.discount_type === "fixed" && (!Number.isFinite(discountValue) || discountValue < 0 || discountValue > getItemsSubtotal())) return;
    onSubmit(form);
  }

  function getItemsSubtotal(): number {
    return form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);
  }

  const subtotal = getItemsSubtotal();
  const discountAmount = getDiscountAmount(form);
  const finalAmount = Math.max(0, subtotal - discountAmount);
  const isValid = Boolean(form.customer_id) && Boolean(form.sales_employee_id) && form.items.length > 0 &&
    form.items.every((item) => Boolean(item.product_id) && item.quantity >= 1 && item.unit_price !== "" && Number(item.unit_price) >= 0) &&
    (form.discount_type === "none" || (Number.isFinite(Number(form.discount_value)) && Number(form.discount_value) >= 0 && (form.discount_type !== "percentage" || Number(form.discount_value) <= 100)) && (form.discount_type !== "fixed" || Number(form.discount_value) <= subtotal));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{order ? "ویرایش سفارش" : "سفارش جدید"}</h2>
        <p className="mt-1 text-sm text-gray-500">سفارش ابتدا به صورت پیش‌نویس ثبت می‌شود.</p>
      </div>
      {error ? <p role="alert" aria-live="polite" className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="مشتری" required>
            <select value={form.customer_id} onChange={(event) => update("customer_id", event.target.value)} disabled={isSubmitting} className={inputClass}>
              <option value="">انتخاب مشتری</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customer_name} — {customer.code}</option>)}
            </select>
          </Field>
          <Field label="کارشناس فروش" required>
            <div className={`${inputClass} flex items-center justify-between`}><span>{currentEmployee?.full_name || "کارشناس فروش مشخص نشده است"}</span><span className="text-xs text-gray-500">از حساب کاربری</span></div>
          </Field>
        </div>

        <OrderItemsEditor items={form.items} products={products} disabled={isSubmitting} onChange={(items) => update("items", items)} />

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">تخفیف و آفر سفارش</h3>
            <p className="mt-1 text-xs text-gray-500">تخفیف سفارش روی مبلغ نهایی فاکتور اعمال می‌شود؛ آفر برای ثبت و نمایش توضیح تجاری سفارش است.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="نوع تخفیف">
              <select value={form.discount_type} onChange={(event) => update("discount_type", event.target.value as OrderDiscountType)} disabled={isSubmitting} className={inputClass}>
                <option value="none">بدون تخفیف</option>
                <option value="percentage">درصدی</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </Field>
            <Field label={form.discount_type === "percentage" ? "درصد تخفیف" : "مبلغ تخفیف"}>
              <FormattedNumberInput dir="ltr" min={0} max={form.discount_type === "percentage" ? 100 : undefined} step="0.01" value={form.discount_value} onValueChange={(value) => update("discount_value", value)} disabled={isSubmitting || form.discount_type === "none"} className={`${inputClass} text-right`} />
            </Field>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="text-xs text-gray-500">اثر تخفیف</div>
              <div className="mt-1 text-sm text-gray-600">کسر می‌شود: <strong dir="ltr">{numberFormatter.format(discountAmount)}</strong></div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="عنوان آفر">
              <input value={form.offer_title} onChange={(event) => update("offer_title", event.target.value)} disabled={isSubmitting} className={inputClass} placeholder="مثلاً آفر ویژه داروخانه" />
            </Field>
            <Field label="توضیحات آفر">
              <textarea value={form.offer_description} onChange={(event) => update("offer_description", event.target.value)} disabled={isSubmitting} rows={3} className={inputClass} placeholder="شرایط یا توضیح آفر..." />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Summary label="جمع اقلام" value={subtotal} />
            <Summary label="تخفیف" value={discountAmount} />
            <Summary label="مبلغ نهایی سفارش" value={finalAmount} emphasized />
          </div>
        </section>

        <Field label="توضیحات سفارش">
          <textarea value={form.description} onChange={(event) => update("description", event.target.value)} disabled={isSubmitting} rows={4} className={inputClass} />
        </Field>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">انصراف</button>
          <button type="submit" disabled={isSubmitting || !isValid} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "در حال ذخیره..." : order ? "ذخیره تغییرات" : "ثبت سفارش"}</button>
        </div>
      </form>
    </section>
  );
}

function Summary({ label, value, emphasized = false }: { label: string; value: number; emphasized?: boolean }) {
  return <div className={`rounded-lg border border-gray-200 bg-white px-4 py-3 ${emphasized ? "ring-1 ring-gray-300" : ""}`}><div className="text-xs text-gray-500">{label}</div><div dir="ltr" className={`mt-1 font-bold ${emphasized ? "text-lg text-gray-900" : "text-sm text-gray-800"}`}>{numberFormatter.format(value)}</div></div>;
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-sm font-medium text-gray-700">{label}{required ? <span className="mr-1 text-red-600">*</span> : null}</label>{children}</div>;
}
