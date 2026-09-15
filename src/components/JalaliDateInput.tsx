import { useState } from "react";
import { gregorianStringToJalali, jalaliStringToGregorian } from "../utils/date";

type Props = { id?: string; value: string; onChange: (gregorianValue: string) => void; disabled?: boolean; required?: boolean; className?: string; placeholder?: string };
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
function normalizeDigits(value: string): string { return value.replace(/[۰-۹]/g, digit => String(persianDigits.indexOf(digit))); }
function normalizeInput(value: string): string { return normalizeDigits(value).replace(/-/g, "/").replace(/\s+/g, ""); }
export function JalaliDateInput({ id, value, onChange, disabled, required, className = "", placeholder = "۱۴۰۵/۰۶/۲۳" }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? gregorianStringToJalali(value);
  function handleChange(next: string) {
    const normalized = normalizeInput(next);
    setDraft(normalized);
    const gregorian = jalaliStringToGregorian(normalized);
    if (gregorian) onChange(gregorian);
    else if (!normalized) onChange("");
  }
  function handleBlur() {
    const normalized = normalizeInput(draft ?? gregorianStringToJalali(value));
    const gregorian = jalaliStringToGregorian(normalized);
    if (gregorian) { setDraft(null); onChange(gregorian); }
    else if (!normalized) setDraft(null);
  }
  return <input id={id} type="text" inputMode="numeric" dir="ltr" value={text} onChange={event => handleChange(event.target.value)} onBlur={handleBlur} disabled={disabled} required={required} placeholder={placeholder} autoComplete="off" className={className} aria-label="تاریخ جلالی" />;
}
