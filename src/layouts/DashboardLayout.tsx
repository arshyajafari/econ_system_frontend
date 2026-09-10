import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../features/auth";

export function DashboardLayout() {
  const { user, logout } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${
      isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div>
      <header>
        <div>
          <strong>Econ System</strong>
        </div>
        <div>
          <span>{user?.employee.full_name}</span>
          <button type="button" onClick={() => { void logout(); }}>
            خروج
          </button>
        </div>
      </header>

      <nav aria-label="ناوبری اصلی" className="border-b border-gray-200 bg-white">
        <div className="flex flex-wrap gap-2 px-4 py-2">
          <NavLink to="/dashboard" className={navClass}>داشبورد</NavLink>
          <NavLink to="/customers" className={navClass}>مشتریان</NavLink>
          <NavLink to="/doctors" className={navClass}>پزشکان</NavLink>
          <NavLink to="/products" className={navClass}>محصولات</NavLink>
          <NavLink to="/orders" className={navClass}>سفارش‌ها</NavLink>
          <NavLink to="/order-returns" className={navClass}>مرجوعی‌ها</NavLink>
          <NavLink to="/payments" className={navClass}>پرداخت‌ها</NavLink>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
