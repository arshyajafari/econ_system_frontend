import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "../types/payment";

import type { PaymentMethod, PaymentStatus } from "../types/payment";

type PaymentFiltersProps = {
  search: string;
  status: PaymentStatus | "";
  method: PaymentMethod | "";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: PaymentStatus | "") => void;
  onMethodChange: (value: PaymentMethod | "") => void;
  onClear: () => void;
};

export function PaymentFilters({
  search,
  status,
  method,
  onSearchChange,
  onStatusChange,
  onMethodChange,
  onClear,
}: PaymentFiltersProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            جستجو
          </label>

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="شماره فاکتور، توضیحات..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            وضعیت
          </label>

          <select
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as PaymentStatus | "")
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">همه وضعیت‌ها</option>

            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            روش پرداخت
          </label>

          <select
            value={method}
            onChange={(event) =>
              onMethodChange(event.target.value as PaymentMethod | "")
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">همه روش‌ها</option>

            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onClear}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            پاک کردن فیلترها
          </button>
        </div>
      </div>
    </div>
  );
}
