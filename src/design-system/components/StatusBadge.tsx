import type { HTMLAttributes, ReactNode } from "react";

export type StatusBadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface StatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<StatusBadgeVariant, string> = {
  neutral: "ui-status-badge--neutral",
  info: "ui-status-badge--info",
  success: "ui-status-badge--success",
  warning: "ui-status-badge--warning",
  danger: "ui-status-badge--danger",
};

/** Visual-only status indicator. Workflow status mapping stays in each feature. */
export function StatusBadge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      {...props}
      className={["ui-status-badge", variantClasses[variant], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
