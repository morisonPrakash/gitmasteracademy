// The five example workflows used in Module 11. Kept in one file so line numbers
// in the annotations stay next to the YAML they describe.

export const testsOnPush = `name: Unit tests

on:
  push:
    branches: [main, 'feature/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Check out code
        uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test`;

export const testsOnPushNotes = [
  { line: 1, text: 'The workflow\'s display name in the **Actions** tab and on commit checks.' },
  { line: 3, text: '`on:` lists the **triggers**: the events that start this workflow.' },
  { line: 4, text: 'Run when commits are **pushed**…' },
  { line: 5, text: '…but only to `main` or any branch under `feature/`. `**` matches across slashes. Quotes are needed because `*` is special in YAML.' },
  { line: 7, text: '`jobs:` holds one or more jobs. Jobs run in parallel unless one `needs` another.' },
  { line: 8, text: 'The job\'s ID, `test`. IDs are used by `needs:` and appear in logs.' },
  { line: 9, text: 'The **runner**: a fresh Ubuntu virtual machine hosted by GitHub, created for this job and destroyed afterwards.' },
  { line: 10, text: '`steps:` run one after another on that runner. If one fails, the job stops and is marked failed.' },
  { line: 11, text: '`name:` is the step\'s label in the log.' },
  { line: 12, text: '`uses:` runs a published **action**. `actions/checkout@v4` clones your repository at the commit that triggered the run. Without it the runner has no code.' },
  { line: 14, text: 'Installs Node.js. `@v4` pins the action\'s major version so updates cannot surprise you.' },
  { line: 15, text: '`with:` passes inputs to the action.' },
  { line: 16, text: 'Which Node.js version to install.' },
  { line: 17, text: 'Caches the npm download cache between runs, keyed on `package-lock.json`, for faster installs.' },
  { line: 19, text: '`run:` executes a shell command. `npm ci` installs exact versions from the lock file.' },
  { line: 21, text: 'Runs the tests. A non-zero exit code fails the step, the job and the check shown on the commit.' },
];

export const testsOnPr = `name: PR checks

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

permissions:
  contents: read

concurrency:
  group: pr-\${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage`;

export const testsOnPrNotes = [
  { line: 4, text: 'Trigger on **pull request** events. The run tests the PR merged with its base branch, so you see whether it will work after merging.' },
  { line: 5, text: 'Only for PRs targeting `main`. This is the *base* branch filter, not the source branch.' },
  { line: 6, text: '`opened` = new PR, `synchronize` = new commits pushed to it, `reopened` = reopened. (These three are the default; listed here to be explicit.)' },
  { line: 8, text: '`permissions:` limits what the automatic `GITHUB_TOKEN` may do in this workflow.' },
  { line: 9, text: 'Read-only access to the code is all a test run needs. Least privilege protects against compromised dependencies.' },
  { line: 11, text: '`concurrency:` groups runs so they do not pile up.' },
  { line: 12, text: 'One group per PR number. `${{ … }}` is an **expression**: GitHub substitutes the value of `github.event.pull_request.number` at run time.' },
  { line: 13, text: 'When you push again, the older, now-outdated run for the same PR is cancelled. Faster feedback, fewer wasted minutes.' },
  { line: 19, text: 'Steps without `name:` show the action or command as their label.' },
  { line: 25, text: 'Lint first: style and static checks fail fast before the slower tests.' },
  { line: 26, text: 'Everything after `--` is passed to the test runner, here to produce a coverage report.' },
];

export const buildReact = `name: Build

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      VITE_API_URL: \${{ vars.API_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Upload build output
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7`;

export const buildReactNotes = [
  { line: 6, text: '`workflow_dispatch` adds a **Run workflow** button in the Actions tab so you can start the build manually.' },
  { line: 11, text: '`env:` at job level sets environment variables for every step in the job.' },
  { line: 12, text: 'Vite exposes variables starting with `VITE_` to the app at build time. The value comes from a repository **variable** (`vars.API_URL`), set in Settings → Secrets and variables → Actions. Variables are for non-secret config.' },
  { line: 20, text: 'Produces the optimised static site in `dist/`. A TypeScript or build error fails the job here.' },
  { line: 22, text: '`upload-artifact` saves files from the runner so they survive after the VM is destroyed. Download them from the run page, or use them in a later job.' },
  { line: 24, text: 'The artifact\'s name.' },
  { line: 25, text: 'What to upload: the build output folder.' },
  { line: 26, text: 'Delete it automatically after 7 days to save storage.' },
];

