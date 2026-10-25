import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../types/payment';

import type { PaymentMethod, PaymentStatus } from '../types/payment';

type PaymentFiltersProps = {
    search: string;
    status: PaymentStatus | '';
    method: PaymentMethod | '';
    onSearchChange: (value: string) => void;
    onStatusChange: (value: PaymentStatus | '') => void;
    onMethodChange: (value: PaymentMethod | '') => void;
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
        <div className="ui-filter-panel">
            <div className="ui-filter-grid grid-cols-1 md:grid-cols-2">
                <div className="ui-filter-field">
                    <label className="ui-filter-label">جستجو</label>

                    <input
                        type="search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="شماره فاکتور، توضیحات..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                    />
                </div>

                <div className="ui-filter-field">
                    <label className="ui-filter-label">وضعیت</label>

                    <select
                        value={status}
                        onChange={(event) =>
                            onStatusChange(event.target.value as PaymentStatus | '')
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

                <div className="ui-filter-field">
                    <label className="ui-filter-label">
                        روش پرداخت
                    </label>

                    <select
                        value={method}
                        onChange={(event) =>
                            onMethodChange(event.target.value as PaymentMethod | '')
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

                <div className="ui-filter-actions">
                    <button
                        type="button"
                        onClick={onClear}
                        className="ui-filter-clear w-full"
                    >
                        پاک کردن فیلترها
                    </button>
                </div>
            </div>
        </div>
    );
}
