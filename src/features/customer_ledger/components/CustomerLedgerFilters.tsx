import { JalaliDateInput } from "../../../components/JalaliDateInput";
import { Button } from "../../../design-system/components/Button";

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
        <Button
          type="button"
          variant="primary"
          onClick={onApply}
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? "در حال دریافت..." : "اعمال فیلتر"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onReset}
          disabled={isLoading}
          className="ui-filter-clear"
        >
          پاک کردن فیلترها
        </Button>
      </div>
    </div>
  );
}
