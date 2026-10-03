export default function StatCard({
  label,
  value,
  hint,
  badge,
  badgeTone = 'success',
  icon: Icon,
}) {
  const badgeClass =
    badgeTone === 'info'
      ? 'bg-info-bg text-info-text'
      : 'bg-success-bg text-success-text';

  return (
    <article className="flex min-h-[112px] items-start justify-between gap-3 rounded-card border border-border-light bg-white p-4 shadow-card sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-label font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          {badge && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-label font-semibold ${badgeClass}`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="mt-2 text-[28px] font-bold leading-none tracking-tight text-slate-900 sm:text-[32px]">
          {value}
        </p>
        {hint && (
          <p className="mt-2 text-secondary text-slate-400">{hint}</p>
        )}
      </div>
      {Icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-bg text-primary">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      )}
    </article>
  );
}
