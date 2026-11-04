import { GOALS } from '@/engine/git/goals';
import { findScenario } from '@/engine/git/scenarios';
import { session } from '@/engine/git/session';

// Simulator exercises are checked against the learner's saved terminal session.

export interface GoalResult {
  ok: boolean;
  message: string;
}

export function checkSimGoal(goal: string, scenario: string): GoalResult {
  const check = GOALS[goal];
  if (!check) return { ok: false, message: `This exercise's check (“${goal}”) is not available.` };
  const s = session.get();
  if (s.scenario !== scenario) {
    const title = findScenario(scenario)?.title ?? scenario;
    return { ok: false, message: `Your terminal is on a different exercise. Open “${title}” with the link above, complete it, then check again.` };
  }
  return check(s.repo);
}
