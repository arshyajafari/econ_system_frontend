import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../../api/client";
import { sendMyLocation } from "../api/employeeLocations";

export function EmployeeLocationShare() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastSentAt = useRef(0);

  const sendPosition = useCallback(async (position: GeolocationPosition) => {
    const now = Date.now();
    if (now - lastSentAt.current < 30000) return;
    lastSentAt.current = now;
    try {
      await sendMyLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        source: "browser",
      });
      setMessage("موقعیت با موفقیت برای مدیر ارسال شد.");
    } catch (error: unknown) {
      setMessage(error instanceof ApiError ? error.message : "ارسال موقعیت انجام نشد.");
    }
  }, []);

  const stop = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setMessage("مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند.");
      return;
    }
    setBusy(true);
    setMessage("در حال دریافت اجازه موقعیت مکانی...");
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setBusy(false);
        void sendPosition(position);
      },
      (error) => {
        setBusy(false);
        stop();
        setEnabled(false);
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "اجازه دسترسی به موقعیت مکانی داده نشد."
            : "دریافت موقعیت مکانی با خطا مواجه شد.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 },
    );
    setEnabled(true);
  }, [sendPosition, stop]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="mx-3 mb-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">موقعیت مکانی</div>
          <div className="mt-1 text-xs text-slate-500">
            {enabled ? "موقعیت شما برای مدیر در حال بروزرسانی است." : "برای ثبت موقعیت، اشتراک‌گذاری را فعال کنید."}
          </div>
        </div>
        <button
          type="button"
          onClick={enabled ? stop : start}
          disabled={busy}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "در حال دریافت..." : enabled ? "توقف" : "اشتراک موقعیت"}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
