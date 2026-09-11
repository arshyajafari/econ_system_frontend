import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../../api/client";
import { getOrders } from "../../orders/services/ordersApi";
import { createInvoiceFromOrder } from "../services/invoicesApi";
import type { Order } from "../../orders/types/order";

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await getOrders({ status: "completed", per_page: 500, page: 1 });
      setOrders(response.data);
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.message ? e.message : "خطا در دریافت سفارش‌های تکمیل‌شده.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function submit() {
    if (!orderId || busy) return;
    setBusy(true); setError(null);
    try {
      const invoice = await createInvoiceFromOrder(orderId);
      navigate(`/invoices/${invoice.id}`);
    } catch (e: unknown) {
      setError(e instanceof ApiError && e.message ? e.message : "ایجاد فاکتور انجام نشد.");
    } finally { setBusy(false); }
  }

  return <section className="space-y-6 p-4 md:p-6">
    <div><button type="button" onClick={() => navigate("/invoices")} className="mb-3 text-sm text-gray-500">← بازگشت به فاکتورها</button><h1 className="text-2xl font-bold text-gray-900">ثبت فاکتور</h1><p className="mt-1 text-sm text-gray-500">فاکتور از روی یک سفارش تکمیل‌شده ساخته می‌شود.</p></div>
    {error ? <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
      {loading ? <div className="text-sm text-gray-500">در حال دریافت سفارش‌ها...</div> : <>
        <label className="block text-sm font-medium text-gray-700">سفارش تکمیل‌شده</label>
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
          <option value="">انتخاب سفارش</option>
          {orders.map((order) => <option key={order.id} value={order.id}>{order.code} — {order.customer?.customer_name ?? "بدون مشتری"}</option>)}
        </select>
        {orders.length === 0 ? <p className="mt-3 text-sm text-gray-500">سفارش تکمیل‌شده‌ای برای صدور فاکتور پیدا نشد.</p> : null}
        <div className="mt-5 flex gap-2"><button type="button" onClick={() => void submit()} disabled={!orderId || busy} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "در حال ایجاد..." : "ایجاد فاکتور"}</button><button type="button" onClick={() => navigate("/invoices")} disabled={busy} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm disabled:opacity-50">انصراف</button></div>
      </>}
    </div>
  </section>;
}
