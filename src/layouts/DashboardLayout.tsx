import { useCallback, useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUnreadNotificationCount } from "../features/notifications/api/notifications";
import { useAuth } from "../features/auth";
import { EmployeeLocationShare } from "../features/employee_locations/components/EmployeeLocationShare";

type IconName = "dashboard"|"reports"|"customers"|"doctors"|"employees"|"catalog"|"products"|"orders"|"invoices"|"visits"|"samples"|"deliveries"|"inventory"|"returns"|"payments";
type NavConfig = { label: string; to: string; icon: IconName; requiredPermission?: string; adminOnly?: boolean };
const navigation: NavConfig[] = [
  { label: "داشبورد", to: "/dashboard", icon: "dashboard", requiredPermission: "dashboard.view" },
  { label: "گزارش‌ها", to: "/reports", icon: "reports", requiredPermission: "reports.view" },
  { label: "مشتریان", to: "/customers", icon: "customers", requiredPermission: "customers.view" },
  { label: "پزشکان", to: "/doctors", icon: "doctors", requiredPermission: "doctors.view" },
  { label: "کارکنان", to: "/employees", icon: "employees", requiredPermission: "employees.view" },
  { label: "موقعیت کارکنان", to: "/employee-locations", icon: "employees", adminOnly: true },
  { label: "برندها و دسته‌بندی‌ها", to: "/catalog", icon: "catalog", requiredPermission: "brands.view" },
  { label: "محصولات", to: "/products", icon: "products", requiredPermission: "products.view" },
  { label: "سفارش‌ها", to: "/orders", icon: "orders", requiredPermission: "orders.view" },
  { label: "فاکتورها", to: "/invoices", icon: "invoices", requiredPermission: "invoices.view" },
  { label: "ویزیت‌ها", to: "/visits", icon: "visits", requiredPermission: "visits.view" },
  { label: "نمونه‌ها", to: "/samples", icon: "samples", requiredPermission: "samples.view" },
  { label: "ارسال‌ها", to: "/deliveries", icon: "deliveries", requiredPermission: "deliveries.view" },
  { label: "موجودی", to: "/inventory", icon: "inventory", requiredPermission: "inventory_batches.view" },
  { label: "مرجوعی‌ها", to: "/order-returns", icon: "returns", requiredPermission: "order_returns.view" },
  { label: "پرداخت‌ها", to: "/payments", icon: "payments", requiredPermission: "payments.view" },
];

