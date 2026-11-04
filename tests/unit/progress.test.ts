import { MODULES, lessonKey } from '@/content/catalog';
import { FINAL_ID, FINAL_SIZE, buildAttempt } from '@/features/quiz/quizzes';
import { commandMatches, normalizeCommand } from '@/lib/text';
import { PROGRESS_KEY, progress } from '@/store/progress';
import { moduleComplete, overallStats, recommendedNext } from '@/store/selectors';

beforeEach(() => progress.reset());

describe('progress store', () => {
  it('persists completed lessons, bookmarks and visits to localStorage', () => {
    const key = lessonKey('m01', 'what-is-head');
    progress.setComplete(key, true);
    progress.toggleBookmark(key);
    progress.visit(key);
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY)!);
    expect(saved.completed[key]).toBeTypeOf('number');
    expect(saved.bookmarks).toEqual([key]);
    expect(saved.current).toBe(key);
    progress.reload();
    expect(progress.get().completed[key]).toBeDefined();
  });

  it('survives corrupt storage', () => {
    localStorage.setItem(PROGRESS_KEY, '{not json');
    progress.reload();
    expect(progress.get().completed).toEqual({});
  });

  it('records quiz attempts with the 80% pass mark', () => {
    expect(progress.recordQuiz({ quizId: 'm01', score: 9, total: 12 }).passed).toBe(false); // 75%
    const a = progress.recordQuiz({ quizId: 'm01', score: 10, total: 12 }); // 83%
    expect(a.percent).toBe(83);
    expect(a.passed).toBe(true);
  });

  it('a module is complete only with all lessons and a passed quiz', () => {
    const m = MODULES[0];
    for (const l of m.lessons) progress.setComplete(lessonKey(m.id, l.slug), true);
    expect(moduleComplete(progress.get(), m)).toBe(false);
    progress.recordQuiz({ quizId: m.id, score: 12, total: 12 });
    expect(moduleComplete(progress.get(), m)).toBe(true);
    expect(overallStats(progress.get()).modulesDone).toBe(1);
  });

  it('recommends the first unfinished lesson after the current one', () => {
    progress.visit(lessonKey('m01', 'what-is-version-control'));
    progress.setComplete(lessonKey('m01', 'git-and-github'), true);
    expect(recommendedNext(progress.get())?.slug).toBe('hosting-platforms');
  });

  it('a solved exercise stays solved after revealing the answer', () => {
    progress.markExercise('x', 'solved');
    progress.markExercise('x', 'revealed');
    expect(progress.get().exercises.x).toBe('solved');
  });
});

describe('answer normalisation', () => {
  it('accepts equivalent quoting and spacing', () => {
    expect(normalizeCommand("  $ git commit -m 'Fix  bug'  ")).toBe('git commit -m "Fix bug"');
    expect(commandMatches('git   status', ['git status'])).toBe(true);
    expect(commandMatches('git stat', ['git status'])).toBe(false);
  });
});

describe('quiz attempts', () => {
  it('module quiz contains every question once, options keep the right answer', async () => {
    const qs = await buildAttempt('m03');
    expect(qs).toHaveLength(12);
    expect(new Set(qs.map((q) => q.q.id)).size).toBe(12);
    for (const q of qs) {
      if (q.options) expect(q.options[q.correct!]).toBe(q.q.options![q.q.correct!]);
    }
  });

  it('final assessment draws 40 unique questions from every module', async () => {
    const qs = await buildAttempt(FINAL_ID);
    expect(qs).toHaveLength(FINAL_SIZE);
    expect(new Set(qs.map((q) => q.q.id)).size).toBe(FINAL_SIZE);
    expect(new Set(qs.map((q) => q.moduleId)).size).toBe(14);
  });
});
