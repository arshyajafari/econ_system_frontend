import type { HTMLAttributes, ReactNode } from "react";

export interface TableContainerProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Responsive horizontal-scroll boundary for wide data tables.
 * It does not own table columns, sorting, pagination, selection or row actions.
 */
export function TableContainer({
  children,
  className = "",
  tabIndex = 0,
  role = "region",
  "aria-label": ariaLabel = "جدول داده‌ها",
  ...props
}: TableContainerProps) {
  return (
    <div
      {...props}
      className={["ui-table-container", className].filter(Boolean).join(" ")}
      tabIndex={tabIndex}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
