type CustomerLedgerFiltersProps = {
  from: string;
  to: string;
  isLoading: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export function CustomerLedgerFilters({
  from,
  to,
  isLoading,
  onFromChange,
  onToChange,
  onApply,
  onReset,
}: CustomerLedgerFiltersProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label
            htmlFor="ledger-from"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            از تاریخ
          </label>

          <input
            id="ledger-from"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="flex-1">
          <label
            htmlFor="ledger-to"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            تا تاریخ
          </label>

          <input
            id="ledger-to"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={isLoading}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "در حال دریافت..." : "اعمال فیلتر"}
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={isLoading && !from && !to}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            حذف فیلتر
          </button>
        </div>
      </div>
    </div>
  );
}
