import type { Commit, Repo, Tree } from './types';

export const AUTHOR = 'You <you@example.com>';
export const TEAMMATE = 'Rahul Verma <rahul@example.com>';

export function emptyRepo(): Repo {
  return {
    initialized: false,
    cwdName: 'project',
    files: {},
    index: {},
    commits: {},
    branches: {},
    head: { type: 'branch', name: 'main' },
    tags: {},
    stash: [],
    reflog: [],
    remotes: {},
    tracking: {},
    upstream: {},
    clock: 0,
  };
}

export function clone<T>(v: T): T {
  return structuredClone(v);
}

/** Deterministic 7-character hex IDs so outputs are reproducible. */
export function newId(repo: Repo, seed: string): string {
  let h = 0x811c9dc5;
  const s = `${repo.clock}:${seed}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let id = (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
  while (repo.commits[id]) id = ((parseInt(id, 16) + 1) % 0xfffffff).toString(16).padStart(7, '0');
  return id;
}

export function headCommitId(repo: Repo): string | undefined {
  return repo.head.type === 'branch' ? repo.branches[repo.head.name] : repo.head.id;
}

export function headTree(repo: Repo): Tree {
  const id = headCommitId(repo);
  return id ? repo.commits[id].tree : {};
}

export function currentBranch(repo: Repo): string | undefined {
  return repo.head.type === 'branch' ? repo.head.name : undefined;
}

export function short(id: string) {
  return id.slice(0, 7);
}

/** All ancestors of a commit, including itself. */
export function ancestors(repo: Repo, id: string | undefined): Set<string> {
  const seen = new Set<string>();
  const stack = id ? [id] : [];
  while (stack.length) {
    const c = stack.pop()!;
    if (seen.has(c) || !repo.commits[c]) continue;
    seen.add(c);
    stack.push(...repo.commits[c].parents);
  }
  return seen;
}

export function isAncestor(repo: Repo, a: string, b: string): boolean {
  return ancestors(repo, b).has(a);
}

/** Best common ancestor: the newest commit reachable from both. */
export function mergeBase(repo: Repo, a: string, b: string): string | undefined {
  const aa = ancestors(repo, a);
  let best: Commit | undefined;
  for (const id of ancestors(repo, b)) {
    if (aa.has(id) && (!best || repo.commits[id].time > best.time)) best = repo.commits[id];
  }
  return best?.id;
}

/** Commits reachable from `to` but not from `from`, newest first. */
export function range(repo: Repo, from: string | undefined, to: string): Commit[] {
  const exclude = ancestors(repo, from);
  return [...ancestors(repo, to)]
    .filter((id) => !exclude.has(id))
    .map((id) => repo.commits[id])
    .sort((x, y) => y.time - x.time);
}

/** Resolve a revision such as HEAD, HEAD~2, main, origin/main, v1.0, a1b2c3d, HEAD@{1}. */
export function resolveRev(repo: Repo, rev: string): string | undefined {
  const reflogMatch = rev.match(/^(?:HEAD)?@\{(\d+)\}$/);
  if (reflogMatch) {
    const n = Number(reflogMatch[1]);
    return repo.reflog[repo.reflog.length - 1 - n]?.id;
  }
  const m = rev.match(/^(.*?)((?:[~^]\d*)*)$/);
  if (!m) return undefined;
  const [, base, suffix] = m;
  let id: string | undefined;
  if (base === 'HEAD' || base === '@' || base === '') id = headCommitId(repo);
  else if (repo.branches[base]) id = repo.branches[base];
  else if (repo.tracking[base]) id = repo.tracking[base];
  else if (repo.tags[base]) id = repo.tags[base].id;
  else if (/^[0-9a-f]{4,40}$/.test(base)) {
    const hits = Object.keys(repo.commits).filter((c) => c.startsWith(base.slice(0, 7)));
    if (hits.length === 1) id = hits[0];
  }
  if (!id) return undefined;
  const steps = suffix.match(/[~^]\d*/g) ?? [];
  for (const s of steps) {
    const n = s.length > 1 ? Number(s.slice(1)) : 1;
    if (s[0] === '~') {
      for (let i = 0; i < n; i++) id = id ? repo.commits[id]?.parents[0] : undefined;
    } else {
      id = id ? repo.commits[id]?.parents[n - 1] : undefined;
    }
    if (!id) return undefined;
  }
  return id;
}

export interface FileChange {
  path: string;
  kind: 'new file' | 'modified' | 'deleted';
}

export function diffTrees(a: Tree, b: Tree): FileChange[] {
  const paths = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const out: FileChange[] = [];
  for (const p of paths) {
    if (!(p in a)) out.push({ path: p, kind: 'new file' });
    else if (!(p in b)) out.push({ path: p, kind: 'deleted' });
    else if (a[p] !== b[p]) out.push({ path: p, kind: 'modified' });
  }
  return out;
}

export function lines(s: string | undefined): string[] {
  if (s === undefined || s === '') return [];
  return s.replace(/\n$/, '').split('\n');
}

/** Line diff using a longest-common-subsequence table (files here are small). */
export function lineDiff(a: string | undefined, b: string | undefined): { op: ' ' | '+' | '-'; text: string }[] {
  const x = lines(a);
  const y = lines(b);
  const dp = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--)
    for (let j = y.length - 1; j >= 0; j--)
      dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { op: ' ' | '+' | '-'; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) {
      out.push({ op: ' ', text: x[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ op: '-', text: x[i++] });
    else out.push({ op: '+', text: y[j++] });
  }
  while (i < x.length) out.push({ op: '-', text: x[i++] });
  while (j < y.length) out.push({ op: '+', text: y[j++] });
  return out;
}

export function countChanges(a: Tree, b: Tree) {
  let ins = 0;
  let del = 0;
  const changes = diffTrees(a, b);
  for (const c of changes) {
    for (const d of lineDiff(a[c.path], b[c.path])) {
      if (d.op === '+') ins++;
      if (d.op === '-') del++;
    }
  }
  return { files: changes.length, ins, del, changes };
}

export function statSummary(a: Tree, b: Tree): string {
  const { files, ins, del, changes } = countChanges(a, b);
  const parts = [`${files} file${files === 1 ? '' : 's'} changed`];
  if (ins) parts.push(`${ins} insertion${ins === 1 ? '' : 's'}(+)`);
  if (del) parts.push(`${del} deletion${del === 1 ? '' : 's'}(-)`);
  const modes = changes
    .filter((c) => c.kind !== 'modified')
    .map((c) => ` ${c.kind === 'new file' ? 'create' : 'delete'} mode 100644 ${c.path}`);
  return [` ${parts.join(', ')}`, ...modes].join('\n');
}

export function unifiedDiff(a: Tree, b: Tree, paths?: string[]): string {
  const out: string[] = [];
  for (const c of diffTrees(a, b)) {
    if (paths && paths.length && !paths.includes(c.path)) continue;
    out.push(`diff --git a/${c.path} b/${c.path}`);
    if (c.kind === 'new file') out.push('new file mode 100644', '--- /dev/null', `+++ b/${c.path}`);
    else if (c.kind === 'deleted') out.push('deleted file mode 100644', `--- a/${c.path}`, '+++ /dev/null');
    else out.push(`--- a/${c.path}`, `+++ b/${c.path}`);
    const d = lineDiff(a[c.path], b[c.path]);
    const oldN = d.filter((l) => l.op !== '+').length;
    const newN = d.filter((l) => l.op !== '-').length;
    out.push(`@@ -${oldN ? 1 : 0},${oldN} +${newN ? 1 : 0},${newN} @@`);
    for (const l of d) out.push(`${l.op}${l.text}`);
  }
  return out.join('\n');
}

export function hasMarkers(content: string | undefined): boolean {
  return !!content && /^(<<<<<<<|=======|>>>>>>>)/m.test(content);
}
