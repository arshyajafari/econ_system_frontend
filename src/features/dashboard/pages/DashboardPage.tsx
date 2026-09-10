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
      const response = await getDashboard();
      setDashboard(response.data);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setError(error.message || "خطا در دریافت اطلاعات داشبورد.");
      } else {
        setError("خطا در دریافت اطلاعات داشبورد.");
      }
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

        if (!cancelled) {
          setDashboard(response.data);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          if (error instanceof ApiError) {
            setError(error.message || "خطا در دریافت اطلاعات داشبورد.");
          } else {
            setError("خطا در دریافت اطلاعات داشبورد.");
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">داشبورد</h1>

          <p className="mt-1 text-sm text-gray-500">
            خوش آمدید {user?.employee.full_name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadDashboard();
          }}
          disabled={isLoading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "در حال بروزرسانی..." : "بروزرسانی"}
        </button>
      </div>

      {isLoading && !dashboard ? (
        <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <p className="text-sm text-gray-500">
            در حال دریافت اطلاعات داشبورد...
          </p>
        </div>
      ) : error && !dashboard ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => {
              void loadDashboard();
            }}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            تلاش مجدد
          </button>
        </div>
      ) : dashboard ? (
        <>
          {error ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <DashboardSummaryCards dashboard={dashboard} />
          <DashboardRecentSection recent={dashboard.recent} />
        </>
      ) : (
        <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <p className="text-sm text-gray-500">
            اطلاعاتی برای نمایش وجود ندارد.
          </p>
        </div>
      )}
    </section>
  );
}
