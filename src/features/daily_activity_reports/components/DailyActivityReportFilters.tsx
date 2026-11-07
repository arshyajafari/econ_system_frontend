import { JalaliDateInput } from "../../../components/JalaliDateInput";
import type { ActivityResult, ContactType } from "../services/dailyActivityReportsApi";

type DailyActivityReportFiltersProps = {
  search: string;
  from: string;
  to: string;
  contactType: ContactType | "";
  result: ActivityResult | "";
  onSearchChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onContactTypeChange: (value: ContactType | "") => void;
  onResultChange: (value: ActivityResult | "") => void;
  onClear: () => void;
};

export function DailyActivityReportFilters({
  search,
  from,
  to,
  contactType,
  result,
  onSearchChange,
  onFromChange,
  onToChange,
  onContactTypeChange,
  onResultChange,
  onClear,
}: DailyActivityReportFiltersProps) {
  return (
    <section className="ui-filter-panel" aria-label="فیلتر گزارش‌های فعالیت">
      <div className="ui-filter-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        <div className="ui-filter-field lg:col-span-2">
          <label htmlFor="daily-activity-report-search" className="ui-filter-label">
            جستجو
          </label>
          <input
            id="daily-activity-report-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="نام کارمند، مجموعه، مخاطب یا شرح مذاکرات..."
          />
        </div>

        <div className="ui-filter-field">
          <label htmlFor="daily-activity-report-from" className="ui-filter-label">
            از تاریخ
          </label>
          <JalaliDateInput
            value={from}
            onChange={onFromChange}
            placeholder="از تاریخ"
            className="w-full"
          />
        </div>

        <div className="ui-filter-field">
          <label htmlFor="daily-activity-report-to" className="ui-filter-label">
            تا تاریخ
          </label>
          <JalaliDateInput
            value={to}
            onChange={onToChange}
            placeholder="تا تاریخ"
            className="w-full"
          />
        </div>

        <div className="ui-filter-field">
          <label htmlFor="daily-activity-report-contact-type" className="ui-filter-label">
            نوع ارتباط
          </label>
          <select
            id="daily-activity-report-contact-type"
            value={contactType}
            onChange={(event) =>
              onContactTypeChange(event.target.value as ContactType | "")
            }
          >
            <option value="">همه روش‌ها</option>
            <option value="in_person">حضوری</option>
            <option value="phone">تلفنی</option>
          </select>
        </div>

        <div className="ui-filter-field">
          <label htmlFor="daily-activity-report-result" className="ui-filter-label">
            نتیجه
          </label>
          <select
            id="daily-activity-report-result"
            value={result}
            onChange={(event) =>
              onResultChange(event.target.value as ActivityResult | "")
            }
          >
            <option value="">همه نتایج</option>
            <option value="positive">مثبت</option>
            <option value="neutral">خنثی</option>
            <option value="negative">منفی</option>
            <option value="follow_up">نیازمند پیگیری</option>
          </select>
        </div>
      </div>

      <div className="ui-filter-actions">
        <button type="button" onClick={onClear} className="ui-filter-clear">
          پاک کردن فیلترها
        </button>
      </div>
    </section>
  );
}
