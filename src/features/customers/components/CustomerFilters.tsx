import { Button } from "../../../design-system/components/Button";
import type { CustomerStatus, CustomerType } from "../types/customer";

type CustomerFiltersProps = {
  search: string;
  status: CustomerStatus | "";
  type: CustomerType | "";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: CustomerStatus | "") => void;
  onTypeChange: (value: CustomerType | "") => void;
  onClear: () => void;
};

const typeOptions: Array<{
  value: CustomerType;
  label: string;
}> = [
  { value: "pharmacy", label: "داروخانه" },
  { value: "clinic", label: "کلینیک" },
  { value: "hospital", label: "بیمارستان" },
  { value: "wholesaler", label: "عمده‌فروش" },
  { value: "store", label: "فروشگاه" },
  { value: "other", label: "سایر" },
];

const statusOptions: Array<{
  value: CustomerStatus;
  label: string;
}> = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
  { value: "blocked", label: "مسدود" },
];

export function CustomerFilters({
  search,
  status,
  type,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onClear,
}: CustomerFiltersProps) {
  return (
    <section className="ui-filter-panel">
      <div className="ui-filter-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="ui-filter-field lg:col-span-2">
          <label
            htmlFor="customer-search"
            className="ui-filter-label"
          >
            جستجو
          </label>

          <input
            id="customer-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="نام، کد، تلفن، کد ملی..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          />
        </div>

        <div className="ui-filter-field">
<label
            htmlFor="customer-type"
            className="ui-filter-label"
          >
            نوع مشتری
          </label>

          <select
            id="customer-type"
            value={type}
            onChange={(event) =>
              onTypeChange(event.target.value as CustomerType | "")
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">همه</option>

            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ui-filter-field">
<label
            htmlFor="customer-status"
            className="ui-filter-label"
          >
            وضعیت
          </label>

          <select
            id="customer-status"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as CustomerStatus | "")
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">همه</option>

            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ui-filter-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClear}
          className="ui-filter-clear"
        >
          پاک کردن فیلترها
        </Button>
      </div>
    </section>
  );
}
