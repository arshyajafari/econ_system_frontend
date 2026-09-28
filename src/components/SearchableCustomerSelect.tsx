import { useEffect, useId, useRef, useState } from "react";

export type SearchableCustomer = {
  id: string;
  code: string;
  customer_name: string;
  national_code?: string | null;
  phone_number?: string | null;
  telephone_number?: string | null;
};

type SearchableCustomerSelectProps = {
  value: string;
  selectedCustomer?: SearchableCustomer | null;
  disabled?: boolean;
  onChange: (customer: SearchableCustomer | null) => void;
  searchCustomers: (query: string) => Promise<SearchableCustomer[]>;
  placeholder?: string;
  emptyLabel?: string;
};

const numberFormatter = new Intl.NumberFormat("fa-IR");

export function SearchableCustomerSelect({
  value,
  selectedCustomer = null,
  disabled = false,
  onChange,
  searchCustomers,
  placeholder = "جستجوی مشتری...",
  emptyLabel = "مشتری پیدا نشد",
}: SearchableCustomerSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `customer-options-${useId().replace(/:/g, "")}`;
  const requestRef = useRef(0);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchableCustomer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(async () => {
      const requestId = ++requestRef.current;
      setLoading(true);
      try {
        const result = await searchCustomers(query.trim());
        if (requestId === requestRef.current) {
          const merged = selectedCustomer && !result.some((item) => item.id === selectedCustomer.id)
            ? [selectedCustomer, ...result]
            : result;
          setOptions(merged);
          setActiveIndex(0);
        }
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, query.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, query, searchCustomers, selectedCustomer?.id]);

  function selectCustomer(customer: SearchableCustomer) {
    setQuery("");
    setIsOpen(false);
    onChange(customer);
    inputRef.current?.blur();
  }

  function clear() {
    setQuery("");
    setOptions([]);
    setIsOpen(false);
    onChange(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      setIsOpen(true);
      return;
    }
    if (!isOpen) {
      if (event.key === "Escape") setIsOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(options.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && options[activeIndex]) {
      event.preventDefault();
      selectCustomer(options[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  const displayValue = query || (selectedCustomer ? `${selectedCustomer.code} — ${selectedCustomer.customer_name}` : "");

  return (
    <div ref={rootRef} className="relative">
      <div className={`flex min-h-[44px] items-center rounded-xl border bg-white shadow-sm transition ${isOpen ? "border-gray-900 ring-4 ring-gray-900/5" : "border-gray-200"}`}>
        <input
          ref={inputRef}
          value={displayValue}
          disabled={disabled}
          dir="rtl"
          autoComplete="off"
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-0"
        />
        {selectedCustomer ? (
          <button type="button" tabIndex={-1} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={clear} aria-label="پاک کردن مشتری" className="px-2 text-gray-400 hover:text-gray-700 disabled:opacity-40">
            ×
          </button>
        ) : null}
        <button type="button" tabIndex={-1} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => { inputRef.current?.focus(); setIsOpen(true); }} className="px-3 text-gray-400 hover:text-gray-700 disabled:opacity-40" aria-label="باز کردن فهرست مشتریان">
          <span aria-hidden="true" className="text-xs">⌄</span>
        </button>
      </div>

      {isOpen ? (
        <div id={listboxId} role="listbox" className="absolute inset-x-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">در حال جستجو...</div>
          ) : options.length ? (
            options.map((customer, index) => (
              <button key={customer.id} type="button" role="option" aria-selected={customer.id === value} onMouseDown={(event) => event.preventDefault()} onClick={() => selectCustomer(customer)} className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-right ${index === activeIndex ? "bg-gray-100" : "hover:bg-gray-50"}`}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-900">{customer.customer_name}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{customer.code}{customer.national_code ? ` · کد ملی ${customer.national_code}` : ""}</span>
                </span>
                <span className="shrink-0 text-left text-xs text-gray-500">
                  {customer.phone_number ? <span className="block" dir="ltr">{customer.phone_number}</span> : null}
                  {customer.telephone_number ? <span className="block" dir="ltr">{customer.telephone_number}</span> : null}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <div className="text-sm font-medium text-gray-700">{emptyLabel}</div>
              <div className="mt-1 text-xs text-gray-400">نام، کد مشتری، کد ملی یا شماره تماس را وارد کنید.</div>
            </div>
          )}
          {!query.trim() && options.length > 0 ? (
            <div className="px-3 py-2 text-center text-xs text-gray-400">
              {numberFormatter.format(options.length)} مشتری نمایش داده شد؛ برای جستجوی دقیق‌تر تایپ کنید.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
