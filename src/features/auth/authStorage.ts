import type { AuthSession, AuthUser } from "./types/auth";

const AUTH_STORAGE_KEY = "econ_auth_session";

function normalizeUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const user = value as Partial<AuthUser>;

  if (typeof user.id !== "string" || typeof user.login !== "string") {
    return null;
  }

  if (!user.employee || typeof user.employee !== "object") {
    return null;
  }

  const employee = user.employee as Partial<AuthUser["employee"]>;

  if (
    typeof employee.id !== "string" ||
    typeof employee.full_name !== "string" ||
    typeof employee.phone_number !== "string"
  ) {
    return null;
  }

  return {
    id: user.id,
    login: user.login,
    roles: Array.isArray(user.roles) ? user.roles.filter((role): role is string => typeof role === "string") : [],
    permissions: Array.isArray(user.permissions)
      ? user.permissions.filter((permission): permission is string => typeof permission === "string")
      : [],
    employee: {
      id: employee.id,
      full_name: employee.full_name,
      phone_number: employee.phone_number,
    },
  };
}

function normalizeSession(value: unknown): AuthSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const session = value as Partial<AuthSession>;

  if (typeof session.token !== "string" || session.token.length === 0) {
    return null;
  }

  const user = normalizeUser(session.user);

  if (!user) {
    return null;
  }

  return { token: session.token, user };
}

export function getAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const normalized = normalizeSession(JSON.parse(raw) as unknown);

    if (!normalized) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return normalized;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function setAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("econ:auth-changed"));
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event("econ:auth-changed"));
}
