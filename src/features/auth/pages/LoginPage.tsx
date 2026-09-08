import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getDeviceId } from "../../../utils/device";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!loginValue.trim()) {
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
        login: loginValue.trim(),
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
    } catch (error) {
      setError(error instanceof Error ? error.message : "خطا در ورود به سیستم");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <h1>ورود به سیستم</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login">نام کاربری</label>

          <input
            id="login"
            value={loginValue}
            onChange={(event) => setLoginValue(event.target.value)}
            autoComplete="username"
            disabled={isSubmitting || isLoading}
          />
        </div>

        <div>
          <label htmlFor="password">رمز عبور</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting || isLoading}
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </main>
  );
}
