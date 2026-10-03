import { CalendarDays, GraduationCap, KeyRound, Trash2, Upload, Users, Info, Pencil, Plus } from 'lucide-react';
import { formatRelativeTime } from '../../hooks/useNotifications';

const ENTITY_ICON = {
  faculty: Users,
  student: GraduationCap,
  schedule: CalendarDays,
  account: KeyRound,
  system: Info,
};

const TYPE_STYLE = {
  add: { icon: Plus, cls: 'bg-success-bg text-success-text' },
  update: { icon: Pencil, cls: 'bg-info-bg text-info-text' },
  delete: { icon: Trash2, cls: 'bg-[#fff1f2] text-[#be123c]' },
  import: { icon: Upload, cls: 'bg-[#eef2ff] text-[#4338ca]' },
  account: { icon: KeyRound, cls: 'bg-[#fffbeb] text-[#b45309]' },
  info: { icon: Info, cls: 'bg-[#f8fafc] text-slate-600' },
};

export default function NotificationItem({ notification, onClick, compact = false }) {
  const type = TYPE_STYLE[notification.type] || TYPE_STYLE.info;
  const EntityIcon = ENTITY_ICON[notification.entity] || Info;
  const TypeIcon = type.icon;

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={`flex w-full items-start gap-3 text-left transition-colors hover:bg-[#f8fafc] ${
        compact ? 'px-3 py-2.5' : 'rounded-card border border-border-light bg-white px-4 py-3 shadow-card'
      } ${notification.read ? '' : compact ? 'bg-info-bg/40' : 'border-l-4 border-l-primary'}`}
    >
      <span className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${type.cls}`}>
        <EntityIcon className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-white">
          <TypeIcon className="h-2.5 w-2.5 text-slate-600" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-body ${notification.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
          {notification.title}
        </span>
        {notification.message && (
          <span className="block truncate text-secondary text-slate-500">{notification.message}</span>
        )}
        <span className="mt-0.5 block text-label text-slate-400">
          {notification.actorName ? `${notification.actorName} · ` : ''}
          {formatRelativeTime(notification.createdAt)}
        </span>
      </span>
      {!notification.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </button>
  );
}
