import { useEffect } from "react";
import { Button } from "../design-system/components/Button";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLoading, onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="absolute inset-0 bg-gray-950/45 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        dir="rtl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-5 flex items-start gap-4">
            <div
              className={
                variant === "danger"
                  ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
                  : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700"
              }
              aria-hidden="true"
            >
              {variant === "danger" ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 4.6 3.8 16a2 2 0 0 0 1.74 3h12.92a2 2 0 0 0 1.74-3L13.7 4.6a2 2 0 0 0-3.4 0Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 4.6 3.8 16a2 2 0 0 0 1.74 3h12.92a2 2 0 0 0 1.74-3L13.7 4.6a2 2 0 0 0-3.4 0Z" />
                </svg>
              )}
            </div>

            <div className="min-w-0">
              <h2 id="confirm-modal-title" className="text-lg font-bold text-gray-900">
                {title}
              </h2>
              <p id="confirm-modal-description" className="mt-2 text-sm leading-6 text-gray-500">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <Button
              variant="secondary"
              size="md"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>

            <Button
              variant={variant === "danger" ? "dangerSolid" : "primary"}
              size="md"
              onClick={onConfirm}
              loading={isLoading}
              autoFocus
            >
              {isLoading ? "در حال انجام..." : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
