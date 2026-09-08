import type { ReactNode } from "react";

import type {
  DashboardRecent,
  DashboardRecentOrder,
  DashboardRecentPayment,
  DashboardRecentReturn,
  DashboardRecentVisit,
} from "../types/dashboard";

type DashboardRecentSectionProps = {
  recent: DashboardRecent;
};

type RecentPanelProps = {
  title: string;
  children: ReactNode;
};

function RecentPanel({ title, children }: RecentPanelProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="m-0 text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      {children}
    </section>
  );
}

function RecentEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 px-5 py-6 text-center text-sm text-gray-500">
      {children}
    </p>
  );
}

function RecentList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

function RecentListItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0">
      {children}
    </div>
  );
}

function RecentItemContent({
  title,
  subtitle,
}: {
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <strong className="block truncate text-sm font-medium text-gray-900">
        {title}
      </strong>

      <span className="mt-1 block truncate text-xs text-gray-500">
        {subtitle}
      </span>
    </div>
  );
}

function RecentStatus({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

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

function OrderItem({ order }: { order: DashboardRecentOrder }) {
  return (
    <RecentListItem>
      <RecentItemContent
        title={order.code}
        subtitle={formatDate(order.created_at)}
      />

      <RecentStatus>{order.status ?? "—"}</RecentStatus>
    </RecentListItem>
  );
}

function PaymentItem({ payment }: { payment: DashboardRecentPayment }) {
  return (
    <RecentListItem>
      <RecentItemContent
        title={payment.customer?.name ?? "مشتری نامشخص"}
        subtitle={payment.reference_number ?? "بدون شماره مرجع"}
      />

      <div className="shrink-0 text-left">
        <strong className="block text-sm font-semibold text-gray-900">
          {formatAmount(payment.amount)}
        </strong>

        <span className="mt-1 block text-xs text-gray-500">
          {payment.status ?? "—"}
        </span>
      </div>
    </RecentListItem>
  );
}

function ReturnItem({ item }: { item: DashboardRecentReturn }) {
  return (
    <RecentListItem>
      <RecentItemContent
        title={item.code}
        subtitle={formatDate(item.created_at)}
      />

      <RecentStatus>{item.status ?? "—"}</RecentStatus>
    </RecentListItem>
  );
}

function VisitItem({ visit }: { visit: DashboardRecentVisit }) {
  return (
    <RecentListItem>
      <RecentItemContent
        title={visit.doctor?.name ?? "پزشک نامشخص"}
        subtitle={formatDate(visit.visit_date)}
      />

      <RecentStatus>{visit.status ?? "—"}</RecentStatus>
    </RecentListItem>
  );
}

export function DashboardRecentSection({
  recent,
}: DashboardRecentSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <RecentPanel title="آخرین سفارش‌ها">
        {recent.orders.length === 0 ? (
          <RecentEmpty>سفارشی ثبت نشده است.</RecentEmpty>
        ) : (
          <RecentList>
            {recent.orders.map((order) => (
              <OrderItem key={order.id} order={order} />
            ))}
          </RecentList>
        )}
      </RecentPanel>

      <RecentPanel title="آخرین پرداخت‌ها">
        {recent.payments.length === 0 ? (
          <RecentEmpty>پرداختی ثبت نشده است.</RecentEmpty>
        ) : (
          <RecentList>
            {recent.payments.map((payment) => (
              <PaymentItem key={payment.id} payment={payment} />
            ))}
          </RecentList>
        )}
      </RecentPanel>

      <RecentPanel title="آخرین مرجوعی‌ها">
        {recent.returns.length === 0 ? (
          <RecentEmpty>مرجوعی ثبت نشده است.</RecentEmpty>
        ) : (
          <RecentList>
            {recent.returns.map((item) => (
              <ReturnItem key={item.id} item={item} />
            ))}
          </RecentList>
        )}
      </RecentPanel>

      <RecentPanel title="آخرین ویزیت‌ها">
        {recent.visits.length === 0 ? (
          <RecentEmpty>ویزیتی ثبت نشده است.</RecentEmpty>
        ) : (
          <RecentList>
            {recent.visits.map((visit) => (
              <VisitItem key={visit.id} visit={visit} />
            ))}
          </RecentList>
        )}
      </RecentPanel>
    </div>
  );
}
