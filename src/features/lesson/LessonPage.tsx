import { Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock, ExternalLink } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BlockView, headingId } from '@/components/lesson/BlockRenderer';
import { Badge, Button, EmptyState, Spinner } from '@/components/ui';
import { LESSON_ORDER, findModule, lessonKey } from '@/content/catalog';
import { ExerciseCard } from '@/features/exercises/ExerciseCard';
import { plain } from '@/lib/text';
import { progress, useProgress } from '@/store/progress';
import { lessonPath } from '@/store/selectors';
import NotFound from '../NotFound';
import { TocRail, type TocItem } from './TocRail';
import { useModule } from './useModule';

export default function LessonPage() {
  const { moduleId = '', slug = '' } = useParams();
  const meta = findModule(moduleId);
  const load = useModule(meta ? moduleId : undefined);
  const p = useProgress();
  const key = lessonKey(moduleId, slug);
  const lesson = load.status === 'ready' ? load.module.lessons.find((l) => l.slug === slug) : undefined;
  const lessonExists = Boolean(meta?.lessons.some((l) => l.slug === slug));

  useEffect(() => {
    if (lesson) {
      progress.visit(key);
      document.title = `${lesson.title} · GitMaster Academy`;
    }
  }, [lesson, key]);

  const toc: TocItem[] = useMemo(() => {
    if (!lesson) return [];
    const items: TocItem[] = lesson.blocks
      .filter((b): b is Extract<typeof b, { type: 'heading' }> => b.type === 'heading')
      .map((b) => ({ id: headingId(b.text), text: plain(b.text), level: b.level ?? 2 }));
    if (lesson.exercises.length) items.push({ id: 'practice', text: 'Practice', level: 2 });
    if (lesson.sources.length) items.push({ id: 'sources', text: 'Sources', level: 2 });
    return items;
  }, [lesson]);

  if (!meta || !lessonExists) return <NotFound />;
  if (load.status === 'loading') return <div className="px-6"><Spinner label="Loading lesson" /></div>;
  if (load.status === 'error') return <div className="p-8"><EmptyState title="This lesson could not be loaded.">{load.error}</EmptyState></div>;
  if (load.status === 'missing' || !lesson) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <EmptyState title="This module is still being written.">
          Its lessons will appear here as soon as they are published. <Link to="/" className="text-accent">Back to the dashboard</Link>.
        </EmptyState>
      </div>
    );
  }

  const idx = LESSON_ORDER.findIndex((l) => l.moduleId === moduleId && l.slug === slug);
  const prev = LESSON_ORDER[idx - 1];
  const next = LESSON_ORDER[idx + 1];
  const done = Boolean(p.completed[key]);
  const bookmarked = p.bookmarks.includes(key);
  const position = meta.lessons.findIndex((l) => l.slug === slug) + 1;

  return (
    <div className="mx-auto flex max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:px-10">
      <article className="min-w-0 flex-1 xl:max-w-3xl" aria-labelledby="lesson-title">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
          <Link to={`/learn/${meta.id}`} className="hover:text-accent">Module {meta.number}: {meta.navTitle}</Link>
          <span className="mx-1.5">/</span>
          <span>Lesson {position} of {meta.lessons.length}</span>
        </nav>
        <header className="mb-6 border-b border-line-soft pb-6">
          <h1 id="lesson-title" className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{lesson.title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">{lesson.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge><Clock className="h-3 w-3" aria-hidden="true" /> {lesson.minutes} min</Badge>
            <Badge tone="accent">Level {meta.level}</Badge>
            {done && <Badge tone="ok"><CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Completed</Badge>}
            <Button
              variant="ghost"
              className="ml-auto"
              onClick={() => progress.toggleBookmark(key)}
              aria-pressed={bookmarked}
            >
              {bookmarked ? <BookmarkCheck className="h-4 w-4 text-accent" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
          </div>
        </header>

        <div>
          {lesson.blocks.map((b, i) => <BlockView key={i} block={b} />)}
        </div>

        {lesson.exercises.length > 0 && (
          <section aria-labelledby="practice" className="mt-12">
            <h2 id="practice" className="scroll-mt-20 border-b border-line-soft pb-2 text-2xl font-bold tracking-tight text-fg">Practice</h2>
            <p className="mt-3 text-sm text-muted">Try each exercise yourself first. Hints and the answer are there when you need them.</p>
            {lesson.exercises.map((ex, i) => <ExerciseCard key={ex.id} exercise={ex} index={i} />)}
          </section>
        )}

        {lesson.sources.length > 0 && (
          <section aria-labelledby="sources" className="mt-10">
            <h2 id="sources" className="scroll-mt-20 text-lg font-semibold text-fg">Sources and further reading</h2>
            <ul className="mt-2 space-y-1.5">
              {lesson.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 flex flex-col items-start gap-3 rounded-xl border border-line bg-subtle p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-semibold text-fg">{done ? 'Lesson completed' : 'Finished reading?'}</p>
            <p className="text-sm text-muted">{done ? 'Nice work. Your progress is saved in this browser.' : 'Mark the lesson complete to track your progress.'}</p>
          </div>
          <Button variant={done ? 'secondary' : 'primary'} onClick={() => progress.setComplete(key, !done)} aria-pressed={done}>
            {done ? <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden="true" /> : <Circle className="h-4 w-4" aria-hidden="true" />}
            {done ? 'Completed (undo)' : 'Mark as complete'}
          </Button>
        </div>

        <nav aria-label="Lesson navigation" className="mt-6 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link to={lessonPath(prev.moduleId, prev.slug)} className="group rounded-xl border border-line p-4 hover:border-accent">
              <span className="flex items-center gap-1 text-xs text-muted"><ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" /> Previous</span>
              <span className="mt-1 block font-medium text-fg group-hover:text-accent">{prev.title}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link
              to={lessonPath(next.moduleId, next.slug)}
              onClick={() => !done && progress.setComplete(key, true)}
              className="group rounded-xl border border-line p-4 text-right hover:border-accent"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-muted">Next <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
              <span className="mt-1 block font-medium text-fg group-hover:text-accent">{next.title}</span>
            </Link>
          ) : (
            <Link to="/quizzes/final" className="group rounded-xl border border-line p-4 text-right hover:border-accent">
              <span className="text-xs text-muted">You reached the end</span>
              <span className="mt-1 block font-medium text-fg group-hover:text-accent">Take the final assessment</span>
            </Link>
          )}
        </nav>
        {next && next.moduleId !== moduleId && (
          <p className="mt-3 text-sm text-muted">
            This is the last lesson of the module. <Link to={`/quizzes/${moduleId}`} className="text-accent hover:underline">Take the Module {meta.number} quiz</Link> before moving on.
          </p>
        )}
      </article>

      <TocRail items={toc} />
    </div>
  );
}
