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

export function DashboardSummaryCards({
  dashboard,
}: DashboardSummaryCardsProps) {
  return (
    <div className="dashboard-summary-grid">
      <article className="dashboard-card">
        <span className="dashboard-card__label">فروش امروز</span>

        <strong className="dashboard-card__value">
          {formatAmount(dashboard.sales.today)}
        </strong>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-card__label">فروش ماه</span>

        <strong className="dashboard-card__value">
          {formatAmount(dashboard.sales.month)}
        </strong>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-card__label">سفارش امروز</span>

        <strong className="dashboard-card__value">
          {formatNumber(dashboard.orders.today)}
        </strong>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-card__label">پرداخت امروز</span>

        <strong className="dashboard-card__value">
          {formatAmount(dashboard.payments.today)}
        </strong>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-card__label">مطالبات</span>

        <strong className="dashboard-card__value">
          {formatAmount(dashboard.receivables.total)}
        </strong>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-card__label">مرجوعی در انتظار</span>

        <strong className="dashboard-card__value">
          {formatNumber(dashboard.returns.pending)}
        </strong>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-card__label">ارسال در انتظار</span>

        <strong className="dashboard-card__value">
          {formatNumber(dashboard.deliveries.pending)}
        </strong>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-card__label">ویزیت امروز</span>

        <strong className="dashboard-card__value">
          {formatNumber(dashboard.visits.today)}
        </strong>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-card__label">نمونه امروز</span>

        <strong className="dashboard-card__value">
          {formatNumber(dashboard.samples.today)}
        </strong>
      </article>
    </div>
  );
}
