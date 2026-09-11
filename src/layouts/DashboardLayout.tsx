import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth";

const navigation = [
  { label: "داشبورد", to: "/dashboard", icon: "⌂" },
  { label: "گزارش‌ها", to: "/reports", icon: "▥" },
  { label: "مشتریان", to: "/customers", icon: "◉" },
  { label: "پزشکان", to: "/doctors", icon: "♙" },
  { label: "کارکنان", to: "/employees", icon: "♟" },
  { label: "برندها و دسته‌بندی‌ها", to: "/catalog", icon: "◇" },
  { label: "محصولات", to: "/products", icon: "□" },
  { label: "سفارش‌ها", to: "/orders", icon: "🛒" },
  { label: "فاکتورها", to: "/invoices", icon: "▤" },
  { label: "ثبت فاکتور", to: "/invoices/new", icon: "+" },
  { label: "ویزیت‌ها", to: "/visits", icon: "◷" },
  { label: "نمونه‌ها", to: "/samples", icon: "△" },
  { label: "ارسال‌ها", to: "/deliveries", icon: "▱" },
  { label: "موجودی", to: "/inventory", icon: "▣" },
  { label: "مرجوعی‌ها", to: "/order-returns", icon: "↩" },
  { label: "پرداخت‌ها", to: "/payments", icon: "▭" },
];

function NavItem({
  label,
  to,
  icon,
  onNavigate,
}: {
  label: string;
  to: string;
  icon: string;
  onNavigate: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-700 shadow-sm"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`
      }
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500 transition-colors group-[.active]:bg-blue-100">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const closeMobileSidebar = () => setIsSidebarOpen(false);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="بستن منو"
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px] lg:hidden"
          onClick={closeMobileSidebar}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[272px] flex-col border-l border-slate-200 bg-white shadow-xl shadow-slate-900/5 transition-transform duration-200 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } ${isCollapsed ? "lg:w-[84px]" : ""}`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
            E
          </div>
          {!isCollapsed ? (
            <div className="min-w-0">
              <strong className="block truncate text-sm font-bold text-slate-900">
                سیستم مدیریت دارو
              </strong>
              <span className="mt-0.5 block text-xs text-slate-400">
                پنل مدیریت کسب‌وکار
              </span>
            </div>
          ) : null}
        </div>

        <nav aria-label="ناوبری اصلی" className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                onNavigate={closeMobileSidebar}
              />
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className={`flex items-center gap-3 rounded-xl bg-slate-50 p-3 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {user?.employee.full_name?.slice(0, 1) ?? "ک"}
            </div>
            {!isCollapsed ? (
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">
                  {user?.employee.full_name ?? "کاربر سیستم"}
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="mt-0.5 text-xs font-medium text-slate-400 hover:text-red-600"
                >
                  خروج از حساب
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-200 lg:pr-[272px] ${isCollapsed ? "lg:pr-[84px]" : ""}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-20 items-center gap-3 px-4 md:px-6">
            <button
              type="button"
              aria-label="باز کردن منو"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              ☰
            </button>

            <button
              type="button"
              aria-label="جمع کردن منوی کناری"
              onClick={() => setIsCollapsed((value) => !value)}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:flex"
            >
              {isCollapsed ? "→" : "←"}
            </button>

            <div className="hidden min-w-0 flex-1 sm:block">
              <div className="relative max-w-xl">
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                <input
                  aria-label="جستجو"
                  placeholder="جستجو در سیستم..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-10 pl-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div className="mr-auto flex items-center gap-2">
              <button
                type="button"
                aria-label="اعلان‌ها"
                title="اعلان‌ها به‌زودی"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-600 hover:bg-slate-50"
              >
                ♧
              </button>
              <div className="hidden items-center gap-2 border-r border-slate-200 pr-3 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {user?.employee.full_name?.slice(0, 1) ?? "ک"}
                </div>
                <div className="max-w-32">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {user?.employee.full_name ?? "کاربر سیستم"}
                  </span>
                  <span className="block text-xs text-slate-400">مدیر سیستم</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
