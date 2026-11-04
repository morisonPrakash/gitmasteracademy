# Progress Tracker

Status key: ⬜ not started · 🟨 in progress · ✅ done and verified

| Phase | Scope | Status | Verified by |
|---|---|---|---|
| 1 | Architecture, curriculum, scaffold, content types | ✅ | tsc + vitest pass |
| 2 | UI shell, themes, sidebar, search, dashboard, roadmap | ✅ | tsc, vitest, browser check: desktop + 375px mobile, dark/light, Ctrl+K search, drawer, no console errors |
| 3 | Modules 1–3 content | ✅ | 33 lessons, 36 quiz questions; integrity tests + browser check |
| 4 | Modules 6, 7, 12, 13 content | ✅ | 34 lessons, 48 quiz questions; integrity tests + browser check |
| 5 | Modules 4, 5, 8, 9, 10, 11, 14 content | ✅ | 73 lessons, 84 quiz questions; integrity tests incl. annotation line checks |
| 6 | Git simulation engine, terminal, visualizer | ✅ | 47 engine tests (every sim exercise answer + every guided scene replayed); browser check desktop + 375px, no console errors |
| 7 | Exercises, quizzes, final exam, progress | ✅ | progress + quiz unit tests; browser: answer feedback, results, mistake review, retake, history |
| 8 | Projects, cheat sheet, glossary, resources | ✅ | 4 projects, 128 cheat-sheet commands, 100 glossary terms; reference tests + browser check |
| 9 | Full QA pass and fixes | ✅ | 109 unit + 39 e2e tests green; see docs/qa-checklist.md |
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

### Phases 3–5 (content)
- All 14 modules written: 140 lessons, 168 module quiz questions, 188 exercises.
- Integrity test now requires every module; it also checks that each line-by-line YAML annotation points at a real line.
- 11 exercises use the simulator. Phase 6 must provide these scenarios: `one-commit`, `feature-ahead`, `diverged`, `conflict`, `local-ahead`, `remote-ahead`, `remote-feature`, `dirty-feature`, `bad-commit`; and goals: `feature-login-one-commit`, `main-has-feature`, `merge-commit-on-main`, `conflict-resolved`, `pushed-main`, `pulled-latest`, `on-remote-feature`, `stash-roundtrip`, `reverted-bad-commit`. Simulator also needs a `resolve <file> [ours|theirs|both]` helper (used in Module 8).

### Phase 6
- Pure TS engine (`src/engine/git`): working directory, index, commits, branches, HEAD/detached HEAD, tags, stash, reflog, remote "server", tracking branches, merge state with conflict markers.
- ~30 git subcommands with realistic output and a plain-English explanation per command; shell helpers (ls, cat, echo >/>>, touch, rm, edit, resolve, teammate push); `&&` chaining; unsupported commands get a clear "safe simulation" message.
- 10 scenarios and 9 goal checks; exercises verify against the saved session (`gma:sim`) and the scenario they belong to.
- Terminal page: exercise picker (Start new exercise), Reset playground, Teammate pushes, history recall, quick chips, explanation panel, live graph, four-area panel.
- Visualizer page: live SVG graph, guided scenes (lifecycle, merges, rebase, pull request, collaboration), button actions that show the equivalent command.
- `git log --graph` ASCII layout rewritten to match Git when branches split from merge commits.

## Open items needing the owner
- Create an **empty public** GitHub repo `morisonPrakash/gitmasteracademy`.
- After the first push: Settings → Pages → Source: **GitHub Actions**.
