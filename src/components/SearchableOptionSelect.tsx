import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableOption = {
  value: string;
  label: string;
  description?: string | null;
};

type SearchableOptionSelectProps = {
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
};

function normalize(value: string): string {
  return value.toLocaleLowerCase("fa").replace(/[\u200c\u200f\u202a-\u202e]/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک").trim();
}

export function SearchableOptionSelect({ value, options, onChange, placeholder = "برای جستجو تایپ کنید...", disabled = false, required = false }: SearchableOptionSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const term = normalize(query);
    return term ? options.filter((option) => normalize(`${option.label} ${option.description ?? ""}`).includes(term)) : options;
  }, [options, query]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        required={required && !value}
        disabled={disabled}
        value={open ? query : selected ? `${selected.label}${selected.description ? ` — ${selected.description}` : ""}` : ""}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (!value) setQuery("");
          setOpen(false);
        }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setQuery("");
          } else if (event.key === "Enter" && open) {
            event.preventDefault();
            if (filteredOptions.length === 1) {
              onChange(filteredOptions[0].value);
              setQuery("");
              setOpen(false);
            }
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
      />
      {open ? (
        <div role="listbox" className="absolute inset-x-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
          {filteredOptions.length ? filteredOptions.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={option.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(option.value); setQuery(""); setOpen(false); }}
              className={`block w-full rounded-md px-3 py-2 text-right text-sm hover:bg-gray-100 ${option.value === value ? "bg-gray-50 font-semibold" : ""}`}>
              <span className="block">{option.label}</span>
              {option.description ? <span className="mt-0.5 block text-xs text-gray-500">{option.description}</span> : null}
            </button>
          )) : <div className="px-3 py-5 text-center text-sm text-gray-500">موردی با این مشخصات پیدا نشد.</div>}
        </div>
      ) : null}
    </div>
  );
}
