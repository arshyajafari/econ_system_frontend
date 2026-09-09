import type { OrderItemFormData, OrderProductOption } from "../types/order";

type OrderItemsEditorProps = {
  items: OrderItemFormData[];
  products: OrderProductOption[];
  disabled?: boolean;
  onChange: (items: OrderItemFormData[]) => void;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100";

const numberFormatter = new Intl.NumberFormat("fa-IR");

export function OrderItemsEditor({
  items,
  products,
  disabled = false,
  onChange,
}: OrderItemsEditorProps) {
  function addItem() {
    onChange([
      ...items,
      {
        product_id: "",
        quantity: 1,
        unit_price: "",
        description: "",
      },
    ]);
  }

  function updateItem(index: number, patch: Partial<OrderItemFormData>) {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      return;
    }

    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function getItemTotal(item: OrderItemFormData): number {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;

    return quantity * unitPrice;
  }

  const orderTotal = items.reduce((sum, item) => sum + getItemTotal(item), 0);

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">اقلام سفارش</h3>

          <p className="mt-1 text-xs text-gray-500">
            حداقل یک محصول باید در سفارش وجود داشته باشد.
          </p>
        </div>

        <button
          type="button"
          onClick={addItem}
          disabled={disabled}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          افزودن محصول
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const usedProductIds = items
            .filter((_, itemIndex) => itemIndex !== index)
            .map((current) => current.product_id)
            .filter(Boolean);

          const itemTotal = getItemTotal(item);

          return (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  آیتم {numberFormatter.format(index + 1)}
                </span>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={disabled || items.length === 1}
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  حذف
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Field label="محصول" required>
                  <select
                    value={item.product_id}
                    onChange={(event) =>
                      updateItem(index, {
                        product_id: event.target.value,
                      })
                    }
                    disabled={disabled}
                    className={inputClass}
                  >
                    <option value="">انتخاب محصول</option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                        disabled={usedProductIds.includes(product.id)}
                      >
                        {product.title} — {product.code}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="تعداد" required>
                  <input
                    dir="ltr"
                    type="number"
                    min={1}
                    step={1}
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(index, {
                        quantity: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                    disabled={disabled}
                    className={`${inputClass} text-right`}
                  />
                </Field>

                <Field label="قیمت واحد" required>
                  <input
                    dir="ltr"
                    type="number"
                    min={0}
                    step="any"
                    value={item.unit_price}
                    onChange={(event) =>
                      updateItem(index, {
                        unit_price: event.target.value,
                      })
                    }
                    disabled={disabled}
                    className={`${inputClass} text-right`}
                  />
                </Field>

                <Field label="مبلغ کل">
                  <div
                    dir="ltr"
                    className="flex min-h-[42px] items-center rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-700"
                  >
                    {numberFormatter.format(itemTotal)}
                  </div>
                </Field>
              </div>

              <div className="mt-4">
                <Field label="توضیحات آیتم">
                  <input
                    value={item.description}
                    onChange={(event) =>
                      updateItem(index, {
                        description: event.target.value,
                      })
                    }
                    disabled={disabled}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-gray-600">مبلغ کل سفارش</span>

        <strong dir="ltr" className="text-lg font-bold text-gray-900">
          {numberFormatter.format(orderTotal)}
        </strong>
      </div>
    </section>
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
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}

        {required ? <span className="mr-1 text-red-600">*</span> : null}
      </label>

      {children}
    </div>
  );
}
