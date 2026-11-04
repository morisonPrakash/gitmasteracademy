import { loadAllModules } from '@/content/registry';
import { teammatePush } from '@/engine/git/commands';
import { GOALS } from '@/engine/git/goals';
import { emptyRepo, headCommitId } from '@/engine/git/repo';
import { SCENARIOS, findScenario } from '@/engine/git/scenarios';
import { run, runAll, tokenize } from '@/engine/git/shell';
import type { Repo } from '@/engine/git/types';
import { TOURS } from '@/features/visualizer/tours';

function exec(repo: Repo, ...lines: string[]) {
  let r = { repo, output: '', ok: true, explain: [] as string[] };
  for (const l of lines) {
    r = run(r.repo, l);
  }
  return r;
}

const started = () => runAll(emptyRepo(), ['git init', 'echo "# Shop" > README.md', 'git add README.md', 'git commit -m "Initial commit"']);

describe('tokenizer', () => {
  it('keeps quoted words and redirection together', () => {
    expect(tokenize('git commit -m "Add login form"')).toEqual(['git', 'commit', '-m', 'Add login form']);
    expect(tokenize('echo "a b">>notes.txt')).toEqual(['echo', 'a b', '>>', 'notes.txt']);
    expect(tokenize("git commit -m ''")).toEqual(['git', 'commit', '-m', '']);
  });
});

describe('basic workflow', () => {
  it('requires a repository', () => {
    const r = run(emptyRepo(), 'git status');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('not a git repository');
  });

  it('init → add → commit → log', () => {
    let r = run(emptyRepo(), 'git init');
    expect(r.output).toContain('Initialized empty Git repository');
    r = exec(r.repo, 'echo "hello" > a.txt', 'git status');
    expect(r.output).toContain('Untracked files');
    r = exec(r.repo, 'git add a.txt', 'git status');
    expect(r.output).toContain('new file:   a.txt');
    r = exec(r.repo, 'git commit -m "Add a"');
    expect(r.output).toMatch(/^\[main \(root-commit\) [0-9a-f]{7}\] Add a/);
    expect(r.output).toContain('create mode 100644 a.txt');
    r = exec(r.repo, 'git status');
    expect(r.output).toContain('nothing to commit, working tree clean');
    r = exec(r.repo, 'git log --oneline');
    expect(r.output).toMatch(/[0-9a-f]{7} \(HEAD -> main\) Add a/);
  });

  it('short status shows staged and unstaged columns', () => {
    const r = exec(started(), 'echo "x" >> README.md', 'git add README.md', 'echo "y" >> README.md', 'echo "n" > new.txt', 'git status -s');
    expect(r.output).toBe('MM README.md\n?? new.txt');
  });

  it('refuses to commit with nothing staged', () => {
    const r = exec(started(), 'echo "x" >> README.md', 'git commit -m "x"');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('no changes added to commit');
  });

  it('commit -am stages tracked files only', () => {
    const r = exec(started(), 'echo "x" >> README.md', 'echo "new" > new.txt', 'git commit -am "Update"', 'git status -s');
    expect(r.output).toBe('?? new.txt');
  });

  it('diff and diff --staged', () => {
    let r = exec(started(), 'echo "line 2" >> README.md', 'git diff');
    expect(r.output).toContain('+line 2');
    r = exec(r.repo, 'git add README.md', 'git diff');
    expect(r.output).toBe('');
    r = exec(r.repo, 'git diff --staged');
    expect(r.output).toContain('+line 2');
  });

  it('restore discards and restore --staged unstages', () => {
    let r = exec(started(), 'echo "oops" >> README.md', 'git add README.md', 'git restore --staged README.md', 'git status -s');
    expect(r.output).toBe(' M README.md');
    r = exec(r.repo, 'git restore README.md', 'git status -s');
    expect(r.output).toBe('');
  });

  it('rm --cached keeps the file but untracks it', () => {
    const r = exec(started(), 'git rm --cached README.md', 'git status -s');
    expect(r.output).toBe('D  README.md\n?? README.md');
  });

  it('show rev:path reads old content', () => {
    const r = exec(started(), 'echo "v2" > README.md', 'git commit -am "v2"', 'git show HEAD~1:README.md');
    expect(r.output).toBe('# Shop');
  });
});

