import { CornerDownLeft, FileText, FolderOpen, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fullIndex, search, shallowIndex, type SearchDoc } from './searchIndex';

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<SearchDoc[]>(() => shallowIndex());
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    setLoading(true);
    fullIndex()
      .then(setDocs)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [open]);

  const hits = useMemo(() => search(docs, query), [docs, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && hits[active]) {
      go(hits[active].doc.to);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[10vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search lessons"
        className="flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-canvas shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-5 w-5 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, commands, topics… e.g. rebase, staging, pull request"
            className="h-14 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-muted"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls="search-results"
            aria-activedescendant={hits[active] ? `search-hit-${active}` : undefined}
            aria-label="Search query"
          />
          <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:text-fg" aria-label="Close search">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <ul id="search-results" ref={listRef} role="listbox" className="overflow-y-auto p-2" aria-label="Search results">
          {query && hits.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted">
              {loading ? 'Indexing lessons…' : `No results for “${query}”.`}
            </li>
          )}
          {!query && (
            <li className="px-3 py-6 text-center text-sm text-muted">
              Type to search all {docs.filter((d) => d.kind === 'lesson').length} lessons. Use ↑ ↓ to move and Enter to open.
            </li>
          )}
          {hits.map((h, i) => (
            <li
              key={h.doc.id}
              id={`search-hit-${i}`}
              data-index={i}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => go(h.doc.to)}
              className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 ${i === active ? 'bg-accent-soft' : ''}`}
            >
              {h.doc.kind === 'lesson' ? (
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              ) : (
                <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{h.doc.title}</p>
                <p className="text-xs text-muted">{h.doc.context}</p>
                {h.snippet && <p className="mt-1 line-clamp-2 text-xs text-muted/90">{h.snippet}</p>}
              </div>
              {i === active && <CornerDownLeft className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
