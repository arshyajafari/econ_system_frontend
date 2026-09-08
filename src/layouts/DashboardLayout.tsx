import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../features/auth";

export function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header>
        <div>
          <strong>Econ System</strong>
        </div>

        <div>
          <span>{user?.employee.full_name}</span>

          <button
            type="button"
            onClick={() => {
              void logout();
            }}
          >
            خروج
          </button>
        </div>
      </header>

      <nav
        aria-label="ناوبری اصلی"
        className="border-b border-gray-200 bg-white"
      >
        <div className="flex gap-2 px-4 py-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            داشبورد
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            مشتریان
          </NavLink>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