describe('branches and merging', () => {
  it('branch creates without switching; switch -c switches', () => {
    let r = exec(started(), 'git branch feature/a', 'git branch --show-current');
    expect(r.output).toBe('main');
    r = exec(r.repo, 'git switch -c feature/b');
    expect(r.output).toBe("Switched to a new branch 'feature/b'");
  });

  it('fast-forward merge', () => {
    const r = exec(findScenario('feature-ahead')!.build(), 'git switch main', 'git merge feature/login');
    expect(r.output).toContain('Fast-forward');
    expect(r.repo.branches.main).toBe(r.repo.branches['feature/login']);
  });

  it('three-way merge creates a two-parent commit', () => {
    const r = exec(findScenario('diverged')!.build(), 'git merge feature/cart');
    expect(r.output).toContain("Merge made by the 'ort' strategy.");
    expect(r.repo.commits[r.repo.branches.main].parents).toHaveLength(2);
  });

  it('conflict, resolve both, add, commit', () => {
    const repo = findScenario('conflict')!.build();
    expect(repo.merge?.conflicts).toEqual(['shipping.txt']);
    expect(repo.files['shipping.txt']).toContain('<<<<<<< HEAD');
    let r = exec(repo, 'git status -s');
    expect(r.output).toBe('UU shipping.txt');
    r = exec(r.repo, 'git commit -m "x"');
    expect(r.ok).toBe(false);
    r = exec(r.repo, 'resolve shipping.txt both', 'git add shipping.txt', 'git commit -m "Merge express"');
    expect(r.ok).toBe(true);
    expect(r.repo.merge).toBeUndefined();
    expect(r.repo.files['shipping.txt']).toBe('Delivery: 3-5 days\nExpress delivery: 2 days\n');
  });

  it('merge --abort restores the pre-merge state', () => {
    const r = exec(findScenario('conflict')!.build(), 'git merge --abort', 'git status -s');
    expect(r.output).toBe('');
    expect(r.repo.files['shipping.txt']).toBe('Delivery: 3-5 days\n');
  });

  it('branch -d refuses unmerged, -D forces', () => {
    let r = exec(findScenario('feature-ahead')!.build(), 'git switch main', 'git branch -d feature/login');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('not fully merged');
    r = exec(r.repo, 'git branch -D feature/login');
    expect(r.output).toMatch(/Deleted branch feature\/login \(was [0-9a-f]{7}\)\./);
  });

  it('switching with clashing local changes is refused', () => {
    const r = exec(findScenario('feature-ahead')!.build(), 'echo "changed" > login.txt', 'git switch main');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('would be overwritten by checkout');
  });

  it('detached HEAD via switch --detach', () => {
    const r = exec(started(), 'echo "2" >> README.md', 'git commit -am "Two"', 'git switch --detach HEAD~1', 'git status');
    expect(r.output).toContain('HEAD detached at');
  });

  it('rebase replays commits onto main', () => {
    const r = exec(findScenario('diverged')!.build(), 'git switch feature/cart', 'git rebase main', 'git log --oneline');
    expect(r.output.split('\n')).toHaveLength(3);
    expect(r.repo.commits[r.repo.branches['feature/cart']].parents[0]).toBe(r.repo.branches.main);
  });
});

describe('undoing', () => {
  it('reset --soft keeps changes staged; --hard discards', () => {
    let r = exec(started(), 'echo "2" >> README.md', 'git commit -am "Two"', 'git reset --soft HEAD~1', 'git status -s');
    expect(r.output).toBe('M  README.md');
    r = exec(r.repo, 'git reset --hard HEAD');
    expect(r.output).toMatch(/HEAD is now at [0-9a-f]{7} Initial commit/);
    expect(r.repo.files['README.md']).toBe('# Shop\n');
  });

  it('reflog can recover a commit lost by reset --hard', () => {
    let r = exec(started(), 'echo "2" >> README.md', 'git commit -am "Two"');
    const lost = headCommitId(r.repo)!;
    r = exec(r.repo, 'git reset --hard HEAD~1', 'git reflog');
    expect(r.output).toContain(lost);
    r = exec(r.repo, 'git reset --hard HEAD@{1}');
    expect(headCommitId(r.repo)).toBe(lost);
  });

  it('revert adds an undo commit', () => {
    const r = exec(findScenario('bad-commit')!.build(), 'git revert HEAD');
    expect(r.output).toMatch(/\[main [0-9a-f]{7}\] Revert "Break checkout"/);
    expect(r.repo.files['checkout.txt']).toBe('Checkout: card payments\n');
  });

  it('stash push and pop', () => {
    let r = exec(findScenario('dirty-feature')!.build(), 'git stash');
    expect(r.output).toContain('Saved working directory and index state WIP on feature/search');
    expect(r.repo.files['search.txt']).toBe('search box\n');
    r = exec(r.repo, 'git stash pop');
    expect(r.output).toContain('Dropped refs/stash@{0}');
    expect(r.repo.files['search.txt']).toContain('filters');
  });

  it('amend replaces the last commit', () => {
    const before = headCommitId(started())!;
    const r = exec(started(), 'git commit --amend -m "Better message"');
    expect(headCommitId(r.repo)).not.toBe(before);
    expect(r.repo.commits[headCommitId(r.repo)!].message).toBe('Better message');
  });
});

