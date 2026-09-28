import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../../api/client";
import { FormattedNumberInput } from "../../../components/FormattedNumberInput";
import { SearchableCustomerSelect } from "../../../components/SearchableCustomerSelect";
import type { SearchableCustomer } from "../../../components/SearchableCustomerSelect";
import { ImageUploadField } from "../../../components/ImageUploadField";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import { searchCustomers } from "../../customers/services/customersApi";
import { getCustomerPayableBalance } from "../services/paymentsApi";
import { PAYMENT_METHOD_OPTIONS } from "../types/payment";
import type { Payment, PaymentFormData, PaymentMethod } from "../types/payment";

type PaymentFormProps = {
  payment: Payment | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
};

const numberFormatter = new Intl.NumberFormat("fa-IR");

export function PaymentForm({
  payment,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [customerId, setCustomerId] = useState(payment?.customer?.id ?? "");
  const [amount, setAmount] = useState(payment ? String(payment.amount) : "");
  const [customerBalance, setCustomerBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(
    payment?.method ?? "cash",
  );
  const [settlementDiscountAmount, setSettlementDiscountAmount] = useState(
    payment ? String(payment.settlement_discount_amount ?? 0) : "0",
  );
  const [referenceNumber, setReferenceNumber] = useState(
    payment?.reference_number ?? "",
  );
  const [paymentDate, setPaymentDate] = useState(
    payment?.payment_date ?? new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState(payment?.description ?? "");
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!customerId) {
      return () => {
        cancelled = true;
      };
    }

    async function loadBalance() {
      setIsLoadingBalance(true);
      setBalanceError(null);

      try {
        const balance = await getCustomerPayableBalance(customerId);

        if (cancelled) return;

        setCustomerBalance(balance);

        if (!payment) {
          setAmount(balance > 0 ? String(balance) : "");
          setSettlementDiscountAmount("0");
        } else {
          setAmount((current) => {
            const currentAmount = Number(current || 0);
            return currentAmount > balance ? String(balance) : current;
          });
        }
      } catch (requestError: unknown) {
        if (cancelled) return;

        setCustomerBalance(null);
        setAmount("");
        setBalanceError(
          requestError instanceof ApiError && requestError.message
            ? requestError.message
            : "خطا در دریافت مانده قابل پرداخت مشتری.",
        );
      } finally {
        if (!cancelled) setIsLoadingBalance(false);
      }
    }

    void loadBalance();

    return () => {
      cancelled = true;
    };
  }, [customerId, payment]);

  function handleCustomerChange(nextCustomerId: string) {
    if (payment) return;
    setCustomerId(nextCustomerId);
    setCustomerBalance(null);
    setAmount("");
    setSettlementDiscountAmount("0");
    setBalanceError(null);
    setIsLoadingBalance(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);
    const numericDiscount = Number(settlementDiscountAmount || 0);

    if (
      !customerId ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !Number.isFinite(numericDiscount) ||
      numericDiscount < 0 ||
      (customerBalance !== null &&
        (numericAmount + numericDiscount > customerBalance ||
          numericDiscount > customerBalance)) ||
      receiptError
    )
      return;

    onSubmit({
      customer_id: customerId,
      method,
      amount: amount.trim(),
      settlement_discount_amount: settlementDiscountAmount.trim() || "0",
      reference_number: referenceNumber,
      payment_date: paymentDate,
      description,
      receipt_image: receiptImage,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {payment ? "ویرایش پرداخت" : "پرداخت جدید"}
        </h2>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}
      {balanceError ? (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700"
        >
          {balanceError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            مشتری
          </label>
          <SearchableCustomerSelect
            value={customerId}
            selectedCustomer={payment?.customer ? {
              id: payment.customer.id,
              code: payment.customer.code,
              customer_name: payment.customer.name,
            } : null}
            disabled={isSubmitting || Boolean(payment)}
            searchCustomers={searchCustomers}
            onChange={(customer) => {
              handleCustomerChange(customer?.id ?? "");
            }}
            placeholder="نام، کد، کد ملی یا شماره مشتری..."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            مبلغ
          </label>
          <FormattedNumberInput
            required
            min="0.01"
            step="0.01"
            dir="ltr"
            disabled={isSubmitting || isLoadingBalance || !customerId}
            value={amount}
            onValueChange={(value) => {
              const numericValue = Number(value || 0);
              if (customerBalance !== null && numericValue > customerBalance) {
                setAmount(String(customerBalance));
                return;
              }
              setAmount(value);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right"
            placeholder="مثلاً 1,500,000"
          />
          {customerId ? (
            <div className="mt-2 text-xs text-gray-500">
              {isLoadingBalance
                ? "در حال محاسبه مانده قابل پرداخت..."
                : `مانده قابل پرداخت مشتری: ${numberFormatter.format(customerBalance ?? 0)}`}
            </div>
          ) : null}
          {customerId && customerBalance === 0 && !isLoadingBalance ? (
            <div className="mt-1 text-xs font-medium text-green-600">
              این مشتری در حال حاضر مانده قابل پرداخت ندارد.
            </div>
          ) : null}
          {customerId &&
          !isLoadingBalance &&
          Number(amount || 0) < (customerBalance ?? 0) ? (
            <div className="mt-1 text-xs text-blue-600">
              پرداخت جزئی مجاز است؛ مبلغ باقی‌مانده پس از تأیید پرداخت حفظ
              می‌شود.
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            روش پرداخت
          </label>
          <select
            required
            disabled={isSubmitting}
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            تخفیف تسویه
          </label>
          <FormattedNumberInput
            min="0"
            step="0.01"
            dir="ltr"
            disabled={isSubmitting || !customerId}
            value={settlementDiscountAmount}
            onValueChange={setSettlementDiscountAmount}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right"
            placeholder="مثلاً 100,000"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            تاریخ پرداخت
          </label>
          <JalaliDateInput
            required
            disabled={isSubmitting}
            value={paymentDate}
            onChange={setPaymentDate}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            شماره مرجع
          </label>
          <input
            type="text"
            maxLength={100}
            disabled={isSubmitting}
            value={referenceNumber}
            onChange={(event) => setReferenceNumber(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="شماره پیگیری، چک و..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            توضیحات
          </label>
          <input
            type="text"
            disabled={isSubmitting}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <ImageUploadField
            label=""
            file={receiptImage}
            value={payment?.receipt_image_url}
            disabled={isSubmitting}
            maxSizeMB={3}
            hint="JPG، PNG یا WEBP · حداکثر ۳ مگابایت"
            onFileChange={setReceiptImage}
            onError={setReceiptError}
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={
            isSubmitting ||
            !customerId ||
            Boolean(receiptError) ||
            (!payment &&
              (isLoadingBalance ||
                customerBalance === null ||
                customerBalance <= 0))
          }
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "در حال ذخیره..." : "ذخیره پرداخت"}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}
