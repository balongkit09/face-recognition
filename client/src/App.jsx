import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AdminLayout from './layouts/AdminLayout';
import FacultyLayout from './layouts/FacultyLayout';
import { FACULTY_BASE, LOGIN_PATH, homeForRole } from './utils/routes';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManageFacultyPage from './pages/ManageFacultyPage';
import ManageStudentPage from './pages/ManageStudentPage';
import ManageWorkingScholarPage from './pages/ManageWorkingScholarPage';
import MonitoringPage from './pages/MonitoringPage';
import CreateSchedulePage from './pages/CreateSchedulePage';
import PlaybackPage from './pages/PlaybackPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import RequestsPage from './pages/RequestsPage';
import FacultyDashboardPage from './pages/faculty/FacultyDashboardPage';
import FacultySchedulePage from './pages/faculty/FacultySchedulePage';
import EnrollStudentPage from './pages/faculty/EnrollStudentPage';
import FacultyEmailPage from './pages/faculty/FacultyEmailPage';
import EnrolledFacePage from './pages/EnrolledFacePage';
import SessionSplash from './components/common/SessionSplash';

/** Dashboard routes: must sign in on /login first, then match the allowed role. */
function RequireRole({ roles, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <SessionSplash />;
  if (!user || !role) {
    return <Navigate to={LOGIN_PATH} replace state={{ from: location }} />;
  }
  if (!roles.includes(role)) return <Navigate to={homeForRole(role)} replace />;
  return children;
}

function CatchAll() {
  const { user, role, loading } = useAuth();
  if (loading) return <SessionSplash />;
  if (!user || !role) return <Navigate to={LOGIN_PATH} replace />;
  return <Navigate to={homeForRole(role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path={LOGIN_PATH} element={<LoginPage />} />

      {/* Faculty portal */}
      <Route
        path={FACULTY_BASE}
        element={
          <RequireRole roles={['faculty']}>
            <FacultyLayout />
          </RequireRole>
        }
      >
        <Route index element={<FacultyDashboardPage />} />
        <Route path="schedule" element={<FacultySchedulePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="enroll" element={<EnrollStudentPage />} />
        <Route path="enrolled-face" element={<EnrolledFacePage />} />
        <Route path="email" element={<FacultyEmailPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="playback" element={<PlaybackPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to={FACULTY_BASE} replace />} />
      </Route>

      {/* Admin dashboard */}
      <Route
        path="/"
        element={
          <RequireRole roles={['admin']}>
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="faculty" element={<ManageFacultyPage />} />
        <Route path="students" element={<ManageStudentPage />} />
        <Route path="enrolled-face" element={<EnrolledFacePage />} />
        <Route path="working-scholars" element={<ManageWorkingScholarPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="schedule" element={<CreateSchedulePage />} />
        <Route path="playback" element={<PlaybackPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<CatchAll />} />
    </Routes>
  );
}
