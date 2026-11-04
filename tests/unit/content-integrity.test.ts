import { MODULES } from '@/content/catalog';
import { hasModuleContent, loadModule } from '@/content/registry';
import type { Block, Exercise, Lesson, Question } from '@/content/types';

// Guards the "no placeholder content" rule: every lesson that exists must be complete,
// and once a module's content file exists it must match the catalog exactly.

const PLACEHOLDER = /lorem ipsum|coming soon|\bTBD\b|\bFIXME\b|\[placeholder\]|content goes here|to be written/i;
// Every module is written, so a missing content file is now always a failure.
const ALL_REQUIRED = true;

function blockText(b: Block): string {
  return JSON.stringify(b);
}

function checkExercise(ex: Exercise, where: string) {
  expect(ex.problem.length, `${where} problem`).toBeGreaterThan(20);
  expect(ex.start.length, `${where} start`).toBeGreaterThan(5);
  expect(ex.expected.length, `${where} expected`).toBeGreaterThan(5);
  expect(ex.hints.length, `${where} hints`).toBeGreaterThan(0);
  expect(ex.answer.length, `${where} answer`).toBeGreaterThan(0);
  expect(ex.explanation.length, `${where} explanation`).toBeGreaterThan(20);
  const c = ex.check;
  if (c.type === 'command') expect(c.answers.length, `${where} answers`).toBeGreaterThan(0);
  if (c.type === 'choice') {
    expect(c.options.length, `${where} options`).toBeGreaterThanOrEqual(2);
    expect(c.correct, `${where} correct`).toBeLessThan(c.options.length);
  }
  if (c.type === 'order') expect(c.items.length, `${where} order items`).toBeGreaterThanOrEqual(3);
}

function checkQuestion(q: Question, where: string) {
  expect(q.prompt.length, `${where} prompt`).toBeGreaterThan(10);
  expect(q.explanation.length, `${where} explanation`).toBeGreaterThan(15);
  if (q.kind === 'command') {
    expect(q.answers?.length ?? 0, `${where} answers`).toBeGreaterThan(0);
  } else {
    expect(q.options?.length ?? 0, `${where} options`).toBeGreaterThanOrEqual(3);
    expect(q.correct, `${where} correct`).toBeDefined();
    expect(q.correct!, `${where} correct index`).toBeLessThan(q.options!.length);
  }
}

function checkLesson(lesson: Lesson, where: string) {
  expect(lesson.summary.length, `${where} summary`).toBeGreaterThan(20);
  expect(lesson.blocks.length, `${where} blocks`).toBeGreaterThanOrEqual(5);
  expect(lesson.exercises.length, `${where} exercises`).toBeGreaterThanOrEqual(1);
  expect(lesson.sources.length, `${where} sources`).toBeGreaterThanOrEqual(1);
  for (const s of lesson.sources) expect(s.url, `${where} source url`).toMatch(/^https:\/\//);
  const text = JSON.stringify(lesson);
  expect(PLACEHOLDER.test(text), `${where} contains placeholder text`).toBe(false);
  expect(lesson.blocks.some((b) => b.type === 'heading'), `${where} has a heading`).toBe(true);
  for (const b of lesson.blocks) {
    expect(blockText(b).length).toBeGreaterThan(10);
    if (b.type === 'annotated') {
      // Every annotation must point at a real, non-blank line of the code it explains.
      const lines = b.code.split('\n');
      for (const n of b.notes) {
        expect(lines[n.line - 1]?.trim(), `${where} annotation line ${n.line}`).toBeTruthy();
      }
    }
  }
  lesson.exercises.forEach((ex, i) => checkExercise(ex, `${where} exercise ${i + 1}`));
}

describe('curriculum catalog', () => {
  it('has 14 modules with unique ids and lesson slugs', () => {
    expect(MODULES).toHaveLength(14);
    expect(new Set(MODULES.map((m) => m.id)).size).toBe(14);
    for (const m of MODULES) {
      expect(new Set(m.lessons.map((l) => l.slug)).size, m.id).toBe(m.lessons.length);
    }
  });

  if (ALL_REQUIRED) {
    it('has content for every module', () => {
      for (const m of MODULES) expect(hasModuleContent(m.id), m.id).toBe(true);
    });
  }
});

describe.each(MODULES.filter((m) => hasModuleContent(m.id)).map((m) => [m.id, m] as const))(
  'module %s content',
  (_id, meta) => {
    it('matches the catalog lesson list and order', async () => {
      const mod = await loadModule(meta.id);
      expect(mod.id).toBe(meta.id);
      expect(mod.lessons.map((l) => l.slug)).toEqual(meta.lessons.map((l) => l.slug));
      expect(mod.lessons.map((l) => l.title)).toEqual(meta.lessons.map((l) => l.title));
    });

    it('has complete lessons with exercises and sources', async () => {
      const mod = await loadModule(meta.id);
      mod.lessons.forEach((l) => checkLesson(l, `${meta.id}/${l.slug}`));
      const ids = mod.lessons.flatMap((l) => l.exercises.map((e) => e.id));
      expect(new Set(ids).size, 'unique exercise ids').toBe(ids.length);
    });

    it('has a quiz with at least 10 valid questions', async () => {
      const mod = await loadModule(meta.id);
      expect(mod.quiz.length).toBeGreaterThanOrEqual(10);
      mod.quiz.forEach((q, i) => checkQuestion(q, `${meta.id} quiz ${i + 1}`));
      expect(new Set(mod.quiz.map((q) => q.id)).size).toBe(mod.quiz.length);
      expect(PLACEHOLDER.test(JSON.stringify(mod.quiz))).toBe(false);
    });
  },
);
