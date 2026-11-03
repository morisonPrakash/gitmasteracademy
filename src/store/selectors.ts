import { LESSON_ORDER, LEVELS, MODULES, lessonKey } from '@/content/catalog';
import type { ModuleMeta } from '@/content/types';
import type { ProgressState, QuizAttempt } from './progress';

export function lessonDone(s: ProgressState, moduleId: string, slug: string): boolean {
  return Boolean(s.completed[lessonKey(moduleId, slug)]);
}

export function moduleLessonProgress(s: ProgressState, m: ModuleMeta) {
  const done = m.lessons.filter((l) => lessonDone(s, m.id, l.slug)).length;
  return { done, total: m.lessons.length, percent: Math.round((done / m.lessons.length) * 100) };
}

export function attemptsFor(s: ProgressState, quizId: string): QuizAttempt[] {
  return s.quizzes.filter((q) => q.quizId === quizId);
}

export function bestAttempt(s: ProgressState, quizId: string): QuizAttempt | undefined {
  return attemptsFor(s, quizId).reduce<QuizAttempt | undefined>(
    (best, a) => (!best || a.percent > best.percent ? a : best),
    undefined,
  );
}

export function quizPassed(s: ProgressState, quizId: string): boolean {
  return attemptsFor(s, quizId).some((a) => a.passed);
}

/** A module is complete when every lesson is done and its quiz has been passed. */
export function moduleComplete(s: ProgressState, m: ModuleMeta): boolean {
  return moduleLessonProgress(s, m).done === m.lessons.length && quizPassed(s, m.id);
}

export function overallStats(s: ProgressState) {
  const lessonsDone = LESSON_ORDER.filter((l) => lessonDone(s, l.moduleId, l.slug)).length;
  const modulesDone = MODULES.filter((m) => moduleComplete(s, m)).length;
  const quizIds = [...new Set(s.quizzes.map((q) => q.quizId))];
  const bests = quizIds.map((id) => bestAttempt(s, id)!.percent);
  const avgBest = bests.length ? Math.round(bests.reduce((a, b) => a + b, 0) / bests.length) : 0;
  const passedQuizzes = quizIds.filter((id) => quizPassed(s, id)).length;
  return {
    lessonsDone,
    lessonsTotal: LESSON_ORDER.length,
    modulesDone,
    modulesTotal: MODULES.length,
    attempts: s.quizzes.length,
    quizzesTaken: quizIds.length,
    passedQuizzes,
    avgBest,
    percent: Math.round((lessonsDone / LESSON_ORDER.length) * 100),
  };
}

/** The learner's current level: the lowest level that still has unfinished lessons. */
export function currentLevel(s: ProgressState): number {
  for (const level of [1, 2, 3, 4, 5]) {
    const mods = MODULES.filter((m) => m.level === level);
    if (mods.some((m) => moduleLessonProgress(s, m).done < m.lessons.length)) return level;
  }
  return 5;
}

export function levelProgress(s: ProgressState) {
  return Object.entries(LEVELS).map(([lvl, info]) => {
    const mods = MODULES.filter((m) => m.level === Number(lvl));
    const total = mods.reduce((n, m) => n + m.lessons.length, 0);
    const done = mods.reduce((n, m) => n + moduleLessonProgress(s, m).done, 0);
    return { level: Number(lvl), ...info, modules: mods, done, total, percent: total ? Math.round((done / total) * 100) : 0 };
  });
}

/** Recommend the first unfinished lesson after the current one, else the first unfinished overall. */
export function recommendedNext(s: ProgressState) {
  const idx = s.current ? LESSON_ORDER.findIndex((l) => lessonKey(l.moduleId, l.slug) === s.current) : -1;
  const after = LESSON_ORDER.slice(idx + 1).find((l) => !lessonDone(s, l.moduleId, l.slug));
  return after ?? LESSON_ORDER.find((l) => !lessonDone(s, l.moduleId, l.slug));
}

export function lessonByKey(key: string) {
  const [moduleId, slug] = key.split('/');
  const l = LESSON_ORDER.find((x) => x.moduleId === moduleId && x.slug === slug);
  return l ? { ...l, module: MODULES.find((m) => m.id === moduleId)! } : undefined;
}

export function lessonPath(moduleId: string, slug: string) {
  return `/learn/${moduleId}/${slug}`;
}
