import type { InputHTMLAttributes } from "react";

export type FormattedNumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string | number;
  onValueChange: (value: string) => void;
  maxDecimalPlaces?: number;
};

function formatNumber(value: string | number, maxDecimalPlaces = 2): string {
  const raw = String(value ?? "").replace(/,/g, "").replace(/[^0-9.]/g, "");
  if (!raw) return "";
  const [integer, ...decimalParts] = raw.split(".");
  const formattedInteger = Number(integer || "0").toLocaleString("en-US");
  return decimalParts.length ? `${formattedInteger}.${decimalParts.join("").slice(0, maxDecimalPlaces)}` : formattedInteger;
}

export function FormattedNumberInput({ value, onValueChange, className = "", maxDecimalPlaces = 2, ...props }: FormattedNumberInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={formatNumber(value, maxDecimalPlaces)}
      onChange={(event) => onValueChange(event.target.value.replace(/,/g, "").replace(/[^0-9.]/g, ""))}
      className={className}
    />
  );
}
