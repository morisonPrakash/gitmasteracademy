import { ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { RESOURCES } from '@/content/resources';

export default function ResourcesPage() {
  useEffect(() => {
    document.title = 'Resources · GitMaster Academy';
  }, []);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Reference" title="Resources" description="Official documentation and trusted tools to go further. Every lesson also links its sources at the end." />
      <div className="space-y-8">
        {RESOURCES.map((g) => (
          <section key={g.title} aria-labelledby={`res-${g.title}`}>
            <h2 id={`res-${g.title}`} className="mb-3 text-lg font-semibold text-fg">{g.title}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {g.links.map((l) => {
                const internal = l.url.startsWith('/');
                const cls = 'group block h-full rounded-xl border border-line p-4 hover:border-accent';
                const body = (
                  <>
                    <span className="flex items-center gap-1.5 font-medium text-fg group-hover:text-accent">
                      {l.title} {!internal && <ExternalLink className="h-3.5 w-3.5 text-muted" aria-hidden="true" />}
                    </span>
                    <span className="mt-1 block text-sm text-muted">{l.note}</span>
                  </>
                );
                return (
                  <li key={l.url}>
                    {internal ? <Link to={l.url} className={cls}>{body}</Link> : <a href={l.url} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
