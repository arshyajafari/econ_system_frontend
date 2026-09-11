import { useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../auth";
import { DashboardRecentSection } from "../components/DashboardRecentSection";
import { DashboardSummaryCards } from "../components/DashboardSummaryCards";
import { getDashboard } from "../services/dashboardApi";
import type { DashboardData } from "../types/dashboard";

export function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDashboard(await getDashboard());
    } catch (error: unknown) {
      setError(error instanceof ApiError ? error.message || "خطا در دریافت اطلاعات داشبورد." : "خطا در دریافت اطلاعات داشبورد.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitialDashboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getDashboard();
        if (!cancelled) setDashboard(response);
      } catch (error: unknown) {
        if (!cancelled) setError(error instanceof ApiError ? error.message || "خطا در دریافت اطلاعات داشبورد." : "خطا در دریافت اطلاعات داشبورد.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadInitialDashboard();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="space-y-6 p-4 md:p-6 xl:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold tracking-wide text-blue-600">نمای کلی سیستم</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">سلام، وقت بخیر 👋</h1>
          <p className="mt-1 text-sm text-slate-500">امیدواریم امروز روز خوبی داشته باشید، {user?.employee.full_name}.</p>
        </div>
        <button
          type="button"
          onClick={() => { void loadDashboard(); }}
          disabled={isLoading}
          className="self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "در حال بروزرسانی..." : "بروزرسانی اطلاعات"}
        </button>
      </div>

      {isLoading && !dashboard ? (
        <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">در حال دریافت اطلاعات داشبورد...</p>
        </div>
      ) : error && !dashboard ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={() => { void loadDashboard(); }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">تلاش مجدد</button>
        </div>
      ) : dashboard ? (
        <>
          {error ? <div role="alert" aria-live="polite" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <DashboardSummaryCards dashboard={dashboard} />
          <DashboardRecentSection recent={dashboard.recent} />
        </>
      ) : (
        <div className="flex min-h-60 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">اطلاعاتی برای نمایش وجود ندارد.</p>
        </div>
      )}
    </section>
  );
}
