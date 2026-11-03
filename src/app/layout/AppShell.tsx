import { X } from 'lucide-react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { SearchDialog } from '@/features/search/SearchDialog';
import { readString, writeString } from '@/store/storage';
import { Logo, TopBar } from './TopBar';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => readString('gma:sidebar') === 'collapsed');
  const { pathname } = useLocation();

  useEffect(() => {
    setDrawer(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        setDrawer(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      writeString('gma:sidebar', c ? 'open' : 'collapsed');
      return !c;
    });
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <TopBar
        onMenu={() => setDrawer(true)}
        onSearch={() => setSearchOpen(true)}
        sidebarCollapsed={collapsed}
        onToggleSidebar={toggleSidebar}
      />

      <div className="flex">
        {!collapsed && (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-line bg-canvas lg:block">
            <Sidebar />
          </aside>
        )}

        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[85vw] max-w-80 flex-col overflow-y-auto border-r border-line bg-canvas shadow-xl">
              <div className="flex h-14 items-center justify-between border-b border-line px-3">
                <Logo />
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  className="rounded-md p-2 text-muted hover:bg-subtle hover:text-fg"
                  aria-label="Close navigation menu"
                  autoFocus
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        )}

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <Suspense fallback={<div className="px-6"><Spinner /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
