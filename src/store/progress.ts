import { useSyncExternalStore } from 'react';
import { readJSON, writeJSON } from './storage';

export const PROGRESS_KEY = 'gma:v1';
export const PASS_MARK = 80;
const MAX_RECENT = 8;
const MAX_ATTEMPTS = 200;

export interface QuizAttempt {
  quizId: string; // module id (m01..) or "final"
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  date: number;
}

export type ExerciseStatus = 'solved' | 'revealed';

export interface ProgressState {
  version: 1;
  /** lesson key "m03/git-add" -> completion timestamp */
  completed: Record<string, number>;
  /** lesson keys in the order they were bookmarked */
  bookmarks: string[];
  quizzes: QuizAttempt[];
  /** most recent first */
  recent: string[];
  current?: string;
  exercises: Record<string, ExerciseStatus>;
}

function empty(): ProgressState {
  return { version: 1, completed: {}, bookmarks: [], quizzes: [], recent: [], exercises: {} };
}

function load(): ProgressState {
  const saved = readJSON<Partial<ProgressState>>(PROGRESS_KEY);
  if (!saved || saved.version !== 1) return empty();
  // Merge with defaults so older saves missing a field still work.
  return {
    ...empty(),
    ...saved,
    completed: saved.completed ?? {},
    bookmarks: Array.isArray(saved.bookmarks) ? saved.bookmarks : [],
    quizzes: Array.isArray(saved.quizzes) ? saved.quizzes : [],
    recent: Array.isArray(saved.recent) ? saved.recent : [],
    exercises: saved.exercises ?? {},
  };
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function set(next: ProgressState) {
  state = next;
  writeJSON(PROGRESS_KEY, state);
  listeners.forEach((l) => l());
}

export const progress = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setComplete(key: string, done: boolean) {
    const completed = { ...state.completed };
    if (done) completed[key] = Date.now();
    else delete completed[key];
    set({ ...state, completed });
  },

  visit(key: string) {
    const recent = [key, ...state.recent.filter((k) => k !== key)].slice(0, MAX_RECENT);
    if (state.current === key && state.recent[0] === key) return;
    set({ ...state, recent, current: key });
  },

  toggleBookmark(key: string) {
    const has = state.bookmarks.includes(key);
    set({ ...state, bookmarks: has ? state.bookmarks.filter((k) => k !== key) : [...state.bookmarks, key] });
  },

  recordQuiz(attempt: Omit<QuizAttempt, 'percent' | 'passed' | 'date'>) {
    const percent = attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0;
    const full: QuizAttempt = { ...attempt, percent, passed: percent >= PASS_MARK, date: Date.now() };
    set({ ...state, quizzes: [...state.quizzes, full].slice(-MAX_ATTEMPTS) });
    return full;
  },

  markExercise(id: string, status: ExerciseStatus) {
    // A solved exercise stays solved even if the learner later reveals the answer.
    if (state.exercises[id] === 'solved') return;
    set({ ...state, exercises: { ...state.exercises, [id]: status } });
  },

  reset() {
    set(empty());
  },

  /** Re-read from storage (used by tests and the storage event). */
  reload() {
    state = load();
    listeners.forEach((l) => l());
  },
};

if (typeof window !== 'undefined') {
  // Keep several open tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === PROGRESS_KEY) progress.reload();
  });
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(progress.subscribe, progress.get, progress.get);
}
