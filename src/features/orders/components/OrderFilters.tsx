import type {
  OrderCustomerOption,
  OrderEmployeeOption,
  OrderStatus,
} from "../types/order";
import { ORDER_STATUS_OPTIONS } from "../types/order";

type OrderFiltersProps = {
  search: string;
  status: OrderStatus | "";
  customerId: string;
  salesEmployeeId: string;
  customers: OrderCustomerOption[];
  employees: OrderEmployeeOption[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: OrderStatus | "") => void;
  onCustomerChange: (value: string) => void;
  onSalesEmployeeChange: (value: string) => void;
  onClear: () => void;
};

export function OrderFilters({
  search,
  status,
  customerId,
  salesEmployeeId,
  customers,
  employees,
  onSearchChange,
  onStatusChange,
  onCustomerChange,
  onSalesEmployeeChange,
  onClear,
}: OrderFiltersProps) {
  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label
            htmlFor="order-search"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            جستجو
          </label>

          <input
            id="order-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="کد سفارش، توضیحات..."
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="order-status"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            وضعیت
          </label>

          <select
            id="order-status"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as OrderStatus | "")
            }
            className={inputClass}
          >
            <option value="">همه</option>

            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="order-customer"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            مشتری
          </label>

          <select
            id="order-customer"
            value={customerId}
            onChange={(event) => onCustomerChange(event.target.value)}
            className={inputClass}
          >
            <option value="">همه مشتریان</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.customer_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="order-sales-employee"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            کارشناس فروش
          </label>

          <select
            id="order-sales-employee"
            value={salesEmployeeId}
            onChange={(event) => onSalesEmployeeChange(event.target.value)}
            className={inputClass}
          >
            <option value="">همه کارشناسان</option>

            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
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
