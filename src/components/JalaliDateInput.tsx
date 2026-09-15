import { useEffect, useRef, useState } from "react";
import {
  gregorianStringToJalali,
  gregorianToJalali,
  jalaliStringToGregorian,
  jalaliToGregorian,
} from "../utils/date";

type Props = {
  id?: string;
  value: string;
  onChange: (gregorianValue: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
};

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const monthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)));
}

function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

function normalizeInput(value: string): string {
  return normalizeDigits(value).replace(/-/g, "/").replace(/\s+/g, "");
}

function getTodayJalali(): [number, number, number] {
  const today = new Date();
  return gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
}

function getMonthDays(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return jalaliStringToGregorian(`${year}/12/30`) ? 30 : 29;
}

function getWeekdayIndex(year: number, month: number, day: number): number {
  const [gy, gm, gd] = jalaliToGregorian(year, month, day);
  return (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
}

function parseJalali(value: string): [number, number, number] | null {
  const normalized = normalizeInput(value);
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(normalized);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!jalaliStringToGregorian(`${year}/${month}/${day}`)) return null;
  return [year, month, day];
}

export function JalaliDateInput({
  id,
  value,
  onChange,
  disabled,
  required,
  className = "",
  placeholder = "۱۴۰۵/۰۶/۲۳",
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const today = getTodayJalali();
  const selected = parseJalali(gregorianStringToJalali(value));
  const draftDate = draft ? parseJalali(draft) : null;
  const initialCalendarDate = draftDate ?? selected ?? today;
  const [calendarYear, setCalendarYear] = useState(initialCalendarDate[0]);
  const [calendarMonth, setCalendarMonth] = useState(initialCalendarDate[1]);
  const text = draft ?? gregorianStringToJalali(value);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function openCalendar() {
    if (disabled) return;
    const date = draftDate ?? selected ?? today;
    setCalendarYear(date[0]);
    setCalendarMonth(date[1]);
    setIsOpen(true);
  }

  function handleChange(next: string) {
    const normalized = normalizeInput(next);
    setDraft(normalized);
    const gregorian = jalaliStringToGregorian(normalized);
    if (gregorian) onChange(gregorian);
    else if (!normalized) onChange("");
  }

  function selectDate(year: number, month: number, day: number) {
    const jalali = `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
    const gregorian = jalaliStringToGregorian(jalali);
    if (!gregorian) return;
    setDraft(null);
    onChange(gregorian);
    setIsOpen(false);
  }

  function handleBlur() {
    const normalized = normalizeInput(draft ?? gregorianStringToJalali(value));
    const gregorian = jalaliStringToGregorian(normalized);
    if (gregorian) {
      setDraft(null);
      onChange(gregorian);
    } else if (!normalized) {
      setDraft(null);
    }
  }

  function changeMonth(offset: number) {
    let nextYear = calendarYear;
    let nextMonth = calendarMonth + offset;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setCalendarYear(nextYear);
    setCalendarMonth(nextMonth);
  }

  function goToToday() {
    setCalendarYear(today[0]);
    setCalendarMonth(today[1]);
  }

  const monthDays = getMonthDays(calendarYear, calendarMonth);
  const firstWeekday = getWeekdayIndex(calendarYear, calendarMonth, 1);
  const cells = Array.from({ length: firstWeekday + monthDays }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  );
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={text}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-11 ${className}`}
          aria-label="تاریخ جلالی"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={openCalendar}
          disabled={disabled}
          aria-label="باز کردن تقویم جلالی"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-label="تقویم جلالی"
          className="absolute left-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="ماه بعد"
            >
              <span aria-hidden="true">›</span>
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {monthNames[calendarMonth - 1]} {toPersianDigits(calendarYear)}
            </button>
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="ماه قبل"
            >
              <span aria-hidden="true">‹</span>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
            {weekDays.map((day) => (
              <div key={day} className="py-1.5">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} className="h-9" />;

              const isSelected = selected?.[0] === calendarYear && selected?.[1] === calendarMonth && selected?.[2] === day;
              const isToday = today[0] === calendarYear && today[1] === calendarMonth && today[2] === day;

              return (
                <button
                  key={`${calendarYear}-${calendarMonth}-${day}`}
                  type="button"
                  onClick={() => selectDate(calendarYear, calendarMonth, day)}
                  className={`h-9 rounded-lg text-sm transition ${
                    isSelected
                      ? "bg-slate-900 text-white"
                      : isToday
                        ? "border border-slate-300 font-bold text-slate-900 hover:bg-slate-100"
                        : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              امروز
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                onChange("");
                setIsOpen(false);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              پاک کردن
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
