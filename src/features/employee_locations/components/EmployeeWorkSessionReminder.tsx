import { useCallback, useEffect, useRef, useState } from "react";
import { getMyWorkSession } from "../api/employeeLocations";

type ReminderKind = "start" | "end";

type EmployeeWorkSessionReminderProps = {
  loginVersion: number;
  onOpenTracker: () => void;
};

const REMINDER_INTERVAL_MS = 30 * 60 * 1000;

export function EmployeeWorkSessionReminder({
  loginVersion,
  onOpenTracker,
}: EmployeeWorkSessionReminderProps) {
  const [reminder, setReminder] = useState<ReminderKind | null>(null);
  const lastReminderAt = useRef(0);
  const handledLoginVersion = useRef(0);
  const requestInFlight = useRef(false);

  const refreshStatus = useCallback(async (successfulLogin = false): Promise<void> => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;

    try {
      const session = await getMyWorkSession();
      const hasActiveSession = session?.status === "in_progress";

      if (!hasActiveSession) {
        setReminder((current) => (current === "end" ? null : current));
        if (successfulLogin) {
          lastReminderAt.current = Date.now();
          setReminder("start");
        }
        return;
      }

      if (
        successfulLogin ||
        Date.now() - lastReminderAt.current >= REMINDER_INTERVAL_MS
      ) {
        lastReminderAt.current = Date.now();
        setReminder("end");
      } else {
        setReminder((current) => (current === "start" ? "end" : current));
      }
    } catch {
      // A temporary network error must not create a false start/end reminder.
    } finally {
      requestInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (loginVersion <= handledLoginVersion.current) return;
    handledLoginVersion.current = loginVersion;
    void refreshStatus(true);
  }, [loginVersion, refreshStatus]);

  useEffect(() => {
    const checkWhenActive = () => {
      if (document.visibilityState === "visible") {
        void refreshStatus(false);
      }
    };

    checkWhenActive();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshStatus(false);
      }
    }, REMINDER_INTERVAL_MS);

    document.addEventListener("visibilitychange", checkWhenActive);
    window.addEventListener("focus", checkWhenActive);
    window.addEventListener("pageshow", checkWhenActive);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", checkWhenActive);
      window.removeEventListener("focus", checkWhenActive);
      window.removeEventListener("pageshow", checkWhenActive);
    };
  }, [refreshStatus]);

  if (!reminder) return null;

  const isEnding = reminder === "end";

  return (
    <div
      role="status"
      dir="rtl"
      className="fixed left-4 right-4 top-24 z-[70] mx-auto max-w-md rounded-2xl border border-amber-200 bg-white p-4 shadow-xl shadow-slate-900/15 sm:left-auto sm:right-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-700">
          {isEnding ? "⏱" : "📍"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">
            {isEnding ? "یادآوری پایان مأموریت" : "یادآوری شروع مأموریت"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {isEnding
              ? "طبق سوابق سامانه، یک مأموریت هنوز باز است. اگر کارتان به پایان رسیده، لطفاً پایان مأموریت را ثبت کنید."
              : "برای ثبت دقیق زمان و موقعیت شروع فعالیت، لطفاً مأموریت کاری خود را در سامانه آغاز کنید."}
          </p>
        </div>
        <button
          type="button"
          aria-label="بستن یادآوری"
          onClick={() => setReminder(null)}
          className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100"
        >
          ×
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setReminder(null);
            onOpenTracker();
          }}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          نمایش بخش ثبت مأموریت
        </button>
        <button
          type="button"
          onClick={() => setReminder(null)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          فعلاً نه
        </button>
      </div>
      {isEnding ? (
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          در صورت باز بودن برنامه، این یادآوری هر ۳۰ دقیقه بررسی و در صورت باز بودن مأموریت تکرار می‌شود.
        </p>
      ) : null}
    </div>
  );
}
