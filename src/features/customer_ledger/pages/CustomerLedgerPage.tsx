import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../../../api/client";
import { CustomerLedgerFilters } from "../components/CustomerLedgerFilters";
import { CustomerLedgerSummary } from "../components/CustomerLedgerSummary";
import { CustomerLedgerTable } from "../components/CustomerLedgerTable";
import { getCustomerLedger } from "../services/customerLedgerApi";
import type {
  CustomerLedger,
  CustomerLedgerParams,
} from "../types/customerLedger";

export function CustomerLedgerPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [ledger, setLedger] = useState<CustomerLedger | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<CustomerLedgerParams>(
    {},
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const loadLedger = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      setError("شناسه مشتری معتبر نیست.");
      return;
    }

    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCustomerLedger(id, appliedFilters);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setLedger(response);
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در دریافت حساب مشتری.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [appliedFilters, id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadLedger();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadLedger]);

  function handleApplyFilters() {
    if (from && to && from > to) {
      setFilterError("تاریخ شروع بازه نمی‌تواند بعد از تاریخ پایان باشد.");

      return;
    }

    setFilterError(null);

    setAppliedFilters({
      from: from || undefined,
      to: to || undefined,
    });
  }

  function handleResetFilters() {
    setFrom("");
    setTo("");
    setFilterError(null);
    setAppliedFilters({});
  }

  if (!id) {
    return (
      <section className="p-4 md:p-6">
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-5 text-sm text-red-700"
        >
          شناسه مشتری معتبر نیست.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2">
            <button
              type="button"
              onClick={() => navigate("/customers")}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              ← بازگشت به مشتریان
            </button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">حساب مشتری</h1>

          <p className="mt-1 text-sm text-gray-500">
            {ledger?.customer.name ?? "در حال دریافت اطلاعات مشتری..."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadLedger();
          }}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          بروزرسانی
        </button>
      </div>

      {filterError ? (
        <div
          role="alert"
          className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700"
        >
          {filterError}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="flex flex-col gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => {
              void loadLedger();
            }}
            className="self-start rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100 sm:self-auto"
          >
            تلاش مجدد
          </button>
        </div>
      ) : null}

      <CustomerLedgerFilters
        from={from}
        to={to}
        isLoading={isLoading}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {ledger ? (
        <>
          <CustomerLedgerSummary
            openingBalance={ledger.opening_balance}
            totalDebit={ledger.total_debit}
            totalCredit={ledger.total_credit}
            closingBalance={ledger.closing_balance}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">گردش حساب</h2>

              {ledger.transactions.length > 0 ? (
                <span className="text-sm text-gray-500">
                  {new Intl.NumberFormat("fa-IR").format(
                    ledger.transactions.length,
                  )}{" "}
                  تراکنش
                </span>
              ) : null}
            </div>

            <CustomerLedgerTable
              transactions={ledger.transactions}
              isLoading={isLoading}
            />
          </div>
        </>
      ) : isLoading ? (
        <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
          <p className="text-sm text-gray-500">در حال دریافت حساب مشتری...</p>
        </div>
      ) : null}
    </section>
  );
}
