import { useMemo, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import NotificationItem from '../components/layout/NotificationItem';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'student', label: 'Students' },
  { key: 'schedule', label: 'Schedules' },
  { key: 'workingScholar', label: 'Scholars' },
  { key: 'faceEnroll', label: 'Face enroll' },
];

export default function NotificationsPage() {
  const { role } = useAuth();
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications(200);
  const [filter, setFilter] = useState('all');
  const isFaculty = role === 'faculty';

  const visible = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.entity === filter);
  }, [notifications, filter]);

  return (
    <>
      <PageHeader
        breadcrumbSection="SYSTEM"
        breadcrumbPage="NOTIFICATIONS"
        title="Notifications"
        description={
          isFaculty
            ? 'Alerts for students you add, enroll, or remove. Admin dashboard activity is never shown here.'
            : 'Faculty activity and system events appear here. Faculty cannot see these admin notifications.'
        }
        actions={
          <Button variant="outline" onClick={() => markAllRead().catch(() => {})} disabled={!unreadCount}>
            <CheckCheck className="h-4 w-4" />
            Mark all as read{unreadCount ? ` (${unreadCount})` : ''}
          </Button>
        }
      />

      {error && <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-body font-medium transition-colors ${
              filter === f.key
                ? 'bg-primary text-white shadow-card'
                : 'border border-border bg-white text-slate-600 hover:bg-[#f8fafc]'
            }`}
          >
            {f.label}
            {f.key === 'unread' && unreadCount ? ` · ${unreadCount}` : ''}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {loading && <p className="py-8 text-center text-body text-slate-500">Loading notifications…</p>}
        {!loading && visible.length === 0 && (
          <p className="rounded-card border border-border-light bg-white py-10 text-center text-body text-slate-500 shadow-card">
            {notifications.length === 0
              ? isFaculty
                ? 'No notifications yet. Adding, enrolling, or removing a student will appear here.'
                : 'No notifications yet. Faculty enrollments and other faculty activity will show up here.'
              : 'Nothing matches this filter.'}
          </p>
        )}
        {!loading &&
          visible.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={(item) => {
                if (!item.read) markRead(item.id).catch(() => {});
              }}
            />
          ))}
      </div>
    </>
  );
}
