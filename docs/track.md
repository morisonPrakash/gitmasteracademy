# Progress Tracker

Status key: ⬜ not started · 🟨 in progress · ✅ done and verified

| Phase | Scope | Status | Verified by |
|---|---|---|---|
| 1 | Architecture, curriculum, scaffold, content types | ✅ | tsc + vitest pass |
| 2 | UI shell, themes, sidebar, search, dashboard, roadmap | ✅ | tsc, vitest, browser check: desktop + 375px mobile, dark/light, Ctrl+K search, drawer, no console errors |
| 3 | Modules 1–3 content | ✅ | 33 lessons, 36 quiz questions; integrity tests + browser check |
| 4 | Modules 6, 7, 12, 13 content | ✅ | 34 lessons, 48 quiz questions; integrity tests + browser check |
| 5 | Modules 4, 5, 8, 9, 10, 11, 14 content | 🟨 | |
| 6 | Git simulation engine, terminal, visualizer | ⬜ | |
| 7 | Exercises, quizzes, final exam, progress | ⬜ | |
| 8 | Projects, cheat sheet, glossary, resources | ⬜ | |
| 9 | Full QA pass and fixes | ⬜ | |
| 10 | GitHub Pages deployment, live verification | ⬜ | |

## Log
### Phase 1
- Created the Vite + React + TS + Tailwind 4 project in `C:\Users\innov\Desktop\gitmasteracademy`.
- Wrote plan.md, architecture.md, curriculum.md and this tracker.
- Wrote the content model (`src/content/types.ts`), catalog (14 modules / 140 lessons) and lazy registry.

### Phase 2
- App shell: sticky top bar (search, Resume, bookmarks, theme), collapsible desktop sidebar with expandable modules and per-lesson ticks, mobile drawer, skip link.
- Progress store (`gma:v1`) with completed lessons, bookmarks, quiz attempts, recent lessons, current lesson, exercise status; cross-tab sync.
- Dashboard (stats, learning path by level, recommended next, recent, bookmarks, all modules), Roadmap, Module overview, Lesson page (blocks, exercises, sources, mark complete, prev/next, right-hand TOC), Bookmarks, 404.
- Block renderer: headings, lists, analogies, definitions, code with copy + light highlighting, terminal with coloured Git output, callouts, tables, steps, diagrams, 8-part command cards, annotated code, roles, timeline.
- 21 named diagrams (SVG commit graphs, flows, custom layouts) that work in both themes.
- Search: Ctrl+K / "/" dialog, instant title index, full-text index loaded on first open, keyboard navigation.
- Sidebar deviation from the brief: "Existing Projects" (module 13) is listed under Professional Developer Workflow so every module is reachable.

## Open items needing the owner
- Create an **empty public** GitHub repo `morisonPrakash/gitmasteracademy`.
- After the first push: Settings → Pages → Source: **GitHub Actions**.
