import { Bookmark, Menu, Moon, PanelLeftClose, PanelLeftOpen, Play, Search, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProgress } from '@/store/progress';
import { lessonByKey, lessonPath, recommendedNext } from '@/store/selectors';
import { toggleTheme, useTheme } from '@/store/theme';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-md" aria-label="GitMaster Academy home">
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
        <rect width="64" height="64" rx="14" className="fill-fg" />
        <g fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-ok">
          <path d="M22 14v36" />
          <path d="M22 40c0-10 20-8 20-18" />
        </g>
        <circle cx="22" cy="14" r="6" className="fill-ok" />
        <circle cx="22" cy="50" r="6" className="fill-ok" />
        <circle cx="42" cy="20" r="6" className="fill-accent" />
      </svg>
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-tight text-fg">GitMaster Academy</span>
        <span className="hidden text-[11px] text-muted sm:block">From Git Beginner to Professional</span>
      </span>
    </Link>
  );
}

export function TopBar({
  onMenu,
  onSearch,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  onMenu: () => void;
  onSearch: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const theme = useTheme();
  const progress = useProgress();
  const resume = progress.current ? lessonByKey(progress.current) : undefined;
  const target = resume ?? recommendedNext(progress);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-canvas/90 px-3 backdrop-blur sm:px-4">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-md p-2 text-muted hover:bg-subtle hover:text-fg lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onToggleSidebar}
        className="hidden rounded-md p-2 text-muted hover:bg-subtle hover:text-fg lg:inline-flex"
        aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        aria-pressed={!sidebarCollapsed}
      >
        {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" aria-hidden="true" /> : <PanelLeftClose className="h-5 w-5" aria-hidden="true" />}
      </button>
      <Logo />

      <button
        type="button"
        onClick={onSearch}
        className="ml-auto flex h-9 items-center gap-2 rounded-md border border-line bg-subtle px-3 text-sm text-muted hover:border-accent/50 hover:text-fg sm:w-64"
        aria-label="Search lessons"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Search lessons…</span>
        <kbd className="ml-auto hidden rounded border border-line bg-canvas px-1.5 font-mono text-[11px] sm:inline">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      {target && (
        <Link
          to={lessonPath(target.moduleId, target.slug)}
          className="hidden h-9 items-center gap-2 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg hover:opacity-90 md:inline-flex"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          {resume ? 'Resume' : 'Start'}
        </Link>
      )}
      <Link
        to="/bookmarks"
        className="rounded-md p-2 text-muted hover:bg-subtle hover:text-fg"
        aria-label={`Bookmarks (${progress.bookmarks.length})`}
        title="Bookmarks"
      >
        <Bookmark className="h-5 w-5" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-md p-2 text-muted hover:bg-subtle hover:text-fg"
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
      </button>
    </header>
  );
}
