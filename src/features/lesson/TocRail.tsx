import { useEffect, useState } from 'react';

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Right-hand "On this page" navigation that highlights the section being read. */
export function TocRail({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    if (!items.length || typeof IntersectionObserver === 'undefined') return;
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => Boolean(e));
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-72px 0px -65% 0px' },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-56 shrink-0 self-start overflow-y-auto xl:block" aria-label="On this page">
      <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">On this page</p>
      <ul className="space-y-1 border-l border-line-soft">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(i.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', `#${i.id}`);
                setActive(i.id);
              }}
              className={`-ml-px block border-l-2 py-1 text-[13px] leading-snug ${i.level === 3 ? 'pl-6' : 'pl-3'} ${
                active === i.id ? 'border-accent font-medium text-accent' : 'border-transparent text-muted hover:text-fg'
              }`}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
