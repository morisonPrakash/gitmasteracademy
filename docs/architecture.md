# Architecture

## Overview
GitMaster Academy is a single-page React app that builds to static files. Nothing runs on a server: content is bundled TypeScript data, progress lives in LocalStorage, and the Git playground is a simulation that runs entirely in the browser.

```
Browser
 ├─ App shell (layout, sidebar, search, theme)         src/app
 ├─ Feature pages (dashboard, lesson, quiz, ...)        src/features
 │    └─ render content through shared components       src/components
 ├─ Content (catalog + lazy module chunks)              src/content
 ├─ Git simulation engine (pure TypeScript)             src/engine
 └─ Progress & theme stores (LocalStorage)              src/store
```

## Folder layout
```
.github/workflows/deploy.yml   test → build → deploy to GitHub Pages
docs/                          plan, track, architecture, curriculum, qa-checklist
public/                        favicon
scripts/copy-404.mjs           SPA fallback + .nojekyll for GitHub Pages
src/
  app/          App.tsx, routes, layout/ (AppShell, Sidebar, TopBar, TocRail)
  components/   ui/ primitives · lesson/ block renderers · diagrams/ SVG diagrams
  content/      types.ts, catalog.ts, registry.ts, modules/m01..m14, projects/,
                cheatsheet.ts, glossary.ts, resources.ts, final-exam.ts
  engine/git/   repository model, command parser, commands, explanations, scenarios
  engine/graph/ commit-graph lane layout for the visualizer
  features/     dashboard, roadmap, lesson, terminal, visualizer, quiz, exercises,
                projects, cheatsheet, glossary, resources, search
  store/        progress.ts, theme.ts
  lib/          small helpers (inline markdown, shuffle, answer normalisation)
tests/
  unit/         engine, store, content integrity
  e2e/          Playwright specs incl. axe accessibility scans
```

## Content model (`src/content/types.ts`)
- `ModuleMeta` (in `catalog.ts`): id, level, titles, icon and ordered lesson list. Used by the sidebar, dashboard and roadmap without loading any lesson text.
- `ModuleContent` (in `modules/mXX/index.ts`): the full `Lesson[]` and `Question[]` for one module. Loaded on demand through `registry.ts`, and each one becomes its own JS chunk.
- `Lesson`: `blocks` (what is rendered), `exercises`, `sources`.
- `Block` types: heading, p, list, analogy, definition, code, terminal, callout (note/tip/warning/danger/example/best), table, steps, diagram, command (8-part reference), annotated (line-by-line explained code), roles, timeline.
- Inline formatting in strings: `` `code` ``, `**bold**`, `[label](url)`.

`tests/unit/content-integrity.test.ts` enforces that:
- the catalog and content match one-to-one;
- every lesson has blocks, at least one exercise and source links;
- there is no placeholder text;
- every module quiz has at least 10 valid questions.

## Routing
`BrowserRouter` with `basename = import.meta.env.BASE_URL` (`/gitmasteracademy/`).

| Path | Page |
|---|---|
| `/` | Dashboard |
| `/roadmap` | Learning roadmap |
| `/learn/:moduleId` | Module overview |
| `/learn/:moduleId/:slug` | Lesson |
| `/terminal` | Interactive Git terminal |
| `/visualizer` | Git visualizer |
| `/projects`, `/projects/:slug` | Practical projects |
| `/quizzes`, `/quizzes/:quizId` | Quiz list and quiz runner (`final` = final assessment) |
| `/cheatsheet`, `/glossary`, `/resources`, `/bookmarks` | Reference pages |

GitHub Pages answers unknown paths with `404.html`, which is a copy of `index.html`, so the router handles every deep link.

## State
- **Progress store** (`src/store/progress.ts`): one JSON document under `gma:v1` holding completed lessons, bookmarks, quiz attempts, recently visited lessons, current lesson, solved exercises and the playground session. It is exposed through `useSyncExternalStore`. Reads and writes are wrapped in try/catch; if storage is unavailable the app still works, just without persistence.
- **Theme** (`gma:theme`): applied by an inline script in `index.html` before first paint.
- A module counts as complete when all of its lessons are complete and its quiz has been passed (≥ 80%).

## Git simulation engine (`src/engine/git`)
- A repository is `{ files (working dir), index (staging), commits, branches, HEAD, tags, stash, reflog, remotes, mergeState }`. Commits store full file snapshots plus parent ids. IDs are deterministic 7-character hex strings so the outputs are reproducible.
- `run(state, input)` parses the input, runs a command and returns `{ state, output, explanation }`. It is a pure function, which makes the whole engine unit-testable.
- The remote (`origin`) is a second repository object. `simulateTeammatePush()` adds commits to it to create diverged and conflicting histories.
- Unsupported commands give a clear message. There is no access to the real filesystem or shell.

## Visualizer
`engine/graph/layout.ts` assigns each commit a lane and a row. The visualizer draws an SVG with commit nodes, parent edges, branch and tag labels, `HEAD` and `origin/*`. The terminal and visualizer can share one engine session.

## Build & deploy
`npm run build` runs `tsc --noEmit`, then `vite build`, then `copy-404.mjs`.

The Actions workflow runs on every push to `main`: `npm ci`, unit tests, e2e tests (Chromium), build, `upload-pages-artifact`, `deploy-pages`. Pages source must be set to **GitHub Actions** once in the repository settings.
