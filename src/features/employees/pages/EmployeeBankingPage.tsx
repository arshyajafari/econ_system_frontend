import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import { getEmployees } from "../services/employeesApi";
import type { Employee } from "../types/employee";
import { formatCardNumber, formatIban, getIranianBankByCard } from "../utils/iranianBanks";

export function EmployeeBankingPage() {
  const [items, setItems] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await getEmployees({ search: search.trim() || undefined, per_page: 100, page: 1 });
      setItems(response.data);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در دریافت اطلاعات بانکی کارکنان.");
    } finally { setLoading(false); }
  }, [search]);
  useEffect(() => {\n    const id = window.setTimeout(() => { void load(); }, 0);\n    return () => window.clearTimeout(id);\n  }, [load]);

  return <section className="space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><h1 className="text-2xl font-bold text-gray-900">اطلاعات بانکی کارکنان</h1><p className="mt-1 text-sm text-gray-500">نمایش کارت و شماره شبا؛ بانک از روی ۶ رقم اول شماره کارت به‌صورت خودکار شناسایی می‌شود.</p></div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو بر اساس نام، کد یا موبایل" className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm md:w-80" />
    </div>
    {error ? <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="min-w-full text-right text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-3">کارمند</th><th className="px-4 py-3">بانک</th><th className="px-4 py-3">شماره کارت</th><th className="px-4 py-3">شماره شبا</th></tr></thead>
      <tbody className="divide-y">{loading && items.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center">در حال دریافت...</td></tr> : items.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">اطلاعاتی پیدا نشد.</td></tr> : items.map(item => { const bank = getIranianBankByCard(item.card_number); return <tr key={item.id} className="hover:bg-gray-50/70"><td className="px-4 py-4"><div className="font-semibold text-gray-900">{item.first_name} {item.last_name}</div><div className="mt-1 text-xs text-gray-500">کد {item.code}</div></td><td className="px-4 py-4"><div className="flex items-center gap-3">{bank ? <img src={bank.logo} alt={bank.name} className="h-10 w-10 rounded-xl border bg-white object-contain p-1" onError={e => { e.currentTarget.style.display = "none"; }} /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">؟</span>}<div><div className="font-medium">{bank?.name ?? (item.card_number ? "بانک شناسایی نشد" : "بدون کارت")}</div>{bank ? <div className="mt-0.5 text-xs text-gray-400">شناسایی خودکار از BIN</div> : null}</div></div></td><td dir="ltr" className="px-4 py-4 font-mono tracking-wide">{formatCardNumber(item.card_number) || "—"}</td><td dir="ltr" className="px-4 py-4 font-mono text-xs tracking-wide">{formatIban(item.iban_number)}</td></tr>; })}</tbody></table>
    </div>
  </section>;
}
