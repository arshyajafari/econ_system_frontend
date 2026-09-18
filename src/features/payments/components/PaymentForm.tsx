import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../../api/client";
import { FormattedNumberInput } from "../../../components/FormattedNumberInput";
import { ImageUploadField } from "../../../components/ImageUploadField";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import { getCustomerBalance, getCustomers } from "../../customers/services/customersApi";
import type { Customer } from "../../customers/types/customer";
import { getPayments, getPaymentInvoices } from "../services/paymentsApi";
import { PAYMENT_METHOD_OPTIONS } from "../types/payment";
import type { Payment, PaymentFormData, PaymentInvoiceOption, PaymentMethod } from "../types/payment";

type PaymentFormProps = { payment: Payment | null; invoices: PaymentInvoiceOption[]; isSubmitting: boolean; error: string | null; onSubmit: (data: PaymentFormData) => void; onCancel: () => void };
const numberFormatter = new Intl.NumberFormat("fa-IR");

export function PaymentForm({ payment, invoices, isSubmitting, error, onSubmit, onCancel }: PaymentFormProps) {
  const [customerId, setCustomerId] = useState(payment?.customer?.id ?? "");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoiceOptions, setInvoiceOptions] = useState<PaymentInvoiceOption[]>(invoices);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [invoiceId, setInvoiceId] = useState(payment?.invoice?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>(payment?.method ?? "cash");
  const [amount, setAmount] = useState(payment ? String(payment.amount) : "");
  const [referenceNumber, setReferenceNumber] = useState(payment?.reference_number ?? "");
  const [paymentDate, setPaymentDate] = useState(payment?.payment_date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(payment?.description ?? "");
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [customerBalance, setCustomerBalance] = useState<number | null>(null);
  const [isLoadingCustomerBalance, setIsLoadingCustomerBalance] = useState(false);

  const selectedInvoice = useMemo(() => invoiceOptions.find((invoice) => invoice.id === invoiceId) ?? null, [invoiceId, invoiceOptions]);

  useEffect(() => {
    let cancelled = false;
    async function loadCustomers() {
      setIsLoadingCustomers(true);
      try {
        const response = await getCustomers({ per_page: 100 });
        if (!cancelled) {
          const currentCustomer = payment?.customer;
          const current = currentCustomer && !response.data.some((item) => item.id === currentCustomer.id)
            ? [{ id: currentCustomer.id, code: currentCustomer.code, customer_name: currentCustomer.name } as Customer]
            : [];
          setCustomers([...current, ...response.data]);
        }
      } catch (requestError: unknown) {
        if (!cancelled) setBalanceError(requestError instanceof ApiError && requestError.message ? requestError.message : "خطا در دریافت مشتریان.");
      } finally {
        if (!cancelled) setIsLoadingCustomers(false);
      }
    }
    void loadCustomers();
    return () => { cancelled = true; };
  }, [payment]);

  useEffect(() => {
    let cancelled = false;
    async function loadInvoices() {
      setIsLoadingInvoices(true);
      try {
        const response = await getPaymentInvoices({ customer_id: customerId || undefined, settled: false });
        if (!cancelled) {
          const currentInvoice = payment?.invoice;
          const currentOption = currentInvoice && !response.some((invoice) => invoice.id === currentInvoice.id)
            ? [{ ...currentInvoice, customer: payment.customer }]
            : [];
          setInvoiceOptions([...currentOption, ...response]);
        }
      } catch (requestError: unknown) {
        if (!cancelled) setBalanceError(requestError instanceof ApiError && requestError.message ? requestError.message : "خطا در دریافت فاکتورها.");
      } finally {
        if (!cancelled) setIsLoadingInvoices(false);
      }
    }
    const timeoutId = window.setTimeout(() => void loadInvoices(), 0);
    return () => { cancelled = true; window.clearTimeout(timeoutId); };
  }, [customerId, payment]);

  useEffect(() => {
    let cancelled = false;

    if (!customerId) {
      setCustomerBalance(null);
      setIsLoadingCustomerBalance(false);
      return () => { cancelled = true; };
    }

    async function loadCustomerBalance() {
      setIsLoadingCustomerBalance(true);
      try {
        const balance = await getCustomerBalance(customerId);
        if (!cancelled) setCustomerBalance(balance);
      } catch (requestError: unknown) {
        if (!cancelled) {
          setCustomerBalance(null);
          setBalanceError(
            requestError instanceof ApiError && requestError.message
              ? requestError.message
              : "خطا در دریافت مانده حساب مشتری.",
          );
        }
      } finally {
        if (!cancelled) setIsLoadingCustomerBalance(false);
      }
    }

    const timeoutId = window.setTimeout(() => void loadCustomerBalance(), 0);
    return () => { cancelled = true; window.clearTimeout(timeoutId); };
  }, [customerId]);

  useEffect(() => {
    let cancelled = false;
    if (!invoiceId) return () => { cancelled = true; };
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
  const invoiceRemainingBeforePending = selectedInvoice?.remaining_amount != null
    ? Number(selectedInvoice.remaining_amount)
    : selectedInvoice
      ? Math.max(0, Number(selectedInvoice.total_amount || 0) - confirmedAmount - Number(selectedInvoice.return_credit_amount || 0))
      : 0;
  const remainingAmount = Math.max(0, invoiceRemainingBeforePending - pendingAmount);

  function handleCustomerChange(nextCustomerId: string) {
    if (payment) return;
    setCustomerId(nextCustomerId);
    setInvoiceId("");
    setInvoiceOptions([]);
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
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || receiptError) return;
    onSubmit({ invoice_id: invoiceId, method, amount: amount.trim(), reference_number: referenceNumber, payment_date: paymentDate, description, receipt_image: receiptImage });
  }

  return <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
    <div className="mb-5"><h2 className="text-lg font-semibold text-gray-900">{payment ? "ویرایش پرداخت" : "پرداخت جدید"}</h2><p className="mt-1 text-sm text-gray-500">فقط فاکتورهای صادرشده و تسویه‌نشده قابل پرداخت هستند.</p></div>
    {error ? <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    {balanceError ? <div role="alert" className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">{balanceError}</div> : null}
    <div className="grid gap-4 md:grid-cols-2">
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">مشتری</label><select required disabled={isSubmitting || Boolean(payment) || isLoadingCustomers} value={customerId} onChange={(event) => handleCustomerChange(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"><option value="">{isLoadingCustomers ? "در حال دریافت مشتریان..." : "انتخاب مشتری"}</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.code} — {customer.customer_name}</option>)}</select></div>
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">فاکتور</label><select required disabled={isSubmitting || Boolean(payment) || !customerId || isLoadingInvoices} value={invoiceId} onChange={(event) => handleInvoiceChange(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"><option value="">{isLoadingInvoices ? "در حال دریافت فاکتورها..." : customerId ? "انتخاب فاکتور" : "ابتدا مشتری را انتخاب کنید"}</option>{invoiceOptions.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.code} — مبلغ: {numberFormatter.format(Number(invoice.total_amount || 0))} — مانده: {numberFormatter.format(Number(invoice.remaining_amount ?? invoice.total_amount ?? 0))}</option>)}</select>{!payment && customerId ? <p className="mt-1.5 text-xs text-gray-500">فقط فاکتورهای صادرشده و تسویه‌نشده این مشتری نمایش داده می‌شوند.</p> : null}</div>
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">روش پرداخت</label><select required disabled={isSubmitting} value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{PAYMENT_METHOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">مبلغ</label><FormattedNumberInput required min="0.01" step="0.01" dir="ltr" disabled={isSubmitting} value={amount} onValueChange={setAmount} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right" placeholder="مثلاً 1,500,000" />{customerId ? <div className="mt-2 text-xs text-gray-500">{isLoadingCustomerBalance ? "در حال دریافت مانده حساب مشتری..." : customerBalance === null ? "مانده حساب مشتری: —" : `مانده حساب مشتری: ${numberFormatter.format(customerBalance)}`}</div> : null}{selectedInvoice ? <div className="mt-1 text-xs text-gray-500">{isLoadingBalance ? "در حال محاسبه مانده فاکتور..." : `مانده قابل پرداخت فاکتور: ${numberFormatter.format(remainingAmount)}`}</div> : null}</div>
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">تاریخ پرداخت</label><JalaliDateInput required disabled={isSubmitting} value={paymentDate} onChange={setPaymentDate} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">شماره مرجع</label><input type="text" maxLength={100} disabled={isSubmitting} value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="شماره پیگیری، چک و..." /></div>
      <div><label className="mb-1.5 block text-sm font-medium text-gray-700">توضیحات</label><input type="text" disabled={isSubmitting} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
      <div className="md:col-span-2"><ImageUploadField label="" file={receiptImage} value={payment?.receipt_image_url} disabled={isSubmitting} maxSizeMB={3} hint="JPG، PNG یا WEBP · حداکثر ۳ مگابایت" onFileChange={setReceiptImage} onError={setReceiptError} /></div>
    </div>
    <div className="mt-5 flex gap-2"><button type="submit" disabled={isSubmitting || !invoiceId || Boolean(receiptError)} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "در حال ذخیره..." : "ذخیره پرداخت"}</button><button type="button" disabled={isSubmitting} onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">انصراف</button></div>
  </form>;
}
