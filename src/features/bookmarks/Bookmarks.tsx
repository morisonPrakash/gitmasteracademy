import { Bookmark, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, PageHeader } from '@/components/ui';
import { progress, useProgress } from '@/store/progress';
import { lessonByKey, lessonPath } from '@/store/selectors';

export default function Bookmarks() {
  const p = useProgress();
  const items = p.bookmarks.map((k) => ({ key: k, lesson: lessonByKey(k) })).filter((x) => x.lesson);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader title="Bookmarks" description="Lessons you saved for later. Bookmarks are stored in this browser." />
      {items.length === 0 ? (
        <EmptyState icon={<Bookmark className="h-8 w-8" aria-hidden="true" />} title="No bookmarks yet">
          Open any lesson and press <strong>Bookmark</strong> to save it here.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line-soft rounded-xl border border-line">
          {items.map(({ key, lesson }) => (
            <li key={key} className="flex items-center gap-3 px-4 py-3">
              <Link to={lessonPath(lesson!.moduleId, lesson!.slug)} className="min-w-0 flex-1 hover:text-accent">
                <span className="block font-medium text-fg">{lesson!.title}</span>
                <span className="block text-sm text-muted">Module {lesson!.module.number}: {lesson!.module.navTitle}</span>
              </Link>
              <button
                type="button"
                onClick={() => progress.toggleBookmark(key)}
                className="rounded-md p-2 text-muted hover:bg-bad-soft hover:text-bad"
                aria-label={`Remove bookmark for ${lesson!.title}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
