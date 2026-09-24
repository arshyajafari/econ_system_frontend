import { useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import { formatJalaliDate } from "../../../utils/date";
import { getReport } from "../services/reportApi";
import type { ReportData } from "../types/report";

const money = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(Number.isFinite(value) ? value : 0);

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ReportCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-2 text-xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-xs text-gray-400">{unit}</div>
    </div>
  );
}

export function ReportsPage() {
  const today = getLocalDateString();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReport(start: string, end: string) {
    setLoading(true);
    setError(null);
    try {
      setReport(await getReport(start, end));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در دریافت گزارش.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadReport(monthStart, today),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [monthStart, today]);

  return (
    <section className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">گزارش‌ها</h1>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (from <= to) void loadReport(from, to);
          else setError("تاریخ شروع باید قبل از تاریخ پایان باشد.");
        }}
        className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3"
      >
        <label className="text-sm">
          از تاریخ
          <JalaliDateInput
            value={from}
            onChange={setFrom}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          تا تاریخ
          <JalaliDateInput
            value={to}
            onChange={setTo}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <button
          disabled={loading || !from || !to}
          className="self-end rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "در حال دریافت..." : "نمایش گزارش"}
        </button>
      </form>

      {error ? (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {loading && !report ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">
          در حال دریافت گزارش...
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportCard
              label="فروش نهایی"
              value={money(report.sales.total)}
              unit="تومان · فاکتورهای صادرشده"
            />
            <ReportCard
              label="تعداد فاکتور"
              value={money(report.sales.invoice_count)}
              unit="فاکتور صادرشده"
            />
            <ReportCard
              label="مبلغ واریزی مشتریان"
              value={money(report.payments.recorded_total)}
              unit={money(report.payments.recorded_count) + " پرداخت ثبت‌شده"}
            />
            <ReportCard
              label="در انتظار تأیید"
              value={money(report.payments.pending_total)}
              unit={
                money(report.payments.pending_count) + " پرداخت در انتظار تأیید"
              }
            />
            <ReportCard
              label="سفارش‌ها"
              value={money(report.orders.total)}
              unit={money(report.orders.completed) + " تکمیل‌شده"}
            />
            <ReportCard
              label="مرجوعی تکمیل‌شده"
              value={money(report.returns.amount)}
              unit={money(report.returns.count) + " مرجوعی · اعتبار ثبت‌شده"}
            />
            <ReportCard
              label="مانده حساب مشتریان"
              value={money(report.receivables.total)}
              unit="تومان · مانده جاری"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <h2 className="mb-4 font-semibold">خلاصه مالی</h2>
              <dl className="space-y-3 text-sm">
                {[
                  ["جمع قبل از تخفیف", report.sales.subtotal],
                  ["تخفیف", report.sales.discount],
                  ["مالیات", report.sales.tax],
                  ["فروش نهایی", report.sales.total],
                  ["مبلغ واریزی مشتریان", report.payments.recorded_total],
                  ["پرداختی تأییدشده", report.payments.total],
                  ["پرداخت‌های در انتظار تأیید", report.payments.pending_total],
                  ["بدهکار مشتریان", report.receivables.debit],
                  ["بستانکار / اعتبار مشتریان", report.receivables.credit],
                  ["مانده حساب مشتریان", report.receivables.total],
                ].map(([label, value]) => (
                  <div
                    key={label as string}
                    className="flex justify-between border-b pb-2"
                  >
                    <dt>{label}</dt>
                    <dd className="font-medium">
                      {money(value as number)} تومان
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <h2 className="mb-4 font-semibold">پرفروش‌ترین محصولات</h2>
              {report.top_products.length === 0 ? (
                <p className="text-sm text-gray-500">داده‌ای وجود ندارد.</p>
              ) : (
                <div className="divide-y">
                  {report.top_products.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <div>
                        <span className="ml-2 text-gray-400">{index + 1}</span>
                        <span className="font-medium">{product.title}</span>
                        <span className="mr-2 text-xs text-gray-400">
                          {product.code}
                        </span>
                      </div>
                      <div className="text-left">
                        <div>{money(product.total_amount)} تومان</div>
                        <div className="text-xs text-gray-400">
                          {money(product.quantity)} عدد
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
            بازه گزارش: <strong>{formatJalaliDate(report.period.from)}</strong>{" "}
            تا <strong>{formatJalaliDate(report.period.to)}</strong>
            {" · "}
            {money(report.orders.completed)} سفارش تکمیل‌شده
            {" · "}
            {money(report.returns.count)} مرجوعی
            {" · "}
            {money(report.payments.recorded_count)} پرداخت ثبت‌شده
            {" · "}
            {money(report.payments.count)} پرداخت تأییدشده
            {" · "}
            {money(report.payments.pending_count)} در انتظار تأیید
          </div>
        </>
      ) : null}
    </section>
  );
}
