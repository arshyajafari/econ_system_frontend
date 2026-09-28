import { useEffect, useId, useRef, useState } from "react";
import type { Order } from "../features/orders/types/order";

type SearchableOrderSelectProps = {
  value: string;
  selectedOrder?: Order | null;
  disabled?: boolean;
  onChange: (order: Order | null) => void;
  searchOrders: (query: string) => Promise<Order[]>;
  placeholder?: string;
};

export function SearchableOrderSelect({
  value,
  selectedOrder = null,
  disabled = false,
  onChange,
  searchOrders,
  placeholder = "جستجوی سفارش یا مشتری...",
}: SearchableOrderSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `order-options-${useId().replace(/:/g, "")}`;
  const requestRef = useRef(0);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Order[]>([]);
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
        const result = await searchOrders(query.trim());
        if (requestId === requestRef.current) {
          setOptions(selected && !result.some((item) => item.id === selected.id) ? [selected, ...result] : result);
          setActiveIndex(0);
        }
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, query.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, query, searchOrders, selectedOrder]);

  function choose(order: Order) {
    setQuery("");
    setIsOpen(false);
    onChange(order);
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
    if (!isOpen) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(options.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && options[activeIndex]) {
      event.preventDefault();
      choose(options[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  const displayValue = query || (selectedOrder ? `${selectedOrder.code} — ${selectedOrder.customer?.customer_name ?? "مشتری نامشخص"}` : "");

  return (
    <div ref={rootRef} className="relative">
      <div className={`flex min-h-[44px] items-center rounded-xl border bg-white shadow-sm ${isOpen ? "border-gray-900 ring-4 ring-gray-900/5" : "border-gray-200"}`}>
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
          className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:ring-0"
        />
        {selectedOrder ? (
          <button type="button" tabIndex={-1} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={clear} className="px-2 text-gray-400 hover:text-gray-700" aria-label="پاک کردن سفارش">×</button>
        ) : null}
        <button type="button" tabIndex={-1} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => { inputRef.current?.focus(); setIsOpen(true); }} className="px-3 text-gray-400 hover:text-gray-700" aria-label="باز کردن فهرست سفارش‌ها">⌄</button>
      </div>
      {isOpen ? (
        <div id={listboxId} role="listbox" className="absolute inset-x-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">در حال جستجو...</div>
          ) : options.length ? (
            options.map((order, index) => (
              <button key={order.id} type="button" role="option" aria-selected={order.id === value} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(order)} className={`block w-full rounded-lg px-3 py-2.5 text-right ${index === activeIndex ? "bg-gray-100" : "hover:bg-gray-50"}`}>
                <span className="block text-sm font-semibold text-gray-900">{order.code}</span>
                <span className="mt-0.5 block truncate text-xs text-gray-500">{order.customer?.customer_name ?? "مشتری نامشخص"}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-500">سفارشی با این مشخصات پیدا نشد.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
