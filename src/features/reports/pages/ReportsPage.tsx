import { useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import { getReport } from "../services/reportApi";
import type { ReportData } from "../types/report";

const money = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ReportsPage() {
  const today = getLocalDateString();
  const monthStart = `${today.slice(0, 8)}01`;
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReport(start: string, end: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await getReport(start, end);
      setReport(response);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در دریافت گزارش.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReport(monthStart, today);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [monthStart, today]);

  return <section className="space-y-6 p-4 md:p-6">
    <header><h1 className="text-2xl font-bold">گزارش‌ها</h1><p className="text-sm text-gray-500">گزارش فروش، پرداخت، سفارش و مرجوعی در بازه انتخابی</p></header>
    <form onSubmit={(e) => { e.preventDefault(); if (from <= to) void loadReport(from, to); else setError("تاریخ شروع باید قبل از تاریخ پایان باشد."); }} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3"><label className="text-sm">از تاریخ<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label><label className="text-sm">تا تاریخ<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label><button disabled={loading || !from || !to} className="self-end rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50">{loading ? "در حال دریافت..." : "نمایش گزارش"}</button></form>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {loading && !report ? <div className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">در حال دریافت گزارش...</div> : report ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[["فروش نهایی", money(report.sales.total), true],["تعداد فاکتور", money(report.sales.invoice_count), false],["دریافت تأییدشده", money(report.payments.total), true],["سفارش‌ها", money(report.orders.total), false],["مبلغ مرجوعی", money(report.returns.amount), true]].map(([label, value, unit]) => <div key={label as string} className="rounded-xl border bg-white p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-2 text-xl font-bold">{value}</div>{unit ? <div className="mt-1 text-xs text-gray-400">تومان</div> : null}</div>)}</div>
      <div className="grid gap-6 xl:grid-cols-2"><div className="rounded-xl border bg-white p-4"><h2 className="mb-4 font-semibold">خلاصه مالی</h2><dl className="space-y-3 text-sm">{[["جمع قبل از تخفیف", report.sales.subtotal],["تخفیف", report.sales.discount],["مالیات", report.sales.tax],["فروش نهایی", report.sales.total],["کل مطالبات", report.receivables.total]].map(([label, value]) => <div key={label as string} className="flex justify-between border-b pb-2"><dt>{label}</dt><dd className="font-medium">{money(value as number)} تومان</dd></div>)}</dl></div>
      <div className="rounded-xl border bg-white p-4"><h2 className="mb-4 font-semibold">پرفروش‌ترین محصولات</h2>{report.top_products.length === 0 ? <p className="text-sm text-gray-500">داده‌ای وجود ندارد.</p> : <div className="divide-y">{report.top_products.map((product, index) => <div key={product.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><span className="ml-2 text-gray-400">{index + 1}</span><span className="font-medium">{product.title}</span><span className="mr-2 text-xs text-gray-400">{product.code}</span></div><div className="text-left"><div>{money(product.total_amount)} تومان</div><div className="text-xs text-gray-400">{money(product.quantity)} عدد</div></div></div>)}</div>}</div></div>
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">بازه گزارش: <strong>{report.period.from}</strong> تا <strong>{report.period.to}</strong> · {money(report.orders.completed)} سفارش تکمیل‌شده · {money(report.returns.count)} مرجوعی تأییدشده · {money(report.payments.count)} پرداخت تأییدشده</div>
    </> : null}
  </section>;
}
