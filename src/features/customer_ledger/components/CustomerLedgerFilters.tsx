import { JalaliDateInput } from "../../../components/JalaliDateInput";

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
    <div className="ui-filter-panel">
      <div className="ui-filter-grid grid-cols-1 lg:grid-cols-2">
        <div className="ui-filter-field">
          <label htmlFor="ledger-from" className="ui-filter-label">از تاریخ</label>
          <JalaliDateInput
            id="ledger-from"
            value={from}
            onChange={onFromChange}
            disabled={isLoading}
            className="w-full"
            placeholder="۱۴۰۵/۰۶/۰۱"
          />
        </div>
        <div className="ui-filter-field">
          <label htmlFor="ledger-to" className="ui-filter-label">تا تاریخ</label>
          <JalaliDateInput
            id="ledger-to"
            value={to}
            onChange={onToChange}
            disabled={isLoading}
            className="w-full"
            placeholder="۱۴۰۵/۰۶/۳۱"
          />
        </div>
      </div>
      <div className="ui-filter-actions">
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
          disabled={isLoading}
          className="ui-filter-clear disabled:cursor-not-allowed disabled:opacity-60"
        >
          پاک کردن فیلترها
        </button>
      </div>
    </div>
  );
}
