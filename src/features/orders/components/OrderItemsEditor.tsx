import { FormattedNumberInput } from "../../../components/FormattedNumberInput";
import type { OrderItemFormData, OrderProductOption } from "../types/order";

type Props = {
  items: OrderItemFormData[];
  products: OrderProductOption[];
  disabled?: boolean;
  onChange: (items: OrderItemFormData[]) => void;
};
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 disabled:bg-gray-50";
const numberFormatter = new Intl.NumberFormat("fa-IR");

const emptyItem = (): OrderItemFormData => ({
  product_id: "",
  quantity: 1,
  unit_price: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  offer_type: "none",
  offer_buy_quantity: "0",
  offer_free_quantity: "0",
  offer_title: "",
});

function getGross(item: OrderItemFormData) {
  return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
}
function getDiscount(item: OrderItemFormData) {
  const gross = getGross(item);
  const value = Number(item.discount_value) || 0;
  if (!value) return 0;
  return Math.min(gross, Math.round(((gross * value) / 100) * 100) / 100);
}
function getFree(item: OrderItemFormData) {
  return Math.max(0, Math.trunc(Number(item.offer_free_quantity) || 0));
}

export function OrderItemsEditor({
  items,
  products,
  disabled = false,
  onChange,
}: Props) {
  const addItem = () => onChange([...items, emptyItem()]);
  const updateItem = (index: number, patch: Partial<OrderItemFormData>) =>
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  const updateGift = (index: number, value: string) => {
    const gift = Math.max(0, Math.trunc(Number(value) || 0));
    const item = items[index];
    updateItem(index, {
      offer_free_quantity: String(gift),
      offer_buy_quantity: gift > 0 ? String(item.quantity) : "0",
      offer_type: gift > 0 ? "buy_x_get_y" : "none",
    });
  };
  const selectProduct = (index: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    updateItem(index, {
      product_id: productId,
      unit_price: p?.current_price?.sale_price ?? p?.sale_price ?? "",
    });
  };
  const removeItem = (index: number) => {
    if (items.length > 1) onChange(items.filter((_, i) => i !== index));
  };
  const orderGross = items.reduce((s, i) => s + getGross(i), 0);
  const orderItemDiscount = items.reduce((s, i) => s + getDiscount(i), 0);
  const orderNet = items.reduce((s, i) => s + getGross(i) - getDiscount(i), 0);
  const freeUnits = items.reduce((s, i) => s + getFree(i), 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gradient-to-l from-gray-50 to-white px-5 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-white">
                01
              </span>
              <div>
                <h3 className="font-bold text-gray-900">اقلام سفارش</h3>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={disabled}
            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800 disabled:opacity-50"
          >
            + افزودن محصول
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4 md:p-5">
        {items.map((item, index) => {
          const used = items
            .filter((_, i) => i !== index)
            .map((x) => x.product_id)
            .filter(Boolean);
          const product = item.product_id
            ? products.find((p) => p.id === item.product_id)
            : undefined;
          const gross = getGross(item),
            discount = getDiscount(item),
            free = getFree(item),
            final = Math.max(0, gross - discount);
          const deliveryQuantity = Number(item.quantity) + free;
          const availableQuantity = product?.available_quantity ?? null;

          return (
            <article
              key={index}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/60"
            >
              <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
                    {numberFormatter.format(index + 1)}
                  </span>
                  <span className="truncate text-sm font-bold text-gray-800">
                    {item.product_id
                      ? (product?.title ?? "محصول")
                      : "محصول جدید"}
                  </span>
                  {free > 0 ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      + {numberFormatter.format(free)} رایگان
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={disabled || items.length === 1}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-30"
                >
                  حذف
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-6">
                <div className="lg:col-span-2">
                  <Field label="محصول" required>
                    <select
                      value={item.product_id}
                      onChange={(e) => selectProduct(index, e.target.value)}
                      disabled={disabled}
                      className={inputClass}
                    >
                      <option value="">انتخاب محصول</option>
                      {products.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={used.includes(p.id)}
                        >
                          {p.title} — {p.code}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="تعداد خرید" required>
                  <input
                    dir="rtl"
                    type="number"
                    min={1}
                    step={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const quantity = Math.max(
                        1,
                        Math.trunc(Number(e.target.value) || 1),
                      );
                      updateItem(index, {
                        quantity,
                        offer_buy_quantity:
                          getFree(item) > 0 ? String(quantity) : "0",
                      });
                    }}
                    disabled={disabled}
                    className={inputClass}
                  />
                  {item.product_id ? (
                    <div className="mt-1.5 text-xs font-medium text-gray-500">
                      موجودی قابل فروش:{" "}
                      <span className="font-bold text-gray-700">
                        {availableQuantity !== null
                          ? numberFormatter.format(availableQuantity) + " عدد"
                          : "نامشخص"}
                      </span>
                    </div>
                  ) : null}
                </Field>
                <Field label="قیمت واحد" required>
                  <FormattedNumberInput
                    dir="rtl"
                    min={0}
                    step="0.01"
                    value={item.unit_price}
                    onValueChange={(value) =>
                      updateItem(index, { unit_price: value })
                    }
                    disabled={disabled}
                    className={inputClass}
                  />
                </Field>
                <Field label="درصد تخفیف">
                  <FormattedNumberInput
                    dir="rtl"
                    min={0}
                    max={100}
                    step="0.01"
                    value={item.discount_value}
                    onValueChange={(value) =>
                      updateItem(index, {
                        discount_type: "percentage",
                        discount_value: value,
                      })
                    }
                    disabled={disabled}
                    className={inputClass}
                    placeholder="اختیاری"
                  />
                </Field>
                <Field label="تعداد هدیه">
                  <input
                    aria-label="تعداد هدیه"
                    dir="rtl"
                    type="number"
                    min={0}
                    step={1}
                    value={getFree(item) || ""}
                    onChange={(e) => updateGift(index, e.target.value)}
                    disabled={disabled}
                    className={inputClass}
                    placeholder="اختیاری"
                  />
                </Field>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-[11px] font-medium text-gray-500">
                    مبلغ نهایی
                  </div>
                  <div dir="ltr" className="mt-1 font-bold text-gray-900">
                    {numberFormatter.format(final)}
                  </div>
                  {discount > 0 ? (
                    <div className="mt-1 text-[11px] text-amber-700">
                      تخفیف: {numberFormatter.format(discount)}
                    </div>
                  ) : null}
                </div>
              </div>

              {free > 0 ? (
                <div className="mx-4 mb-4 rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2.5">
                  <div className="text-xs text-emerald-700">
                    این ردیف:{" "}
                    <strong>{numberFormatter.format(item.quantity)}</strong> عدد
                    خرید + <strong>{numberFormatter.format(free)}</strong> عدد
                    هدیه → تحویل{" "}
                    <strong>{numberFormatter.format(deliveryQuantity)}</strong>{" "}
                    عدد
                  </div>
                </div>
              ) : null}

              <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-3">
                <Field label="توضیحات آیتم">
                  <input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, { description: e.target.value })
                    }
                    disabled={disabled}
                    className={inputClass}
                    placeholder="اختیاری"
                  />
                </Field>
              </div>
            </article>
          );
        })}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="جمع ناخالص اقلام" value={orderGross} />
          <Metric label="تخفیف اقلام" value={orderItemDiscount} />
          <Metric label="رایگان کل" value={freeUnits} />
          <Metric label="جمع اقلام پس از تخفیف" value={orderNet} emphasized />
        </div>
      </div>
    </section>
  );
}
function Metric({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-gray-200 bg-white px-4 py-3 " +
        (emphasized ? "ring-1 ring-gray-300" : "")
      }
    >
      <div className="text-[11px] text-gray-500">{label}</div>
      <div dir="ltr" className="mt-1 text-sm font-bold text-gray-900">
        {numberFormatter.format(value)}
      </div>
    </div>
  );
}
function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-gray-600">
        {label}
        {required ? <span className="mr-1 text-red-600">*</span> : null}
      </label>
      {children}
    </div>
  );
}
