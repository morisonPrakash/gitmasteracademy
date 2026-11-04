# QA Checklist

How each item is verified: **U** = Vitest unit/content test, **E** = Playwright end-to-end test (production build), **B** = manual check in the browser, **CI** = GitHub Actions on every push.

| # | Area | Check | How | Result |
|---|---|---|---|---|
| 1 | Navigation | Every top-level page loads with an h1 and no console errors | E `navigation.spec` | ✅ Pass |
| 2 | Navigation | Every sidebar link (all 22+ items) opens a working page | E `navigation.spec` | ✅ Pass |
| 3 | Lessons | All 140 lesson pages render title, Practice and Sources sections without console errors | E `navigation.spec` (14 tests) | ✅ Pass |
| 4 | Lessons | Lesson content complete: ≥5 blocks, ≥1 exercise, sources, no placeholder text, catalog ↔ content match | U `content-integrity` | ✅ Pass |
| 5 | Lessons | Line-by-line YAML annotations point at the right lines | U + B (printed side by side) | ✅ Pass |
| 6 | Lessons | Prev/next navigation, deep-link reload, 404 page | E | ✅ Pass |
| 7 | Git commands | Command examples use real Git syntax; simulator reproduces the core ones | U `engine.test` (40+ behaviours) + review | ✅ Pass |
| 8 | Terminal | init → commit → branch → merge produces correct output and graph; unsupported commands refused safely | E + U | ✅ Pass |
| 9 | Terminal | Every simulator exercise answer reaches its goal; goals do not pass before work is done | U | ✅ Pass |
| 10 | Visualizer | All five guided scenes run every step; graph shows merge commits with two parents | U + B | ✅ Pass |
| 11 | Quizzes | ≥10 valid questions per module; 40-question final from all modules; shuffled options keep the right answer | U | ✅ Pass |
| 12 | Quizzes | Correct run passes at 100%, results saved, retake restarts, list shows pass | E | ✅ Pass |
| 13 | Persistence | Completed lessons, bookmarks, quiz attempts, current lesson survive reload; corrupt storage tolerated | U + E | ✅ Pass |
| 14 | Bookmarks | Add/remove from lesson; listed on dashboard and Bookmarks page | E | ✅ Pass |
| 15 | Search | Ctrl+K opens, full-text finds lesson content, Enter navigates | E | ✅ Pass |
| 16 | Responsive | No horizontal page scroll at phone width on 10 key pages; mobile drawer works | E `mobile.spec` (Pixel 7) | ✅ Pass |
| 17 | Themes | Theme toggle persists after reload; pages checked in light and dark | E + B | ✅ Pass |
| 18 | Console | No console errors on any page visited by the tests | E | ✅ Pass |
| 19 | Accessibility | No serious/critical axe (WCAG 2 A/AA) violations on 6 key pages in both themes | E | ✅ Pass |
| 20 | Accessibility | Skip link, labelled controls, keyboard search, focus rings, aria-live feedback | B + E | ✅ Pass |
| 21 | Build | `npm run build` succeeds; `404.html` and `.nojekyll` written; per-module code splitting | B | ✅ Pass |
| 22 | Deployment | Actions workflow green; live site loads over HTTPS; deep link refresh works; assets load under `/gitmasteracademy/` | CI + B on live URL | ✅ Pass |

**Totals (Phase 9 run):** 109 unit tests passed (Vitest) · 39 end-to-end tests passed (Playwright: Chromium desktop + Pixel 7 mobile) · 0 console errors · 0 serious/critical axe violations on 6 pages × 2 themes.

## Issues found and fixed during QA

| Issue | Found by | Fix |
|---|---|---|
| Code comments in light theme had 4.2:1 contrast (WCAG AA needs 4.5:1) | axe (lesson page, light) | Darkened `.tok-comment` to `#57606a` |
| Search for "bisect" opened the glossary entry instead of the `git bisect` lesson | E2E search test | Lessons ranked above glossary/cheat-sheet entries; ranking now covered by unit tests |
| `git log --graph` drew merge/split lines in the wrong place for branches starting at a merge commit | Manual review of simulator output | Rewrote the ASCII graph layout to fold columns before drawing the commit |
| Stash exercise goal passed before the learner did anything | Engine test ("goal must not pass before doing anything") | Goal also requires switching to main and back (checked via reflog) |
| Several command lessons had fewer than five content blocks | Content-integrity test | Added practical sections (git show, rm, mv, clean, ls-files, blame, worktree, fetching) |
| Glossary "see also" links pointed at non-existent terms | Reference test | Normalised term names and links |
| Three-area diagram was cut off on medium-width screens | Browser check | Stacks vertically below the xl breakpoint |
| E2E: mobile spec also ran in the desktop project; ambiguous locators; key press before listeners attached | E2E run | Test configuration and locators corrected (test-only issues) |
