import type { ComponentProps } from "react";
import { StatusBadge } from "../../../design-system/components/StatusBadge";
import { Button } from "../../../design-system/components/Button";
import type { DailyActivityReport, ActivityResult } from "../services/dailyActivityReportsApi";

type BadgeVariant = ComponentProps<typeof StatusBadge>["variant"];

type DailyActivityReportDetailsModalProps = {
  report: DailyActivityReport | null;
  loading: boolean;
  dateLabel: (value: string) => string;
  resultLabel: (result: ActivityResult) => string;
  resultVariant: (result: ActivityResult) => BadgeVariant;
  onClose: () => void;
};

export function DailyActivityReportDetailsModal({
  report, loading, dateLabel, resultLabel, resultVariant, onClose,
}: DailyActivityReportDetailsModalProps) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 md:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="daily-report-detail-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl md:p-7">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 id="daily-report-detail-title" className="text-lg font-bold text-slate-900">جزئیات گزارش فعالیت</h2>
            <p className="mt-1 text-sm text-slate-500">{report.organization_name} · {dateLabel(report.visit_date)}</p>
          </div>
          <Button variant="secondary" size="md" type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600">بستن</Button>
        </div>
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">در حال دریافت جزئیات...</p>
        ) : (
          <div className="mt-5 space-y-4 text-sm">
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><span className="text-xs text-slate-500">کارمند</span><p className="mt-1 font-semibold text-slate-800">{report.employee.name}</p></div>
              <div><span className="text-xs text-slate-500">مخاطب</span><p className="mt-1 font-semibold text-slate-800">{report.contact_name || "—"}</p></div>
              <div><span className="text-xs text-slate-500">نوع ارتباط</span><p className="mt-1 font-semibold text-slate-800">{report.contact_type === "phone" ? "تلفنی" : "حضوری"}</p></div>
              <div><span className="text-xs text-slate-500">ساعت</span><p className="mt-1 font-semibold text-slate-800">{report.visit_time || "ثبت نشده"}</p></div>
              <div><span className="text-xs text-slate-500">نتیجه</span><p className="mt-1"><StatusBadge variant={resultVariant(report.result)}>{resultLabel(report.result)}</StatusBadge></p></div>
              <div><span className="text-xs text-slate-500">تاریخ مراجعه</span><p className="mt-1 font-semibold text-slate-800">{dateLabel(report.visit_date)}</p></div>
            </div>
            {([
              ["هدف از مراجعه", report.purpose],
              ["شرح مذاکرات", report.discussion],
              ["سؤال یا موضوع مطرح‌شده توسط کارمند", report.employee_question],
              ["بازخورد مخاطب", report.audience_feedback],
              ["نتیجه و جمع‌بندی", report.outcome],
            ] as Array<[string, string | null | undefined]>).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 p-4">
                <h3 className="mb-2 font-bold text-slate-800">{label}</h3>
                <p className="whitespace-pre-wrap leading-7 text-slate-600">{value?.trim() || "موردی ثبت نشده است."}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
