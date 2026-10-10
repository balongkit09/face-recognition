import { Plus } from 'lucide-react';

export default function BoxedPlusButton({
  onClick,
  label = 'Add',
  disabled = false,
  ariaLabel,
  className = '',
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn border border-border bg-white px-3 py-1.5 text-body font-medium text-slate-800 shadow-card transition-colors hover:bg-[#f8fafc] disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary text-white">
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </span>
      {label}
    </button>
  );
}

export function BoxedPlusIcon({ onClick, disabled = false, label, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title || label}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-primary shadow-sm transition-colors hover:bg-[#f8fafc] disabled:pointer-events-none disabled:opacity-40"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}
