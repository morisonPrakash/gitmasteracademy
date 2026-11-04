# GitMaster Academy

**From Git beginner to professional developer.** A free, interactive website that teaches Git and GitHub from the first commit to a real team's workflow, with a dedicated path for QA engineers.

Live site: https://morisonprakash.github.io/gitmasteracademy/

## What's inside

- **14 modules, 140 lessons in 5 levels:** version control basics, installation, essential commands, branching, remotes, GitHub, pull requests, conflicts, advanced Git, workflows, GitHub Actions, the professional developer workflow, existing projects, and Git for QA engineers.
- **188 exercises** with hints, answer checking and explanations. Some are checked inside the Git simulator.
- **Interactive Git terminal:** a safe, in-browser Git simulation with realistic output and an explanation of every command.
- **Git visualizer:** a live commit graph, guided scenes (merges, rebase, pull requests, collaboration) and click-to-run actions.
- **Quizzes:** 14 module quizzes (12 questions each) and a 40-question final assessment. Questions are randomized, explanations appear instantly, the pass mark is 80%, and history is saved.
- **4 practical projects**, a **128-command cheat sheet**, a **100-term glossary** and curated resources.
- **Progress tracking** in your browser (LocalStorage): completed lessons, bookmarks, quiz results, resume learning. No login or backend.

## Tech stack

Vite 6 · React 18 · TypeScript · Tailwind CSS 4 · React Router 6 · lucide-react · Vitest · Playwright + axe-core · GitHub Actions · GitHub Pages

## Getting started

Requirements: Node.js 20+ and Git.

```bash
git clone https://github.com/morisonPrakash/gitmasteracademy.git
cd gitmasteracademy
npm ci
npm run dev
```

Open http://localhost:5173/gitmasteracademy/

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Unit, engine and content-integrity tests (Vitest) |
| `npm run e2e` | Build the site and run the Playwright end-to-end and accessibility tests |
| `npm run build` | Production build into `dist/` (also writes `404.html` for client-side routing) |
| `npm run preview` | Serve the production build locally |

First-time Playwright setup: `npx playwright install chromium`

## Project structure

```
docs/                plan, architecture, curriculum, progress tracker, QA checklist
src/app/             app shell, routes, sidebar, top bar
src/components/      lesson blocks, diagrams, UI primitives
src/content/         catalog (curriculum structure), module content, quizzes, projects, cheat sheet, glossary
src/engine/git/      the Git simulation engine (pure TypeScript)
src/engine/graph/    commit-graph layout for the visualizer
src/features/        dashboard, lessons, terminal, visualizer, quizzes, reference pages, search
src/store/           progress and theme stores (LocalStorage)
tests/unit/          Vitest tests (engine, content integrity, progress, reference data)
tests/e2e/           Playwright tests (navigation, features, accessibility, mobile)
```

Lessons are typed data (`src/content/types.ts`). The content-integrity test fails the build if a lesson has no exercise or sources, if a quiz has fewer than 10 questions, if placeholder text slips in, or if a YAML annotation points at the wrong line. The engine tests replay every simulator exercise's answer to prove it reaches its goal.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`:

1. **test:** type check, unit tests, Playwright end-to-end tests (also runs on pull requests)
2. **build:** `npm run build`
3. **deploy:** publish `dist/` to GitHub Pages

One-time repository setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The site is served over HTTPS at `https://morisonprakash.github.io/gitmasteracademy/`. The Vite `base` is `/gitmasteracademy/`; if you fork under another name, change it in `vite.config.ts`.

No secrets are needed: the workflow uses GitHub's built-in OIDC token for Pages.

## License

Educational content and code © GitMaster Academy. Command examples are illustrative; the companies, people and tickets in scenarios are fictional.
