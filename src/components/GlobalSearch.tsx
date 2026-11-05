import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers } from '../features/customers/services/customersApi';
import { getDoctors } from '../features/doctors/services/doctorsApi';
import { getEmployees } from '../features/employees/services/employeesApi';
import { getOrders } from '../features/orders/services/ordersApi';
import { getProducts } from '../features/products/services/productsApi';

type SearchSections = {
    customers: boolean;
    doctors: boolean;
    employees: boolean;
    orders: boolean;
    products: boolean;
};

type SearchResult = {
    id: string;
    kind: keyof SearchSections;
    kindLabel: string;
    title: string;
    detail: string;
    href: string;
};

type Props = {
    sections: SearchSections;
};

function normalizeSearchTerm(value: string): string {
    return value
        .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
        .trim();
}

const kindLabels: Record<keyof SearchSections, string> = {
    customers: 'مشتری',
    doctors: 'پزشک',
    employees: 'کارمند',
    orders: 'سفارش',
    products: 'محصول',
};

export function GlobalSearch({ sections }: Props) {
    const navigate = useNavigate();
    const rootRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, []);

    useEffect(() => {
        const term = normalizeSearchTerm(query);
        const requestId = ++requestIdRef.current;

        if (term.length < 2) return;

        const timeoutId = window.setTimeout(async () => {
            const tasks: Array<Promise<SearchResult[]>> = [];

            if (sections.customers) {
                tasks.push(
                    getCustomers({ search: term, page: 1, per_page: 10 }).then((response) =>
                        response.data.map((item) => ({
                            id: item.id,
                            kind: 'customers' as const,
                            kindLabel: kindLabels.customers,
                            title: item.customer_name,
                            detail: [item.code, item.phone_number].filter(Boolean).join(' · '),
                            href: '/customers?search=' + encodeURIComponent(term),
                        }))
                    )
                );
            }

            if (sections.doctors) {
                tasks.push(
                    getDoctors({ search: term, page: 1, per_page: 10 }).then((response) =>
                        response.data.map((item) => ({
                            id: item.id,
                            kind: 'doctors' as const,
                            kindLabel: kindLabels.doctors,
                            title: [item.first_name, item.last_name].filter(Boolean).join(' '),
                            detail: [item.code, item.specialty].filter(Boolean).join(' · '),
                            href: '/doctors?search=' + encodeURIComponent(term),
                        }))
                    )
                );
            }

            if (sections.employees) {
                tasks.push(
                    getEmployees({ search: term, page: 1, per_page: 10 }).then((response) =>
                        response.data.map((item) => ({
                            id: item.id,
                            kind: 'employees' as const,
                            kindLabel: kindLabels.employees,
                            title: [item.first_name, item.last_name].filter(Boolean).join(' '),
                            detail: [item.code, item.phone_number].filter(Boolean).join(' · '),
                            href: '/employees?search=' + encodeURIComponent(term),
                        }))
                    )
                );
            }

            if (sections.orders) {
                tasks.push(
                    getOrders({ search: term, page: 1, per_page: 10 }).then((response) =>
                        response.data.map((item) => ({
                            id: item.id,
                            kind: 'orders' as const,
                            kindLabel: kindLabels.orders,
                            title: item.code,
                            detail: item.customer?.customer_name ?? 'بدون نام مشتری',
                            href: '/orders/' + encodeURIComponent(item.id),
                        }))
                    )
                );
            }

            if (sections.products) {
                tasks.push(
                    getProducts({ search: term, page: 1, per_page: 10 }).then((response) =>
                        response.data.map((item) => ({
                            id: item.id,
                            kind: 'products' as const,
                            kindLabel: kindLabels.products,
                            title: item.title,
                            detail: [item.code, item.category?.title].filter(Boolean).join(' · '),
                            href: '/products?search=' + encodeURIComponent(term),
                        }))
                    )
                );
            }

            const settled = await Promise.allSettled(tasks);
            if (requestId !== requestIdRef.current) return;

            const nextResults = settled.flatMap((result) =>
                result.status === 'fulfilled' ? result.value : []
            );
            setResults(nextResults);
            setFailed(tasks.length > 0 && settled.every((result) => result.status === 'rejected'));
            setActiveIndex(0);
            setLoading(false);
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
            requestIdRef.current += 1;
        };
    }, [
        query,
        sections.customers,
        sections.doctors,
        sections.employees,
        sections.orders,
        sections.products,
    ]);

    const selectResult = (result: SearchResult) => {
        navigate(result.href);
        setQuery('');
        setResults([]);
        setLoading(false);
        setFailed(false);
        setOpen(false);
        setActiveIndex(0);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            setOpen(false);
            return;
        }
        if (event.key === 'ArrowDown' && results.length > 0) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => Math.min(current + 1, results.length - 1));
            return;
        }
        if (event.key === 'ArrowUp' && results.length > 0) {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
            return;
        }
        if (event.key === 'Enter' && open && results[activeIndex]) {
            event.preventDefault();
            selectResult(results[activeIndex]);
        }
    };

    return (
        <div ref={rootRef} className="relative w-full min-w-0">
            <label className="sr-only" htmlFor="global-system-search">
                جست‌وجوی سراسری
            </label>
            <span className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">
                <svg
                    viewBox="0 0 24 24"
                    className="h-[18px] w-[18px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                >
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m16 16 5 5" />
                </svg>
            </span>
            <input
                id="global-system-search"
                type="text"
                inputMode="search"
                placeholder="جستجو سیستم"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open && query.trim().length >= 2}
                aria-controls="global-system-search-results"
                autoComplete="off"
                value={query}
                onChange={(event) => {
                    const nextQuery = event.target.value;
                    const hasSearchTerm = normalizeSearchTerm(nextQuery).length >= 2;
                    setQuery(nextQuery);
                    setOpen(hasSearchTerm);
                    if (hasSearchTerm) {
                        setLoading(true);
                        setFailed(false);
                    } else {
                        setResults([]);
                        setLoading(false);
                        setFailed(false);
                        setActiveIndex(0);
                    }
                }}
                onFocus={() => {
                    if (query.trim().length >= 2) setOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 pr-10 pl-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
            {query ? (
                <button
                    type="button"
                    aria-label="پاک کردن جست‌وجو"
                    onClick={() => {
                        setQuery('');
                        setResults([]);
                        setLoading(false);
                        setFailed(false);
                        setOpen(false);
                        setActiveIndex(0);
                    }}
                    className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                    ×
                </button>
            ) : null}

            {open && query.trim().length >= 2 ? (
                <div
                    id="global-system-search-results"
                    role="listbox"
                    aria-label="نتایج جست‌وجو"
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] max-h-[min(65vh,28rem)] w-full min-w-[min(100%,22rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15"
                >
                    {loading ? (
                        <div
                            className="flex items-center justify-center gap-2 px-4 py-7 text-sm text-slate-500"
                            role="status"
                        >
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                            در حال جست‌وجو...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((result, index) => (
                                <button
                                    key={result.kind + ':' + result.id}
                                    type="button"
                                    role="option"
                                    aria-selected={activeIndex === index}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => selectResult(result)}
                                    className={
                                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition ' +
                                        (activeIndex === index
                                            ? 'bg-blue-50 text-blue-950'
                                            : 'text-slate-700 hover:bg-slate-50')
                                    }
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                                        {result.kindLabel.slice(0, 1)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold">
                                            {result.title}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                                            {result.detail || result.kindLabel}
                                        </span>
                                    </span>
                                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                                        {result.kindLabel}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-7 text-center">
                            <p className="text-sm font-semibold text-slate-700">
                                {failed
                                    ? 'ارتباط با سرویس جست‌وجو برقرار نشد'
                                    : 'نتیجه‌ای پیدا نشد'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {failed
                                    ? 'اتصال شبکه را بررسی کنید و دوباره تلاش کنید.'
                                    : 'عبارت دیگری وارد کنید یا املای آن را بررسی کنید.'}
                            </p>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
