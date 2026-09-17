import { useNavigate } from "react-router-dom";

type BackButtonProps = {
  fallbackTo: string;
  label: string;
  disabled?: boolean;
  className?: string;
};

export function BackButton({
  fallbackTo,
  label,
  disabled = false,
  className = "",
}: BackButtonProps) {
  const navigate = useNavigate();

  function handleBack() {
    if (disabled) return;

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      aria-label={label}
    >
      <span aria-hidden="true" className="text-base leading-none">←</span>
      <span>{label}</span>
    </button>
  );
}
