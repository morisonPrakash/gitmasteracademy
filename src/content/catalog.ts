import type { ModuleMeta } from './types';

// The curriculum's single source of truth for structure.
// Lesson bodies live in src/content/modules/mXX and are loaded lazily;
// tests/unit/content-integrity.test.ts checks that both stay in sync.

export const LEVELS: Record<number, { title: string; tagline: string }> = {
  1: { title: 'Absolute Beginner', tagline: 'What Git is, how to install it and the everyday commands' },
  2: { title: 'Intermediate Git', tagline: 'Branches, remotes, GitHub, pull requests and conflicts' },
  3: { title: 'Advanced Git', tagline: 'History rewriting, team workflows and CI/CD' },
  4: { title: 'Professional Developer Workflow', tagline: 'How code really moves from a ticket to production' },
  5: { title: 'QA Engineer Path', tagline: 'Git and GitHub from the tester\'s chair' },
};

export const MODULES: ModuleMeta[] = [
  {
    id: 'm01', number: 1, level: 1, icon: 'BookOpen',
    title: 'Understanding Version Control', navTitle: 'Git Fundamentals',
    description: 'Why version control exists, what Git and GitHub are, and the core ideas: repository, commit, working directory, staging area and HEAD.',
    lessons: [
      { slug: 'what-is-version-control', title: 'What Is Version Control?' },
      { slug: 'git-and-github', title: 'Git and GitHub: What They Are' },
      { slug: 'hosting-platforms', title: 'GitHub vs GitLab vs Bitbucket' },
      { slug: 'centralized-vs-distributed', title: 'Centralized vs Distributed Version Control' },
      { slug: 'how-git-works', title: 'How Git Works Internally' },
      { slug: 'repository-and-commit', title: 'Repositories and Commits' },
      { slug: 'three-areas', title: 'Working Directory and Staging Area' },
      { slug: 'what-is-head', title: 'What Is HEAD?' },
    ],
  },
  {
    id: 'm02', number: 2, level: 1, icon: 'Download',
    title: 'Git Installation and Configuration', navTitle: 'Git Installation',
    description: 'Install Git on Windows, macOS and Linux, set up VS Code, choose a terminal and configure your identity and default branch.',
    lessons: [
      { slug: 'install-windows', title: 'Install Git on Windows' },
      { slug: 'install-macos', title: 'Install Git on macOS' },
      { slug: 'install-linux', title: 'Install Git on Linux' },
      { slug: 'vscode-setup', title: 'Install and Configure VS Code' },
      { slug: 'terminals-compared', title: 'Git Bash vs Command Prompt vs PowerShell' },
      { slug: 'verify-installation', title: 'Verify Your Installation' },
      { slug: 'identity-config', title: 'Set Your Name and Email' },
      { slug: 'config-levels', title: 'Local vs Global Configuration' },
      { slug: 'default-branch', title: 'Configure the Default Branch' },
    ],
  },
  {
    id: 'm03', number: 3, level: 1, icon: 'Terminal',
    title: 'Essential Git Commands', navTitle: 'Git Commands',
    description: 'The 15 commands you will use every day, each with purpose, syntax, real output, common mistakes and best practices.',
    lessons: [
      { slug: 'git-lifecycle', title: 'The Git Lifecycle at a Glance' },
      { slug: 'git-init', title: 'git init' },
      { slug: 'git-clone', title: 'git clone' },
      { slug: 'git-status', title: 'git status' },
      { slug: 'git-add', title: 'git add' },
      { slug: 'git-commit', title: 'git commit' },
      { slug: 'git-log', title: 'git log' },
      { slug: 'git-diff', title: 'git diff' },
      { slug: 'git-show', title: 'git show' },
      { slug: 'git-config', title: 'git config' },
      { slug: 'git-rm', title: 'git rm' },
      { slug: 'git-mv', title: 'git mv' },
      { slug: 'git-clean', title: 'git clean' },
      { slug: 'git-restore', title: 'git restore' },
      { slug: 'git-check-ignore', title: 'git check-ignore' },
      { slug: 'git-ls-files', title: 'git ls-files' },
    ],
  },
  {
    id: 'm04', number: 4, level: 2, icon: 'GitBranch',
    title: 'Branching and Merging', navTitle: 'Branching and Merging',
    description: 'Create, switch, rename and delete branches, then bring work together with fast-forward and three-way merges.',
    lessons: [
      { slug: 'what-is-a-branch', title: 'What Is a Branch?' },
      { slug: 'branch-types', title: 'Feature, Bug-fix, Release and Hotfix Branches' },
      { slug: 'creating-and-switching', title: 'Creating and Switching Branches' },
      { slug: 'renaming-and-deleting', title: 'Renaming and Deleting Branches' },
      { slug: 'head-and-branches', title: 'Understanding HEAD with Branches' },
      { slug: 'merging-basics', title: 'Merging Branches' },
      { slug: 'fast-forward-merge', title: 'Fast-Forward Merge' },
      { slug: 'three-way-merge', title: 'Three-Way Merge' },
      { slug: 'merge-conflicts-intro', title: 'When Merges Conflict' },
      { slug: 'history-graph', title: 'Reading the Branch Graph' },
      { slug: 'branch-playground', title: 'Branching Playground' },
    ],
  },
  {
    id: 'm05', number: 5, level: 2, icon: 'Cloud',
    title: 'Remote Repositories', navTitle: 'Remote Repositories',
    description: 'Connect a local project to GitHub, then push, fetch and pull while keeping tracking branches in sync.',
    lessons: [
      { slug: 'local-vs-remote', title: 'Local vs Remote Repositories' },
      { slug: 'origin-and-upstream', title: 'What Are origin and upstream?' },
      { slug: 'connecting-to-github', title: 'Connecting a Project to GitHub' },
      { slug: 'pushing', title: 'Pushing Changes' },
      { slug: 'fetching', title: 'Fetching Changes' },
      { slug: 'pulling', title: 'Pulling Changes' },
      { slug: 'tracking-branches', title: 'Tracking Branches' },
      { slug: 'remote-branches', title: 'Managing Remote Branches' },
      { slug: 'remote-walkthrough', title: 'Complete Remote Workflow Example' },
    ],
  },
  {
    id: 'm06', number: 6, level: 2, icon: 'Network',
    title: 'GitHub Complete Guide', navTitle: 'GitHub Complete Guide',
    description: 'Accounts, repositories, forks, permissions, organizations, Issues, Projects, Discussions, Releases and settings.',
    lessons: [
      { slug: 'account-and-profile', title: 'Your GitHub Account and Profile' },
      { slug: 'creating-repositories', title: 'Creating Repositories: Public vs Private' },
      { slug: 'repository-files', title: 'Repository Structure: README, .gitignore, LICENSE' },
      { slug: 'forking-and-cloning', title: 'Forking and Cloning' },
      { slug: 'permissions-and-collaborators', title: 'Permissions and Collaborators' },
      { slug: 'organizations', title: 'Organizations and Teams' },
      { slug: 'issues', title: 'GitHub Issues' },
      { slug: 'projects', title: 'GitHub Projects' },
      { slug: 'discussions', title: 'GitHub Discussions' },
      { slug: 'releases-and-tags', title: 'Releases and Tags' },
      { slug: 'repository-settings', title: 'Repository Settings and Branch Protection' },
    ],
  },
  {
    id: 'm07', number: 7, level: 2, icon: 'GitPullRequest',
    title: 'Pull Requests', navTitle: 'Pull Requests',
    description: 'Open, review, update and merge pull requests, and choose between merge commit, squash and rebase.',
    lessons: [
      { slug: 'what-is-a-pull-request', title: 'What Is a Pull Request?' },
      { slug: 'creating-a-pull-request', title: 'Creating a Pull Request' },
      { slug: 'reviewers-labels-drafts', title: 'Reviewers, Labels and Draft PRs' },
      { slug: 'code-review', title: 'Reviewing: Comments, Approvals and Change Requests' },
      { slug: 'merge-strategies', title: 'Merge Commit vs Squash vs Rebase' },
      { slug: 'closing-pull-requests', title: 'Closing Pull Requests' },
      { slug: 'pr-end-to-end', title: 'Pull Request from Start to Finish' },
    ],
  },
  {
    id: 'm08', number: 8, level: 2, icon: 'GitMerge',
    title: 'Merge Conflict Resolution', navTitle: 'Merge Conflicts',
    description: 'Understand why conflicts happen, read conflict markers and resolve them by hand or in VS Code.',
    lessons: [
      { slug: 'what-causes-conflicts', title: 'What Causes Conflicts?' },
      { slug: 'reproducing-a-conflict', title: 'Reproducing a Conflict' },
      { slug: 'conflict-markers', title: 'Finding Conflicted Files and Reading Markers' },
      { slug: 'resolving-manually', title: 'Resolving Conflicts Manually' },
      { slug: 'resolving-in-vscode', title: 'Resolving Conflicts in VS Code' },
      { slug: 'finishing-the-merge', title: 'Verifying and Continuing the Merge' },
      { slug: 'conflict-practice', title: 'Conflict Resolution Practice' },
    ],
  },
  {
    id: 'm09', number: 9, level: 3, icon: 'Wrench',
    title: 'Advanced Git Commands', navTitle: 'Advanced Git',
    description: 'Rebase, cherry-pick, stash, reset, revert, reflog, bisect, blame, worktree, submodules and how to use them safely.',
    lessons: [
      { slug: 'git-rebase', title: 'git rebase' },
      { slug: 'interactive-rebase', title: 'git rebase -i' },
      { slug: 'git-cherry-pick', title: 'git cherry-pick' },
      { slug: 'git-stash', title: 'git stash, pop and apply' },
      { slug: 'git-reset', title: 'git reset' },
      { slug: 'git-revert', title: 'git revert' },
      { slug: 'reset-revert-rebase', title: 'Reset vs Revert vs Rebase' },
      { slug: 'git-reflog', title: 'git reflog' },
      { slug: 'commit-amend', title: 'git commit --amend' },
      { slug: 'git-bisect', title: 'git bisect' },
      { slug: 'git-tag', title: 'git tag' },
      { slug: 'git-blame', title: 'git blame' },
      { slug: 'git-worktree', title: 'git worktree' },
      { slug: 'git-submodule', title: 'git submodule' },
      { slug: 'safe-vs-dangerous', title: 'Safe vs Dangerous Operations' },
    ],
  },
  {
    id: 'm10', number: 10, level: 3, icon: 'Workflow',
    title: 'Git Workflows Used in Software Companies', navTitle: 'Git Workflows',
    description: 'Centralized, feature branch, GitHub Flow, Git Flow and trunk-based development, plus naming, commit messages and SemVer.',
    lessons: [
      { slug: 'centralized-workflow', title: 'Centralized Workflow' },
      { slug: 'feature-branch-workflow', title: 'Feature Branch Workflow' },
      { slug: 'github-flow', title: 'GitHub Flow' },
      { slug: 'git-flow', title: 'Git Flow' },
      { slug: 'trunk-based', title: 'Trunk-Based Development' },
      { slug: 'comparing-workflows', title: 'Choosing a Workflow' },
      { slug: 'branch-naming', title: 'Branch Naming Conventions' },
      { slug: 'commit-messages', title: 'Commit Message Conventions' },
      { slug: 'semantic-versioning', title: 'Semantic Versioning' },
    ],
  },
  {
    id: 'm11', number: 11, level: 3, icon: 'Rocket',
    title: 'GitHub Actions and CI/CD', navTitle: 'GitHub Actions',
    description: 'CI/CD concepts, workflows, jobs, steps, runners, YAML, triggers, secrets and five complete, line-by-line explained pipelines.',
    lessons: [
      { slug: 'ci-cd-basics', title: 'What Are CI and CD?' },
      { slug: 'actions-concepts', title: 'Workflows, Jobs, Steps and Runners' },
      { slug: 'yaml-basics', title: 'Understanding YAML' },
      { slug: 'triggers', title: 'Workflow Triggers' },
      { slug: 'env-and-secrets', title: 'Environment Variables and Secrets' },
      { slug: 'workflow-tests-on-push', title: 'Workflow: Run Tests on Push' },
      { slug: 'workflow-tests-on-pr', title: 'Workflow: Run Tests on Pull Requests' },
      { slug: 'workflow-build-react', title: 'Workflow: Build a React Project' },
      { slug: 'workflow-playwright', title: 'Workflow: Run Playwright Tests' },
      { slug: 'workflow-deploy-pages', title: 'Workflow: Deploy to GitHub Pages' },
    ],
  },
  {
    id: 'm12', number: 12, level: 4, icon: 'Building2',
    title: 'How Developers Actually Work in a Company', navTitle: 'Professional Developer Workflow',
    description: 'A full simulated company: from a Jira ticket to production, with every command and every role\'s responsibility.',
    lessons: [
      { slug: 'meet-the-team', title: 'Meet the Team' },
      { slug: 'ticket-to-branch', title: 'From Ticket to Feature Branch' },
      { slug: 'code-and-commit', title: 'Writing, Testing and Committing' },
      { slug: 'push-and-open-pr', title: 'Pushing and Opening the Pull Request' },
      { slug: 'review-cycle', title: 'The Code Review Cycle' },
      { slug: 'merge-and-pipeline', title: 'Merge, CI/CD and Staging Deploy' },
      { slug: 'qa-on-staging', title: 'QA Tests the Staging Build' },
      { slug: 'bugfix-cycle', title: 'The Bug-Fix Cycle' },
      { slug: 'release-to-production', title: 'Releasing to Production' },
    ],
  },
  {
    id: 'm13', number: 13, level: 4, icon: 'FolderGit2',
    title: 'Working with Existing Projects', navTitle: 'Existing Projects',
    description: 'Join a team, get access, clone and understand a real project, and keep your work in sync without overwriting anyone.',
    lessons: [
      { slug: 'joining-a-project', title: 'Joining a Project and Getting Access' },
      { slug: 'clone-and-explore', title: 'Cloning and Understanding the Project' },
      { slug: 'branches-and-main', title: 'Checking Branches and Finding Main' },
      { slug: 'local-environment', title: 'Local Environment Configuration' },
      { slug: 'staying-up-to-date', title: 'Pulling and Updating Local Branches' },
      { slug: 'working-with-others', title: 'Working Safely with Other Developers' },
      { slug: 'onboarding-scenario', title: 'Onboarding Scenario: Your First Week' },
    ],
  },
  {
    id: 'm14', number: 14, level: 5, icon: 'ShieldCheck',
    title: 'Git and GitHub for QA Engineers', navTitle: 'QA Engineer Guide',
    description: 'The tester\'s complete Git path: testing feature branches, finding bad commits, owning automation repos and managing releases.',
    lessons: [
      { slug: 'qa-access-and-setup', title: 'Getting Access, Cloning and Pulling' },
      { slug: 'testing-feature-branches', title: 'Switching to and Testing Feature Branches' },
      { slug: 'inspecting-changes', title: 'Identifying Changes and Comparing Commits' },
      { slug: 'finding-the-bad-commit', title: 'Finding the Commit That Caused a Bug' },
      { slug: 'qa-branches-and-prs', title: 'QA Branches and Automation Pull Requests' },
      { slug: 'reviewing-automation-code', title: 'Reviewing Test Automation Code' },
      { slug: 'maintaining-frameworks', title: 'Maintaining Frameworks Across Environments' },
      { slug: 'ui-automation-repos', title: 'Playwright and Cypress in Git' },
      { slug: 'api-and-performance-repos', title: 'Postman, REST API and JMeter in Git' },
      { slug: 'working-with-developers', title: 'Working with Developers on Bug Fixes' },
      { slug: 'regression-and-releases', title: 'Regression Suites and Release Branches' },
      { slug: 'qa-workflow-simulation', title: 'QA Workflow Simulation' },
    ],
  },
];

export const TOTAL_LESSONS = MODULES.reduce((n, m) => n + m.lessons.length, 0);

export function findModule(id: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.id === id);
}

/** Flat, ordered list of every lesson: used for prev/next and recommendations. */
export const LESSON_ORDER: { moduleId: string; slug: string; title: string }[] = MODULES.flatMap((m) =>
  m.lessons.map((l) => ({ moduleId: m.id, slug: l.slug, title: l.title })),
);

export function lessonKey(moduleId: string, slug: string): string {
  return `${moduleId}/${slug}`;
}
