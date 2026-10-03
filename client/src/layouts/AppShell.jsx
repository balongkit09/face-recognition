import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import Sidebar from '../components/sidebar/Sidebar';
import TopBar from '../components/layout/TopBar';

const LG = 1024;

/**
 * Shared application frame (top bar + collapsible sidebar + content outlet).
 * Both the admin dashboard and the faculty portal render through this so they
 * share one design.
 */
export default function AppShell({
  links,
  counts = {},
  basePath = '',
  brand,
  searchPlaceholder,
  outletContext = {},
}) {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= LG : true,
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= LG) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < LG) setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarOpen((open) => !open);

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#f4f6fb]">
      <TopBar
        onMenuClick={toggleSidebar}
        search={search}
        onSearchChange={setSearch}
        onMobileSearchClick={() => setMobileSearchOpen((open) => !open)}
        basePath={basePath}
        brand={brand}
        searchPlaceholder={searchPlaceholder}
      />

      {mobileSearchOpen && (
        <div className="border-b border-border-light bg-white px-3 py-2 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-10 w-full rounded-full border border-border bg-[#f8fafc] pl-9 pr-4 text-body focus:border-primary focus:outline-none"
              autoFocus
            />
          </div>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 top-14 z-20 bg-slate-900/30 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          links={links}
          counts={counts}
          basePath={basePath}
          open={sidebarOpen}
          onNavigate={() => {
            if (window.innerWidth < LG) setSidebarOpen(false);
          }}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet context={{ search, ...outletContext }} />
        </main>
      </div>
    </div>
  );
}
