export default function PageHeader({
  breadcrumbSection,
  breadcrumbPage,
  title,
  description,
  actions,
}) {
  return (
    <div className="flex w-full flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 max-w-[672px] flex-col gap-1">
        <p className="text-secondary font-semibold uppercase tracking-[0.55px] text-slate-400">
          {breadcrumbSection}
          {' / '}
          <span className="font-bold text-primary">{breadcrumbPage}</span>
        </p>
        <h1 className="text-h1 font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="text-body text-slate-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end [&>*]:flex-1 sm:[&>*]:flex-none">
          {actions}
        </div>
      )}
    </div>
  );
}
