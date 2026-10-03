const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn px-3.5 py-2 text-body font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  primary:
    'bg-primary text-white shadow-card hover:bg-primary-hover',
  outline:
    'border border-border bg-white text-slate-700 shadow-card hover:bg-[#f8fafc]',
  danger: 'bg-[#e11d48] text-white shadow-card hover:bg-[#be123c]',
};

export default function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
