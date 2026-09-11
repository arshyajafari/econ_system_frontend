import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../../api/client";
import { getInvoices } from "../services/invoicesApi";
import type { Invoice, InvoiceListParams, InvoiceStatus } from "../types/invoice";
import { invoiceStatusLabel } from "../types/invoice";

const nf = new Intl.NumberFormat("fa-IR");
const money = (v: number | string) => nf.format(Number(v || 0));

function statusClass(status: InvoiceStatus): string {
  if (status === "issued") return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: InvoiceListParams = { search: search.trim() || undefined, status: status || undefined, page, per_page: 20 };
      const response = await getInvoices(params);
      setInvoices(response.data);
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.message ? e.message : "خطا در دریافت فاکتورها.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), search.trim() ? 300 : 0);
    return () => window.clearTimeout(id);
  }, [load, search]);

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">فاکتورها</h1><p className="mt-1 text-sm text-gray-500">مدیریت فاکتورهای صادرشده از سفارش‌ها</p></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">بروزرسانی</button>
      </div>

      {error ? <div role="alert" className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void load()} className="rounded border border-red-200 px-3 py-1.5">تلاش مجدد</button></div> : null}

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 md:flex-row">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="جستجو بر اساس کد یا توضیحات" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500" />
        <select value={status} onChange={(e) => { setStatus(e.target.value as InvoiceStatus | ""); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">همه وضعیت‌ها</option><option value="draft">پیش‌نویس</option><option value="issued">صادر شده</option><option value="cancelled">لغو شده</option>
        </select>
      </div>

      <div className="text-sm text-gray-500">{nf.format(total)} فاکتور</div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[850px] w-full text-sm">
          <thead className="bg-gray-50 text-right text-gray-600"><tr><th className="px-5 py-3 font-medium">کد فاکتور</th><th className="px-5 py-3 font-medium">مشتری</th><th className="px-5 py-3 font-medium">سفارش</th><th className="px-5 py-3 font-medium">وضعیت</th><th className="px-5 py-3 font-medium">مبلغ نهایی</th><th className="px-5 py-3 font-medium">سررسید</th><th /></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">در حال دریافت فاکتورها...</td></tr> : null}
            {!loading && invoices.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">فاکتوری پیدا نشد.</td></tr> : null}
            {!loading ? invoices.map((invoice) => <tr key={invoice.id} className="hover:bg-gray-50"><td className="px-5 py-4 font-medium text-gray-900">{invoice.code}</td><td className="px-5 py-4">{invoice.customer?.name ?? "—"}</td><td className="px-5 py-4">{invoice.order?.code ?? "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(invoice.status)}`}>{invoiceStatusLabel(invoice.status)}</span></td><td dir="ltr" className="px-5 py-4 font-medium">{money(invoice.total_amount)}</td><td className="px-5 py-4">{invoice.due_date ?? "—"}</td><td className="px-5 py-4 text-left"><button type="button" onClick={() => navigate(`/invoices/${invoice.id}`)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50">مشاهده</button></td></tr>) : null}
          </tbody>
        </table>
      </div>

      {lastPage > 1 ? <div className="flex items-center justify-center gap-3"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((v) => Math.max(1, v - 1))} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50">قبلی</button><span className="text-sm text-gray-600">صفحه {nf.format(page)} از {nf.format(lastPage)}</span><button type="button" disabled={page >= lastPage || loading} onClick={() => setPage((v) => Math.min(lastPage, v + 1))} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50">بعدی</button></div> : null}
    </section>
  );
}
