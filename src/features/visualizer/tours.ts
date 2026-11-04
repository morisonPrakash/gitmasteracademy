// Guided, step-by-step scenes for the visualizer. Each step runs one real command in
// the simulator and explains what to look for in the graph.

export interface TourStep {
  cmd: string;
  note: string;
  /** The command is meant to fail (e.g. a rejected push) to teach the error. */
  expectFail?: boolean;
}

export interface Tour {
  id: string;
  title: string;
  summary: string;
  scenario: string;
  steps: TourStep[];
}

export const TOURS: Tour[] = [
  {
    id: 'lifecycle',
    title: 'The Git lifecycle',
    summary: 'Working directory → staging area → repository, one command at a time.',
    scenario: 'playground',
    steps: [
      { cmd: 'git init', note: 'An empty repository: HEAD points at main, which has no commits yet.' },
      { cmd: 'echo "# Shop" > README.md', note: 'A new file appears in the working directory as untracked.' },
      { cmd: 'git add README.md', note: 'The file is copied into the staging area: it will be in the next commit.' },
      { cmd: 'git commit -m "Initial commit"', note: 'The first commit appears in the graph, and main points at it.' },
      { cmd: 'echo "Open 9-5" >> README.md', note: 'README.md is now modified in the working directory only.' },
      { cmd: 'git diff', note: 'git diff shows the unstaged change.' },
      { cmd: 'git commit -am "Add opening hours"', note: '-a staged the tracked change and committed it: a second commit, and main moves forward.' },
    ],
  },
  {
    id: 'merge',
    title: 'Fast-forward vs three-way merge',
    summary: 'See why some merges just move a label and others create a merge commit.',
    scenario: 'one-commit',
    steps: [
      { cmd: 'git switch -c feature/footer', note: 'A new label at the same commit; HEAD moves to it.' },
      { cmd: 'echo "footer" > footer.txt && git add footer.txt && git commit -m "Add footer"', note: 'feature/footer moves ahead; main stays behind.' },
      { cmd: 'git switch main', note: 'Back on main. Notice footer.txt left the working directory.' },
      { cmd: 'git merge feature/footer', note: 'main had nothing new, so Git just slid main forward: a fast-forward. No new commit.' },
      { cmd: 'git switch -c feature/cart && echo "cart" > cart.txt && git add cart.txt && git commit -m "Add cart"', note: 'Another feature branch with its own commit.' },
      { cmd: 'git switch main && echo "v2" >> README.md && git commit -am "Update README"', note: 'main now has a commit the feature lacks: the branches have diverged.' },
      { cmd: 'git merge feature/cart', note: 'A three-way merge: a new merge commit with two parents joins the lines.' },
    ],
  },
  {
    id: 'rebase',
    title: 'Rebasing a feature branch',
    summary: 'Replay a branch on top of main and watch the commits get new IDs.',
    scenario: 'diverged',
    steps: [
      { cmd: 'git log --oneline --graph --all', note: 'main and feature/cart have diverged from the initial commit.' },
      { cmd: 'git switch feature/cart', note: 'Rebase moves the branch you are on.' },
      { cmd: 'git rebase main', note: 'The cart commit was replayed on top of main as a NEW commit with a new ID. History is now linear.' },
      { cmd: 'git switch main', note: 'Back on main.' },
      { cmd: 'git merge feature/cart', note: 'Because of the rebase, this merge is a simple fast-forward.' },
    ],
  },
  {
    id: 'pull-request',
    title: 'A pull request, simulated',
    summary: 'Branch, push, review on GitHub, merge and clean up.',
    scenario: 'remote-ahead',
    steps: [
      { cmd: 'git pull', note: 'Always start from the latest main. A teammate\'s commit arrives.' },
      { cmd: 'git switch -c feature/returns', note: 'A feature branch for the ticket.' },
      { cmd: 'echo "Returns within 30 days" > returns.txt && git add returns.txt && git commit -m "Add returns policy"', note: 'Your work, committed locally.' },
      { cmd: 'git push -u origin feature/returns', note: 'The branch is now on GitHub, where you would open a pull request and get it reviewed.' },
      { cmd: 'git switch main && git merge --no-ff feature/returns -m "Merge pull request #42 from acme/feature/returns"', note: 'This is what GitHub\'s "Create a merge commit" button does after approval.' },
      { cmd: 'git push', note: 'main on GitHub now includes the feature.' },
      { cmd: 'git branch -d feature/returns && git push origin --delete feature/returns', note: 'Clean up the merged branch locally and on GitHub.' },
    ],
  },
  {
    id: 'collaboration',
    title: 'Two people, one branch',
    summary: 'A rejected push, a pull with rebase, and a successful push.',
    scenario: 'local-ahead',
    steps: [
      { cmd: 'teammate push main', note: 'Meanwhile, a teammate pushes to main on GitHub (see the Remote column).' },
      { cmd: 'git push', note: 'Rejected! GitHub has a commit you do not have. Git protects your teammate\'s work.', expectFail: true },
      { cmd: 'git pull --rebase', note: 'Fetch their commit and replay yours on top of it.' },
      { cmd: 'git push', note: 'Now the push works and both commits are on GitHub.' },
      { cmd: 'git log --oneline --graph --all', note: 'Linear history with both people\'s work.' },
    ],
  },
];
