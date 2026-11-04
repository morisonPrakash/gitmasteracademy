export interface ResourceLink {
  title: string;
  url: string;
  note: string;
}

export interface ResourceGroup {
  title: string;
  links: ResourceLink[];
}

export const RESOURCES: ResourceGroup[] = [
  {
    title: 'Official Git documentation',
    links: [
      { title: 'Pro Git book (free)', url: 'https://git-scm.com/book/en/v2', note: 'The definitive Git book, by Scott Chacon and Ben Straub. Most lessons here link to its chapters.' },
      { title: 'Git reference manual', url: 'https://git-scm.com/docs', note: 'Every command and option, as in `git help <command>`.' },
      { title: 'Git downloads', url: 'https://git-scm.com/downloads', note: 'Installers for Windows, macOS and Linux.' },
    ],
  },
  {
    title: 'Official GitHub documentation',
    links: [
      { title: 'GitHub Docs', url: 'https://docs.github.com/en', note: 'Repositories, pull requests, Actions, Pages, security and administration.' },
      { title: 'GitHub Skills', url: 'https://skills.github.com/', note: 'Free interactive courses that run inside real GitHub repositories.' },
      { title: 'GitHub Actions documentation', url: 'https://docs.github.com/en/actions', note: 'Workflow syntax, events, runners, secrets and deployment.' },
      { title: 'GitHub CLI manual', url: 'https://cli.github.com/manual/', note: 'Open PRs, check out branches and manage repos from the terminal with `gh`.' },
    ],
  },
  {
    title: 'Practice and visualisation',
    links: [
      { title: 'Learn Git Branching', url: 'https://learngitbranching.js.org/', note: 'Visual puzzles for branching, merging and rebasing.' },
      { title: 'Oh My Git!', url: 'https://ohmygit.org/', note: 'An open-source game that teaches Git with cards and visual repositories.' },
      { title: 'This site: Interactive Git Terminal', url: '/terminal', note: 'Safe simulator with exercises and explanations.' },
      { title: 'This site: Git Visualizer', url: '/visualizer', note: 'Guided scenes for merges, rebases, pull requests and collaboration.' },
    ],
  },
  {
    title: 'Conventions and standards',
    links: [
      { title: 'Conventional Commits', url: 'https://www.conventionalcommits.org/en/v1.0.0/', note: 'Machine-readable commit messages.' },
      { title: 'Semantic Versioning', url: 'https://semver.org/', note: 'MAJOR.MINOR.PATCH version numbers.' },
      { title: 'A successful Git branching model (Git Flow)', url: 'https://nvie.com/posts/a-successful-git-branching-model/', note: 'The original Git Flow article, with its 2020 note.' },
      { title: 'Trunk-Based Development', url: 'https://trunkbaseddevelopment.com/', note: 'Patterns for integrating continuously.' },
      { title: 'github/gitignore templates', url: 'https://github.com/github/gitignore', note: 'Ready-made .gitignore files for every language and tool.' },
    ],
  },
  {
    title: 'For QA engineers',
    links: [
      { title: 'Playwright documentation', url: 'https://playwright.dev/docs/intro', note: 'Best practices, CI setup, API testing, trace viewer.' },
      { title: 'Cypress documentation', url: 'https://docs.cypress.io/', note: 'Configuration, CI and test organisation.' },
      { title: 'Newman (Postman CLI runner)', url: 'https://learning.postman.com/docs/collections/using-newman-cli/command-line-integration-with-newman/', note: 'Run Postman collections in CI.' },
      { title: 'Apache JMeter user manual', url: 'https://jmeter.apache.org/usermanual/index.html', note: 'Non-GUI runs and reporting for performance tests.' },
      { title: 'VS Code: Source Control', url: 'https://code.visualstudio.com/docs/sourcecontrol/overview', note: 'Staging, committing, branches and conflicts inside the editor.' },
    ],
  },
];
