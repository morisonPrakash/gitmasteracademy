import { ArrowDown, ArrowLeft, ArrowRight, Cloud, HardDrive, Laptop, Server } from 'lucide-react';
import type { ReactNode } from 'react';
import type { DiagramName } from '@/content/types';
import { FlowDiagram } from './FlowDiagram';
import { GraphDiagram, type GraphSpec } from './GraphDiagram';

function Frame({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  return (
    <figure className="my-6 rounded-xl border border-line bg-subtle/60 p-4 sm:p-5">
      <p className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">Diagram · {title}</p>
      {children}
      {caption && <figcaption className="mt-3 text-sm leading-relaxed text-muted">{caption}</figcaption>}
    </figure>
  );
}

function Area({ title, sub, icon, tone, children }: { title: string; sub: string; icon?: ReactNode; tone: string; children?: ReactNode }) {
  return (
    <div className={`flex-1 rounded-lg border px-3 py-3 ${tone}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-fg">
        {icon}
        {title}
      </p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
      {children && <div className="mt-2 space-y-1 font-mono text-[11px] text-fg/80">{children}</div>}
    </div>
  );
}

// The four-area diagram only fits side by side on wide screens; below xl it stacks.
function Link2({ label, back }: { label: string; back?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 py-1 font-mono text-[11px] text-muted xl:px-1" aria-hidden="true">
      <span className="flex items-center gap-1 text-accent">
        <ArrowDown className="h-4 w-4 xl:hidden" />
        <ArrowRight className="hidden h-4 w-4 xl:block" />
        {label}
      </span>
      {back && (
        <span className="flex items-center gap-1">
          <ArrowLeft className="hidden h-3.5 w-3.5 xl:block" />
          {back}
        </span>
      )}
    </div>
  );
}

function ThreeAreas() {
  return (
    <div className="flex flex-col gap-1 xl:flex-row xl:items-stretch">
      <Area title="Working Directory" sub="Files you edit on disk" tone="border-warn/40 bg-warn-soft">
        <p>login.js (modified)</p>
        <p>notes.txt (untracked)</p>
      </Area>
      <Link2 label="git add" back="git restore" />
      <Area title="Staging Area (Index)" sub="Changes chosen for the next commit" tone="border-ok/40 bg-ok-soft">
        <p>login.js (staged)</p>
      </Area>
      <Link2 label="git commit" back="git restore --staged" />
      <Area title="Local Repository" sub="Permanent history in .git" tone="border-accent/40 bg-accent-soft">
        <p>a1b2c3d Add login form</p>
      </Area>
      <Link2 label="git push" back="git fetch / pull" />
      <Area title="Remote (GitHub)" sub="Shared copy for the team" tone="border-done/40 bg-done-soft" icon={<Cloud className="h-4 w-4" />} />
    </div>
  );
}

function Lifecycle() {
  return (
    <FlowDiagram
      steps={[
        { title: 'Untracked', sub: 'new file', tone: 'bad' },
        { title: 'Staged', sub: 'in the index', tone: 'ok' },
        { title: 'Unmodified', sub: 'committed', tone: 'accent' },
        { title: 'Modified', sub: 'edited', tone: 'warn' },
        { title: 'Staged', sub: 'ready again', tone: 'ok' },
      ]}
      arrows={['git add', 'git commit', 'edit file', 'git add']}
      loop="After the second git commit the file is Unmodified again, and the cycle repeats."
    />
  );
}

function CentralVsDistributed() {
  const client = (label: string, full: boolean) => (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-line bg-canvas px-2 py-2 text-center">
      <Laptop className="h-5 w-5 text-muted" aria-hidden="true" />
      <span className="text-xs font-medium text-fg">{label}</span>
      <span className={`rounded px-1.5 text-[10px] font-semibold ${full ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}>
        {full ? 'full history' : 'latest files only'}
      </span>
    </div>
  );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-line bg-canvas p-3">
        <p className="mb-2 text-sm font-semibold text-fg">Centralized (SVN, Perforce)</p>
        <div className="mx-auto mb-2 flex w-fit items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2">
          <Server className="h-5 w-5 text-accent" aria-hidden="true" />
          <span className="text-xs font-semibold text-fg">Central server: the ONLY full history</span>
        </div>
        <div className="grid grid-cols-3 gap-2">{['Dev A', 'Dev B', 'Dev C'].map((d) => <div key={d}>{client(d, false)}</div>)}</div>
        <p className="mt-2 text-xs text-muted">Server down = nobody can commit or see history.</p>
      </div>
      <div className="rounded-lg border border-line bg-canvas p-3">
        <p className="mb-2 text-sm font-semibold text-fg">Distributed (Git)</p>
        <div className="mx-auto mb-2 flex w-fit items-center gap-2 rounded-lg border border-done/40 bg-done-soft px-3 py-2">
          <Cloud className="h-5 w-5 text-done" aria-hidden="true" />
          <span className="text-xs font-semibold text-fg">GitHub: a shared copy by agreement</span>
        </div>
        <div className="grid grid-cols-3 gap-2">{['Dev A', 'Dev B', 'Dev C'].map((d) => <div key={d}>{client(d, true)}</div>)}</div>
        <p className="mt-2 text-xs text-muted">Every clone is a complete backup; commit, branch and view history offline.</p>
      </div>
    </div>
  );
}

function Snapshots() {
  const commits = [
    { id: 'C1', msg: 'Initial commit', files: [['index.html', 'v1', true], ['style.css', 'v1', true]] },
    { id: 'C2', msg: 'Add login page', files: [['index.html', 'v1', false], ['style.css', 'v1', false], ['login.html', 'v1', true]] },
    { id: 'C3', msg: 'Style login', files: [['index.html', 'v1', false], ['style.css', 'v2', true], ['login.html', 'v1', false]] },
  ] as const;
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
      {commits.map((c, i) => (
        <div key={c.id} className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <div className="flex-1 rounded-lg border border-accent/40 bg-canvas p-3">
            <p className="font-mono text-sm font-bold text-accent">{c.id}</p>
            <p className="mb-2 text-xs text-muted">{c.msg}</p>
            <ul className="space-y-1">
              {c.files.map(([f, v, changed]) => (
                <li key={f} className={`flex justify-between rounded px-2 py-0.5 font-mono text-[11px] ${changed ? 'bg-ok-soft text-ok' : 'bg-inset text-muted'}`}>
                  <span>{f}</span>
                  <span>{changed ? `${v} (stored)` : `${v} (link)`}</span>
                </li>
              ))}
            </ul>
          </div>
          {i < commits.length - 1 && <ArrowRight className="mx-auto hidden h-4 w-4 text-muted md:block" aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

function LocalRemote() {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <div className="rounded-lg border border-line bg-canvas p-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg"><Laptop className="h-4 w-4" aria-hidden="true" /> Your computer</p>
        <div className="space-y-2">
          <Area title="Working directory + staging" sub="where you edit and git add" tone="border-warn/40 bg-warn-soft" />
          <Area title="Local branches" sub="main, feature/login" tone="border-accent/40 bg-accent-soft" icon={<HardDrive className="h-4 w-4" />} />
          <Area title="Remote-tracking branches" sub="origin/main: a read-only bookmark of GitHub" tone="border-done/40 bg-done-soft" />
        </div>
      </div>
      <div className="flex flex-row justify-center gap-4 font-mono text-xs md:flex-col">
        <span className="flex items-center gap-1 text-ok">git push <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
        <span className="flex items-center gap-1 text-accent"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> git fetch</span>
        <span className="flex items-center gap-1 text-done"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> git pull</span>
      </div>
      <div className="rounded-lg border border-line bg-canvas p-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg"><Cloud className="h-4 w-4" aria-hidden="true" /> GitHub ("origin")</p>
        <Area title="Remote repository" sub="branches: main, feature/login, ..." tone="border-done/40 bg-done-soft" />
        <p className="mt-2 text-xs text-muted">Teammates push here too. You only see their work after you fetch or pull.</p>
      </div>
    </div>
  );
}

function ResetModes() {
  const rows = [
    ['--soft', true, false, false, 'Undo the commit, keep changes staged'],
    ['--mixed (default)', true, true, false, 'Undo the commit and unstage, keep edits in files'],
    ['--hard', true, true, true, 'Undo the commit AND throw away the edits'],
  ] as const;
  const cell = (on: boolean) => (
    <td className="px-2 py-2 text-center">
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${on ? 'bg-bad-soft text-bad' : 'bg-ok-soft text-ok'}`}>{on ? 'reset' : 'kept'}</span>
    </td>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="px-2 py-1">git reset …</th>
            <th className="px-2 py-1 text-center">HEAD / branch</th>
            <th className="px-2 py-1 text-center">Staging area</th>
            <th className="px-2 py-1 text-center">Working directory</th>
            <th className="px-2 py-1">Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([mode, a, b, c, note]) => (
            <tr key={mode} className="border-t border-line-soft">
              <td className="px-2 py-2 font-mono text-xs font-semibold text-fg">{mode}</td>
              {cell(a)}
              {cell(b)}
              {cell(c)}
              <td className="px-2 py-2 text-xs text-fg/85">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ForkFlow() {
  return (
    <FlowDiagram
      steps={[
        { title: 'Upstream repo', sub: 'company/project', tone: 'done' },
        { title: 'Your fork', sub: 'you/project', tone: 'accent' },
        { title: 'Local clone', sub: 'your laptop', tone: 'warn' },
        { title: 'Push branch', sub: 'to your fork', tone: 'ok' },
        { title: 'Pull request', sub: 'fork → upstream', tone: 'done' },
      ]}
      arrows={['Fork', 'git clone', 'commit', 'open PR']}
      loop="Keep your fork current: git fetch upstream, then merge or rebase upstream/main."
    />
  );
}

const GRAPHS: Partial<Record<DiagramName, GraphSpec>> = {
  'head-pointer': {
    title: 'HEAD points to the current branch, which points to the latest commit',
    nodes: [
      { id: 'a', col: 0, lane: 0, label: 'A' },
      { id: 'b', col: 1, lane: 0, label: 'B' },
      { id: 'c', col: 2, lane: 0, label: 'C' },
    ],
    edges: [['a', 'b'], ['b', 'c']],
    refs: [{ at: 'c', name: 'main' }, { at: 'c', name: 'HEAD', kind: 'head' }],
  },
  'branch-basic': {
    title: 'A feature branch created from commit B',
    laneNames: ['main', 'feature/login'],
    nodes: [
      { id: 'a', col: 0, lane: 0, label: 'A' },
      { id: 'b', col: 1, lane: 0, label: 'B' },
      { id: 'c', col: 2, lane: 0, label: 'C' },
      { id: 'd', col: 2, lane: 1, label: 'D', tone: 'feature' },
      { id: 'e', col: 3, lane: 1, label: 'E', tone: 'feature' },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['b', 'd'], ['d', 'e']],
    refs: [{ at: 'c', name: 'main' }, { at: 'e', name: 'feature/login', below: true }, { at: 'e', name: 'HEAD', kind: 'head', below: true }],
  },
  'fast-forward': {
    title: 'Fast-forward: main had no new commits, so Git just moves the main label forward',
    laneNames: ['main', 'feature'],
    nodes: [
      { id: 'a', col: 0, lane: 0, label: 'A' },
      { id: 'b', col: 1, lane: 0, label: 'B' },
      { id: 'c', col: 2, lane: 1, label: 'C', tone: 'feature' },
      { id: 'd', col: 3, lane: 1, label: 'D', tone: 'feature' },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['c', 'd']],
    refs: [
      { at: 'b', name: 'main (before)', kind: 'tag' },
      { at: 'd', name: 'main (after)' },
      { at: 'd', name: 'feature', below: true },
    ],
  },
  'three-way': {
    title: 'Three-way merge: both branches moved on, so Git creates merge commit M',
    laneNames: ['main', 'feature'],
    nodes: [
      { id: 'a', col: 0, lane: 0, label: 'A' },
      { id: 'b', col: 1, lane: 0, label: 'B' },
      { id: 'c', col: 2, lane: 0, label: 'C' },
      { id: 'd', col: 2, lane: 1, label: 'D', tone: 'feature' },
      { id: 'e', col: 3, lane: 1, label: 'E', tone: 'feature' },
      { id: 'm', col: 4, lane: 0, label: 'M', tone: 'merge' },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['b', 'd'], ['d', 'e'], ['c', 'm'], ['e', 'm']],
    refs: [
      { at: 'b', name: 'base', kind: 'tag' },
      { at: 'c', name: 'ours', kind: 'remote' },
      { at: 'e', name: 'theirs', kind: 'remote', below: true },
      { at: 'm', name: 'main' },
      { at: 'm', name: 'HEAD', kind: 'head' },
    ],
  },
  conflict: {
    title: 'Both branches changed the same line of login.js after commit B',
    laneNames: ['main', 'feature'],
    nodes: [
      { id: 'a', col: 0, lane: 0, label: 'A' },
      { id: 'b', col: 1, lane: 0, label: 'B' },
      { id: 'c', col: 2, lane: 0, label: 'C', tone: 'bad' },
      { id: 'd', col: 2, lane: 1, label: 'D', tone: 'bad' },
      { id: 'm', col: 3, lane: 0, label: '?', tone: 'muted', dashed: true },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['b', 'd'], ['c', 'm'], ['d', 'm']],
    refs: [
      { at: 'c', name: 'line 12: maxLength 20' , kind: 'tag' },
      { at: 'd', name: 'line 12: maxLength 32', kind: 'tag', below: true },
      { at: 'm', name: 'CONFLICT', kind: 'head' },
    ],
  },
  rebase: {
    title: 'Rebase replays D and E on top of C as new commits D\' and E\'',
    laneNames: ['main', 'feature', 'rebased'],
    nodes: [
      { id: 'a', col: 0, lane: 0, label: 'A' },
      { id: 'b', col: 1, lane: 0, label: 'B' },
      { id: 'c', col: 2, lane: 0, label: 'C' },
      { id: 'd', col: 2, lane: 1, label: 'D', tone: 'muted', dashed: true },
      { id: 'e', col: 3, lane: 1, label: 'E', tone: 'muted', dashed: true },
      { id: 'd2', col: 3, lane: 2, label: "D'", tone: 'feature' },
      { id: 'e2', col: 4, lane: 2, label: "E'", tone: 'feature' },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['b', 'd'], ['d', 'e'], ['c', 'd2'], ['d2', 'e2']],
    refs: [{ at: 'c', name: 'main' }, { at: 'e2', name: 'feature', below: true }, { at: 'e', name: 'old (orphaned)', kind: 'tag', below: true }],
  },
  'git-flow': {
    title: 'Git Flow: long-lived main and develop, plus feature, release and hotfix branches',
    laneNames: ['hotfix', 'main', 'release', 'develop', 'feature'],
    nodes: [
      { id: 'm0', col: 0, lane: 1, label: '1.0', tone: 'main' },
      { id: 'h1', col: 1, lane: 0, label: 'H', tone: 'bad' },
      { id: 'm1', col: 2, lane: 1, label: '1.0.1', tone: 'main' },
      { id: 'd0', col: 0, lane: 3, label: 'd', tone: 'release' },
      { id: 'f1', col: 1, lane: 4, label: 'f1', tone: 'feature' },
      { id: 'f2', col: 2, lane: 4, label: 'f2', tone: 'feature' },
      { id: 'd1', col: 3, lane: 3, label: 'd', tone: 'release' },
      { id: 'r1', col: 4, lane: 2, label: 'rc', tone: 'fix' },
      { id: 'm2', col: 5, lane: 1, label: '1.1', tone: 'main' },
      { id: 'd2', col: 5, lane: 3, label: 'd', tone: 'release' },
    ],
    edges: [['m0', 'h1'], ['h1', 'm1'], ['m0', 'm1'], ['m0', 'd0'], ['d0', 'f1'], ['f1', 'f2'], ['f2', 'd1'], ['d0', 'd1'], ['h1', 'd1'], ['d1', 'r1'], ['r1', 'm2'], ['m1', 'm2'], ['r1', 'd2'], ['d1', 'd2']],
  },
  'github-flow': {
    title: 'GitHub Flow: one main branch, short-lived branches merged by pull request',
    laneNames: ['main', 'feature/a', 'feature/b'],
    nodes: [
      { id: 'a', col: 0, lane: 0, label: 'A' },
      { id: 'f1', col: 1, lane: 1, label: 'a1', tone: 'feature' },
      { id: 'f2', col: 2, lane: 1, label: 'a2', tone: 'feature' },
      { id: 'm1', col: 3, lane: 0, label: 'PR', tone: 'merge' },
      { id: 'g1', col: 4, lane: 2, label: 'b1', tone: 'feature' },
      { id: 'm2', col: 5, lane: 0, label: 'PR', tone: 'merge' },
    ],
    edges: [['a', 'f1'], ['f1', 'f2'], ['a', 'm1'], ['f2', 'm1'], ['m1', 'g1'], ['m1', 'm2'], ['g1', 'm2']],
    refs: [{ at: 'm1', name: 'deploy' , kind: 'tag' }, { at: 'm2', name: 'main' }],
  },
  'trunk-based': {
    title: 'Trunk-based: everyone integrates into main at least daily',
    laneNames: ['main', 'short branch'],
    nodes: [
      { id: 'a', col: 0, lane: 0, label: 'A' },
      { id: 'b', col: 1, lane: 0, label: 'B' },
      { id: 's', col: 2, lane: 1, label: 's', tone: 'feature' },
      { id: 'c', col: 3, lane: 0, label: 'C' },
      { id: 'd', col: 4, lane: 0, label: 'D' },
      { id: 'e', col: 5, lane: 0, label: 'E' },
    ],
    edges: [['a', 'b'], ['b', 's'], ['b', 'c'], ['s', 'c'], ['c', 'd'], ['d', 'e']],
    refs: [{ at: 'e', name: 'main' }, { at: 'd', name: 'flag: off', kind: 'tag' }],
  },
};

const FLOWS: Partial<Record<DiagramName, ReactNode>> = {
  'pr-flow': (
    <FlowDiagram
      steps={[
        { title: 'Feature branch', sub: 'git switch -c', tone: 'ok' },
        { title: 'Push', sub: 'git push -u origin', tone: 'accent' },
        { title: 'Open PR', sub: 'feature → main', tone: 'done' },
        { title: 'Review + CI', sub: 'comments, checks', tone: 'warn' },
        { title: 'Merge', sub: 'into main', tone: 'ok' },
      ]}
      arrows={['commit', '', '', 'approved']}
      loop="Changes requested? Commit fixes on the same branch and push again; the PR updates itself."
    />
  ),
  'ci-pipeline': (
    <FlowDiagram
      steps={[
        { title: 'Trigger', sub: 'push / pull_request', tone: 'accent' },
        { title: 'Checkout', sub: 'actions/checkout', tone: 'neutral' },
        { title: 'Install', sub: 'npm ci', tone: 'neutral' },
        { title: 'Test', sub: 'npm test', tone: 'warn' },
        { title: 'Build', sub: 'npm run build', tone: 'neutral' },
        { title: 'Deploy', sub: 'staging / prod', tone: 'ok' },
      ]}
      loop="Any failing step stops the run and marks the commit or PR with a red ✗."
    />
  ),
  'company-lifecycle': (
    <FlowDiagram
      steps={[
        { title: 'Ticket', role: 'PM', tone: 'neutral' },
        { title: 'Branch + code', role: 'Developer', tone: 'ok' },
        { title: 'Pull request', role: 'Developer', tone: 'accent' },
        { title: 'Code review', role: 'Senior / Lead', tone: 'warn' },
        { title: 'Merge + CI/CD', role: 'DevOps', tone: 'done' },
        { title: 'Test on staging', role: 'QA', tone: 'warn' },
        { title: 'Release', role: 'Tech Lead', tone: 'ok' },
      ]}
      loop="Bugs found on staging go back to a developer as a bug-fix branch and through review again."
    />
  ),
  'qa-workflow': (
    <FlowDiagram
      steps={[
        { title: 'Dev pushes', sub: 'feature branch', tone: 'accent' },
        { title: 'QA pulls', sub: 'git switch', tone: 'neutral' },
        { title: 'QA tests', sub: 'manual + automation', tone: 'warn' },
        { title: 'Defects', sub: 'Jira / Issues', tone: 'bad' },
        { title: 'Dev fixes', sub: 'new commits', tone: 'accent' },
        { title: 'QA retests', sub: 'git pull', tone: 'warn' },
        { title: 'PR approved', sub: 'merge', tone: 'ok' },
        { title: 'Release', sub: 'tag', tone: 'done' },
      ]}
      loop="Defects → fix → retest repeats until the branch passes."
    />
  ),
  'fetch-vs-pull': (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-accent/40 bg-canvas p-3">
        <p className="font-mono text-sm font-semibold text-accent">git fetch</p>
        <p className="mt-1 text-sm text-fg/85">Downloads new commits and updates <code className="prose-code">origin/main</code> only.</p>
        <p className="mt-1 text-sm text-fg/85">Your <code className="prose-code">main</code> and your files are <strong>not touched</strong>. Safe any time.</p>
      </div>
      <div className="rounded-lg border border-done/40 bg-canvas p-3">
        <p className="font-mono text-sm font-semibold text-done">git pull = git fetch + git merge</p>
        <p className="mt-1 text-sm text-fg/85">Downloads, then immediately merges <code className="prose-code">origin/main</code> into your current branch.</p>
        <p className="mt-1 text-sm text-fg/85">Changes your files and can cause conflicts.</p>
      </div>
    </div>
  ),
};

const CUSTOM: Partial<Record<DiagramName, () => ReactNode>> = {
  'three-areas': ThreeAreas,
  lifecycle: Lifecycle,
  'centralized-vs-distributed': CentralVsDistributed,
  snapshots: Snapshots,
  'local-remote': LocalRemote,
  'reset-modes': ResetModes,
  'fork-flow': ForkFlow,
};

const TITLES: Record<DiagramName, string> = {
  'three-areas': 'The three areas of Git (plus the remote)',
  lifecycle: 'File status lifecycle',
  'centralized-vs-distributed': 'Centralized vs distributed version control',
  snapshots: 'Git stores snapshots, not differences',
  'head-pointer': 'HEAD and branches',
  'branch-basic': 'Branching',
  'fast-forward': 'Fast-forward merge',
  'three-way': 'Three-way merge',
  'local-remote': 'Local vs remote repositories',
  'fetch-vs-pull': 'Fetch vs pull',
  'pr-flow': 'Pull request flow',
  rebase: 'Rebase',
  'reset-modes': 'git reset modes',
  'git-flow': 'Git Flow',
  'github-flow': 'GitHub Flow',
  'trunk-based': 'Trunk-based development',
  'ci-pipeline': 'CI/CD pipeline',
  'company-lifecycle': 'Ticket to production',
  'qa-workflow': 'QA workflow',
  'fork-flow': 'Fork and pull request',
  conflict: 'How a merge conflict happens',
};

export const DIAGRAM_NAMES = Object.keys(TITLES) as DiagramName[];

export function Diagram({ name, caption }: { name: DiagramName; caption?: string }) {
  const Custom = CUSTOM[name];
  const graph = GRAPHS[name];
  const flow = FLOWS[name];
  return (
    <Frame title={TITLES[name]} caption={caption}>
      {Custom ? <Custom /> : graph ? <GraphDiagram spec={graph} /> : flow}
    </Frame>
  );
}

export function hasDiagram(name: DiagramName) {
  return Boolean(CUSTOM[name] || GRAPHS[name] || FLOWS[name]);
}
