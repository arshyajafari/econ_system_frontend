import { SearchableCustomerSelect } from '../../../components/SearchableCustomerSelect';
import { searchCustomers } from '../../customers/services/customersApi';
import type { OrderEmployeeOption, OrderStatus } from '../types/order';
import { ORDER_STATUS_OPTIONS } from '../types/order';

type OrderFiltersProps = {
    search: string;
    status: OrderStatus | '';
    customerId: string;
    salesEmployeeId: string;
    employees: OrderEmployeeOption[];
    onSearchChange: (value: string) => void;
    onStatusChange: (value: OrderStatus | '') => void;
    onCustomerChange: (value: string) => void;
    onSalesEmployeeChange: (value: string) => void;
    onClear: () => void;
};

export function OrderFilters({
    search,
    status,
    customerId,
    salesEmployeeId,
    employees,
    onSearchChange,
    onStatusChange,
    onCustomerChange,
    onSalesEmployeeChange,
    onClear,
}: OrderFiltersProps) {
    const inputClass =
        'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10';

    return (
        <section className="ui-filter-panel">
            <div className="ui-filter-grid grid-cols-1 md:grid-cols-2">
                <div>
                    <label
                        htmlFor="order-search"
                        className="ui-filter-label"
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
                        onChange={(event) => onStatusChange(event.target.value as OrderStatus | '')}
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
                    <label className="mb-2 block text-sm font-medium text-gray-700">مشتری</label>
                    <SearchableCustomerSelect
                        value={customerId}
                        searchCustomers={searchCustomers}
                        onChange={(customer) => onCustomerChange(customer?.id ?? '')}
                        placeholder="همه مشتریان؛ برای جستجو تایپ کنید..."
                    />
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

            <div className="ui-filter-actions">
                <button
                    type="button"
                    onClick={onClear}
                    className="ui-filter-clear"
                >
                    پاک کردن فیلترها
                </button>
            </div>
        </section>
    );
}
