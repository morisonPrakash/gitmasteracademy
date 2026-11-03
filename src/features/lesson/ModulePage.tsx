import { CheckCircle2, Circle, FileQuestion, Play } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ModuleIcon } from '@/components/Icon';
import { Badge, ButtonLink, PageHeader, ProgressBar } from '@/components/ui';
import { LEVELS, findModule } from '@/content/catalog';
import { useProgress } from '@/store/progress';
import { bestAttempt, lessonDone, lessonPath, moduleComplete, moduleLessonProgress } from '@/store/selectors';
import NotFound from '../NotFound';
import { useModule } from './useModule';

export default function ModulePage() {
  const { moduleId = '' } = useParams();
  const meta = findModule(moduleId);
  const load = useModule(meta?.id);
  const p = useProgress();

  useEffect(() => {
    if (meta) document.title = `${meta.title} · GitMaster Academy`;
  }, [meta]);

  if (!meta) return <NotFound />;

  const mp = moduleLessonProgress(p, meta);
  const best = bestAttempt(p, meta.id);
  const firstOpen = meta.lessons.find((l) => !lessonDone(p, meta.id, l.slug)) ?? meta.lessons[0];
  const lessons = load.status === 'ready' ? load.module.lessons : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader
        eyebrow={`Module ${meta.number} · Level ${meta.level}: ${LEVELS[meta.level].title}`}
        title={meta.title}
        description={meta.description}
      >
        <ButtonLink to={lessonPath(meta.id, firstOpen.slug)} variant="primary">
          <Play className="h-4 w-4" aria-hidden="true" /> {mp.done === 0 ? 'Start module' : mp.done === mp.total ? 'Review module' : 'Continue'}
        </ButtonLink>
        <ButtonLink to={`/quizzes/${meta.id}`}>
          <FileQuestion className="h-4 w-4" aria-hidden="true" /> Module quiz
        </ButtonLink>
        {moduleComplete(p, meta) && <Badge tone="ok">Module complete</Badge>}
      </PageHeader>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line p-4 sm:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <ModuleIcon name={meta.icon} className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-fg">{mp.done} of {mp.total} lessons complete</p>
              <ProgressBar value={mp.percent} label="Module progress" className="mt-1.5" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-line p-4">
          <p className="text-sm text-muted">Quiz best score</p>
          <p className="text-2xl font-bold text-fg">{best ? `${best.percent}%` : '—'}</p>
          <p className="text-xs text-muted">{best ? (best.passed ? 'Passed' : 'Pass mark is 80%') : 'Not attempted'}</p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-fg">Lessons</h2>
      <ol className="divide-y divide-line-soft overflow-hidden rounded-xl border border-line">
        {meta.lessons.map((l, i) => {
          const done = lessonDone(p, meta.id, l.slug);
          const full = lessons?.find((x) => x.slug === l.slug);
          return (
            <li key={l.slug}>
              <Link to={lessonPath(meta.id, l.slug)} className="flex items-start gap-3 px-4 py-3 hover:bg-subtle">
                {done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-label="Completed" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-fg">
                    <span className="mr-2 text-muted tabular-nums">{i + 1}.</span>
                    {l.title}
                  </span>
                  {full && <span className="mt-0.5 block text-sm text-muted">{full.summary}</span>}
                </span>
                {full && <span className="shrink-0 text-xs text-muted">{full.minutes} min</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
