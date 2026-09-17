import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../../api/client";
import { FormattedNumberInput } from "../../../components/FormattedNumberInput";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import { getCustomers } from "../../customers/services/customersApi";
import type { Customer } from "../../customers/types/customer";
import { getPayments, getPaymentInvoices } from "../services/paymentsApi";
import { PAYMENT_METHOD_OPTIONS } from "../types/payment";
import type { Payment, PaymentFormData, PaymentInvoiceOption, PaymentMethod } from "../types/payment";

type PaymentFormProps = { payment: Payment | null; invoices: PaymentInvoiceOption[]; isSubmitting: boolean; error: string | null; onSubmit: (data: PaymentFormData) => void; onCancel: () => void };
const numberFormatter = new Intl.NumberFormat("fa-IR");

export function PaymentForm({ payment, isSubmitting, error, onSubmit, onCancel }: PaymentFormProps) {
  const [invoiceId, setInvoiceId] = useState(payment?.invoice?.id ?? "");
  const [customerId, setCustomerId] = useState(payment?.customer?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>(payment?.method ?? "cash");
  const [amount, setAmount] = useState(payment ? String(payment.amount) : "");
  const [referenceNumber, setReferenceNumber] = useState(payment?.reference_number ?? "");
  const [paymentDate, setPaymentDate] = useState(payment?.payment_date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(payment?.description ?? "");
  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<PaymentInvoiceOption[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const selectedInvoice = useMemo(() => availableInvoices.find((invoice) => invoice.id === invoiceId) ?? null, [invoiceId, availableInvoices]);

  useEffect(() => {
    let cancelled = false;
    async function loadCustomers() {
      setIsLoadingCustomers(true);
      try {
        const response = await getCustomers({ per_page: 100 });
        if (!cancelled) setCustomers(response.data);
      } catch (requestError: unknown) {
        if (!cancelled) setInvoiceError(requestError instanceof ApiError && requestError.message ? requestError.message : "خطا در دریافت مشتریان.");
      } finally {
        if (!cancelled) setIsLoadingCustomers(false);
      }
    }
    void loadCustomers();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInvoices() {
      setIsLoadingInvoices(true);
      setInvoiceError(null);
      try {
        const response = await getPaymentInvoices({ customer_id: customerId || undefined, settled: false });
        if (!cancelled) {
          setAvailableInvoices(response);
          if (invoiceId && !response.some((invoice) => invoice.id === invoiceId) && !payment) setInvoiceId("");
        }
      } catch (requestError: unknown) {
        if (!cancelled) setInvoiceError(requestError instanceof ApiError && requestError.message ? requestError.message : "خطا در دریافت فاکتورهای قابل پرداخت.");
      } finally {
        if (!cancelled) setIsLoadingInvoices(false);
      }
    }
    void loadInvoices();
    return () => { cancelled = true; };
  }, [customerId, invoiceId, payment]);

  useEffect(() => {
    let cancelled = false;
    if (!invoiceId) {
      setInvoicePayments([]);
      setIsLoadingBalance(false);
      return () => { cancelled = true; };
    }
    async function loadInvoicePayments() {
      setIsLoadingBalance(true);
      setBalanceError(null);
      try {
        const response = await getPayments({ invoice_id: invoiceId, per_page: 100 });
        if (!cancelled) setInvoicePayments(response.data);
      } catch (requestError: unknown) {
        if (!cancelled) setBalanceError(requestError instanceof ApiError && requestError.message ? requestError.message : "خطا در دریافت وضعیت پرداخت فاکتور.");
      } finally {
        if (!cancelled) setIsLoadingBalance(false);
      }
    }
    const timeoutId = window.setTimeout(() => void loadInvoicePayments(), 0);
    return () => { cancelled = true; window.clearTimeout(timeoutId); };
  }, [invoiceId]);

  const confirmedAmount = invoicePayments.filter((item) => item.status === "confirmed").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pendingAmount = invoicePayments.filter((item) => item.status === "pending" && item.id !== payment?.id).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingAmount = selectedInvoice ? Math.max(0, Number(selectedInvoice.total_amount || 0) - confirmedAmount - pendingAmount) : 0;

  function handleCustomerChange(nextCustomerId: string) {
    setCustomerId(nextCustomerId);
    setInvoiceId("");
    setInvoicePayments([]);
    setBalanceError(null);
  }

  function handleInvoiceChange(nextInvoiceId: string) {
    setInvoiceId(nextInvoiceId);
    setInvoicePayments([]);
    setBalanceError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoiceId) return;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;
    onSubmit({ invoice_id: invoiceId, method, amount: amount.trim(), reference_number: referenceNumber, payment_date: paymentDate, description });
  }

  return <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
    <div className="mb-5"><h2 className="text-lg font-semibold text-gray-900">{payment ? "ویرایش پرداخت" : "پرداخت جدید"}</h2><p className="mt-1 text-sm text-gray-500">فقط فاکتورهای صادرشده و تسویه‌نشده قابل پرداخت هستند.</p></div>
    {error ? <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    {invoiceError ? <div role="alert" className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">{invoiceError}</div> : null}
    {balanceError ? <div role="alert" className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">{balanceError}</div> : null}
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">مشتری</label>
        <select disabled={isSubmitting || Boolean(payment) || isLoadingCustomers} value={customerId} onChange={(event) => handleCustomerChange(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100">
          <option value="">همه مشتریان</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customer_name}{customer.code ? ` — ${customer.code}` : ""}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">فاکتور</label>
        <select required disabled={isSubmitting || Boolean(payment) || isLoadingInvoices} value={invoiceId} onChange={(event) => handleInvoiceChange(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100">
          <option value="">{isLoadingInvoices ? "در حال دریافت فاکتورها..." : "انتخاب فاکتور"}</option>
          {availableInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.code} — {invoice.customer?.name ?? "بدون مشتری"} — {numberFormatter.format(Number(invoice.total_amount || 0))}</option>)}
        </select>
        <p className="mt-1.5 text-xs text-gray-500">فاکتورهای تسویه‌شده به‌صورت خودکار از این فهرست حذف شده‌اند.</p>
      </div>
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">روش پرداخت</label><select required disabled={isSubmitting} value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{PAYMENT_METHOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">مبلغ</label><FormattedNumberInput required min="0.01" step="0.01" dir="ltr" disabled={isSubmitting} value={amount} onValueChange={setAmount} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right" placeholder="مثلاً 1,500,000" />{selectedInvoice ? <div className="mt-2 text-xs text-gray-500">{isLoadingBalance ? "در حال محاسبه مانده..." : `مانده قابل پرداخت: ${numberFormatter.format(remainingAmount)}`}</div> : null}</div>
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">تاریخ پرداخت</label><JalaliDateInput required disabled={isSubmitting} value={paymentDate} onChange={setPaymentDate} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">شماره مرجع</label><input type="text" maxLength={100} disabled={isSubmitting} value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="شماره پیگیری، چک و..." /></div>
      <div className="md:col-span-2"><label className="mb-1.5 block text-sm font-medium text-gray-700">توضیحات</label><input type="text" disabled={isSubmitting} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
    </div>
    <div className="mt-5 flex gap-2"><button type="submit" disabled={isSubmitting || !invoiceId} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "در حال ذخیره..." : "ذخیره پرداخت"}</button><button type="button" disabled={isSubmitting} onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">انصراف</button></div>
  </form>;
}
