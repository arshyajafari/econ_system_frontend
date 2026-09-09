import type { OrderItemFormData } from "../types/order";

type ProductOption = {
  id: string;
  code: string;
  title: string;
};

type OrderItemsEditorProps = {
  items: OrderItemFormData[];
  products: ProductOption[];
  disabled: boolean;
  onChange: (items: OrderItemFormData[]) => void;
};

export function OrderItemsEditor({
  items,
  products,
  disabled,
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
    if (items.length <= 1) {
      return;
    }

    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function getItemTotal(item: OrderItemFormData): number {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;

    return quantity * unitPrice;
  }

  const total = items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const selectedProductIds = new Set(
    items.map((item) => item.product_id).filter(Boolean),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">اقلام سفارش</h3>

        <button
          type="button"
          onClick={addItem}
          disabled={disabled}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          افزودن محصول
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${index}-${item.product_id}`}
            className="rounded-xl border border-gray-200 p-4"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  محصول
                </label>

                <select
                  value={item.product_id}
                  disabled={disabled}
                  onChange={(event) =>
                    updateItem(index, {
                      product_id: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                >
                  <option value="">انتخاب محصول</option>

                  {products.map((product) => {
                    const usedByAnotherItem =
                      selectedProductIds.has(product.id) &&
                      product.id !== item.product_id;

                    return (
                      <option
                        key={product.id}
                        value={product.id}
                        disabled={usedByAnotherItem}
                      >
                        {product.title} — {product.code}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  تعداد
                </label>

                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  disabled={disabled}
                  onChange={(event) =>
                    updateItem(index, {
                      quantity: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  قیمت واحد
                </label>

                <input
                  dir="ltr"
                  inputMode="decimal"
                  value={item.unit_price}
                  disabled={disabled}
                  onChange={(event) =>
                    updateItem(index, {
                      unit_price: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-right outline-none focus:border-gray-900"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  توضیحات
                </label>

                <input
                  value={item.description}
                  disabled={disabled}
                  onChange={(event) =>
                    updateItem(index, {
                      description: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div className="rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
                <span className="text-gray-500">مبلغ:</span>{" "}
                <strong>{getItemTotal(item).toLocaleString("fa-IR")}</strong>
              </div>

              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={disabled || items.length <= 1}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end rounded-xl bg-gray-50 px-5 py-4">
        <div className="text-base">
          <span className="text-gray-500">مبلغ کل سفارش:</span>{" "}
          <strong className="mr-2 text-lg text-gray-900">
            {total.toLocaleString("fa-IR")}
          </strong>
        </div>
      </div>
    </div>
  );
}
