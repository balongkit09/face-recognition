import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, LogOut, Menu, Search, Settings, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

export default function TopBar({
  onMenuClick,
  search,
  onSearchChange,
  onMobileSearchClick,
  basePath = '',
  brand = 'Attendance MS',
  searchPlaceholder = 'Search faculty, students, ID number, EDP code, program...',
}) {
  const { user, role, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(20);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(menuRef, () => setMenuOpen(false));

  const displayName =
    (role === 'faculty' && profile?.name) ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    (role === 'faculty' ? 'Faculty' : 'Admin');
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const openNotification = async (n) => {
    if (!n.read) markRead(n.id).catch(() => {});
    setNotifOpen(false);
    navigate(`${basePath}/notifications`);
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border-light bg-white px-3 sm:h-16 sm:gap-4 sm:px-5">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn text-slate-600 transition-colors hover:bg-[#f8fafc]"
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      <Link to={basePath || '/'} className="flex min-w-0 shrink-0 items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
          A
        </span>
        <span className="hidden truncate text-sm font-semibold text-slate-900 sm:inline">{brand}</span>
      </Link>

      <div className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 w-full rounded-full border border-border bg-[#f8fafc] pl-9 pr-4 text-body text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMobileSearchClick}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-btn text-slate-500 hover:bg-[#f8fafc]"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-label font-semibold text-emerald-600 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Sync: Live
        </span>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setMenuOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-btn text-slate-500 hover:bg-[#f8fafc]"
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={notifOpen}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 z-50 w-[calc(100vw-1.5rem)] max-w-sm overflow-hidden rounded-card border border-border-light bg-white shadow-lg sm:w-96">
              <div className="flex items-center justify-between border-b border-border-light px-3 py-2.5">
                <p className="text-body font-semibold text-slate-900">
                  Notifications{unreadCount ? ` (${unreadCount})` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => markAllRead().catch(() => {})}
                  disabled={!unreadCount}
                  className="inline-flex items-center gap-1 text-secondary font-medium text-primary disabled:opacity-40"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-body text-slate-500">
                    No notifications yet. Adding or deleting records will show up here.
                  </p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <NotificationItem key={n.id} notification={n} onClick={openNotification} compact />
                  ))
                )}
              </div>
              <Link
                to={`${basePath}/notifications`}
                onClick={() => setNotifOpen(false)}
                className="block border-t border-border-light px-3 py-2.5 text-center text-body font-medium text-primary hover:bg-[#f8fafc]"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((o) => !o);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-full py-0.5 pl-1 pr-0.5 hover:bg-[#f8fafc]"
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            <span className="hidden text-body font-medium text-slate-600 lg:inline">@ {displayName}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
              {initials || 'U'}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-card border border-border-light bg-white shadow-lg">
              <div className="border-b border-border-light px-4 py-3">
                <p className="truncate text-body font-semibold text-slate-900">{displayName}</p>
                <p className="truncate text-secondary text-slate-500">
                  {role === 'faculty' ? `Faculty · ID ${profile?.idNumber || ''}` : 'Administrator'}
                </p>
              </div>
              <nav className="flex flex-col p-1">
                <MenuLink to={`${basePath}/profile`} icon={UserRound} onClick={() => setMenuOpen(false)}>
                  My profile
                </MenuLink>
                <MenuLink to={`${basePath}/settings`} icon={Settings} onClick={() => setMenuOpen(false)}>
                  Settings
                </MenuLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-btn px-3 py-2 text-left text-body font-medium text-danger hover:bg-[#f8fafc]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({ to, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 rounded-btn px-3 py-2 text-body font-medium text-slate-700 hover:bg-[#f8fafc]"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
