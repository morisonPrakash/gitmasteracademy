import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Inline } from '@/components/Inline';
import { EmptyState, PageHeader } from '@/components/ui';
import { GLOSSARY } from '@/content/glossary';
import { slugify } from '@/lib/text';

const termId = (t: string) => `term-${slugify(t) || t.length}`;

export default function GlossaryPage() {
  const [query, setQuery] = useState('');
  useEffect(() => {
    document.title = 'Glossary · GitMaster Academy';
  }, []);
  const sorted = useMemo(() => [...GLOSSARY].sort((a, b) => a.term.replace(/^\./, '').localeCompare(b.term.replace(/^\./, ''))), []);
  const q = query.trim().toLowerCase();
  const items = sorted.filter((t) => !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q));
  const letters = [...new Set(sorted.map((t) => t.term.replace(/^\./, '')[0].toUpperCase()))];
  const byLetter = (l: string) => items.filter((t) => t.term.replace(/^\./, '')[0].toUpperCase() === l);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Reference" title="Glossary" description={`${GLOSSARY.length} Git, GitHub and delivery terms in plain English.`} />
      <label className="mb-4 flex h-10 items-center gap-2 rounded-lg border border-line bg-subtle px-3 focus-within:border-accent">
        <Search className="h-4 w-4 text-muted" aria-hidden="true" />
        <span className="sr-only">Search the glossary</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search terms…" className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted" />
      </label>
      {!q && (
        <nav aria-label="Jump to letter" className="mb-6 flex flex-wrap gap-1">
          {letters.map((l) => (
            <a key={l} href={`#letter-${l}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-sm font-medium text-muted hover:border-accent hover:text-accent">{l}</a>
          ))}
        </nav>
      )}
      {items.length === 0 && <EmptyState title={`No terms match “${query}”.`} />}
      {letters.map((l) => {
        const list = byLetter(l);
        if (!list.length) return null;
        return (
          <section key={l} id={`letter-${l}`} className="scroll-mt-20">
            <h2 className="mt-6 mb-2 border-b border-line-soft pb-1 text-xl font-bold text-fg">{l}</h2>
            <dl className="space-y-3">
              {list.map((t) => (
                <div key={t.term} id={termId(t.term)} className="scroll-mt-20 rounded-lg px-1">
                  <dt className="font-semibold text-fg">{t.term}</dt>
                  <dd className="text-[15px] leading-relaxed text-fg/85"><Inline text={t.definition} /></dd>
                  {t.related && t.related.length > 0 && (
                    <dd className="mt-0.5 text-xs text-muted">
                      See also:{' '}
                      {t.related.map((r, i) => (
                        <span key={r}>
                          {i > 0 && ', '}
                          <a href={`#${termId(r)}`} className="text-accent hover:underline" onClick={() => setQuery('')}>{r}</a>
                        </span>
                      ))}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
