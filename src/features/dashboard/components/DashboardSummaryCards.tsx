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
};

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5">
      <span className="block text-sm text-gray-500">{label}</span>

      <strong className="mt-2 block text-2xl font-bold text-gray-900">
        {value}
      </strong>
    </article>
  );
}

export function DashboardSummaryCards({
  dashboard,
}: DashboardSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SummaryCard
        label="فروش امروز"
        value={formatAmount(dashboard.sales.today)}
      />

      <SummaryCard
        label="فروش ماه"
        value={formatAmount(dashboard.sales.month)}
      />

      <SummaryCard
        label="سفارش امروز"
        value={formatNumber(dashboard.orders.today)}
      />

      <SummaryCard
        label="پرداخت امروز"
        value={formatAmount(dashboard.payments.today)}
      />

      <SummaryCard
        label="مطالبات"
        value={formatAmount(dashboard.receivables.total)}
      />

      <SummaryCard
        label="مرجوعی در انتظار"
        value={formatNumber(dashboard.returns.pending)}
      />

      <SummaryCard
        label="ارسال در انتظار"
        value={formatNumber(dashboard.deliveries.pending)}
      />

      <SummaryCard
        label="ویزیت امروز"
        value={formatNumber(dashboard.visits.today)}
      />

      <SummaryCard
        label="نمونه امروز"
        value={formatNumber(dashboard.samples.today)}
      />
    </div>
  );
}
