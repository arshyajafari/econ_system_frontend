import type { DashboardRecent } from "../types/dashboard";

type DashboardRecentSectionProps = {
  recent: DashboardRecent;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function DashboardRecentSection({
  recent,
}: DashboardRecentSectionProps) {
  return (
    <div className="dashboard-recent-grid">
      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>آخرین سفارش‌ها</h2>
        </div>

        {recent.orders.length === 0 ? (
          <p className="dashboard-empty">سفارشی ثبت نشده است.</p>
        ) : (
          <div className="dashboard-list">
            {recent.orders.map((order) => (
              <div className="dashboard-list__item" key={order.id}>
                <div>
                  <strong>{order.code}</strong>
                  <span>{formatDate(order.created_at)}</span>
                </div>

                <span className="dashboard-badge">{order.status ?? "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>آخرین پرداخت‌ها</h2>
        </div>

        {recent.payments.length === 0 ? (
          <p className="dashboard-empty">پرداختی ثبت نشده است.</p>
        ) : (
          <div className="dashboard-list">
            {recent.payments.map((payment) => (
              <div className="dashboard-list__item" key={payment.id}>
                <div>
                  <strong>{payment.customer?.name ?? "مشتری نامشخص"}</strong>

                  <span>{payment.reference_number ?? "بدون شماره مرجع"}</span>
                </div>

                <div className="dashboard-list__meta">
                  <strong>{formatAmount(payment.amount)}</strong>

                  <span>{payment.status ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>آخرین مرجوعی‌ها</h2>
        </div>

        {recent.returns.length === 0 ? (
          <p className="dashboard-empty">مرجوعی ثبت نشده است.</p>
        ) : (
          <div className="dashboard-list">
            {recent.returns.map((item) => (
              <div className="dashboard-list__item" key={item.id}>
                <div>
                  <strong>{item.code}</strong>
                  <span>{formatDate(item.created_at)}</span>
                </div>

                <span className="dashboard-badge">{item.status ?? "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>آخرین ویزیت‌ها</h2>
        </div>

        {recent.visits.length === 0 ? (
          <p className="dashboard-empty">ویزیتی ثبت نشده است.</p>
        ) : (
          <div className="dashboard-list">
            {recent.visits.map((visit) => (
              <div className="dashboard-list__item" key={visit.id}>
                <div>
                  <strong>{visit.doctor?.name ?? "پزشک نامشخص"}</strong>

                  <span>{formatDate(visit.visit_date)}</span>
                </div>

                <span className="dashboard-badge">{visit.status ?? "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
