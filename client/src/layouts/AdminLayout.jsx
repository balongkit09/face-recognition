import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ScanFace,
  Briefcase,
  Video,
  CalendarPlus,
  PlayCircle,
  Bell,
  Inbox,
} from 'lucide-react';
import AppShell from './AppShell';
import { useFaculty } from '../hooks/useFaculty';
import { useStudents } from '../hooks/useStudents';
import { useWorkingScholars } from '../hooks/useWorkingScholars';
import { useNotifications } from '../hooks/useNotifications';
import { usePasswordResets } from '../hooks/usePasswordResets';
import { useFaceEnrollRequests } from '../hooks/useFaceEnrollRequests';

const ADMIN_LINKS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/faculty', icon: Users, label: 'Manage Faculty', badgeKey: 'faculty' },
  { to: '/students', icon: GraduationCap, label: 'Manage Student', badgeKey: 'students' },
  { to: '/enrolled-face', icon: ScanFace, label: 'Enrolled Face', badgeKey: 'faces' },
  { to: '/working-scholars', icon: Briefcase, label: 'Manage Working Scholar', badgeKey: 'scholars' },
  { to: '/monitoring', icon: Video, label: 'Monitoring' },
  { to: '/schedule', icon: CalendarPlus, label: 'Create Schedule' },
  { to: '/playback', icon: PlayCircle, label: 'Playback' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badgeKey: 'notifications' },
  { to: '/requests', icon: Inbox, label: 'Request', badgeKey: 'requests' },
];

export default function AdminLayout() {
  const { faculty } = useFaculty();
  const { students } = useStudents();
  const { scholars } = useWorkingScholars();
  const { unreadCount } = useNotifications(50);
  const { requests } = usePasswordResets();
  const { requests: faceRequests } = useFaceEnrollRequests({ pendingOnly: true });
  const enrolledFaces =
    students.filter((s) => s.faceEnrolled).length + scholars.filter((s) => s.faceEnrolled).length;

  return (
    <AppShell
      links={ADMIN_LINKS}
      counts={{
        faculty: faculty.length,
        students: students.length,
        faces: enrolledFaces || undefined,
        scholars: scholars.length,
        notifications: unreadCount || undefined,
        requests: requests.length + faceRequests.length || undefined,
      }}
      basePath=""
      brand="Monitoring Eye"
      searchPlaceholder="Search faculty, students, scholars, ID number, EDP code, program..."
    />
  );
}
