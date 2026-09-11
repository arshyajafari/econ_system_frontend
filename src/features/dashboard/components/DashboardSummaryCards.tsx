import type { DashboardData } from "../types/dashboard";

type DashboardSummaryCardsProps = {
  dashboard: DashboardData;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 2,
  }).format(value);
}

type SummaryCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "blue" | "green" | "orange" | "red" | "slate";
};

const toneClasses = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  orange: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
};

function SummaryCard({
  label,
  value,
  hint,
  tone = "blue",
}: SummaryCardProps) {
  return (
    <article className="dashboard-card group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${toneClasses[tone]}`}>
          {tone === "green" ? "✓" : tone === "red" ? "!" : tone === "orange" ? "◷" : "↗"}
        </span>
      </div>
      <strong className="mt-4 block text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </strong>
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </article>
  );
}

export function DashboardSummaryCards({ dashboard }: DashboardSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        label="فروش امروز"
        value={formatAmount(dashboard.sales.today)}
        hint="تومان"
        tone="blue"
      />
      <SummaryCard
        label="فروش ماه"
        value={formatAmount(dashboard.sales.month)}
        hint="تومان"
        tone="green"
      />
      <SummaryCard
        label="سفارش امروز"
        value={formatNumber(dashboard.orders.today)}
        hint="سفارش"
        tone="blue"
      />
      <SummaryCard
        label="مطالبات"
        value={formatAmount(dashboard.receivables.total)}
        hint="تومان"
        tone="orange"
      />
      <SummaryCard
        label="موجودی قابل فروش"
        value={formatNumber(dashboard.inventory.available_quantity)}
        hint={`${formatNumber(dashboard.inventory.batches)} بچ موجود`}
        tone="green"
      />

      <div className="sm:col-span-2 xl:col-span-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <h2 className="text-xs font-bold tracking-wide text-slate-400">شاخص‌های عملیاتی</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-5">
          <SummaryCard label="پرداخت امروز" value={formatAmount(dashboard.payments.today)} hint="تومان" tone="green" />
          <SummaryCard label="مرجوعی در انتظار" value={formatNumber(dashboard.returns.pending)} tone="orange" />
          <SummaryCard label="ارسال در انتظار" value={formatNumber(dashboard.deliveries.pending)} tone="orange" />
          <SummaryCard label="ویزیت امروز" value={formatNumber(dashboard.visits.today)} tone="blue" />
          <SummaryCard label="نمونه امروز" value={formatNumber(dashboard.samples.today)} tone="blue" />
          <SummaryCard label="موجودی کل" value={formatNumber(dashboard.inventory.quantity)} tone="slate" />
          <SummaryCard label="موجودی رزرو شده" value={formatNumber(dashboard.inventory.reserved_quantity)} tone="slate" />
          <SummaryCard label="بچ‌های منقضی" value={formatNumber(dashboard.inventory.expired_batches)} tone="red" />
          <SummaryCard label="نزدیک انقضا" value={formatNumber(dashboard.inventory.near_expire_batches)} tone="orange" />
        </div>
      </div>
    </div>
  );
}
