# GitMaster Academy: Project Plan

## Goal
A free, static, interactive website that teaches Git and GitHub from absolute beginner level to confidently taking part in a real software team's GitHub workflow. It includes a dedicated learning path for QA engineers.

- Live URL: https://morisonprakash.github.io/gitmasteracademy/
- Repository: https://github.com/morisonPrakash/gitmasteracademy
- Hosting: GitHub Pages, deployed by GitHub Actions on every push to `main`

## Constraints
- No backend, no login, no paid APIs or subscriptions. All progress is stored in the browser's LocalStorage.
- Responsive on desktop, tablet and mobile. Light and dark themes. Keyboard accessible.
- No placeholder content: every lesson has real explanations, commands, realistic output and at least one exercise.
- Official Git (git-scm.com) and GitHub (docs.github.com) documentation are the primary references, linked at the end of lessons.

## Stack
Vite 6 · React 18 · TypeScript (strict) · Tailwind CSS 4 · lucide-react · React Router 6 · Vitest + Testing Library · Playwright + axe-core

## Key decisions
| Decision | Choice | Why |
|---|---|---|
| Content format | Typed TS data (`Block[]`) | Testable for completeness, one renderer, search index built from the same data |
| Routing on Pages | `BrowserRouter` + `basename` + `404.html` copy of `index.html` | Clean URLs, deep links and refresh work on static hosting |
| Loading | One lazy chunk per module | Small first load, curriculum can keep growing |
| Simulator | Pure TS Git engine, no React | Fully unit-testable; terminal, visualizer and exercises share it |
| Persistence | Versioned LocalStorage key `gma:v1`, every access wrapped in try/catch | Works in private windows and survives future schema changes |

## Phases
Each phase ends with tests passing, a commit, and an update to `track.md`.

1. **Architecture & curriculum:** scaffold, docs, content types, catalog, registry, integrity test
2. **UI/UX shell & dashboard:** layout, sidebar, table of contents, themes, search, progress store, dashboard, roadmap
3. **Fundamentals & commands:** modules 1–3
4. **GitHub & developer workflow:** modules 6, 7, 12, 13
5. **Advanced & QA path:** modules 4, 5, 8, 9, 10, 11, 14
6. **Interactive terminal & visualizer:** Git simulation engine
7. **Exercises, quizzes, progress:** module quizzes, final assessment, quiz history
8. **Projects & reference:** 4 projects, cheat sheet, glossary, resources
9. **QA pass:** checklist, e2e, accessibility, responsive, themes, console; fix issues
10. **Deployment:** Actions workflow, Pages, live verification

## Definition of done
- Every sidebar route renders real content with no console errors.
- `npm run test`, `npm run e2e` and `npm run build` pass locally and in CI.
- The live URL loads over HTTPS, deep links survive a refresh, and progress persists after a reload.
