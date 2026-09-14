import { useEffect, useState } from "react";
import { gregorianStringToJalali, jalaliStringToGregorian } from "../utils/date";

type Props = { value: string; onChange: (gregorianValue: string) => void; disabled?: boolean; required?: boolean; className?: string; placeholder?: string };

export function JalaliDateInput({ value, onChange, disabled, required, className = "", placeholder = "۱۴۰۵/۰۶/۲۳" }: Props) {
  const [text, setText] = useState(() => gregorianStringToJalali(value));
  useEffect(() => setText(gregorianStringToJalali(value)), [value]);
  function handleChange(next: string) {
    setText(next);
    const gregorian = jalaliStringToGregorian(next);
    if (gregorian) onChange(gregorian);
    else if (!next.trim()) onChange("");
  }
  return <input type="text" inputMode="numeric" dir="ltr" value={text} onChange={(e) => handleChange(e.target.value)} onBlur={() => { const normalized = jalaliStringToGregorian(text); if (normalized) setText(gregorianStringToJalali(normalized)); }} disabled={disabled} required={required} placeholder={placeholder} autoComplete="off" className={className} aria-label="تاریخ جلالی" />;
}
