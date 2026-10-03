import { NavLink } from 'react-router-dom';

export default function SidebarLink({ to, end, icon: Icon, label, badge, onClick, onNavigate }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-btn px-3.5 py-2.5 text-left text-body font-medium text-danger transition-colors hover:bg-[#f8fafc]"
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        {label}
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      end={end ?? to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex w-full items-center justify-between rounded-btn px-3.5 py-2.5 transition-colors',
          isActive
            ? 'bg-primary text-white shadow-card'
            : 'text-slate-600 hover:bg-[#f8fafc]',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex items-center gap-3">
            <Icon
              className="h-4 w-4 shrink-0"
              strokeWidth={2}
              color={isActive ? '#ffffff' : undefined}
            />
            <span className="text-body font-medium">{label}</span>
          </span>
          {badge != null && badge !== '' && (
            <span
              className={`rounded px-1.5 py-0.5 text-label font-semibold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-info-bg text-primary'
              }`}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
