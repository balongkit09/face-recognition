import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Video,
  CalendarPlus,
  PlayCircle,
  Bell,
} from 'lucide-react';
import AppShell from './AppShell';
import { useFaculty } from '../hooks/useFaculty';
import { useStudents } from '../hooks/useStudents';
import { useNotifications } from '../hooks/useNotifications';

const ADMIN_LINKS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/faculty', icon: Users, label: 'Manage Faculty', badgeKey: 'faculty' },
  { to: '/students', icon: GraduationCap, label: 'Manage Student', badgeKey: 'students' },
  { to: '/monitoring', icon: Video, label: 'Monitoring' },
  { to: '/schedule', icon: CalendarPlus, label: 'Create Schedule' },
  { to: '/playback', icon: PlayCircle, label: 'Playback' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badgeKey: 'notifications' },
];

export default function AdminLayout() {
  const { faculty } = useFaculty();
  const { students } = useStudents();
  const { unreadCount } = useNotifications(50);

  return (
    <AppShell
      links={ADMIN_LINKS}
      counts={{
        faculty: faculty.length,
        students: students.length,
        notifications: unreadCount || undefined,
      }}
      basePath=""
      brand="Attendance MS"
    />
  );
}
