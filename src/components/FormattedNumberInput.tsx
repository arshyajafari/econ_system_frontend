import type { InputHTMLAttributes } from "react";

export type FormattedNumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string | number;
  onValueChange: (value: string) => void;
};

function formatNumber(value: string | number): string {
  const raw = String(value ?? "").replace(/,/g, "").replace(/[^0-9.]/g, "");
  if (!raw) return "";
  const [integer, ...decimalParts] = raw.split(".");
  const formattedInteger = Number(integer || "0").toLocaleString("en-US");
  return decimalParts.length ? `${formattedInteger}.${decimalParts.join("").slice(0, 2)}` : formattedInteger;
}

export function FormattedNumberInput({ value, onValueChange, className = "", ...props }: FormattedNumberInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={formatNumber(value)}
      onChange={(event) => onValueChange(event.target.value.replace(/,/g, "").replace(/[^0-9.]/g, ""))}
      className={className}
    />
  );
}
