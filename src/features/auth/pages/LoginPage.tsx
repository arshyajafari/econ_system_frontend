import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getDeviceId } from "../../../utils/device";
import { useAuth } from "../hooks/useAuth";

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isBusy = isSubmitting || isLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedLogin = loginValue.trim();

    if (!normalizedLogin) {
      setError("نام کاربری را وارد کنید.");
      return;
    }

    if (!password) {
      setError("رمز عبور را وارد کنید.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login({
        login: normalizedLogin,
        password,
        device_id: getDeviceId(),
        platform: "web",
        platform_version: navigator.userAgent,
      });

      const state = location.state as LoginLocationState | null;

      const redirectPath =
        state?.from?.pathname && state.from.pathname !== "/login"
          ? state.from.pathname
          : "/dashboard";

      navigate(redirectPath, { replace: true });
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "خطا در ورود به سیستم.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">ورود به سیستم</h1>

          <p className="mt-2 text-sm text-gray-500">
            برای ادامه وارد حساب کاربری خود شوید.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="login"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              نام کاربری
            </label>

            <input
              id="login"
              name="login"
              type="text"
              value={loginValue}
              onChange={(event) => setLoginValue(event.target.value)}
              autoComplete="username"
              autoFocus
              disabled={isBusy}
              placeholder="نام کاربری"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              رمز عبور
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={isBusy}
              placeholder="رمز عبور"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          {error ? (
            <p
              role="alert"
              aria-live="polite"
              className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isBusy}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "در حال ورود..." : "ورود"}
          </button>
        </form>
      </section>
    </main>
  );
}
