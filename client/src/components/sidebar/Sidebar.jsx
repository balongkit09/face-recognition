import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, UserRound } from 'lucide-react';
import SidebarLink from './SidebarLink';
import { useAuth } from '../../hooks/useAuth';

/**
 * Generic sidebar. `links` = [{ to, icon, label, badgeKey? }], `counts` maps
 * badgeKey -> number. `basePath` is prefixed to every link (e.g. "/faculty-portal").
 */
export default function Sidebar({
  links = [],
  counts = {},
  basePath = '',
  open = true,
  onNavigate,
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const prefix = (to) => (to === '/' ? basePath || '/' : `${basePath}${to}`);

  return (
    <aside
      className={[
        'z-30 flex h-full w-[240px] shrink-0 flex-col justify-between border-r border-border-light bg-white py-3 pl-3 pr-[13px] transition-transform duration-200',
        'fixed inset-y-0 left-0 top-14 max-h-[calc(100dvh-3.5rem)] sm:top-16 sm:max-h-[calc(100dvh-4rem)]',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:static lg:top-0 lg:max-h-none lg:translate-x-0',
        !open ? 'lg:hidden' : '',
      ].join(' ')}
    >
      <nav className="flex flex-col gap-1 overflow-y-auto">
        {links.map((link) => (
          <SidebarLink
            key={link.to}
            to={prefix(link.to)}
            end={link.to === '/'}
            icon={link.icon}
            label={link.label}
            badge={link.badgeKey != null ? counts[link.badgeKey] : undefined}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-border-light pt-[13px]">
        <nav className="flex flex-col gap-1">
          <SidebarLink to={prefix('/profile')} icon={UserRound} label="My Profile" onNavigate={onNavigate} />
          <SidebarLink to={prefix('/settings')} icon={Settings} label="Settings" onNavigate={onNavigate} />
          <SidebarLink icon={LogOut} label="Logout" onClick={handleLogout} />
        </nav>
      </div>
    </aside>
  );
}
