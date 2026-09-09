import type { Customer, CustomerStatus } from "../types/customer";

type CustomerTableProps = {
  customers: Customer[];
  isLoading: boolean;
  pendingStatusId: string | null;
  pendingDeleteId: string | null;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onStatusChange: (customer: Customer, status: CustomerStatus) => void;
};

const statusLabels: Record<CustomerStatus, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  blocked: "مسدود",
};

const typeLabels: Record<Customer["type"], string> = {
  pharmacy: "داروخانه",
  clinic: "کلینیک",
  hospital: "بیمارستان",
  wholesaler: "عمده‌فروش",
  store: "فروشگاه",
  other: "سایر",
};

export function CustomerTable({
  customers,
  isLoading,
  pendingStatusId,
  pendingDeleteId,
  onEdit,
  onDelete,
  onStatusChange,
}: CustomerTableProps) {
  if (isLoading && customers.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
        <p className="text-sm text-gray-500">در حال دریافت مشتریان...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">مشتری‌ای برای نمایش وجود ندارد.</p>
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
                مشتری
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                نوع
              </th>

              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                تلفن
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
            {customers.map((customer) => {
              const isStatusPending = pendingStatusId === customer.id;

              const isDeletePending = pendingDeleteId === customer.id;

              return (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    {customer.code}
                  </td>

                  <td className="min-w-52 px-4 py-3 text-gray-900">
                    {customer.customer_name}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {typeLabels[customer.type]}
                  </td>

                  <td
                    dir="ltr"
                    className="whitespace-nowrap px-4 py-3 text-right text-gray-600"
                  >
                    {customer.phone_number}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <select
                      aria-label={`تغییر وضعیت ${customer.customer_name}`}
                      value={customer.status}
                      disabled={isStatusPending || isDeletePending}
                      onChange={(event) =>
                        onStatusChange(
                          customer,
                          event.target.value as CustomerStatus,
                        )
                      }
                      className="rounded-full border-0 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
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
                        onClick={() => onEdit(customer)}
                        disabled={isDeletePending || isStatusPending}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ویرایش
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(customer)}
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
