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
      title="برای مشاهده وضعیت و ثبت مأموریت کلیک کنید"
      className={"group flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-2 py-1.5 text-right shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 sm:min-h-11 sm:gap-2 sm:px-3 sm:py-2 " + (
        hasPoints
          ? "border-emerald-200 bg-gradient-to-l from-emerald-50 to-white text-emerald-900 focus:ring-emerald-100"
          : "border-amber-300 bg-gradient-to-l from-amber-100 via-amber-50 to-white text-amber-950 focus:ring-amber-100"
      )}
    >
      <span className={"relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 " + (
        hasPoints ? "bg-emerald-100 text-emerald-700" : "bg-amber-200 text-amber-800"
      )}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        {!hasPoints ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-amber-100 bg-rose-500 animate-pulse" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[10px] font-extrabold leading-4 sm:text-xs sm:leading-5">{countLabel}</span>
        <span className={"hidden text-[10px] font-medium leading-4 sm:block " + (
          hasPoints ? "text-emerald-700" : "text-amber-800"
        )}>
          {hasPoints ? "امروز موقعیت ثبت شده است" : "ثبت موقعیت را فراموش نکنید"}
        </span>
      </span>
      <span className="hidden text-base leading-none opacity-60 transition-transform group-hover:-translate-x-0.5 sm:mr-1 sm:inline-block" aria-hidden="true">‹</span>
    </button>
  );
}
