import { CheckCircle2, ChevronLeft, Circle, Hammer, Users } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Callout } from '@/components/lesson/BlockRenderer';
import { TerminalBlock } from '@/components/lesson/CodeBlocks';
import { Inline } from '@/components/Inline';
import { Badge, Button, PageHeader } from '@/components/ui';
import { PROJECTS, findProject } from '@/content/projects';
import { progress, useProgress } from '@/store/progress';
import NotFound from '../NotFound';

const projectKey = (slug: string) => `project/${slug}`;

export function ProjectsList() {
  const p = useProgress();
  useEffect(() => {
    document.title = 'Practical Projects · GitMaster Academy';
  }, []);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader
        eyebrow="Practice"
        title="Practical Projects"
        description="Four end-to-end projects that combine everything in the course. Follow them in a real folder on your computer with a free GitHub repository, or replay the Git parts in the simulator."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {PROJECTS.map((pr) => {
          const done = Boolean(p.completed[projectKey(pr.slug)]);
          return (
            <Link key={pr.slug} to={`/projects/${pr.slug}`} className="group flex flex-col rounded-2xl border border-line p-5 hover:border-accent">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent"><Hammer className="h-4 w-4" aria-hidden="true" /></span>
                <span className="text-xs text-muted">Project {pr.number} · {pr.steps.length} steps</span>
                {done && <CheckCircle2 className="ml-auto h-5 w-5 text-ok" aria-label="Completed" />}
              </div>
              <p className="mt-3 text-lg font-semibold text-fg group-hover:text-accent">{pr.title}</p>
              <p className="mt-1 text-sm text-muted">{pr.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {pr.skills.slice(0, 5).map((s) => <Badge key={s}>{s}</Badge>)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectPage() {
  const { slug = '' } = useParams();
  const pr = findProject(slug);
  const p = useProgress();
  useEffect(() => {
    if (pr) document.title = `${pr.title} project · GitMaster Academy`;
  }, [pr]);
  if (!pr) return <NotFound />;
  const done = Boolean(p.completed[projectKey(pr.slug)]);
  const idx = PROJECTS.indexOf(pr);
  const next = PROJECTS[idx + 1];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-accent"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> All projects</Link>
      <PageHeader eyebrow={`Project ${pr.number}`} title={pr.title} description={pr.summary}>
        <span className="flex items-center gap-1.5 text-sm text-muted"><Users className="h-4 w-4" aria-hidden="true" /> {pr.roles.join(' · ')}</span>
      </PageHeader>
      <section aria-label="Skills practised" className="mb-6 flex flex-wrap gap-1.5">
        {pr.skills.map((s) => <Badge key={s} tone="accent">{s}</Badge>)}
      </section>
      <Callout kind="note" title="How to follow along">
        Commands use placeholders like <code className="prose-code">{'<you>'}</code> for your GitHub username. Output shown is what you should expect; hashes will differ on your machine.
      </Callout>
      <ol className="mt-6 space-y-6">
        {pr.steps.map((st, i) => (
          <li key={i} className="rounded-xl border border-line p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg">{i + 1}</span>
              <h2 className="font-semibold text-fg">{st.title}</h2>
              {st.role && <Badge tone="done">{st.role}</Badge>}
            </div>
            {st.text && <p className="mt-2 text-[15px] leading-relaxed text-fg/90"><Inline text={st.text} /></p>}
            {st.terminal && <TerminalBlock lines={st.terminal} />}
            {st.callout && <Callout kind={st.callout.kind}><Inline text={st.callout.text} /></Callout>}
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-subtle p-5">
        <p className="flex-1 font-semibold text-fg">{done ? 'Project completed' : 'Finished the project?'}</p>
        <Button variant={done ? 'secondary' : 'primary'} onClick={() => progress.setComplete(projectKey(pr.slug), !done)} aria-pressed={done}>
          {done ? <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden="true" /> : <Circle className="h-4 w-4" aria-hidden="true" />}
          {done ? 'Completed (undo)' : 'Mark project complete'}
        </Button>
        {next && <Link to={`/projects/${next.slug}`} className="text-sm font-medium text-accent hover:underline">Next: {next.title} →</Link>}
      </div>
    </div>
  );
}
