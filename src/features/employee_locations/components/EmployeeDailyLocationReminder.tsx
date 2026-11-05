import { useCallback, useEffect, useState } from "react";
import { getMyDailyLocationPointCount } from "../api/employeeLocations";

type Props = {
  onOpenTracker: () => void;
};

export function EmployeeDailyLocationReminder({ onOpenTracker }: Props) {
  const [pointsCount, setPointsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCount = useCallback(async () => {
    try {
      const summary = await getMyDailyLocationPointCount();
      setPointsCount(summary.points_count);
    } catch {
      // Keep the last known count; transient network failures should not hide the reminder.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refreshCount(), 0);

    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") void refreshCount();
    };
    const interval = window.setInterval(() => void refreshCount(), 60_000);
    document.addEventListener("visibilitychange", refreshWhenActive);
    window.addEventListener("focus", refreshWhenActive);
    window.addEventListener("employee-location:changed", refreshWhenActive);

    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenActive);
      window.removeEventListener("focus", refreshWhenActive);
      window.removeEventListener("employee-location:changed", refreshWhenActive);
    };
  }, [refreshCount]);

  const hasPoints = (pointsCount ?? 0) > 0;
  const countLabel = loading && pointsCount === null
    ? "در حال بررسی"
    : (pointsCount ?? 0).toLocaleString("fa-IR") + " نقطه امروز";

  return (
    <button
      type="button"
      onClick={onOpenTracker}
      aria-label={"وضعیت ثبت موقعیت امروز: " + countLabel + ". باز کردن ثبت حضور مکانی"}
      className={"group flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-right shadow-sm transition-all hover:-translate-y-px hover:shadow-md focus:outline-none focus:ring-4 focus:ring-offset-1 " + (
        hasPoints
          ? "border-emerald-200 bg-gradient-to-l from-emerald-50 to-white text-emerald-900 focus:ring-emerald-100"
          : "border-amber-300 bg-gradient-to-l from-amber-100 via-amber-50 to-white text-amber-950 focus:ring-amber-100"
      )}
    >
      <span className={"relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " + (
        hasPoints ? "bg-emerald-100 text-emerald-700" : "bg-amber-200 text-amber-800"
      )}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        {!hasPoints ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-amber-100 bg-rose-500 animate-pulse" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-extrabold leading-5">{countLabel}</span>
        <span className={"block text-[10px] font-medium leading-4 " + (
          hasPoints ? "text-emerald-700" : "text-amber-800"
        )}>
          {hasPoints ? "امروز موقعیت ثبت شده است" : "ثبت موقعیت را فراموش نکنید"}
        </span>
      </span>
      <span className="mr-1 text-base leading-none opacity-60 transition-transform group-hover:-translate-x-0.5" aria-hidden="true">‹</span>
    </button>
  );
}
