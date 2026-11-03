import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { findModule } from '@/content/catalog';
import { ModuleIcon } from '@/components/Icon';
import { useProgress } from '@/store/progress';
import { lessonDone, moduleLessonProgress } from '@/store/selectors';
import { NAV } from '../nav';

const itemCls = (active: boolean) =>
  `flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
    active ? 'bg-accent-soft font-semibold text-accent' : 'text-fg/85 hover:bg-subtle hover:text-fg'
  }`;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const progress = useProgress();
  const activeModule = pathname.match(/^\/learn\/(m\d\d)/)?.[1];
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Expand the module the learner is currently reading.
  useEffect(() => {
    if (activeModule) setOpen((o) => ({ ...o, [activeModule]: true }));
  }, [activeModule]);

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-0.5 px-3 py-4">
      {NAV.map((item, i) => {
        if (item.kind === 'section') {
          return (
            <p key={i} className="mt-5 mb-1 px-2.5 text-xs font-semibold tracking-wider text-muted uppercase">
              {item.label}
            </p>
          );
        }
        if (item.kind === 'link') {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end onClick={onNavigate} className={({ isActive }) => itemCls(isActive)}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        }
        const m = findModule(item.moduleId)!;
        const isOpen = open[m.id] ?? false;
        const p = moduleLessonProgress(progress, m);
        const active = activeModule === m.id;
        const listId = `nav-${m.id}`;
        return (
          <div key={m.id}>
            <div className={`group flex items-center rounded-md ${active ? 'bg-accent-soft' : 'hover:bg-subtle'}`}>
              <Link
                to={`/learn/${m.id}`}
                onClick={onNavigate}
                className={`flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pl-2.5 text-sm ${active ? 'font-semibold text-accent' : 'text-fg/85 group-hover:text-fg'}`}
              >
                <ModuleIcon name={m.icon} className="h-4 w-4 shrink-0" />
                <span className="truncate">{m.navTitle}</span>
                {p.done > 0 && (
                  <span className="ml-auto shrink-0 text-[11px] text-muted tabular-nums">
                    {p.done}/{p.total}
                  </span>
                )}
              </Link>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${m.navTitle} lessons`}
                onClick={() => setOpen((o) => ({ ...o, [m.id]: !isOpen }))}
                className="mr-1 rounded p-1 text-muted hover:text-fg"
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
              </button>
            </div>
            {isOpen && (
              <ul id={listId} className="my-1 ml-4 border-l border-line-soft pl-2">
                {m.lessons.map((l) => {
                  const done = lessonDone(progress, m.id, l.slug);
                  const to = `/learn/${m.id}/${l.slug}`;
                  return (
                    <li key={l.slug}>
                      <NavLink
                        to={to}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          `flex items-start gap-2 rounded-md px-2 py-1 text-[13px] leading-snug ${
                            isActive ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:bg-subtle hover:text-fg'
                          }`
                        }
                      >
                        {done ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-label="Completed" />
                        ) : (
                          <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
                        )}
                        <span>{l.title}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
