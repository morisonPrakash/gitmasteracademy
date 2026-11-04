import type { Project } from './types';

export const PROJECTS: Project[] = [
  {
    slug: 'login-application',
    number: 1,
    title: 'Login Application',
    summary: 'Manage a small login app on your own: repository setup, branches, commits, pull requests, a bug fix and a tagged release.',
    skills: ['init and first commit', '.gitignore', 'connect to GitHub', 'feature branches', 'pull requests', 'bug-fix branch', 'tags'],
    roles: ['You (developer)'],
    steps: [
      { title: 'Create the project and repository', text: 'Make a folder, initialise Git and add a README.', terminal: [
        { cmd: 'mkdir login-app && cd login-app' },
        { cmd: 'git init', out: 'Initialized empty Git repository in /home/you/login-app/.git/' },
        { cmd: 'echo "# Login App" > README.md' },
      ] },
      { title: 'Add a .gitignore before the first commit', text: 'Keep dependencies, build output and secrets out of history from day one.', terminal: [
        { cmd: 'printf "node_modules/\\ndist/\\n.env\\n*.log\\n" > .gitignore' },
        { cmd: 'git add README.md .gitignore' },
        { cmd: 'git commit -m "Initial commit: README and .gitignore"', out: '[main (root-commit) 1a2b3c4] Initial commit: README and .gitignore\n 2 files changed, 5 insertions(+)\n create mode 100644 .gitignore\n create mode 100644 README.md' },
      ] },
      { title: 'Publish to GitHub', text: 'Create an empty repository named `login-app` on GitHub (no README), then connect and push.', terminal: [
        { cmd: 'git remote add origin https://github.com/<you>/login-app.git' },
        { cmd: 'git push -u origin main', out: ' * [new branch]      main -> main\nbranch \'main\' set up to track \'origin/main\'.' },
      ] },
      { title: 'Build the login form on a feature branch', text: 'Never build features directly on main.', terminal: [
        { cmd: 'git switch -c feature/login-form', out: 'Switched to a new branch \'feature/login-form\'' },
        { cmd: 'git add index.html login.js' },
        { cmd: 'git commit -m "Add login form markup"' },
        { cmd: 'git add login.js' },
        { cmd: 'git commit -m "Validate email and password before submit"' },
      ] },
      { title: 'Review your own changes and push', terminal: [
        { cmd: 'git log --oneline main..feature/login-form', out: '7d8e9f0 Validate email and password before submit\n4c5d6e7 Add login form markup' },
        { cmd: 'git push -u origin feature/login-form', out: ' * [new branch]      feature/login-form -> feature/login-form' },
      ] },
      { title: 'Open a pull request', text: 'On GitHub: Compare & pull request → base `main` ← compare `feature/login-form`. Write a description with "How to test". Even working alone, PRs give you a review checkpoint and run CI.' },
      { title: 'Respond to feedback with another commit', text: 'Suppose CI or a friend notices passwords shorter than 8 characters are accepted.', terminal: [
        { cmd: 'git commit -am "Require passwords of at least 8 characters"' },
        { cmd: 'git push' },
      ] },
      { title: 'Merge and clean up', text: 'Squash and merge on GitHub, then update your local main.', terminal: [
        { cmd: 'git switch main && git pull', out: 'Fast-forward\n index.html | 24 ++++++++++++++++++++++++\n login.js   | 41 +++++++++++++++++++++++++++++++++++++++++\n 2 files changed, 65 insertions(+)' },
        { cmd: 'git branch -D feature/login-form', out: 'Deleted branch feature/login-form (was 9a0b1c2).' },
      ] },
      { title: 'Tag the first release', terminal: [
        { cmd: 'git tag -a v1.0.0 -m "First release: login form"' },
        { cmd: 'git push origin v1.0.0', out: ' * [new tag]         v1.0.0 -> v1.0.0' },
      ] },
      { title: 'A bug is reported: fix it on a bug-fix branch', text: 'The error message shows under the wrong field.', terminal: [
        { cmd: 'git switch -c bugfix/error-position' },
        { cmd: 'git commit -am "Show password errors under the password field"' },
        { cmd: 'git push -u origin bugfix/error-position' },
      ], callout: { kind: 'tip', text: 'After the PR merges, tag `v1.0.1`. A bug fix increments the PATCH number.' } },
      { title: 'Check your history', terminal: [{ cmd: 'git log --oneline --graph --all -6', out: '* 3f4a5b6 (HEAD -> main, tag: v1.0.1, origin/main) Show password errors under the password field (#2)\n* 8e9f0a1 (tag: v1.0.0) Add login form (#1)\n* 1a2b3c4 Initial commit: README and .gitignore' }] },
    ],
  },
  {
    slug: 'ecommerce-application',
    number: 2,
    title: 'E-commerce Application',
    summary: 'Three developers build cart, payment and search features in parallel. Practise rebasing, a shared-file conflict, and a release branch.',
    skills: ['parallel feature branches', 'keeping a branch up to date', 'rebasing', 'conflict resolution', '--force-with-lease', 'release branches', 'merging a release back'],
    roles: ['You (search)', 'Rahul (cart)', 'Mei (payment)', 'Tech lead (release)'],
    steps: [
      { title: 'Everyone clones and branches from the same main', role: 'All developers', terminal: [
        { cmd: 'git clone https://github.com/acme/shop.git && cd shop' },
        { cmd: 'git switch -c feature/search', out: 'Switched to a new branch \'feature/search\'' },
      ], callout: { kind: 'note', text: 'Rahul creates `feature/cart` and Mei `feature/payment` from the same commit at the same time.' } },
      { title: 'Work in parallel', role: 'You', terminal: [
        { cmd: 'git commit -am "Add search box to header"' },
        { cmd: 'git commit -am "Register /search route in routes.ts"' },
        { cmd: 'git push -u origin feature/search' },
      ] },
      { title: 'Mei\'s payment PR merges first', role: 'Mei', text: 'Her PR also registers a route in `routes.ts`, on the same line where you added yours.' },
      { title: 'Update your branch with the new main', role: 'You', terminal: [
        { cmd: 'git fetch' },
        { cmd: 'git log --oneline HEAD..origin/main', out: 'b7c8d9e Add payment page and route (#14)' },
        { cmd: 'git rebase origin/main', out: 'Auto-merging src/routes.ts\nCONFLICT (content): Merge conflict in src/routes.ts\nerror: could not apply 5e6f7a8... Register /search route in routes.ts' },
      ] },
      { title: 'Resolve the conflict: keep both routes', role: 'You', text: 'During a rebase, "HEAD" is main (Mei\'s route) and the incoming change is yours.', terminal: [
        { cmd: 'git diff --name-only --diff-filter=U', out: 'src/routes.ts' },
        { cmd: 'git add src/routes.ts' },
        { cmd: 'git rebase --continue', out: 'Successfully rebased and updated refs/heads/feature/search.' },
        { cmd: 'npm test', out: 'Tests: 96 passed, 96 total' },
      ] },
      { title: 'Update your already-pushed branch safely', role: 'You', terminal: [
        { cmd: 'git push --force-with-lease', out: ' + 5e6f7a8...c4d5e6f feature/search -> feature/search (forced update)' },
      ], callout: { kind: 'warning', text: 'Use `--force-with-lease` only on your own branch. Rahul and Mei never force-push main.' } },
      { title: 'Rahul\'s cart and your search PRs merge', role: 'Reviewers', text: 'Each PR gets one approval and green CI, then is squash-merged.' },
      { title: 'Cut a release branch', role: 'Tech lead', terminal: [
        { cmd: 'git switch main && git pull' },
        { cmd: 'git switch -c release/1.1', out: 'Switched to a new branch \'release/1.1\'' },
        { cmd: 'git push -u origin release/1.1' },
      ], callout: { kind: 'note', text: 'QA now tests `release/1.1`. New features keep merging into main without affecting the release.' } },
      { title: 'Fix a bug QA found on the release branch', role: 'Rahul', terminal: [
        { cmd: 'git switch -c bugfix/cart-total release/1.1' },
        { cmd: 'git commit -am "Fix cart total rounding"' },
        { cmd: 'git push -u origin bugfix/cart-total' },
      ], callout: { kind: 'tip', text: 'The PR targets `release/1.1`, not main.' } },
      { title: 'Tag the release and bring the fix back to main', role: 'Tech lead', terminal: [
        { cmd: 'git switch release/1.1 && git pull' },
        { cmd: 'git tag -a v1.1.0 -m "Release 1.1.0: search, cart, payment"' },
        { cmd: 'git push origin v1.1.0' },
        { cmd: 'git switch main && git merge --no-ff release/1.1 -m "Merge release/1.1 back into main"' },
        { cmd: 'git push' },
      ] },
    ],
  },
  {
    slug: 'qa-automation-framework',
    number: 3,
    title: 'QA Automation Framework',
    summary: 'Create and maintain a Playwright automation repository: structure, environments, CI, test branches, reviews, flaky-test handling and framework releases.',
    skills: ['repository structure', '.gitignore for test output', 'environment config', 'CI workflow', 'test branches and PRs', 'quarantining flaky tests', 'tagging framework versions'],
    roles: ['You (QA automation engineer)', 'QA reviewer'],
    steps: [
      { title: 'Create the repository', terminal: [
        { cmd: 'mkdir shop-e2e && cd shop-e2e && git init' },
        { cmd: 'npm init playwright@latest -- --quiet --browser=chromium --browser=firefox --gha', out: 'Initializing project in \'.\'\n✔ Success! Created a Playwright Test project at /home/you/shop-e2e' },
      ] },
      { title: 'Ignore generated output and secrets', terminal: [
        { cmd: 'cat .gitignore', out: 'node_modules/\n/test-results/\n/playwright-report/\n/blob-report/\n/playwright/.cache/' },
        { cmd: 'printf ".env\\n.auth/\\n" >> .gitignore' },
      ] },
      { title: 'Structure for growth', text: 'Create `pages/` for page objects, `fixtures/` for shared setup, `tests/smoke` and `tests/regression`, and `config/environments.ts` selecting the base URL from `TEST_ENV`.' },
      { title: 'First commit and publish', terminal: [
        { cmd: 'git add . && git commit -m "Set up Playwright framework with page objects and environments"' },
        { cmd: 'git remote add origin https://github.com/acme/shop-e2e.git && git push -u origin main' },
      ] },
      { title: 'CI: smoke tests on every PR, regression nightly', text: 'Edit `.github/workflows/playwright.yml` (Module 11) so pull requests run `--grep @smoke` and a `schedule` runs everything. Add `STAGING_URL` as a variable and the test password as a secret.' },
      { title: 'Add tests for a ticket on a test branch', terminal: [
        { cmd: 'git switch -c test/SHOP-275-gift-wrap' },
        { cmd: 'git add pages/GiftWrapSection.ts tests/regression/gift-wrap.spec.ts' },
        { cmd: 'git commit -m "test(checkout): gift wrap pricing and toggle"' },
        { cmd: 'npx playwright test gift-wrap --repeat-each=5', out: '  15 passed (38.4s)' },
        { cmd: 'git push -u origin test/SHOP-275-gift-wrap' },
      ] },
      { title: 'Peer review', role: 'QA reviewer', text: 'Checks selectors, waits, data setup and secrets (Module 14 checklist), runs the specs locally, approves. Squash-merged.' },
      { title: 'A test turns flaky: quarantine it, don\'t delete it', terminal: [
        { cmd: 'git switch -c test/quarantine-coupon-expiry' },
        { cmd: 'git commit -am "test: quarantine coupon expiry test (flaky, SHOP-311)"' },
      ], callout: { kind: 'best', text: 'Use `test.fixme()` with a ticket number so the quarantine is visible and tracked, and fix it in a follow-up.' } },
      { title: 'Upgrade Playwright on its own branch', terminal: [
        { cmd: 'git switch -c chore/upgrade-playwright' },
        { cmd: 'npm install -D @playwright/test@latest && npx playwright install' },
        { cmd: 'git commit -am "chore: upgrade Playwright"' },
      ] },
      { title: 'Release the framework', text: 'Other teams import shared fixtures, so version them.', terminal: [
        { cmd: 'git tag -a v2.0.0 -m "Framework 2.0: environments, gift wrap coverage"' },
        { cmd: 'git push origin v2.0.0' },
      ] },
    ],
  },
  {
    slug: 'team-collaboration',
    number: 4,
    title: 'Team Collaboration Simulation',
    summary: 'A full sprint with six roles: parallel development, code review, a merge conflict between two PRs, QA defects, a release and a production hotfix.',
    skills: ['team branching', 'code review', 'conflicting PRs', 'QA defect loop', 'release tagging', 'hotfix from a tag', 'merging the hotfix back'],
    roles: ['Project manager', 'Junior developer', 'Senior developer', 'QA engineer', 'Tech lead', 'DevOps engineer'],
    steps: [
      { title: 'Sprint planning', role: 'Project manager', text: 'Tickets SHOP-320 "Order history page" (Junior dev) and SHOP-321 "Account settings page" (Senior dev). QA reviews acceptance criteria and asks about pagination.' },
      { title: 'Both developers branch from main', role: 'Developers', terminal: [
        { cmd: 'git switch main && git pull && git switch -c feature/SHOP-320-order-history', prompt: 'junior $' },
        { cmd: 'git switch main && git pull && git switch -c feature/SHOP-321-account-settings', prompt: 'senior $' },
      ] },
      { title: 'Both edit the navigation menu', role: 'Developers', text: 'Each adds a link in `NavMenu.tsx` at the same place. Neither knows yet.' },
      { title: 'Senior\'s PR merges first; Junior\'s PR now conflicts', role: 'Junior developer', text: 'GitHub shows "This branch has conflicts that must be resolved".', terminal: [
        { prompt: 'junior $', cmd: 'git fetch && git merge origin/main', out: 'Auto-merging src/NavMenu.tsx\nCONFLICT (content): Merge conflict in src/NavMenu.tsx\nAutomatic merge failed; fix conflicts and then commit the result.' },
        { prompt: 'junior $', cmd: 'git add src/NavMenu.tsx && git commit --no-edit', out: '[feature/SHOP-320-order-history 6a7b8c9] Merge remote-tracking branch \'origin/main\' into feature/SHOP-320-order-history' },
        { prompt: 'junior $', cmd: 'git push' },
      ], callout: { kind: 'tip', text: 'The Junior used merge, not rebase, because the Senior had already pulled the branch to help with review. Never rebase a shared branch.' } },
      { title: 'Code review', role: 'Senior developer', text: 'Requests changes: "Paginate orders, 20 per page, as QA asked in planning." The Junior pushes a fix commit and re-requests review. Approved.' },
      { title: 'Merge, CI and staging', role: 'DevOps engineer', text: 'Squash-merged. The pipeline deploys `main` to staging as `2.8.0-dev+4f5a6b7`.' },
      { title: 'QA finds a defect', role: 'QA engineer', terminal: [
        { prompt: 'qa $', cmd: 'git log --oneline v2.7.0..origin/main', out: '4f5a6b7 SHOP-320: Order history page (#88)\n2c3d4e5 SHOP-321: Account settings page (#87)' },
      ], callout: { kind: 'example', text: 'SHOP-330: "Order history shows other customers\' orders when page=2 is requested directly." Severity critical. Linked to commit 4f5a6b7.' } },
      { title: 'Bug-fix cycle', role: 'Junior developer → QA', terminal: [
        { prompt: 'junior $', cmd: 'git switch main && git pull && git switch -c bugfix/SHOP-330-order-scope' },
        { prompt: 'junior $', cmd: 'git commit -am "fix(orders): scope pagination query to the signed-in user"' },
        { prompt: 'junior $', cmd: 'git push -u origin bugfix/SHOP-330-order-scope' },
      ], callout: { kind: 'note', text: 'QA verifies on the PR preview, adds an API test for authorisation on page=2, approves. Merged and redeployed.' } },
      { title: 'Release', role: 'Tech lead', terminal: [
        { prompt: 'lead $', cmd: 'git tag -a v2.8.0 9d0e1f2 -m "Release 2.8.0: order history, account settings"' },
        { prompt: 'lead $', cmd: 'git push origin v2.8.0' },
      ], callout: { kind: 'best', text: 'The tag is placed on the exact commit QA signed off (9d0e1f2), not on whatever main is now.' } },
      { title: 'Production incident: hotfix from the tag', role: 'Senior developer', terminal: [
        { prompt: 'senior $', cmd: 'git switch -c hotfix/SHOP-335-settings-crash v2.8.0' },
        { prompt: 'senior $', cmd: 'git commit -am "fix(settings): handle missing phone number"' },
        { prompt: 'senior $', cmd: 'git push -u origin hotfix/SHOP-335-settings-crash' },
      ] },
      { title: 'Ship the hotfix and merge it back', role: 'Tech lead + DevOps', terminal: [
        { prompt: 'lead $', cmd: 'git tag -a v2.8.1 <hotfix-merge-commit> -m "Hotfix 2.8.1"' },
        { prompt: 'lead $', cmd: 'git push origin v2.8.1' },
        { prompt: 'lead $', cmd: 'git switch main && git pull && git cherry-pick -x <hotfix-commit> && git push' },
      ], callout: { kind: 'warning', text: 'If the fix is not brought back to main, the next release reintroduces the crash.' } },
      { title: 'Retrospective', role: 'Whole team', text: 'Actions: add authorisation tests to the PR checklist; agree that shared files like NavMenu are coordinated in stand-up; keep PRs smaller to reduce conflicts.' },
    ],
  },
];

export function findProject(slug: string) {
  return PROJECTS.find((p) => p.slug === slug);
}