function Icon({ name, size = 20 }: { name: IconName | "bell" | "search" | "menu" | "chevron-left" | "chevron-right"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<string, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    reports: <><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-4 3 2 5-7"/></>,
    customers: <><circle cx="9" cy="8" r="3"/><path d="M3 20c.6-3.4 2.5-5 6-5s5.4 1.6 6 5"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M18 15c1.7.8 2.7 2.3 3 5"/></>,
    doctors: <><circle cx="9" cy="8" r="3"/><path d="M3 20c.6-3.4 2.5-5 6-5s5.4 1.6 6 5"/><path d="M18 8v6"/><path d="M15 11h6"/></>,
    employees: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    catalog: <><path d="M4 6.5 12 3l8 3.5L12 10 4 6.5Z"/><path d="m4 12 8 3.5 8-3.5"/><path d="m4 17.5 8 3.5 8-3.5"/></>,
    products: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></>,
    orders: <><circle cx="9" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.5L21 8H6"/></>,
    invoices: <><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 12h6M9 16h6M9 8h2"/></>,
    visits: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    samples: <><path d="M9 3h6M10 3v5l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 17l-5-9V3"/><path d="M8 15h8"/></>,
    deliveries: <><path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
    inventory: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M8 9v8M16 9v8"/></>,
    returns: <><path d="M9 7H4v5"/><path d="M4 12a8 8 0 1 0 3-6"/><path d="m4 12 3-3"/></>,
    payments: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    "chevron-left": <path d="m14 6-6 6 6 6"/>, "chevron-right": <path d="m10 6 6 6-6 6"/>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function NavItem({ label, to, icon, onNavigate }: { label: string; to: string; icon: IconName; onNavigate: () => void }) {
  return <NavLink to={to} onClick={onNavigate} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
    {({ isActive }) => <><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500 group-hover:text-slate-700"}`}><Icon name={icon} size={18}/></span><span className="truncate">{label}</span></>}
  </NavLink>;
}

export function DashboardLayout() {
  const { user, logout } = useAuth(); const navigate = useNavigate(); const [isSidebarOpen,setIsSidebarOpen]=useState(false); const [isCollapsed,setIsCollapsed]=useState(false); const [unreadCount,setUnreadCount]=useState(0);
  const refreshUnreadCount=useCallback(()=>{void getUnreadNotificationCount().then(setUnreadCount).catch(()=>setUnreadCount(0));},[]);
  useEffect(()=>{refreshUnreadCount();const handler=()=>refreshUnreadCount();window.addEventListener("notifications:changed",handler);return()=>window.removeEventListener("notifications:changed",handler);},[refreshUnreadCount]);
  const closeMobileSidebar=()=>setIsSidebarOpen(false); const roles=user?.roles ?? []; const permissions=user?.permissions ?? []; const isAdmin=roles.includes("admin"); const isSalesVisitor=roles.includes("sales visitor"); const can=(permission:string)=>isAdmin||permissions.includes(permission); const canSeeNav=(item:NavConfig)=>{ if(item.to==="/dashboard"||item.adminOnly) return isAdmin; if(item.to==="/catalog") return isAdmin; if(item.to==="/products"||item.to==="/inventory") return isAdmin||isSalesVisitor; return !item.requiredPermission||can(item.requiredPermission); };
  return <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
    {isSidebarOpen?<button type="button" aria-label="بستن منو" className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px] lg:hidden" onClick={closeMobileSidebar}/>:null}
    <aside className={`fixed inset-y-0 right-0 z-50 flex w-[272px] flex-col border-l border-slate-200 bg-white shadow-xl shadow-slate-900/5 transition-transform duration-200 lg:translate-x-0 ${isSidebarOpen?"translate-x-0":"translate-x-full"} ${isCollapsed?"lg:w-[84px]":""}`}>
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20"><img src="logo.png" alt="econ_system" className="h-auto w-auto rounded-2xl object-contain"/></div>{!isCollapsed?<div className="min-w-0"><strong className="block truncate text-sm font-bold text-slate-900">سیستم ایکان</strong><span className="mt-0.5 block text-xs text-slate-400">پنل مدیریت سفارش‌گیری</span></div>:null}</div>
      <nav aria-label="ناوبری اصلی" className="flex-1 overflow-y-auto px-3 py-5"><div className="space-y-1">{navigation.filter(canSeeNav).map((item)=><NavItem key={item.to} {...item} onNavigate={closeMobileSidebar}/>)}<NavLink to="/notifications" onClick={closeMobileSidebar} className={({isActive})=>`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive?"bg-blue-50 text-blue-700 shadow-sm":"text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${unreadCount>0?"bg-blue-100 text-blue-700":"bg-slate-100 text-slate-500"}`}><Icon name="bell" size={18}/>{unreadCount>0?<span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] font-bold leading-4 text-white">{unreadCount>99?"۹۹+":unreadCount}</span>:null}</span><span className="truncate">پیام‌ها و اعلان‌ها</span></NavLink></div></nav>
      {!isAdmin ? <EmployeeLocationShare /> : null}<div className="border-t border-slate-100 p-3"><div className={`flex items-center gap-3 rounded-xl bg-slate-50 p-3 ${isCollapsed?"justify-center":""}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{user?.employee.full_name?.slice(0,1)??"ک"}</div>{!isCollapsed?<div className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{user?.employee.full_name??"کاربر سیستم"}</span><button type="button" onClick={()=>void logout()} className="mt-0.5 text-xs font-medium text-slate-400 hover:text-red-600">خروج از حساب</button></div>:null}</div></div>
    </aside>
    <div className={`min-h-screen transition-[padding] duration-200 lg:pr-[272px] ${isCollapsed?"lg:pr-[84px]":""}`}><header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="flex h-20 items-center gap-3 px-4 md:px-6"><button type="button" aria-label="باز کردن منو" onClick={()=>setIsSidebarOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"><Icon name="menu"/></button><button type="button" aria-label="جمع کردن منوی کناری" onClick={()=>setIsCollapsed(v=>!v)} className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:flex"><Icon name={isCollapsed?"chevron-right":"chevron-left"}/></button><div className="hidden min-w-0 flex-1 sm:block"><div className="relative max-w-xl"><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" size={18}/></span><input aria-label="جستجو" placeholder="جستجو در سیستم..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-10 pl-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"/></div></div><div className="mr-auto flex items-center gap-2"><button type="button" aria-label="اعلان‌ها" onClick={()=>navigate("/notifications")} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"><Icon name="bell" size={19}/>{unreadCount>0?<span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] font-bold leading-4 text-white">{unreadCount>99?"۹۹+":unreadCount}</span>:null}</button><div className="hidden items-center gap-2 border-r border-slate-200 pr-3 sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{user?.employee.full_name?.slice(0,1)??"ک"}</div><div className="max-w-32"><span className="block truncate text-sm font-semibold text-slate-800">{user?.employee.full_name??"کاربر سیستم"}</span><span className="block text-xs text-slate-400">{roles.includes("admin")?"مدیر سیستم":"کاربر سیستم"}</span></div></div></div></div></header><main className="min-h-[calc(100vh-5rem)]"><Outlet/></main></div>
  </div>;
}
