import { LayoutDashboard, Bell, UserPlus, Video, PlayCircle } from 'lucide-react';
import AppShell from './AppShell';
import { useNotifications } from '../hooks/useNotifications';
import { FACULTY_BASE } from '../utils/routes';

export { FACULTY_BASE };

const FACULTY_LINKS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/notifications', icon: Bell, label: 'Notification', badgeKey: 'notifications' },
  { to: '/enroll', icon: UserPlus, label: 'Enroll Student' },
  { to: '/monitoring', icon: Video, label: 'Monitoring' },
  { to: '/playback', icon: PlayCircle, label: 'Playback' },
];

export default function FacultyLayout() {
  const { unreadCount } = useNotifications(50);

  return (
    <AppShell
      links={FACULTY_LINKS}
      counts={{ notifications: unreadCount || undefined }}
      basePath={FACULTY_BASE}
      brand="Attendance MS · Faculty"
      searchPlaceholder="Search students, ID number, EDP code, schedule..."
    />
  );
}
