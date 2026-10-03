// EDIT HERE to add new status colors
const STATUS_STYLES = {
  Active: {
    bg: 'bg-success-bg',
    text: 'text-success-text',
    dot: 'bg-success-dot',
  },
  Enrolled: {
    bg: 'bg-info-bg',
    text: 'text-info-text',
    dot: 'bg-info-dot',
  },
  'In Session': {
    bg: 'bg-info-bg',
    text: 'text-info-text',
    dot: 'bg-info-dot',
  },
  'On Campus': {
    bg: 'bg-success-bg',
    text: 'text-success-text',
    dot: 'bg-success-dot',
  },
  Teaching: {
    bg: 'bg-info-bg',
    text: 'text-info-text',
    dot: 'bg-info-dot',
  },
  Inactive: {
    bg: 'bg-[#f8fafc]',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  'Off Campus': {
    bg: 'bg-[#f8fafc]',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  // Schedule statuses
  Open: {
    bg: 'bg-success-bg',
    text: 'text-success-text',
    dot: 'bg-success-dot',
  },
  Full: {
    bg: 'bg-[#fffbeb]',
    text: 'text-[#b45309]',
    dot: 'bg-[#f59e0b]',
  },
  Dissolved: {
    bg: 'bg-[#fff1f2]',
    text: 'text-[#be123c]',
    dot: 'bg-[#f43f5e]',
  },
};

export default function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES['Off Campus'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-btn px-2 py-0.5 text-label font-semibold ${styles.bg} ${styles.text}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
      {status}
    </span>
  );
}
