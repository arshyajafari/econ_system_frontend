import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../../api/client';
import { FormattedNumberInput } from '../../../components/FormattedNumberInput';
import { SearchableCustomerSelect } from '../../../components/SearchableCustomerSelect';
import type { SearchableCustomer } from '../../../components/SearchableCustomerSelect';
import { ImageUploadField } from '../../../components/ImageUploadField';
import { JalaliDateInput } from '../../../components/JalaliDateInput';
import { searchCustomers } from '../../customers/services/customersApi';
import { getCustomerPayableBalance } from '../services/paymentsApi';
import { IRANIAN_BANK_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../types/payment';
import type { Payment, PaymentFormData, PaymentMethod } from '../types/payment';

type PaymentFormProps = {
    payment: Payment | null;
    isSubmitting: boolean;
    error: string | null;
    onSubmit: (data: PaymentFormData) => void;
    onCancel: () => void;
};

const numberFormatter = new Intl.NumberFormat('fa-IR');

export function PaymentForm({
    payment,
    isSubmitting,
    error,
    onSubmit,
    onCancel,
}: PaymentFormProps) {
    const [customerId, setCustomerId] = useState(payment?.customer?.id ?? '');
    const [selectedCustomer, setSelectedCustomer] = useState<SearchableCustomer | null>(() =>
        payment?.customer
            ? {
                  id: payment.customer.id,
                  code: payment.customer.code,
                  customer_name: payment.customer.name,
              }
            : null
    );
    const [amount, setAmount] = useState(payment ? String(payment.amount) : '');
    const [customerBalance, setCustomerBalance] = useState<number | null>(null);
    const [previousBalance, setPreviousBalance] = useState<number | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [method, setMethod] = useState<PaymentMethod>(payment?.method ?? 'cash');
    const [discountInput, setDiscountInput] = useState(
        payment ? String(payment.settlement_discount_amount ?? 0) : '0'
    );
    const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('amount');
    const [validationError, setValidationError] = useState<string | null>(null);
    const effectiveDiscountAmount =
        discountMode === 'percent'
            ? Math.round((((customerBalance ?? 0) * Number(discountInput || 0)) / 100) * 100) / 100
            : Number(discountInput || 0);
    const [referenceNumber, setReferenceNumber] = useState(
        payment?.method === 'cheque'
            ? (payment.cheque_details?.number ?? payment.reference_number ?? '')
            : (payment?.reference_number ?? '')
    );
    const [paymentDate, setPaymentDate] = useState(
        payment?.payment_date ?? new Date().toISOString().slice(0, 10)
    );
    const [description, setDescription] = useState(payment?.description ?? '');
    const [chequeDueDate, setChequeDueDate] = useState(payment?.cheque_details?.due_date ?? '');
    const [chequeBankName, setChequeBankName] = useState(
        IRANIAN_BANK_OPTIONS.some((bank) => bank === payment?.cheque_details?.bank_name)
            ? (payment?.cheque_details?.bank_name ?? '')
            : ''
    );
    const [chequeSayadId, setChequeSayadId] = useState(payment?.cheque_details?.sayad_id ?? '');
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
                const balance = await getCustomerPayableBalance(customerId, payment?.id);

                if (cancelled) return;

                setCustomerBalance(balance.payableBalance);
                setPreviousBalance(balance.previousBalance);

                if (!payment) {
                    setAmount(balance.payableBalance > 0 ? String(balance.payableBalance) : '');
                    setDiscountInput('0');
                }
            } catch (requestError: unknown) {
                if (cancelled) return;

                setCustomerBalance(null);
                setPreviousBalance(null);
                if (!payment) setAmount('');
                setBalanceError(
                    requestError instanceof ApiError && requestError.message
                        ? requestError.message
                        : 'خطا در دریافت مانده قابل پرداخت مشتری.'
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
        setPreviousBalance(null);
        setAmount('');
        setDiscountInput('0');
        setBalanceError(null);
        setIsLoadingBalance(false);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const numericAmount = Number(amount);
        const numericDiscount = effectiveDiscountAmount;
        setValidationError(null);

        if (!customerId) {
            setValidationError('ابتدا مشتری را انتخاب کنید.');
            return;
        }
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setValidationError('مبلغ پرداخت باید بیشتر از صفر باشد.');
            return;
        }
        if (!Number.isFinite(numericDiscount) || numericDiscount < 0) {
            setValidationError('مبلغ تخفیف تسویه معتبر نیست.');
            return;
        }
        if (discountMode === 'percent' && Number(discountInput || 0) > 100) {
            setValidationError('درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.');
            return;
        }
        if (customerBalance !== null && numericDiscount > customerBalance) {
            setValidationError('تخفیف تسویه نمی‌تواند بیشتر از مانده قابل پرداخت باشد.');
            return;
        }
        if (customerBalance !== null && numericAmount + numericDiscount > customerBalance + 0.009) {
            setValidationError('مجموع مبلغ پرداخت و تخفیف تسویه بیشتر از مانده قابل پرداخت است.');
            return;
        }
        if (method === 'cheque') {
            if (!referenceNumber.trim() || !chequeBankName.trim() || !chequeDueDate) {
                setValidationError('برای چک، شماره چک، نام بانک و تاریخ سررسید الزامی است.');
                return;
            }
            if (paymentDate && chequeDueDate < paymentDate) {
                setValidationError('تاریخ سررسید چک نمی‌تواند قبل از تاریخ پرداخت باشد.');
                return;
            }
            if (chequeSayadId.trim() && !/^\d{16}$/.test(chequeSayadId.trim())) {
                setValidationError('شناسه صیادی باید دقیقاً ۱۶ رقم باشد.');
                return;
            }
        }
        if (receiptError) {
            setValidationError('لطفاً خطای تصویر رسید را برطرف کنید.');
            return;
        }

        onSubmit({
            customer_id: customerId,
            method,
            amount: amount.trim(),
            settlement_discount_amount: String(numericDiscount),
            reference_number: referenceNumber,
            cheque_due_date: chequeDueDate,
            cheque_bank_name: chequeBankName,
            cheque_sayad_id: chequeSayadId,
            payment_date: paymentDate,
            description,
            receipt_image: receiptImage,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900">
                    {payment ? 'ویرایش پرداخت' : 'پرداخت جدید'}
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
            {validationError ? (
                <div
                    role="alert"
                    className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {validationError}
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">مشتری</label>
                    <SearchableCustomerSelect
                        value={customerId}
                        selectedCustomer={selectedCustomer}
                        disabled={isSubmitting || Boolean(payment)}
                        searchCustomers={searchCustomers}
                        onChange={(customer) => {
                            setSelectedCustomer(customer);
                            handleCustomerChange(customer?.id ?? '');
                        }}
                        placeholder="نام، کد، کد ملی یا شماره مشتری..."
                    />
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
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">مبلغ</label>
                    <FormattedNumberInput
                        required
                        min="0.01"
                        step="0.01"
                        dir="ltr"
                        disabled={isSubmitting || isLoadingBalance || !customerId}
                        value={amount}
                        onValueChange={(value) => {
                            const numericValue = Number(value || 0);
                            const maxAmount =
                                customerBalance === null
                                    ? null
                                    : Math.max(
                                          0,
                                          Math.round(
                                              (customerBalance - effectiveDiscountAmount) * 100
                                          ) / 100
                                      );
                            if (maxAmount !== null && numericValue > maxAmount) {
                                setAmount(String(maxAmount));
                                return;
                            }
                            setAmount(value);
                            setValidationError(null);
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right"
                        placeholder="مثلاً 1,500,000"
                    />
                    {customerId ? (
                        <div className="mt-2 space-y-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                            {isLoadingBalance ? (
                                <div>در حال محاسبه بدهی و مانده حساب مشتری...</div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between gap-3">
                                        <span>
                                            {(previousBalance ?? 0) > 0
                                                ? 'بدهی قبلی مشتری'
                                                : (previousBalance ?? 0) < 0
                                                  ? 'بستانکاری قبلی مشتری'
                                                  : 'بدهی قبلی ثبت‌شده'}
                                        </span>
                                        <span className="font-medium tabular-nums" dir="ltr">
                                            {numberFormatter.format(Math.abs(previousBalance ?? 0))}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-1.5 font-semibold text-gray-900">
                                        <span>مانده قابل پرداخت نهایی</span>
                                        <span className="tabular-nums" dir="ltr">
                                            {numberFormatter.format(customerBalance ?? 0)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        تخفیف تسویه
                    </label>
                    <FormattedNumberInput
                        min="0"
                        maxDecimalPlaces={discountMode === 'percent' ? 8 : 2}
                        max={discountMode === 'percent' ? '100' : undefined}
                        step="0.01"
                        dir="ltr"
                        disabled={isSubmitting || isLoadingBalance || !customerId}
                        value={discountInput}
                        onValueChange={(value) => {
                            setDiscountInput(value);
                            setValidationError(null);
                            const nextDiscount =
                                discountMode === 'percent'
                                    ? Math.round(
                                          (((customerBalance ?? 0) * Number(value || 0)) / 100) *
                                              100
                                      ) / 100
                                    : Number(value || 0);
                            const currentAmount = Number(amount || 0);
                            if (
                                customerBalance !== null &&
                                (Math.abs(
                                    currentAmount + effectiveDiscountAmount - customerBalance
                                ) < 0.02 ||
                                    !amount)
                            ) {
                                setAmount(
                                    String(
                                        Math.max(
                                            0,
                                            Math.round((customerBalance - nextDiscount) * 100) / 100
                                        )
                                    )
                                );
                            }
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right"
                        placeholder={discountMode === 'percent' ? 'مثلاً 3.2' : 'مثلاً 4,650,000'}
                    />

                    <div className="mt-2 flex gap-2">
                        <button
                            type="button"
                            disabled={isSubmitting || !customerId}
                            onClick={() => {
                                setDiscountMode('amount');
                                setDiscountInput(String(effectiveDiscountAmount));
                                setValidationError(null);
                            }}
                            className={
                                'rounded-md border px-3 py-1 text-xs ' +
                                (discountMode === 'amount'
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-gray-300 text-gray-700')
                            }
                        >
                            مبلغ ریالی
                        </button>
                        <button
                            type="button"
                            disabled={isSubmitting || !customerId}
                            onClick={() => {
                                setDiscountMode('percent');
                                setDiscountInput(
                                    customerBalance && customerBalance > 0
                                        ? String(
                                              Math.round(
                                                  (effectiveDiscountAmount / customerBalance) *
                                                      10000000000
                                              ) / 100000000
                                          )
                                        : '0'
                                );
                                setValidationError(null);
                            }}
                            className={
                                'rounded-md border px-3 py-1 text-xs ' +
                                (discountMode === 'percent'
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-gray-300 text-gray-700')
                            }
                        >
                            درصد
                        </button>
                    </div>
                </div>

                {method === 'cheque' ? (
                    <>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                بانک <span className="text-red-600">*</span>
                            </label>
                            <select
                                required
                                disabled={isSubmitting}
                                value={chequeBankName}
                                onChange={(event) => setChequeBankName(event.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            >
                                <option value="">انتخاب بانک</option>
                                {IRANIAN_BANK_OPTIONS.map((bank) => (
                                    <option key={bank} value={bank}>
                                        {bank}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                تاریخ سررسید چک <span className="text-red-600">*</span>
                            </label>
                            <JalaliDateInput
                                required
                                disabled={isSubmitting}
                                value={chequeDueDate}
                                onChange={(value) => {
                                    setChequeDueDate(value);
                                    setValidationError(null);
                                }}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                شناسه صیادی ۱۶ رقمی (اختیاری)
                            </label>
                            <input
                                inputMode="numeric"
                                maxLength={16}
                                dir="ltr"
                                disabled={isSubmitting}
                                value={chequeSayadId}
                                onChange={(event) =>
                                    setChequeSayadId(
                                        event.target.value.replace(/\D/g, '').slice(0, 16)
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="۱۶ رقم شناسه صیادی"
                            />
                        </div>
                    </>
                ) : null}

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
                        {method === 'cheque' ? 'شماره چک' : 'شماره مرجع'}
                    </label>
                    <input
                        type="text"
                        maxLength={100}
                        disabled={isSubmitting}
                        value={referenceNumber}
                        onChange={(event) => setReferenceNumber(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder={
                            method === 'cheque' ? 'شماره چک' : 'شماره پیگیری یا مرجع بانکی'
                        }
                    />
                </div>

                <div>
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
                        isLoadingBalance ||
                        customerBalance === null ||
                        Boolean(balanceError) ||
                        customerBalance <= 0
                    }
                    className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? 'در حال ذخیره...' : 'ذخیره پرداخت'}
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