describe('remotes', () => {
  it('clone sets up origin and tracking', () => {
    const r = exec(emptyRepo(), 'git clone https://github.com/acme/shop.git', 'git status');
    expect(r.output).toContain("Your branch is up to date with 'origin/main'.");
    expect(exec(r.repo, 'git remote -v').output).toContain('origin\thttps://github.com/acme/shop.git (fetch)');
  });

  it('push requires an upstream for new branches', () => {
    let r = exec(findScenario('local-ahead')!.build(), 'git switch -c feature/x', 'git push');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('has no upstream branch');
    r = exec(r.repo, 'git push -u origin feature/x');
    expect(r.output).toContain('* [new branch]      feature/x -> feature/x');
  });

  it('push is rejected when the remote has new work, then succeeds after pull --rebase', () => {
    let repo = findScenario('local-ahead')!.build();
    repo = teammatePush(repo, 'main', 'faq.txt', 'FAQ\n', 'Add FAQ');
    let r = exec(repo, 'git push');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('[rejected]');
    r = exec(r.repo, 'git pull --rebase', 'git push');
    expect(r.ok).toBe(true);
    expect(r.repo.server!.branches.main).toBe(r.repo.branches.main);
  });

  it('fetch updates origin/* only', () => {
    const repo = findScenario('remote-ahead')!.build();
    const before = repo.branches.main;
    const r = exec(repo, 'git fetch', 'git status');
    expect(r.repo.branches.main).toBe(before);
    expect(r.output).toContain("behind 'origin/main' by 1 commit");
  });

  it('merge-base --is-ancestor sets the exit status for && chains', () => {
    const repo = findScenario('diverged')!.build();
    expect(exec(repo, 'git merge-base --is-ancestor main feature/cart && echo yes').output).toBe('');
    expect(exec(repo, 'git merge-base --is-ancestor HEAD~1 main && echo yes').output).toBe('yes');
  });
});

describe('shell helpers', () => {
  it('rejects unsupported commands clearly', () => {
    const r = run(emptyRepo(), 'sudo rm -rf /');
    expect(r.ok).toBe(false);
    expect(r.output).toContain('safe Git simulation');
  });
  it('unknown git subcommands are explained', () => {
    const r = run(started(), 'git frobnicate');
    expect(r.output).toContain('not a git command in this simulation');
  });
});

describe('visualizer tours', () => {
  it.each(TOURS.map((t) => [t.id, t] as const))('tour %s runs every step', (_id, t) => {
    let repo = findScenario(t.scenario)!.build();
    for (const step of t.steps) {
      const r = run(repo, step.cmd);
      expect(r.ok, `${t.id}: "${step.cmd}" → ${r.output}`).toBe(!step.expectFail);
      repo = r.repo;
    }
  });
});

describe('scenarios and goals', () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))('scenario %s builds', (_id, s) => {
    expect(() => s.build()).not.toThrow();
  });

  it('every simulator exercise answer reaches its goal', async () => {
    const mods = await loadAllModules();
    const sims = mods.flatMap((m) => m.lessons.flatMap((l) => l.exercises)).filter((e) => e.check.type === 'sim');
    expect(sims.length).toBeGreaterThan(0);
    for (const ex of sims) {
      if (ex.check.type !== 'sim') continue;
      const scenario = findScenario(ex.check.scenario);
      expect(scenario, `${ex.id}: scenario ${ex.check.scenario}`).toBeDefined();
      const goal = GOALS[ex.check.goal];
      expect(goal, `${ex.id}: goal ${ex.check.goal}`).toBeDefined();
      const startState = scenario!.build();
      expect(goal(startState).ok, `${ex.id}: goal must not pass before doing anything`).toBe(false);
      const solved = runAll(startState, ex.answer.split('\n'));
      const outcome = goal(solved);
      expect(outcome.ok, `${ex.id}: ${outcome.message}`).toBe(true);
    }
  });
});
