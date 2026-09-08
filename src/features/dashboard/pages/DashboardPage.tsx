import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../../../api/client";
import { useAuth } from "../../auth";
import { DashboardRecentSection } from "../components/DashboardRecentSection";
import { DashboardSummaryCards } from "../components/DashboardSummaryCards";
import { getDashboard } from "../services/dashboardApi";
import type { DashboardData } from "../types/dashboard";

import "../dashboard.css";

export function DashboardPage() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    getDashboard()
      .then((response) => {
        if (cancelled) {
          return;
        }

        setDashboard(response.data);
        setError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError) {
          setError(error.message || "خطا در دریافت اطلاعات داشبورد.");
        } else {
          setError("خطا در دریافت اطلاعات داشبورد.");
        }
      })
      .finally(() => {
        if (cancelled) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1>داشبورد</h1>

          <p>خوش آمدید {user?.employee.full_name}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadDashboard();
          }}
          disabled={isLoading}
        >
          {isLoading ? "در حال بروزرسانی..." : "بروزرسانی"}
        </button>
      </div>

      {isLoading && !dashboard ? (
        <div className="dashboard-state">
          <p>در حال دریافت اطلاعات داشبورد...</p>
        </div>
      ) : error && !dashboard ? (
        <div className="dashboard-state dashboard-state--error">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => {
              void loadDashboard();
            }}
          >
            تلاش مجدد
          </button>
        </div>
      ) : dashboard ? (
        <>
          {error ? (
            <div className="dashboard-inline-error">
              <span>{error}</span>
            </div>
          ) : null}

          <DashboardSummaryCards dashboard={dashboard} />

          <DashboardRecentSection recent={dashboard.recent} />
        </>
      ) : (
        <div className="dashboard-state">
          <p>اطلاعاتی برای نمایش وجود ندارد.</p>
        </div>
      )}
    </section>
  );
}
