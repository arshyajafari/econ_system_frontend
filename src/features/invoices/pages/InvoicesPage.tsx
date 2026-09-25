import { useCallback, useEffect, useState } from "react";
import { Pagination } from "../../../components/Pagination";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../../api/client";
import { formatJalaliDate } from "../../../utils/date";
import { getCustomers } from "../../customers/services/customersApi";
import type { Customer } from "../../customers/types/customer";
import { getInvoices } from "../services/invoicesApi";
import { useAuth } from "../../auth";
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
  const { user } = useAuth();
  const canManageInvoices = user?.roles.includes("admin") || user?.roles.includes("accountant");
  const canCreateReturn = user?.roles.some((role) => ["admin", "accountant", "sales visitor", "delivery operator"].includes(role)) ?? false;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [settled, setSettled] = useState<"" | "true" | "false">("");
  const [customerId, setCustomerId] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCustomers() {
      try {
        const response = await getCustomers({ per_page: 100 });
        if (!cancelled) setCustomers(response.data);
      } catch {
        // Customer filtering is optional; invoice loading remains available.
      }
    }
    void loadCustomers();
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: InvoiceListParams = {
        search: search.trim() || undefined,
        status: status || undefined,
        settled: settled === "" ? undefined : settled === "true",
        customer_id: customerId || undefined,
        page,
        per_page: 20,
      };
      const response = await getInvoices(params);
      setInvoices(response.data);
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.message ? e.message : "خطا در دریافت فاکتورها.");
    } finally {
      setLoading(false);
    }
  }, [customerId, page, search, settled, status]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), search.trim() ? 300 : 0);
    return () => window.clearTimeout(id);
  }, [load, search]);

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">فاکتورها</h1><p className="mt-1 text-sm text-gray-500">مدیریت فاکتورهای صادرشده از سفارش‌ها</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">بروزرسانی</button>
          {canManageInvoices ? <button type="button" onClick={() => navigate("/invoices/new")} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">ثبت فاکتور</button> : null}
        </div>
      </div>

      {error ? <div role="alert" className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void load()} className="rounded border border-red-200 px-3 py-1.5">تلاش مجدد</button></div> : null}

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-4">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="جستجو بر اساس کد یا توضیحات" className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500" />
        <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">همه مشتریان</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customer_name}{customer.code ? ` — ${customer.code}` : ""}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value as InvoiceStatus | ""); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">همه وضعیت‌ها</option><option value="draft">پیش‌نویس</option><option value="issued">صادر شده</option><option value="cancelled">لغو شده</option>
        </select>
        <select value={settled} onChange={(e) => { setSettled(e.target.value as "" | "true" | "false"); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">همه وضعیت تسویه</option><option value="false">تسویه نشده</option><option value="true">تسویه شده</option>
        </select>
      </div>

      <div className="text-sm text-gray-500">{nf.format(total)} فاکتور</div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-gray-50 text-right text-gray-600"><tr><th className="px-5 py-3 font-medium">کد فاکتور</th><th className="px-5 py-3 font-medium">مشتری</th><th className="px-5 py-3 font-medium">سفارش</th><th className="px-5 py-3 font-medium">وضعیت</th><th className="px-5 py-3 font-medium">تسویه</th><th className="px-5 py-3 font-medium">مبلغ نهایی</th><th className="px-5 py-3 font-medium">سررسید</th><th /></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-500">در حال دریافت فاکتورها...</td></tr> : null}
            {!loading && invoices.length === 0 ? <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-500">فاکتوری پیدا نشد.</td></tr> : null}
            {!loading ? invoices.map((invoice) => <tr key={invoice.id} className="hover:bg-gray-50"><td className="px-5 py-4 font-medium text-gray-900">{invoice.code}</td><td className="px-5 py-4">{invoice.customer?.name ?? "—"}</td><td className="px-5 py-4">{invoice.order?.code ?? "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(invoice.status)}`}>{invoiceStatusLabel(invoice.status)}</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${invoice.is_settled ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{invoice.is_settled ? "تسویه شده" : "تسویه نشده"}</span></td><td dir="ltr" className="px-5 py-4 font-medium">{money(invoice.total_amount)}</td><td className="px-5 py-4">{formatJalaliDate(invoice.due_date)}</td><td className="px-5 py-4 text-left"><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => navigate(`/invoices/${invoice.id}`)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50">مشاهده</button>{canCreateReturn && invoice.status === "issued" && invoice.order?.status === "completed" && invoice.order?.id ? <button type="button" onClick={() => navigate(`/order-returns/new?order_id=${encodeURIComponent(invoice.order!.id)}`)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">ثبت مرجوعی</button> : null}</div></td></tr>) : null}
          </tbody>
        </table>
      </div>

      {<Pagination page={page} lastPage={lastPage} isLoading={loading} total={total} onPageChange={setPage} />}
    </section>
  );
}
