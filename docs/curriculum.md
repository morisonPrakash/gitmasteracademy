# Curriculum

14 modules · 140 lessons · 5 levels. The structure is defined in code in `src/content/catalog.ts`; this document describes what each module teaches and how each lesson is built.

## Lesson standard
Every lesson contains:
1. **Plain-English intro.** New technical words are defined before they are used (`definition` blocks).
2. **Analogy** where it helps a beginner (`analogy` block).
3. **Commands with realistic output** (`terminal` blocks). The outputs match current Git 2.4x formatting.
4. **Labelled examples, best practices and warnings.** A `danger` callout appears **before** any destructive command (`reset --hard`, `clean -f`, `push --force`, `branch -D`, `rebase` on shared branches).
5. **At least one exercise** with a problem, starting situation, expected result, hints, verification and explanation. The answer stays hidden until the learner asks for it.
6. **Sources:** links to git-scm.com or docs.github.com.

Command lessons (modules 3 and 9) use the 8-part reference: what it does · why developers use it · when to use it · syntax · example · expected output · common mistakes · best practices.

## Level 1: Absolute Beginner
### Module 1: Understanding Version Control (Git Fundamentals) · 8 lessons
What version control is and why it matters; problems without it; Git; GitHub; Git vs GitHub; GitHub vs GitLab vs Bitbucket; centralized vs distributed; how Git stores snapshots and objects (blob, tree, commit, SHA); repository; commit; working directory; staging area; HEAD.

### Module 2: Git Installation and Configuration · 9 lessons
Windows (Git for Windows installer options, winget), macOS (Xcode CLT, Homebrew), Linux (apt, dnf, pacman); VS Code setup and Source Control view; Git Bash vs Command Prompt vs PowerShell; `git --version`; `user.name` and `user.email`; system/global/local levels and `--show-origin`; `init.defaultBranch`.

### Module 3: Essential Git Commands · 16 lessons
Lifecycle diagram (working directory → staging → repository), then one lesson per command: `init`, `clone`, `status`, `add`, `commit`, `log`, `diff`, `show`, `config`, `rm`, `mv`, `clean`, `restore`, `check-ignore`, `ls-files`.

## Level 2: Intermediate Git
### Module 4: Branching and Merging · 11 lessons
Branches as movable pointers; main vs master; feature, bug-fix, release and hotfix branches; `branch`, `switch`, `switch -c`, `checkout`; renaming (`-m`) and deleting (`-d`/`-D`); HEAD and detached HEAD; `merge`; fast-forward vs three-way merges; intro to conflicts; `log --oneline --graph --all`; an interactive branching playground.

### Module 5: Remote Repositories · 9 lessons
Local vs remote; `origin` and `upstream`; `remote -v/add/remove`; `push` and `push -u`; `fetch`; `pull` (fetch + merge, `--rebase`); tracking branches and ahead/behind; `branch -r/-a`, deleting remote branches, `fetch --prune`; a complete worked example.

### Module 6: GitHub Complete Guide · 11 lessons
Account, profile and profile README; creating repositories (public vs private); README, .gitignore and LICENSE; forking vs cloning; permission levels and collaborators; organizations and teams; Issues; Projects; Discussions; Releases and tags; repository settings, rulesets and branch protection.

### Module 7: Pull Requests · 7 lessons
What a PR is and why it exists; source vs target branch; creating a PR (title, description template); reviewers, labels, draft PRs; review comments, approve, request changes, resolving conversations; merge commit vs squash vs rebase-and-merge; closing without merging; a full feature-to-main example.

### Module 8: Merge Conflict Resolution · 7 lessons
Causes; reproducing a conflict step by step; finding conflicted files with `status` and `diff --name-only --diff-filter=U`; reading `<<<<<<<`, `=======` and `>>>>>>>` markers; manual resolution; VS Code Accept Current/Incoming/Both and the merge editor; verifying, `git add`, `merge --continue` and `merge --abort`; interactive practice.

## Level 3: Advanced Git
### Module 9: Advanced Git Commands · 15 lessons
`rebase`, `rebase -i` (pick, reword, squash, fixup, drop), `cherry-pick`, `stash`/`pop`/`apply`, `reset` (soft, mixed, hard), `revert`, reset vs revert vs rebase, `reflog` recovery, `commit --amend`, `bisect`, `tag`, `blame`, `worktree`, `submodule`, and a safe vs dangerous operations reference for shared branches.

### Module 10: Git Workflows · 9 lessons
Centralized, feature branch, GitHub Flow, Git Flow, trunk-based development; a comparison with when to use each; branch naming (`feature/login`, `bugfix/password-validation`, `hotfix/payment-failure`, `release/v1.0.0`); Conventional Commits; Semantic Versioning.

### Module 11: GitHub Actions and CI/CD · 10 lessons
CI vs CD; workflow, job, step, runner; YAML syntax; triggers (`push`, `pull_request`, `workflow_dispatch`, `schedule`); `env`, `vars` and `secrets`; five complete workflows, each explained line by line: tests on push, tests on PR, React build, Playwright, deploy to GitHub Pages.

## Level 4: Professional Developer Workflow
### Module 12: How Developers Actually Work in a Company · 9 lessons
Roles: Junior Developer, Senior Developer, QA Engineer, Tech Lead, DevOps Engineer, Project Manager. The 26-step lifecycle from a Jira ticket to production, with the commands, output, GitHub actions and responsibilities at each stage.

### Module 13: Working with Existing Projects · 7 lessons
Getting access; cloning; reading the structure and README; finding the default branch; `.env.example` and local config; pulling and updating local branches; avoiding overwriting others (`pull --rebase`, `push --force-with-lease`); a first-week onboarding scenario.

## Level 5: QA Engineer Path
### Module 14: Git and GitHub for QA Engineers · 12 lessons
All 18 QA topics from the brief: access, clone, pull, switching and testing feature branches, `diff`/`log`/comparing commits, `bisect`/`blame` to find the bad commit, QA branches, automation PRs, reviewing automation code, maintaining frameworks, environment configs, working with developers on fixes, regression suites, release branches; Playwright, Cypress, Postman, REST API and JMeter repository examples; a full simulated QA workflow.

## Assessments
- **Module quizzes:** 12 questions each (multiple choice, command, scenario, troubleshooting). Questions are randomized, explanations appear immediately, pass mark is 80%, retakes are allowed, and history is saved.
- **Final assessment:** 40 questions drawn from every module. Pass mark 80%.

## Practical projects
1. **Login Application:** one developer; branches, commits, PRs, a bug-fix and a tag.
2. **E-commerce Application:** three developers on parallel features (cart, payment, search); rebasing and a release.
3. **QA Automation Framework:** a Playwright repo with page objects, environments, CI and a QA PR flow.
4. **Team Collaboration Simulation:** six roles, code review, a merge conflict, a hotfix and a release.
