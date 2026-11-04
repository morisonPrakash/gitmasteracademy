import { OctagonAlert, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CopyButton } from '@/components/lesson/CopyButton';
import { EmptyState, PageHeader } from '@/components/ui';
import { CHEATSHEET, CHEAT_COUNT } from '@/content/cheatsheet';

export default function CheatSheetPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  useEffect(() => {
    document.title = 'Git Cheat Sheet · GitMaster Academy';
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHEATSHEET.filter((c) => category === 'all' || c.id === category)
      .map((c) => ({ ...c, entries: c.entries.filter((e) => !q || e.command.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)) }))
      .filter((c) => c.entries.length);
  }, [query, category]);
  const shown = groups.reduce((n, g) => n + g.entries.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Reference" title="Git Cheat Sheet" description={`${CHEAT_COUNT} commands in 12 categories. Search, filter, and copy any command with one click. Commands marked with a red sign can lose work or rewrite shared history: read their lesson first.`} />

      <div className="sticky top-14 z-10 -mx-4 mb-6 space-y-3 bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <label className="flex h-10 items-center gap-2 rounded-lg border border-line bg-subtle px-3 focus-within:border-accent">
          <Search className="h-4 w-4 text-muted" aria-hidden="true" />
          <span className="sr-only">Search commands</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search commands… e.g. undo, branch, stash, remote" className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted" />
          <span className="text-xs text-muted tabular-nums">{shown} shown</span>
        </label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {[{ id: 'all', title: 'All' }, ...CHEATSHEET].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${category === c.id ? 'border-accent bg-accent text-accent-fg' : 'border-line text-muted hover:text-fg'}`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState title={`No commands match “${query}”.`}>Try a different word, or clear the category filter.</EmptyState>
      ) : (
        <div className="columns-1 gap-4 lg:columns-2">
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`cs-${g.id}`} className="mb-4 break-inside-avoid rounded-xl border border-line">
              <h2 id={`cs-${g.id}`} className="border-b border-line bg-subtle px-4 py-2 text-sm font-semibold text-fg">{g.title}</h2>
              <ul className="divide-y divide-line-soft">
                {g.entries.map((e) => (
                  <li key={e.command} className="flex items-start gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <code className="block font-mono text-[13px] break-all text-fg">
                        {e.danger && <OctagonAlert className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-bad" aria-label="Destructive or history-rewriting" />}
                        {e.command}
                      </code>
                      <p className="mt-0.5 text-xs text-muted">{e.description}</p>
                    </div>
                    <CopyButton text={e.command} label={`Copy ${e.command}`} className="shrink-0 text-muted hover:bg-inset hover:text-fg" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
