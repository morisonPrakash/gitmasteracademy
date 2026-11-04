import { MODULES, findModule } from '@/content/catalog';
import { loadAllModules, loadModule } from '@/content/registry';
import type { Question } from '@/content/types';
import { shuffle } from '@/lib/text';

export const FINAL_ID = 'final';
export const FINAL_SIZE = 40;

export function quizTitle(id: string) {
  if (id === FINAL_ID) return 'Final Assessment';
  const m = findModule(id);
  return m ? `Module ${m.number}: ${m.navTitle}` : id;
}

/** A question prepared for one attempt: options shuffled, remembering the correct one. */
export interface PreparedQuestion {
  q: Question;
  moduleId: string;
  options?: string[];
  correct?: number;
}

function prepare(q: Question, moduleId: string): PreparedQuestion {
  if (!q.options || q.correct === undefined) return { q, moduleId };
  const order = shuffle(q.options.map((_, i) => i));
  return { q, moduleId, options: order.map((i) => q.options![i]), correct: order.indexOf(q.correct) };
}

/** Questions for one attempt, in random order. The final draws evenly from every module. */
export async function buildAttempt(quizId: string): Promise<PreparedQuestion[]> {
  if (quizId === FINAL_ID) {
    const mods = await loadAllModules();
    const perModule = Math.floor(FINAL_SIZE / mods.length); // 2 each
    const picked: PreparedQuestion[] = [];
    const rest: PreparedQuestion[] = [];
    for (const m of mods) {
      const qs = shuffle(m.quiz).map((q) => prepare(q, m.id));
      picked.push(...qs.slice(0, perModule));
      rest.push(...qs.slice(perModule));
    }
    picked.push(...shuffle(rest).slice(0, FINAL_SIZE - picked.length));
    return shuffle(picked);
  }
  const mod = await loadModule(quizId);
  return shuffle(mod.quiz).map((q) => prepare(q, quizId));
}

export const QUIZ_IDS = [...MODULES.map((m) => m.id), FINAL_ID];
