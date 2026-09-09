import type {
  ProductBrand,
  ProductCategory,
  ProductStatus,
} from "../types/product";
import { PRODUCT_STATUS_OPTIONS } from "../types/product";

type ProductFiltersProps = {
  search: string;
  brandId: string;
  categoryId: string;
  status: ProductStatus | "";
  brands: ProductBrand[];
  categories: ProductCategory[];
  onSearchChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: ProductStatus | "") => void;
  onClear: () => void;
};

export function ProductFilters({
  search,
  brandId,
  categoryId,
  status,
  brands,
  categories,
  onSearchChange,
  onBrandChange,
  onCategoryChange,
  onStatusChange,
  onClear,
}: ProductFiltersProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label
            htmlFor="product-search"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            جستجو
          </label>

          <input
            id="product-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="نام، کد محصول، بارکد..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          />
        </div>

        <div>
          <label
            htmlFor="product-brand"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            برند
          </label>

          <select
            id="product-brand"
            value={brandId}
            onChange={(event) => onBrandChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">همه برندها</option>

            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="product-category"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            دسته‌بندی
          </label>

          <select
            id="product-category"
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">همه دسته‌بندی‌ها</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="product-status"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            وضعیت
          </label>

          <select
            id="product-status"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as ProductStatus | "")
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">همه</option>

            {PRODUCT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          پاک کردن فیلترها
        </button>
      </div>
    </section>
  );
}
