import { useState } from "react";

import { ApiError } from "../../../api/client";
import { importCustomerOpeningBalances } from "../services/customersApi";
import type { CustomerOpeningBalanceImportResult } from "../services/customersApi";

type Props = {
  onCompleted: () => void;
};

const reasonLabels: Record<string, string> = {
  missing_customer_id: "شناسه مشتری خالی است.",
  invalid_customer_id: "شناسه مشتری معتبر نیست.",
  invalid_balance: "مبلغ معتبر نیست.",
  duplicate_customer_in_excel: "مشتری در فایل تکراری است.",
  customer_not_found: "مشتری در سیستم پیدا نشد.",
  database_error: "خطای پایگاه داده.",
  missing_required_columns: "ستون‌های customer_id و balance در فایل پیدا نشد.",
};

export function CustomerOpeningBalanceImport({ onCompleted }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [openingDate, setOpeningDate] = useState("");
  const [result, setResult] = useState<CustomerOpeningBalanceImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(mode: "preview" | "commit") {
    if (!file) {
      setError("ابتدا فایل Excel را انتخاب کنید.");
      return;
    }

    if (!openingDate) {
      setError("تاریخ مانده اولیه را وارد کنید.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await importCustomerOpeningBalances(file, openingDate, mode);
      setResult(response);

      if (mode === "commit") {
        onCompleted();
      }
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "خطا در پردازش فایل مانده اولیه.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          ورود مانده اولیه مشتریان
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          فایل باید حداقل دو ستون customer_id و balance داشته باشد. نام مشتری
          برای تطبیق استفاده نمی‌شود.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            فایل Excel
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setResult(null);
              setError(null);
            }}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            تاریخ مانده اولیه
          </span>
          <input
            type="date"
            value={openingDate}
            onChange={(event) => {
              setOpeningDate(event.target.value);
              setResult(null);
            }}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void run("preview")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "در حال پردازش..." : "بررسی فایل"}
        </button>

        {result && result.statistics.failed === 0 ? (
          <button
            type="button"
            disabled={isLoading || result.statistics.imported === 0}
            onClick={() => {
              if (
                window.confirm(
                  "مانده‌های صحیح وارد سیستم شوند؟ این عملیات قابل برگشت خودکار نیست.",
                )
              ) {
                void run("commit");
              }
            }}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            ثبت مانده‌های صحیح
          </button>
        ) : null}
      </div>

      {result ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Summary label="بررسی‌شده" value={result.statistics.processed} />
            <Summary label="قابل ثبت" value={result.statistics.imported} />
            <Summary label="خطادار" value={result.statistics.failed} />
          </div>

          {result.statistics.skipped_duplicate > 0 ? (
            <p className="text-sm text-amber-700">
              {result.statistics.skipped_duplicate} مورد قبلاً وارد شده و دوباره
              ثبت نمی‌شود.
            </p>
          ) : null}

          {result.statistics.skipped_empty > 0 ? (
            <p className="text-sm text-gray-600">
              {result.statistics.skipped_empty} ردیف خالی/صفر نادیده گرفته شد.
            </p>
          ) : null}

          {result.errors.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-red-100">
              <table className="min-w-full text-right text-sm">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-3 py-2">ردیف</th>
                    <th className="px-3 py-2">مشتری</th>
                    <th className="px-3 py-2">مبلغ</th>
                    <th className="px-3 py-2">خطا</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((item) => (
                    <tr key={String(item.row) + "-" + item.reason} className="border-t">
                      <td className="px-3 py-2">{item.row}</td>
                      <td className="px-3 py-2">{item.customer_id ?? "—"}</td>
                      <td className="px-3 py-2">{item.balance ?? "—"}</td>
                      <td className="px-3 py-2">
                        {reasonLabels[item.reason] ?? item.message ?? item.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {result.statistics.failed === 0 && result.statistics.imported > 0 ? (
            <p className="text-sm font-medium text-green-700">
              فایل بدون خطای اعتبارسنجی آماده ثبت است.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-gray-900">
        {new Intl.NumberFormat("fa-IR").format(value)}
      </div>
    </div>
  );
}
