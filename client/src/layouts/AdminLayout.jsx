import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Video,
  CalendarPlus,
  PlayCircle,
  Bell,
  Inbox,
} from 'lucide-react';
import AppShell from './AppShell';
import { useFaculty } from '../hooks/useFaculty';
import { useStudents } from '../hooks/useStudents';
import { useNotifications } from '../hooks/useNotifications';
import { usePasswordResets } from '../hooks/usePasswordResets';

const ADMIN_LINKS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/faculty', icon: Users, label: 'Manage Faculty', badgeKey: 'faculty' },
  { to: '/students', icon: GraduationCap, label: 'Manage Student', badgeKey: 'students' },
  { to: '/monitoring', icon: Video, label: 'Monitoring' },
  { to: '/schedule', icon: CalendarPlus, label: 'Create Schedule' },
  { to: '/playback', icon: PlayCircle, label: 'Playback' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badgeKey: 'notifications' },
  { to: '/requests', icon: Inbox, label: 'Request', badgeKey: 'requests' },
];

export default function AdminLayout() {
  const { faculty } = useFaculty();
  const { students } = useStudents();
  const { unreadCount } = useNotifications(50);
  const { requests } = usePasswordResets();

  return (
    <AppShell
      links={ADMIN_LINKS}
      counts={{
        faculty: faculty.length,
        students: students.length,
        notifications: unreadCount || undefined,
        requests: requests.length || undefined,
      }}
      basePath=""
      brand="Attendance MS"
    />
  );
}
