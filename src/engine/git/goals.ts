import { currentBranch, hasMarkers, headCommitId, isAncestor, range } from './repo';
import type { Repo } from './types';

export interface GoalOutcome {
  ok: boolean;
  message: string;
}

type Goal = (repo: Repo) => GoalOutcome;

const pass = (message: string): GoalOutcome => ({ ok: true, message });
const miss = (message: string): GoalOutcome => ({ ok: false, message });

/** Checks for simulator exercises. Each inspects the learner's saved terminal session. */
export const GOALS: Record<string, Goal> = {
  'feature-login-one-commit': (r) => {
    const f = r.branches['feature/login'];
    if (!f) return miss('There is no branch called feature/login yet.');
    if (currentBranch(r) !== 'feature/login') return miss('feature/login exists, but you are not on it.');
    const ahead = range(r, r.branches.main, f).length;
    if (ahead !== 1) return miss(`feature/login should be exactly 1 commit ahead of main; it is ${ahead} ahead.`);
    return pass('feature/login is checked out and one commit ahead of main.');
  },
  'main-has-feature': (r) => {
    const f = r.branches['feature/login'];
    if (!f || !r.branches.main) return miss('Both main and feature/login must exist.');
    return isAncestor(r, f, r.branches.main) ? pass('main now contains the feature commit.') : miss('main does not contain the feature commit yet.');
  },
  'merge-commit-on-main': (r) => {
    const m = r.branches.main;
    if (r.merge) return miss('A merge is still in progress. Finish it with git commit.');
    if (!m || r.commits[m].parents.length !== 2) return miss('The latest commit on main is not a merge commit (it should have two parents).');
    return pass(`main ends with merge commit ${m}, which has two parents.`);
  },
  'conflict-resolved': (r) => {
    if (r.merge) return miss(r.merge.conflicts.length ? 'The conflict is not resolved yet. Edit the file, then git add it.' : 'Conflicts are resolved; now run git commit to finish the merge.');
    const m = r.branches.main;
    if (!m || r.commits[m].parents.length !== 2) return miss('main does not end with a merge commit yet.');
    const content = r.commits[m].tree['shipping.txt'] ?? '';
    if (hasMarkers(content)) return miss('shipping.txt was committed with conflict markers still in it.');
    if (!/3-5 days/.test(content) || !/2 days/i.test(content)) return miss('shipping.txt should keep both options: "3-5 days" and the 2-day express delivery.');
    return pass('Conflict resolved, both delivery options kept, and the merge is committed.');
  },
  'pushed-main': (r) => {
    if (!r.server) return miss('No remote found. Start the exercise from its link.');
    return r.server.branches.main === r.branches.main ? pass('origin/main now matches your main.') : miss('origin/main does not have your commit yet.');
  },
  'pulled-latest': (r) => {
    if (!r.server) return miss('No remote found. Start the exercise from its link.');
    return r.branches.main === r.server.branches.main ? pass('Your main is up to date with the remote.') : miss('Your main does not have the teammate\'s commit yet.');
  },
  'on-remote-feature': (r) => {
    if (currentBranch(r) !== 'feature/gift-wrap') return miss('You are not on feature/gift-wrap.');
    if (r.upstream['feature/gift-wrap'] !== 'origin/feature/gift-wrap') return miss('Your branch is not tracking origin/feature/gift-wrap.');
    return pass('You are on feature/gift-wrap, tracking the developer\'s remote branch.');
  },
  'stash-roundtrip': (r) => {
    if (currentBranch(r) !== 'feature/search') return miss('Finish back on feature/search.');
    if (r.stash.length) return miss('Your change is still in the stash. Use git stash pop.');
    if (!r.reflog.some((e) => e.action === 'checkout: moving from feature/search to main')) {
      return miss('Switch to main (after stashing) and back to feature/search before restoring your work.');
    }
    return /filters/.test(r.files['search.txt'] ?? '') ? pass('Your uncommitted change is back and the stash is empty.') : miss('search.txt does not contain your "filters" change.');
  },
  'reverted-bad-commit': (r) => {
    const tip = headCommitId(r);
    if (!tip) return miss('No commits found.');
    const c = r.commits[tip];
    if (!c.message.startsWith('Revert "Break checkout"')) return miss('The latest commit should be a revert of "Break checkout".');
    const bad = c.parents[0];
    const before = r.commits[bad]?.parents[0];
    if (!before || r.commits[before].tree['checkout.txt'] !== c.tree['checkout.txt']) return miss('checkout.txt was not restored.');
    return pass('Reverted with a new commit; the bad commit is still in history, so nobody\'s clone breaks.');
  },
};
