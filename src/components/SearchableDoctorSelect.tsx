import { useEffect, useId, useRef, useState } from "react";
import type { Doctor } from "../features/doctors/types/doctor";

export type SearchableDoctor = Pick<
  Doctor,
  "id" | "first_name" | "last_name"
> & {
  code?: string | null;
  phone_number?: string | null;
  clinic_name?: string | null;
  specialty?: string | null;
};

type SearchableDoctorSelectProps = {
  value: string;
  selectedDoctor?: SearchableDoctor | null;
  disabled?: boolean;
  onChange: (doctor: SearchableDoctor | null) => void;
  searchDoctors: (query: string) => Promise<SearchableDoctor[]>;
  placeholder?: string;
  emptyLabel?: string;
};

export function SearchableDoctorSelect({
  value,
  selectedDoctor = null,
  disabled = false,
  onChange,
  searchDoctors,
  placeholder = "جستجوی پزشک...",
  emptyLabel = "پزشکی پیدا نشد",
}: SearchableDoctorSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `doctor-options-${useId().replace(/:/g, "")}`;
  const requestRef = useRef(0);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchableDoctor[]>([]);
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
    const timer = window.setTimeout(
      async () => {
        const requestId = ++requestRef.current;
        setLoading(true);
        try {
          const result = await searchDoctors(query.trim());
          if (requestId === requestRef.current) {
            const merged =
              selectedDoctor &&
              !result.some((item) => item.id === selectedDoctor.id)
                ? [selectedDoctor, ...result]
                : result;
            setOptions(merged);
            setActiveIndex(0);
          }
        } finally {
          if (requestId === requestRef.current) setLoading(false);
        }
      },
      query.trim() ? 250 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [isOpen, query, searchDoctors, selectedDoctor]);

  function selectDoctor(doctor: SearchableDoctor) {
    setQuery("");
    setIsOpen(false);
    onChange(doctor);
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
      setActiveIndex((current) =>
        Math.min(current + 1, Math.max(options.length - 1, 0)),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && options[activeIndex]) {
      event.preventDefault();
      selectDoctor(options[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  const displayValue =
    query ||
    (selectedDoctor
      ? `${selectedDoctor.code ? `${selectedDoctor.code} — ` : ""}${selectedDoctor.first_name} ${selectedDoctor.last_name}`
      : "");

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`flex min-h-[44px] items-center rounded-xl border bg-white shadow-sm transition ${isOpen ? "border-gray-900 ring-4 ring-gray-900/5" : "border-gray-200"}`}
      >
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
        {selectedDoctor ? (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
            aria-label="پاک کردن پزشک"
            className="px-2 text-gray-400 hover:text-gray-700 disabled:opacity-40"
          >
            ×
          </button>
        ) : null}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            inputRef.current?.focus();
            setIsOpen(true);
          }}
          className="px-3 text-gray-400 hover:text-gray-700 disabled:opacity-40"
          aria-label="باز کردن فهرست پزشکان"
        >
          <span aria-hidden="true" className="text-xs">
            ⌄
          </span>
        </button>
      </div>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute inset-x-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
        >
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              در حال جستجو...
            </div>
          ) : options.length ? (
            options.map((doctor, index) => (
              <button
                key={doctor.id}
                type="button"
                role="option"
                aria-selected={doctor.id === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectDoctor(doctor)}
                className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-right ${index === activeIndex ? "bg-gray-100" : "hover:bg-gray-50"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-900">
                    {doctor.first_name} {doctor.last_name}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {doctor.code} · {doctor.specialty}
                  </span>
                </span>
                <span className="shrink-0 text-left text-xs text-gray-500">
                  {doctor.phone_number ? (
                    <span className="block" dir="ltr">
                      {doctor.phone_number}
                    </span>
                  ) : null}
                  {doctor.clinic_name ? (
                    <span className="block max-w-36 truncate">
                      {doctor.clinic_name}
                    </span>
                  ) : null}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <div className="text-sm font-medium text-gray-700">
                {emptyLabel}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                نام، کد پزشک، تخصص، کلینیک یا شماره تماس را وارد کنید.
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
