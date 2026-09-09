import type { Product, ProductStatus } from "../types/product";
import { PRODUCT_STATUS_OPTIONS } from "../types/product";

type ProductTableProps = {
  products: Product[];
  isLoading: boolean;
  pendingStatusId: string | null;
  pendingDeleteId: string | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onStatusChange: (product: Product, status: ProductStatus) => void;
};

const statusLabels: Record<ProductStatus, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  pending: "در انتظار",
  discontinued: "تولید متوقف شده",
};

export function ProductTable({
  products,
  isLoading,
  pendingStatusId,
  pendingDeleteId,
  onEdit,
  onDelete,
  onStatusChange,
}: ProductTableProps) {
  if (isLoading && products.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
        <p className="text-sm text-gray-500">در حال دریافت محصولات...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">محصولی برای نمایش وجود ندارد.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-right text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                کد
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                محصول
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                برند
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                دسته‌بندی
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                بارکد
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                وضعیت
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                عملیات
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {products.map((product) => {
              const isStatusPending = pendingStatusId === product.id;

              const isDeletePending = pendingDeleteId === product.id;

              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    {product.code}
                  </td>

                  <td className="min-w-52 px-4 py-3 text-gray-900">
                    {product.title}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {product.brand?.title ?? "-"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {product.category?.title ?? "-"}
                  </td>

                  <td
                    dir="ltr"
                    className="whitespace-nowrap px-4 py-3 text-right text-gray-600"
                  >
                    {product.barcode ?? "-"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <select
                      aria-label={`تغییر وضعیت ${product.title}`}
                      value={product.status}
                      disabled={isStatusPending || isDeletePending}
                      onChange={(event) =>
                        onStatusChange(
                          product,
                          event.target.value as ProductStatus,
                        )
                      }
                      className="rounded-full border-0 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {PRODUCT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {statusLabels[option.value]}
                        </option>
                      ))}
                    </select>

                    {isStatusPending ? (
                      <span className="mr-2 text-xs text-gray-400">
                        در حال ذخیره...
                      </span>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        disabled={isDeletePending || isStatusPending}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ویرایش
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        disabled={isDeletePending || isStatusPending}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeletePending ? "در حال حذف..." : "حذف"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
