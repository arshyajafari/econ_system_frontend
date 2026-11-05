import { useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import {
  getMyDailyLocationCheckin,
  sendMyDailyLocationCheckin,
  type EmployeeLocation,
} from "../api/employeeLocations";

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
      timeout: 25000,
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyDailyLocationCheckin()
      .then((value) => {
        if (cancelled) return;
        setLocation(value);
        setOpen(value === null);
        setChecked(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMessage(errorMessage(error));
        setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      setOpen(false);
      setMessage(
        position.coords.accuracy > 100
          ? `موقعیت ثبت شد؛ دقت GPS حدود ${Math.round(position.coords.accuracy)} متر است و ممکن است دقیق نباشد.`
          : "موقعیت مکانی امروز با موفقیت ثبت شد."
      );
    } catch (error: unknown) {
      setMessage(errorMessage(error));
      setOpen(true);
    } finally {
      setBusy(false);
    }
  };

  if (!checked && !message) return null;

  return (
    <>
      <div className="hidden items-center sm:flex">
        {location ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            موقعیت امروز ثبت شده
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setMessage(null);
            }}
            className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
          >
            موقعیت امروز ثبت نشده · ثبت موقعیت
          </button>
        )}
      </div>

      {open && !location ? (
        <div
          role="status"
          dir="rtl"
          className="fixed left-4 right-4 top-24 z-[60] mx-auto max-w-md rounded-2xl border border-blue-100 bg-white p-4 shadow-xl shadow-slate-900/15 sm:left-auto sm:right-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">یادآوری ثبت موقعیت مکانی</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                لطفاً برای تکمیل اطلاعات حضور کاری، موقعیت مکانی فعلی خود را ثبت کنید.
                ثبت موقعیت اختیاری است و انجام ندادن آن هیچ محدودیتی در سامانه ایجاد نمی‌کند.
              </p>
            </div>
            <button
              type="button"
              aria-label="بستن یادآوری"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100"
            >
              ×
            </button>
          </div>
          {message ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
              {message}
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void register()}
              disabled={busy}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "در حال ثبت..." : "ثبت موقعیت"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setMessage(null);
              }}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              فعلاً نه
            </button>
          </div>
        </div>
      ) : null}

      {message && !open ? (
        <div
          role="status"
          dir="rtl"
          className="fixed bottom-4 left-4 z-[60] max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-700 shadow-lg"
        >
          {message}
        </div>
      ) : null}
    </>
  );
}
