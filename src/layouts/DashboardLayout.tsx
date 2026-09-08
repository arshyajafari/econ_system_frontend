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

      <nav aria-label="ناوبری اصلی">
        <NavLink to="/dashboard">داشبورد</NavLink>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
