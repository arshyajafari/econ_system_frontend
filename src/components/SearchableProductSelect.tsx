import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { OrderProductOption } from "../features/orders/types/order";

type SearchableProductSelectProps = {
  value: string;
  products: OrderProductOption[];
  usedProductIds?: string[];
  disabled?: boolean;
  onChange: (productId: string) => void;
  placeholder?: string;
};

function normalizeSearchValue(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ/g, "ه");
}

function getProductPrice(product: OrderProductOption): string {
  return product.current_price?.sale_price ?? product.sale_price ?? "";
}

const numberFormatter = new Intl.NumberFormat("fa-IR");
const MAX_RESULTS = 8;

export function SearchableProductSelect({
  value,
  products,
  usedProductIds = [],
  disabled = false,
  onChange,
  placeholder = "جستجوی محصول...",
}: SearchableProductSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = `order-product-options-${useId().replace(/:/g, "")}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedProduct = products.find((product) => product.id === value);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);
    const availableProducts = products.filter((product) => !usedProductIds.includes(product.id));
    if (!normalizedQuery) return availableProducts;

    return availableProducts.filter((product) => {
      const title = normalizeSearchValue(product.title);
      const code = normalizeSearchValue(product.code);
      return title.includes(normalizedQuery) || code.includes(normalizedQuery);
    });
  }, [products, query, usedProductIds]);

  const visibleProducts = filteredProducts.slice(0, MAX_RESULTS);
  const hasMoreResults = filteredProducts.length > MAX_RESULTS;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function selectProduct(product: OrderProductOption) {
    if (usedProductIds.includes(product.id)) return;
    onChange(product.id);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!isOpen || visibleProducts.length === 0) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, visibleProducts.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectProduct(visibleProducts[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className={
          "flex min-h-[44px] items-center rounded-xl border bg-white shadow-sm transition " +
          (isOpen
            ? "border-gray-900 ring-4 ring-gray-900/5"
            : "border-gray-200")
      }
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          dir="rtl"
          autoComplete="off"
          placeholder={selectedProduct ? selectedProduct.title : placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-label="جستجوی محصول"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-0 focus:ring-0"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="باز کردن فهرست محصولات"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            inputRef.current?.focus();
            setIsOpen(true);
          }}
          className="px-3 text-gray-400 transition hover:text-gray-700 disabled:opacity-40"
        >
          <span aria-hidden="true" className="text-xs">⌄</span>
        </button>
      </div>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute inset-x-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
        >
          {visibleProducts.length > 0 ? (
            <>
              {visibleProducts.map((product, index) => {
                const isActive = index === activeIndex;
                const price = getProductPrice(product);
                const stock = product.available_quantity;

                return (
                  <button
                    key={product.id}
                    type="button"
                    role="option"
                    aria-selected={product.id === value}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectProduct(product)}
                    className={
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-right transition " +
                      (isActive ? "bg-gray-100" : "hover:bg-gray-50")
                    }
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {product.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        کد: {product.code}
                      </span>
                    </span>
                    <span className="shrink-0 text-left">
                      {stock !== null && stock !== undefined ? (
                        <span className="block text-xs font-medium text-gray-500">
                          موجودی: {numberFormatter.format(stock)}
                        </span>
                      ) : null}
                      {price ? (
                        <span dir="ltr" className="mt-0.5 block text-xs font-semibold text-gray-700">
                          {numberFormatter.format(Number(price))}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
              {hasMoreResults ? (
                <div className="px-3 py-2 text-center text-xs text-gray-400">
                  {numberFormatter.format(filteredProducts.length - MAX_RESULTS)} محصول دیگر؛ برای محدودتر کردن جستجو تایپ کنید.
                </div>
              ) : null}
            </>
          ) : (
            <div className="px-4 py-6 text-center">
              <div className="text-sm font-medium text-gray-700">محصولی پیدا نشد</div>
              <div className="mt-1 text-xs text-gray-400">
                نام یا کد محصول را دقیق‌تر وارد کنید.
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
