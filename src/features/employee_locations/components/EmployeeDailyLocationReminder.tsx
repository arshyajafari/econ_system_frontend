import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../../api/client";
import {
  getMyDailyLocationCheckin,
  sendMyDailyLocationCheckin,
  type EmployeeLocation,
} from "../api/employeeLocations";

const REMINDER_VISIBLE_MS = 10_000;
const ACTIVATION_DEBOUNCE_MS = 1_500;

function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("مرورگر این دستگاه از مکان‌یابی پشتیبانی نمی‌کند."));
      return;
    }
    if (!window.isSecureContext) {
      reject(new Error("برای دریافت موقعیت مکانی، سایت باید با HTTPS باز شود."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 25_000,
    });
  });
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = Number((error as { code: unknown }).code);
    if (code === 1) return "اجازه دسترسی به موقعیت مکانی داده نشد. مجوز GPS مرورگر را بررسی کنید.";
    if (code === 2) return "موقعیت مکانی در دسترس نیست. GPS دستگاه یا اتصال اینترنت را بررسی کنید.";
    if (code === 3) return "دریافت موقعیت بیش از حد طول کشید؛ دوباره تلاش کنید.";
  }
  return error instanceof Error ? error.message : "ثبت موقعیت انجام نشد؛ دوباره تلاش کنید.";
}

export function EmployeeDailyLocationReminder() {
  const [location, setLocation] = useState<EmployeeLocation | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reminderVisible, setReminderVisible] = useState(false);
  const reminderTimer = useRef<number | null>(null);
  const requestInFlight = useRef(false);
  const lastActivationAt = useRef(0);

  const hideReminder = useCallback(() => {
    setReminderVisible(false);
    if (reminderTimer.current !== null) {
      window.clearTimeout(reminderTimer.current);
      reminderTimer.current = null;
    }
  }, []);

  const showReminder = useCallback(() => {
    setReminderVisible(true);
    if (reminderTimer.current !== null) {
      window.clearTimeout(reminderTimer.current);
    }
    reminderTimer.current = window.setTimeout(() => {
      setReminderVisible(false);
      reminderTimer.current = null;
    }, REMINDER_VISIBLE_MS);
  }, []);

  const refreshCheckin = useCallback(async (force = false) => {
    if (requestInFlight.current) return;
    const now = Date.now();
    if (!force && now - lastActivationAt.current < ACTIVATION_DEBOUNCE_MS) return;
    lastActivationAt.current = now;
    requestInFlight.current = true;

    try {
      const value = await getMyDailyLocationCheckin();
      setLocation(value);
      setChecked(true);
      setMessage(null);
      if (value) hideReminder();
      else showReminder();
    } catch (error: unknown) {
      setMessage(errorMessage(error));
      setChecked(true);
    } finally {
      requestInFlight.current = false;
    }
  }, [hideReminder, showReminder]);

  useEffect(() => {
    const checkWhenActive = () => {
      if (document.visibilityState === "visible") {
        void refreshCheckin();
      }
    };

    void refreshCheckin(true);
    document.addEventListener("visibilitychange", checkWhenActive);
    window.addEventListener("focus", checkWhenActive);
    window.addEventListener("pageshow", checkWhenActive);

    return () => {
      document.removeEventListener("visibilitychange", checkWhenActive);
      window.removeEventListener("focus", checkWhenActive);
      window.removeEventListener("pageshow", checkWhenActive);
      if (reminderTimer.current !== null) {
        window.clearTimeout(reminderTimer.current);
      }
    };
  }, [refreshCheckin]);

  const register = async () => {
    if (busy || location) return;
    setBusy(true);
    setMessage("در حال دریافت موقعیت مکانی...");
    try {
      const position = await currentPosition();
      const saved = await sendMyDailyLocationCheckin({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Number.isFinite(position.coords.accuracy)
          ? position.coords.accuracy
          : undefined,
        client_operation_id: crypto.randomUUID(),
      });
      setLocation(saved);
      hideReminder();
      setMessage(
        position.coords.accuracy > 100
          ? `موقعیت ثبت شد؛ دقت GPS حدود ${Math.round(position.coords.accuracy)} متر است و ممکن است دقیق نباشد.`
          : "موقعیت مکانی امروز با موفقیت ثبت شد."
      );
    } catch (error: unknown) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mx-3 mb-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-800">ثبت موقعیت روزانه</div>
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
              !checked
                ? "bg-slate-100 text-slate-600"
                : location
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
            }`}
          >
            {!checked ? "در حال بررسی" : location ? "امروز ثبت شده" : "ثبت نشده"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          {location
            ? "موقعیت مکانی امروز شما با موفقیت ثبت شده است."
            : "برای ثبت موقعیت فعلی، دکمه زیر را انتخاب کنید."}
        </p>
        <button
          type="button"
          onClick={() => void register()}
          disabled={!checked || busy || Boolean(location)}
          className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? "در حال دریافت و ثبت GPS..."
            : location
              ? "موقعیت امروز ثبت شده"
              : "ثبت موقعیت امروز"}
        </button>
        {message ? (
          <p role="status" className="mt-2 text-xs leading-5 text-slate-600">
            {message}
          </p>
        ) : null}
      </div>

      {reminderVisible && !location ? (
        <div
          role="status"
          aria-live="polite"
          dir="rtl"
          className="fixed left-4 right-4 top-24 z-[70] mx-auto max-w-md rounded-2xl border border-amber-200 bg-white p-4 shadow-xl shadow-slate-900/15 sm:left-auto sm:right-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-700">
              📍
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">یادآوری ثبت موقعیت مکانی</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                موقعیت مکانی امروز شما هنوز ثبت نشده است. برای ثبت آن می‌توانید از بخش «ثبت موقعیت روزانه» در منوی کناری استفاده کنید.
              </p>
              <p className="mt-2 text-[11px] text-slate-400">این پیام پس از ۱۰ ثانیه بسته می‌شود.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