export const playwright = `name: Playwright tests

on:
  pull_request:
  schedule:
    - cron: '0 1 * * *'

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        project: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps \${{ matrix.project }}
      - name: Run tests
        run: npx playwright test --project=\${{ matrix.project }}
        env:
          BASE_URL: \${{ vars.STAGING_URL }}
          E2E_USER_PASSWORD: \${{ secrets.E2E_USER_PASSWORD }}
      - name: Upload report
        if: \${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-\${{ matrix.project }}
          path: playwright-report/
          retention-days: 14`;

export const playwrightNotes = [
  { line: 4, text: 'Run on every pull request (any target branch, since no filter is given).' },
  { line: 5, text: '`schedule:` also runs the workflow on a timer, a **nightly regression**.' },
  { line: 6, text: 'Cron syntax: minute 0, hour 1, every day (UTC). Scheduled runs use the default branch.' },
  { line: 11, text: 'Kill the job if it hangs for more than 30 minutes instead of the default 6 hours.' },
  { line: 12, text: '`strategy:` controls how the job is multiplied.' },
  { line: 13, text: 'If one browser fails, keep running the others so you see the full picture.' },
  { line: 14, text: 'A **matrix** creates one job per value: three parallel jobs here.' },
  { line: 15, text: 'Each job gets `matrix.project` set to one browser name, matching Playwright\'s project names.' },
  { line: 24, text: 'Downloads only the browser this job needs, plus its Linux system libraries (`--with-deps`).' },
  { line: 26, text: 'Runs the tests for this job\'s browser.' },
  { line: 27, text: 'Step-level environment variables, visible only to this step.' },
  { line: 28, text: 'Target environment URL from a repository variable, so tests are not hard-coded to one server.' },
  { line: 29, text: 'A **secret**: encrypted, never shown in logs (GitHub masks it as `***`), and not available to PRs from forks.' },
  { line: 31, text: '`if:` runs the step even when tests failed (which is exactly when you need the report), unless the run was cancelled.' },
  { line: 34, text: 'A unique artifact name per browser; artifact names must not clash within a run.' },
  { line: 35, text: 'Playwright\'s HTML report with traces, screenshots and videos of failures.' },
];

export const deployPages = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4`;

export const deployPagesNotes = [
  { line: 4, text: 'Every push to `main` deploys the site: continuous deployment.' },
  { line: 8, text: 'The token needs more than read access for deployment:' },
  { line: 10, text: '`pages: write` allows publishing to GitHub Pages.' },
  { line: 11, text: '`id-token: write` lets the job request a short-lived OIDC token that proves to Pages which workflow is deploying. No long-lived secret is stored anywhere.' },
  { line: 14, text: 'Only one Pages deployment at a time…' },
  { line: 15, text: '…and do NOT cancel one that is in progress; let it finish, then deploy the next.' },
  { line: 27, text: 'Builds the static site (for a Vite app, with `base` set to `/<repo-name>/`).' },
  { line: 28, text: 'Reads the repository\'s Pages configuration (requires Settings → Pages → Source: **GitHub Actions**).' },
  { line: 29, text: 'Packages the folder as the special artifact Pages deploys from.' },
  { line: 31, text: 'The folder to publish.' },
  { line: 33, text: 'A second job.' },
  { line: 34, text: '`needs: build` makes it wait for `build` to succeed, a simple **pipeline**: build → deploy.' },
  { line: 36, text: 'Deploys into the `github-pages` **environment**. Environments can require approvals and show deployment history.' },
  { line: 38, text: 'Shows the live URL on the run page, taken from the deploy step\'s output.' },
  { line: 40, text: '`id:` lets other parts of the workflow refer to this step\'s outputs (`steps.deployment.outputs.page_url`).' },
  { line: 41, text: 'Publishes the artifact. The site is live a few seconds later.' },
];
