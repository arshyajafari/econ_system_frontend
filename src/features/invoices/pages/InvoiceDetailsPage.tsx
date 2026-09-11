import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../../api/client";
import { cancelInvoice, getInvoice, issueInvoice, updateInvoice } from "../services/invoicesApi";
import type { Invoice } from "../types/invoice";
import { invoiceStatusLabel } from "../types/invoice";

const nf = new Intl.NumberFormat("fa-IR");
const money = (v: number | string) => nf.format(Number(v || 0));

export function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) { setError("شناسه فاکتور نامعتبر است."); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setInvoice(await getInvoice(id)); } catch (e: unknown) { setError(e instanceof ApiError && e.message ? e.message : "خطا در دریافت فاکتور."); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function action(kind: "issue" | "cancel") {
    if (!invoice || busy) return;
    if (kind === "cancel" && !window.confirm(`آیا از لغو فاکتور «${invoice.code}» مطمئن هستید؟`)) return;
    setBusy(true); setError(null);
    try { setInvoice(kind === "issue" ? await issueInvoice(invoice.id) : await cancelInvoice(invoice.id)); }
    catch (e: unknown) { setError(e instanceof ApiError && e.message ? e.message : "عملیات فاکتور انجام نشد."); }
    finally { setBusy(false); }
  }

  async function editDraft() {
    if (!invoice || invoice.status !== "draft" || busy) return;
    const discount = window.prompt("تخفیف", String(invoice.discount_amount));
    if (discount === null) return;
    const tax = window.prompt("مالیات", String(invoice.tax_amount));
    if (tax === null) return;
    setBusy(true); setError(null);
    try { setInvoice(await updateInvoice(invoice.id, { discount_amount: Number(discount), tax_amount: Number(tax) })); }
    catch (e: unknown) { setError(e instanceof ApiError && e.message ? e.message : "ویرایش فاکتور انجام نشد."); }
    finally { setBusy(false); }
  }

  if (loading) return <section className="p-4 md:p-6"><div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">در حال دریافت فاکتور...</div></section>;
  if (!invoice) return <section className="space-y-4 p-4 md:p-6"><button type="button" onClick={() => navigate("/invoices")} className="rounded-lg border px-4 py-2 text-sm">بازگشت</button><div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error ?? "فاکتور پیدا نشد."}</div></section>;

  const confirmed = invoice.payments.filter((p) => p.status === "confirmed").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pending = invoice.payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const remaining = Math.max(0, Number(invoice.total_amount) - confirmed - pending);

  return <section className="space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><button type="button" onClick={() => navigate("/invoices")} className="mb-3 text-sm text-gray-500">← بازگشت به فاکتورها</button><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold text-gray-900">فاکتور {invoice.code}</h1><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">{invoiceStatusLabel(invoice.status)}</span></div></div><div className="flex gap-2">{invoice.status === "draft" ? <><button type="button" disabled={busy} onClick={() => void editDraft()} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">ویرایش مبلغ</button><button type="button" disabled={busy} onClick={() => void action("issue")} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50">صدور فاکتور</button><button type="button" disabled={busy} onClick={() => void action("cancel")} className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 disabled:opacity-50">لغو</button></> : null}</div></div>
    {error ? <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    <div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl border bg-white p-5"><div className="text-sm text-gray-500">مشتری</div><div className="mt-2 font-semibold">{invoice.customer?.name ?? "—"}</div><div className="mt-1 text-xs text-gray-500">{invoice.customer?.code ?? ""}</div></div><div className="rounded-xl border bg-white p-5"><div className="text-sm text-gray-500">سفارش</div><div className="mt-2 font-semibold">{invoice.order?.code ?? "—"}</div></div><div className="rounded-xl border bg-white p-5"><div className="text-sm text-gray-500">مانده</div><div dir="ltr" className="mt-2 font-bold">{money(remaining)}</div></div></div>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-[750px] w-full text-sm"><thead className="bg-gray-50 text-right text-gray-600"><tr><th className="px-5 py-3">محصول</th><th className="px-5 py-3">تعداد</th><th className="px-5 py-3">قیمت واحد</th><th className="px-5 py-3">مبلغ</th></tr></thead><tbody className="divide-y divide-gray-100">{invoice.items.map((item) => <tr key={item.id}><td className="px-5 py-4">{item.product?.title ?? "—"}</td><td className="px-5 py-4">{nf.format(item.quantity)}</td><td dir="ltr" className="px-5 py-4">{money(item.unit_price)}</td><td dir="ltr" className="px-5 py-4 font-medium">{money(item.total_price)}</td></tr>)}</tbody><tfoot><tr className="border-t"><td colSpan={3} className="px-5 py-4 text-left">جمع</td><td dir="ltr" className="px-5 py-4 font-bold">{money(invoice.total_amount)}</td></tr></tfoot></table></div>
    <div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border bg-white p-5"><h2 className="font-semibold">خلاصه مبلغ</h2><div className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><span>جمع اقلام</span><b>{money(invoice.subtotal)}</b></div><div className="flex justify-between"><span>تخفیف</span><b>{money(invoice.discount_amount)}</b></div><div className="flex justify-between"><span>مالیات</span><b>{money(invoice.tax_amount)}</b></div><div className="flex justify-between border-t pt-3"><span>مبلغ نهایی</span><b>{money(invoice.total_amount)}</b></div></div></div><div className="rounded-xl border bg-white p-5"><h2 className="font-semibold">پرداخت‌ها</h2><div className="mt-4 space-y-2 text-sm"><div>تأییدشده: <b>{money(confirmed)}</b></div><div>در انتظار: <b>{money(pending)}</b></div><div>مانده: <b>{money(remaining)}</b></div></div></div></div>
  </section>;
}
