import { LayoutDashboard, CalendarDays, Bell, UserPlus, ScanFace, Mail, Video, PlayCircle } from 'lucide-react';
import AppShell from './AppShell';
import { useNotifications } from '../hooks/useNotifications';
import { useStudents } from '../hooks/useStudents';
import { FACULTY_BASE } from '../utils/routes';

export { FACULTY_BASE };

const FACULTY_LINKS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/schedule', icon: CalendarDays, label: 'Schedule' },
  { to: '/notifications', icon: Bell, label: 'Notification', badgeKey: 'notifications' },
  { to: '/enroll', icon: UserPlus, label: 'Enroll Student' },
  { to: '/enrolled-face', icon: ScanFace, label: 'Enrolled Face', badgeKey: 'faces' },
  { to: '/email', icon: Mail, label: 'Email' },
  { to: '/monitoring', icon: Video, label: 'Monitoring' },
  { to: '/playback', icon: PlayCircle, label: 'Playback' },
];

export default function FacultyLayout() {
  const { unreadCount } = useNotifications(50);
  const { students } = useStudents();
  const enrolledFaces = students.filter((s) => s.faceEnrolled).length;

  return (
    <AppShell
      links={FACULTY_LINKS}
      counts={{
        notifications: unreadCount || undefined,
        faces: enrolledFaces || undefined,
      }}
      basePath={FACULTY_BASE}
      brand="Monitoring Eye · Faculty"
      searchPlaceholder="Search students, ID number, EDP code, schedule..."
    />
  );
}
