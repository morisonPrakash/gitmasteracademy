// Goals for simulator-based exercises. Each goal inspects the learner's saved
// terminal session (see src/engine/git/session.ts) and reports whether it is met.

export interface GoalResult {
  ok: boolean;
  message: string;
}

type GoalCheck = () => GoalResult;

const goals: Record<string, GoalCheck> = {};

export function registerGoals(more: Record<string, GoalCheck>) {
  Object.assign(goals, more);
}

export function checkSimGoal(goal: string): GoalResult {
  const check = goals[goal];
  if (!check) return { ok: false, message: `This exercise's check (“${goal}”) is not available.` };
  return check();
}
