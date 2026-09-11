import type { ReactNode } from "react";
import type {
  DashboardRecent,
  DashboardRecentOrder,
  DashboardRecentPayment,
  DashboardRecentReturn,
  DashboardRecentVisit,
} from "../types/dashboard";

type DashboardRecentSectionProps = { recent: DashboardRecent };

type RecentPanelProps = { title: string; children: ReactNode; wide?: boolean };

function RecentPanel({ title, children, wide = false }: RecentPanelProps) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03] ${wide ? "lg:col-span-2" : ""}`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="m-0 text-base font-bold text-slate-800">{title}</h2>
        <span className="text-xs text-slate-400">آخرین موارد</span>
      </div>
      {children}
    </section>
  );
}

function RecentEmpty({ children }: { children: ReactNode }) {
  return <p className="m-0 px-5 py-8 text-center text-sm text-slate-400">{children}</p>;
}

function RecentList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-slate-100">{children}</div>;
}

function RecentListItem({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/70">{children}</div>;
}

function RecentItemContent({ title, subtitle }: { title: ReactNode; subtitle: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">•</div>
      <div className="min-w-0">
        <strong className="block truncate text-sm font-semibold text-slate-800">{title}</strong>
        <span className="mt-1 block truncate text-xs text-slate-400">{subtitle}</span>
      </div>
    </div>
  );
}

function RecentStatus({ children }: { children: ReactNode }) {
  return <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{children}</span>;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(value);
}

function OrderItem({ order }: { order: DashboardRecentOrder }) {
  return <RecentListItem><RecentItemContent title={order.code} subtitle={formatDate(order.created_at)} /><RecentStatus>{order.status ?? "—"}</RecentStatus></RecentListItem>;
}

function PaymentItem({ payment }: { payment: DashboardRecentPayment }) {
  return <RecentListItem><RecentItemContent title={payment.customer?.name ?? "مشتری نامشخص"} subtitle={payment.reference_number ?? "بدون شماره مرجع"} /><div className="shrink-0 text-left"><strong className="block text-sm font-bold text-slate-800">{formatAmount(payment.amount)}</strong><span className="mt-1 block text-xs text-slate-400">{payment.status ?? "—"}</span></div></RecentListItem>;
}

function ReturnItem({ item }: { item: DashboardRecentReturn }) {
  return <RecentListItem><RecentItemContent title={item.code} subtitle={formatDate(item.created_at)} /><RecentStatus>{item.status ?? "—"}</RecentStatus></RecentListItem>;
}

function VisitItem({ visit }: { visit: DashboardRecentVisit }) {
  return <RecentListItem><RecentItemContent title={visit.doctor?.name ?? "پزشک نامشخص"} subtitle={formatDate(visit.visit_date)} /><RecentStatus>{visit.status ?? "—"}</RecentStatus></RecentListItem>;
}

export function DashboardRecentSection({ recent }: DashboardRecentSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <RecentPanel title="آخرین سفارش‌ها">
        {recent.orders.length === 0 ? <RecentEmpty>سفارشی ثبت نشده است.</RecentEmpty> : <RecentList>{recent.orders.map((order) => <OrderItem key={order.id} order={order} />)}</RecentList>}
      </RecentPanel>
      <RecentPanel title="آخرین پرداخت‌ها">
        {recent.payments.length === 0 ? <RecentEmpty>پرداختی ثبت نشده است.</RecentEmpty> : <RecentList>{recent.payments.map((payment) => <PaymentItem key={payment.id} payment={payment} />)}</RecentList>}
      </RecentPanel>
      <RecentPanel title="آخرین مرجوعی‌ها">
        {recent.returns.length === 0 ? <RecentEmpty>مرجوعی ثبت نشده است.</RecentEmpty> : <RecentList>{recent.returns.map((item) => <ReturnItem key={item.id} item={item} />)}</RecentList>}
      </RecentPanel>
      <RecentPanel title="آخرین ویزیت‌ها">
        {recent.visits.length === 0 ? <RecentEmpty>ویزیتی ثبت نشده است.</RecentEmpty> : <RecentList>{recent.visits.map((visit) => <VisitItem key={visit.id} visit={visit} />)}</RecentList>}
      </RecentPanel>
    </div>
  );
}
