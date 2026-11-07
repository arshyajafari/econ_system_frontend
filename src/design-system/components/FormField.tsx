import type { ReactNode } from "react";

export interface FormFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * Accessible label and helper-text wrapper.
 * The rendered control must use the supplied id and should reference the
 * generated hint/error element through aria-describedby when applicable.
 */
export function FormField({
  id,
  label,
  children,
  hint,
  error,
  required = false,
  className = "",
}: FormFieldProps) {
  const message = error || hint;
  const messageId = message ? `${id}-message` : undefined;

  return (
    <div
      className={[`ui-form-field`, error ? "ui-form-field--invalid" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      <label className="ui-form-field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="ui-form-field__required" aria-hidden="true">
            {" "}*
          </span>
        ) : null}
      </label>
      {children}
      {message ? (
        <p
          className={error ? "ui-form-field__error" : "ui-form-field__hint"}
          id={messageId}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
