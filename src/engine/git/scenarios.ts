import { teammatePush } from './commands';
import { emptyRepo } from './repo';
import { runAll } from './shell';
import type { Repo } from './types';

export interface Scenario {
  id: string;
  title: string;
  summary: string;
  task: string;
  build: () => Repo;
}

const base = (lines: string[]) => runAll(emptyRepo(), lines);
const cloned = (lines: string[] = []) => runAll(emptyRepo(), ['git clone https://github.com/acme/shop.git', ...lines]);

export const SCENARIOS: Scenario[] = [
  {
    id: 'playground',
    title: 'Empty playground',
    summary: 'An empty folder. Start from git init and try anything.',
    task: 'Explore freely: start with git init, create files with echo, and commit them.',
    build: () => emptyRepo(),
  },
  {
    id: 'one-commit',
    title: 'One commit on main',
    summary: 'A repository with a single commit (README.md) on main.',
    task: 'Practise branching: create a branch, commit on it, and merge it back.',
    build: () => base(['git init', 'echo "# Shop" > README.md', 'git add README.md', 'git commit -m "Initial commit"']),
  },
  {
    id: 'feature-ahead',
    title: 'Feature branch ahead of main',
    summary: 'feature/login has one commit main does not have. You are on feature/login.',
    task: 'Merge feature/login into main.',
    build: () => base([
      'git init', 'echo "# Shop" > README.md', 'git add README.md', 'git commit -m "Initial commit"',
      'git switch -c feature/login', 'echo "login form" > login.txt', 'git add login.txt', 'git commit -m "Add login form"',
    ]),
  },
  {
    id: 'diverged',
    title: 'Diverged branches',
    summary: 'main and feature/cart both have new commits since they split. You are on main.',
    task: 'Merge feature/cart into main and look at the resulting merge commit.',
    build: () => base([
      'git init', 'echo "# Shop" > README.md', 'git add README.md', 'git commit -m "Initial commit"',
      'git switch -c feature/cart', 'echo "cart" > cart.txt', 'git add cart.txt', 'git commit -m "Add cart"',
      'git switch main', 'echo "Open 9-5" >> README.md', 'git commit -am "Add opening hours"',
    ]),
  },
  {
    id: 'conflict',
    title: 'Merge conflict',
    summary: 'main and feature/express changed the same line of shipping.txt. A merge has stopped with a conflict.',
    task: 'Resolve shipping.txt so it keeps both delivery options, then complete the merge.',
    build: () => base([
      'git init', 'echo "Delivery: 5 days" > shipping.txt', 'git add shipping.txt', 'git commit -m "Add shipping info"',
      'git switch -c feature/express', 'echo "Express delivery: 2 days" > shipping.txt', 'git commit -am "Offer express delivery"',
      'git switch main', 'echo "Delivery: 3-5 days" > shipping.txt', 'git commit -am "Clarify delivery range"',
      'git merge feature/express',
    ]),
  },
  {
    id: 'local-ahead',
    title: 'Unpushed local commit',
    summary: 'A clone of acme/shop where your main has one commit that origin does not have yet.',
    task: 'Push your commit to origin.',
    build: () => cloned(['echo "Contact: shop@example.com" > contact.txt', 'git add contact.txt', 'git commit -m "Add contact page"']),
  },
  {
    id: 'remote-ahead',
    title: 'Teammate pushed to main',
    summary: 'A clone of acme/shop. A teammate has since pushed a new commit to origin/main.',
    task: 'Bring your main up to date with the remote.',
    build: () => teammatePush(cloned(), 'main', 'faq.txt', 'FAQ: shipping, returns\n', 'Add FAQ page'),
  },
  {
    id: 'remote-feature',
    title: 'Testing a developer\'s branch',
    summary: 'A developer pushed feature/gift-wrap to origin. You have not fetched it yet and are on main.',
    task: 'Get the branch and switch to it so you can test it.',
    build: () => teammatePush(cloned(), 'feature/gift-wrap', 'giftwrap.txt', 'Gift wrap: $4.99 per item\n', 'Add gift wrap option'),
  },
  {
    id: 'dirty-feature',
    title: 'Uncommitted work on a feature branch',
    summary: 'You are on feature/search with an uncommitted change to search.txt. An urgent request needs you on main.',
    task: 'Stash your work, switch to main and back, then restore your changes.',
    build: () => base([
      'git init', 'echo "# Shop" > README.md', 'git add README.md', 'git commit -m "Initial commit"',
      'git switch -c feature/search', 'echo "search box" > search.txt', 'git add search.txt', 'git commit -m "Add search box"',
      'echo "filters" >> search.txt',
    ]),
  },
  {
    id: 'bad-commit',
    title: 'A bad commit on main',
    summary: 'A clone of acme/shop where the latest commit on main, "Break checkout", was pushed and is causing problems.',
    task: 'Undo the bad commit safely, without rewriting shared history.',
    build: () => cloned(['echo "Checkout: DISABLED" > checkout.txt', 'git commit -am "Break checkout"', 'git push']),
  },
];

export function findScenario(id: string | null | undefined): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
