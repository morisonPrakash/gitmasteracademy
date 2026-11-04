import { threeWay } from './merge';
import {
  AUTHOR, TEAMMATE, ancestors, clone, currentBranch, diffTrees, emptyRepo, hasMarkers, headCommitId, headTree,
  isAncestor, mergeBase, newId, range, resolveRev, short, statSummary, unifiedDiff,
} from './repo';
import type { Commit, Repo, RunResult, Tree } from './types';

// Every command receives a mutable working copy of the repository (cloned by run())
// and writes terminal output plus an explanation of what happened inside Git.
interface Ctx {
  repo: Repo;
  out: string[];
  explain: string[];
  ok: boolean;
}

const HOME = '/home/you';

function fail(ctx: Ctx, msg: string): Ctx {
  ctx.out.push(msg);
  ctx.ok = false;
  return ctx;
}

/** Remove a flag (and optionally its value) from args, returning whether/what was found. */
function flag(args: string[], ...names: string[]): boolean {
  let found = false;
  for (let i = args.length - 1; i >= 0; i--) {
    if (names.includes(args[i])) {
      args.splice(i, 1);
      found = true;
    }
  }
  return found;
}

function option(args: string[], ...names: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    for (const n of names) {
      if (args[i] === n && i + 1 < args.length) {
        const v = args[i + 1];
        args.splice(i, 2);
        return v;
      }
      if (n.startsWith('--') && args[i].startsWith(n + '=')) {
        const v = args[i].slice(n.length + 1);
        args.splice(i, 1);
        return v;
      }
    }
  }
  return undefined;
}

// ───────────────────────── helpers that change state ─────────────────────────

function writeCommit(repo: Repo, tree: Tree, parents: string[], message: string, author = AUTHOR): string {
  repo.clock++;
  const id = newId(repo, message);
  const commit: Commit = { id, parents, message, tree: clone(tree), author, time: repo.clock };
  repo.commits[id] = commit;
  if (repo.head.type === 'branch') repo.branches[repo.head.name] = id;
  else repo.head = { type: 'detached', id };
  return id;
}

function logRef(repo: Repo, action: string) {
  const id = headCommitId(repo);
  if (id) repo.reflog.push({ id, action });
}

function subject(repo: Repo, id: string) {
  return repo.commits[id].message.split('\n')[0];
}

/** Paths whose working-directory or staged content differs from HEAD (tracked changes only). */
function dirtyPaths(repo: Repo): string[] {
  const head = headTree(repo);
  const out = new Set<string>();
  for (const c of diffTrees(head, repo.index)) out.add(c.path);
  for (const p of Object.keys(repo.index)) if (repo.files[p] !== repo.index[p]) out.add(p);
  return [...out];
}

function untracked(repo: Repo): string[] {
  return Object.keys(repo.files).filter((p) => !(p in repo.index)).sort();
}

/**
 * Move HEAD to another commit and update the index and working directory to match,
 * carrying uncommitted changes along when they do not clash (like real git switch).
 */
function checkoutTree(ctx: Ctx, targetId: string | undefined): boolean {
  const repo = ctx.repo;
  const from = headTree(repo);
  const to = targetId ? repo.commits[targetId].tree : {};
  const dirty = dirtyPaths(repo);
  const clashes = dirty.filter((p) => from[p] !== to[p]);
  if (clashes.length) {
    fail(ctx, `error: Your local changes to the following files would be overwritten by checkout:\n${clashes.map((p) => `\t${p}`).join('\n')}\nPlease commit your changes or stash them before you switch branches.\nAborting`);
    return false;
  }
  const files: Tree = {};
  const index: Tree = {};
  for (const p of Object.keys(to)) {
    files[p] = to[p];
    index[p] = to[p];
  }
  for (const p of dirty) {
    if (p in repo.files) files[p] = repo.files[p];
    else delete files[p];
    if (p in repo.index) index[p] = repo.index[p];
    else delete index[p];
  }
  for (const p of untracked(repo)) files[p] = repo.files[p];
  repo.files = files;
  repo.index = index;
  return true;
}

function requireRepo(ctx: Ctx): boolean {
  if (!ctx.repo.initialized) {
    fail(ctx, 'fatal: not a git repository (or any of the parent directories): .git');
    return false;
  }
  return true;
}

function trackingLine(repo: Repo, branch: string): string | undefined {
  const up = repo.upstream[branch];
  if (!up) return undefined;
  const local = repo.branches[branch];
  const remote = repo.tracking[up];
  if (!remote) return `Your branch is based on '${up}', but the upstream is gone.\n  (use "git branch --unset-upstream" to fixup)`;
  const ahead = range(repo, remote, local).length;
  const behind = range(repo, local, remote).length;
  if (!ahead && !behind) return `Your branch is up to date with '${up}'.`;
  if (ahead && !behind) return `Your branch is ahead of '${up}' by ${ahead} commit${ahead > 1 ? 's' : ''}.\n  (use "git push" to publish your local commits)`;
  if (!ahead && behind) return `Your branch is behind '${up}' by ${behind} commit${behind > 1 ? 's' : ''}, and can be fast-forwarded.\n  (use "git pull" to update your local branch)`;
  return `Your branch and '${up}' have diverged,\nand have ${ahead} and ${behind} different commits each, respectively.\n  (use "git pull" if you want to integrate the remote branch with yours)`;
}

function aheadBehind(repo: Repo, branch: string): string {
  const up = repo.upstream[branch];
  if (!up || !repo.tracking[up]) return '';
  const ahead = range(repo, repo.tracking[up], repo.branches[branch]).length;
  const behind = range(repo, repo.branches[branch], repo.tracking[up]).length;
  const parts = [ahead && `ahead ${ahead}`, behind && `behind ${behind}`].filter(Boolean);
  return parts.length ? ` [${parts.join(', ')}]` : '';
}

// ───────────────────────── commands ─────────────────────────

function init(ctx: Ctx): Ctx {
  const path = `${HOME}/${ctx.repo.cwdName}/.git/`;
  if (ctx.repo.initialized) {
    ctx.out.push(`Reinitialized existing Git repository in ${path}`);
    ctx.explain.push('The .git folder already existed, so Git left your history untouched.');
    return ctx;
  }
  ctx.repo.initialized = true;
  ctx.repo.head = { type: 'branch', name: 'main' };
  ctx.out.push(`Initialized empty Git repository in ${path}`);
  ctx.explain.push('Created the hidden .git folder: an empty object store, an empty staging area, and HEAD pointing at the branch "main" (which has no commits yet).');
  return ctx;
}

function status(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const withBranch = args.some((a) => ['-sb', '-bs', '-b', '--branch'].includes(a));
  const isShort = flag(args, '-s', '--short', '-sb', '-bs');
  flag(args, '-b', '--branch');
  const head = headTree(repo);
  const conflicts = repo.merge?.conflicts ?? [];
  const staged = diffTrees(head, repo.index).filter((c) => !conflicts.includes(c.path));
  const unstaged = Object.keys(repo.index)
    .filter((p) => repo.files[p] !== repo.index[p] && !conflicts.includes(p))
    .map((p) => ({ path: p, kind: p in repo.files ? 'modified' : 'deleted' }));
  const untr = untracked(repo).filter((p) => !conflicts.includes(p));
  const branch = currentBranch(repo);

  if (isShort) {
    const rows: string[] = [];
    if (withBranch && branch) rows.push(`## ${branch}${repo.upstream[branch] ? `...${repo.upstream[branch]}` : ''}${aheadBehind(repo, branch)}`);
    const paths = [...new Set([...staged.map((s) => s.path), ...unstaged.map((u) => u.path), ...conflicts])].sort();
    for (const p of paths) {
      if (conflicts.includes(p)) {
        rows.push(`UU ${p}`);
        continue;
      }
      const s = staged.find((x) => x.path === p);
      const u = unstaged.find((x) => x.path === p);
      const x = s ? (s.kind === 'new file' ? 'A' : s.kind === 'deleted' ? 'D' : 'M') : ' ';
      const y = u ? (u.kind === 'deleted' ? 'D' : 'M') : ' ';
      rows.push(`${x}${y} ${p}`);
    }
    for (const p of untr) rows.push(`?? ${p}`);
    ctx.out.push(rows.join('\n'));
    ctx.explain.push('Short status: the left column is the staging area, the right column the working directory. ?? means untracked.');
    return ctx;
  }

  const o: string[] = [];
  o.push(branch ? `On branch ${branch}` : `HEAD detached at ${short(headCommitId(repo)!)}`);
  if (branch) {
    const t = trackingLine(repo, branch);
    if (t) o.push(t);
  }
  if (repo.merge) {
    o.push(conflicts.length
      ? 'You have unmerged paths.\n  (fix conflicts and run "git commit")\n  (use "git merge --abort" to abort the merge)'
      : 'All conflicts fixed but you are still merging.\n  (use "git commit" to conclude merge)');
  }
  if (!headCommitId(repo)) o.push('\nNo commits yet');
  if (staged.length) {
    o.push('\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)');
    for (const s of staged) o.push(`\t${(s.kind + ':').padEnd(12)}${s.path}`);
  }
  if (conflicts.length) {
    o.push('\nUnmerged paths:\n  (use "git add <file>..." to mark resolution)');
    for (const p of conflicts) o.push(`\t${'both modified:'.padEnd(17)}${p}`);
  }
  if (unstaged.length) {
    o.push('\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)');
    for (const u of unstaged) o.push(`\t${(u.kind + ':').padEnd(12)}${u.path}`);
  }
  if (untr.length) {
    o.push('\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)');
    for (const p of untr) o.push(`\t${p}`);
  }
  if (!staged.length && !unstaged.length && !untr.length && !conflicts.length) {
    o.push(headCommitId(repo) ? '\nnothing to commit, working tree clean' : '\nnothing to commit (create/copy files and use "git add" to track)');
  } else if (!staged.length && !conflicts.length) {
    o.push(unstaged.length ? '\nno changes added to commit (use "git add" and/or "git commit -a")' : '\nnothing added to commit but untracked files present (use "git add" to track)');
  }
  ctx.out.push(o.join('\n'));
  ctx.explain.push(`Compared three things: HEAD (last commit), the staging area and your files. ${staged.length} staged, ${unstaged.length} modified but unstaged, ${untr.length} untracked${conflicts.length ? `, ${conflicts.length} in conflict` : ''}.`);
  return ctx;
}

function add(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const all = flag(args, '-A', '--all', '.');
  const updateOnly = flag(args, '-u', '--update');
  if (!all && !updateOnly && !args.length) return fail(ctx, 'Nothing specified, nothing added.\nhint: Maybe you wanted to say \'git add .\'?');
  let paths: string[];
  if (all) paths = [...new Set([...Object.keys(repo.files), ...Object.keys(repo.index)])];
  else if (updateOnly) paths = Object.keys(repo.index);
  else {
    paths = [];
    for (const a of args) {
      const matches = [...new Set([...Object.keys(repo.files), ...Object.keys(repo.index)])].filter((p) => p === a || p.startsWith(a.replace(/\/?$/, '/')));
      if (!matches.length) return fail(ctx, `fatal: pathspec '${a}' did not match any files`);
      paths.push(...matches);
    }
  }
  const changed: string[] = [];
  for (const p of paths) {
    if (p in repo.files) {
      if (repo.index[p] !== repo.files[p]) changed.push(p);
      repo.index[p] = repo.files[p];
    } else if (p in repo.index) {
      delete repo.index[p];
      changed.push(p);
    }
    if (repo.merge?.conflicts.includes(p)) {
      repo.merge.conflicts = repo.merge.conflicts.filter((c) => c !== p);
      if (hasMarkers(repo.files[p])) ctx.out.push(`warning: ${p} still contains conflict markers`);
      ctx.explain.push(`Staging ${p} marks its conflict as resolved.`);
    }
  }
  ctx.explain.push(changed.length
    ? `Copied the current content of ${changed.join(', ')} into the staging area. They will be part of the next commit.`
    : 'Nothing changed: the staging area already matched these files.');
  return ctx;
}

function commit(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const amend = flag(args, '--amend');
  const noEdit = flag(args, '--no-edit');
  const all = flag(args, '-a', '--all');
  let message = option(args, '-m', '--message');
  const am = args.findIndex((a) => a === '-am');
  if (am >= 0) {
    message = args[am + 1];
    args.splice(am, 2);
    if (repo.index) for (const p of Object.keys(repo.index)) {
      if (p in repo.files) repo.index[p] = repo.files[p];
      else delete repo.index[p];
    }
  }
  if (all) for (const p of Object.keys(repo.index)) {
    if (p in repo.files) repo.index[p] = repo.files[p];
    else delete repo.index[p];
  }
  if (repo.merge?.conflicts.length) {
    return fail(ctx, `error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add/rm <file>'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.`);
  }
  const parentId = headCommitId(repo);
  const branchLabel = currentBranch(repo) ?? 'detached HEAD';

  if (amend) {
    if (!parentId) return fail(ctx, 'fatal: You have nothing to amend.');
    const old = repo.commits[parentId];
    const msg = message ?? (noEdit ? old.message : old.message);
    const id = writeCommit(repo, repo.index, old.parents, msg, old.author);
    logRef(repo, `commit (amend): ${msg}`);
    ctx.out.push(`[${branchLabel} ${id}] ${msg}\n${statSummary(old.parents[0] ? repo.commits[old.parents[0]].tree : {}, repo.index)}`);
    ctx.explain.push(`Replaced commit ${old.id} with a new commit ${id} (new hash). The old commit is no longer on the branch but is still in the reflog.`);
    return ctx;
  }

  const head = headTree(repo);
  if (!repo.merge && !diffTrees(head, repo.index).length) {
    const o = ['On branch ' + branchLabel];
    const unstaged = Object.keys(repo.index).filter((p) => repo.files[p] !== repo.index[p]);
    if (unstaged.length) o.push('Changes not staged for commit:\n' + unstaged.map((p) => `\tmodified:   ${p}`).join('\n') + '\n\nno changes added to commit (use "git add" and/or "git commit -a")');
    else if (untracked(repo).length) o.push('Untracked files:\n' + untracked(repo).map((p) => `\t${p}`).join('\n') + '\n\nnothing added to commit but untracked files present (use "git add" to track)');
    else o.push('nothing to commit, working tree clean');
    return fail(ctx, o.join('\n'));
  }
  if (repo.merge) {
    message ??= repo.merge.message;
    const parents = [parentId!, repo.merge.theirs];
    const id = writeCommit(repo, repo.index, parents, message);
    logRef(repo, `commit (merge): ${message}`);
    delete repo.merge;
    ctx.out.push(`[${branchLabel} ${id}] ${message}`);
    ctx.explain.push(`Created merge commit ${id} with two parents (${short(parents[0])} and ${short(parents[1])}). The merge is complete.`);
    return ctx;
  }
  if (!message) return fail(ctx, 'error: this simulation needs a message: use git commit -m "Your message"\n(In a real terminal Git would open your editor here.)');
  const id = writeCommit(repo, repo.index, parentId ? [parentId] : [], message);
  logRef(repo, `commit${parentId ? '' : ' (initial)'}: ${message}`);
  ctx.out.push(`[${branchLabel}${parentId ? '' : ' (root-commit)'} ${id}] ${message}\n${statSummary(head, repo.index)}`);
  ctx.explain.push(`Saved the staging area as a new snapshot: commit ${id}${parentId ? `, whose parent is ${short(parentId)}` : ' (the first commit, with no parent)'}. ${currentBranch(repo) ? `The branch "${currentBranch(repo)}" moved forward to it, and HEAD came along.` : 'HEAD is detached, so no branch moved.'}`);
  return ctx;
}

function decorations(repo: Repo, id: string): string {
  const d: string[] = [];
  const head = repo.head;
  for (const [b, c] of Object.entries(repo.branches)) {
    if (c !== id) continue;
    if (head.type === 'branch' && head.name === b) d.unshift(`HEAD -> ${b}`);
    else d.push(b);
  }
  if (head.type === 'detached' && head.id === id) d.unshift('HEAD');
  for (const [t, c] of Object.entries(repo.tracking)) if (c === id) d.push(t);
  for (const [t, c] of Object.entries(repo.tags)) if (c.id === id) d.push(`tag: ${t}`);
  return d.length ? ` (${d.join(', ')})` : '';
}

function log(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const oneline = flag(args, '--oneline');
  const graph = flag(args, '--graph');
  const all = flag(args, '--all');
  flag(args, '--decorate');
  let limit = Number(option(args, '-n') ?? NaN);
  const nIdx = args.findIndex((a) => /^-\d+$/.test(a));
  if (nIdx >= 0) {
    limit = Number(args[nIdx].slice(1));
    args.splice(nIdx, 1);
  }
  let commits: Commit[];
  const rangeArg = args.find((a) => a.includes('..'));
  if (rangeArg) {
    const [a, b] = rangeArg.split(/\.\.\.?/);
    const from = a ? resolveRev(repo, a) : headCommitId(repo);
    const to = b ? resolveRev(repo, b) : headCommitId(repo);
    if (!from || !to) return fail(ctx, `fatal: ambiguous argument '${rangeArg}': unknown revision or path not in the working tree.`);
    commits = range(repo, from, to);
  } else {
    const starts = all
      ? [...Object.values(repo.branches), ...Object.values(repo.tracking), ...Object.values(repo.tags).map((t) => t.id), headCommitId(repo)].filter((x): x is string => !!x)
      : args.length ? args.map((a) => resolveRev(repo, a)).filter((x): x is string => !!x) : [headCommitId(repo)].filter((x): x is string => !!x);
    if (!starts.length) {
      return fail(ctx, `fatal: your current branch '${currentBranch(repo) ?? 'HEAD'}' does not have any commits yet`);
    }
    const ids = new Set<string>();
    for (const s of starts) for (const id of ancestors(repo, s)) ids.add(id);
    commits = [...ids].map((id) => repo.commits[id]).sort((x, y) => y.time - x.time);
  }
  if (!Number.isNaN(limit)) commits = commits.slice(0, limit);
  if (!commits.length) {
    ctx.explain.push('No commits in that range.');
    return ctx;
  }
  const text = (c: Commit) => oneline
    ? `${c.id}${decorations(repo, c.id)} ${c.message.split('\n')[0]}`
    : `commit ${c.id}${'0'.repeat(33)}${decorations(repo, c.id)}\n${c.parents.length > 1 ? `Merge: ${c.parents.map(short).join(' ')}\n` : ''}Author: ${c.author}\nDate:   commit #${c.time}\n\n    ${c.message.split('\n').join('\n    ')}\n`;
  ctx.out.push(graph ? drawGraph(commits, text) : commits.map(text).join('\n'));
  ctx.explain.push(`Walked the history by following parent links from ${all ? 'every branch and tag' : rangeArg ? `the range ${rangeArg}` : 'HEAD'}, newest first.${graph ? ' The graph lines show branches splitting (/) and merging (\\).' : ''}`);
  return ctx;
}

/** A compact ASCII commit graph similar to git log --graph. */
function drawGraph(commits: Commit[], text: (c: Commit) => string): string {
  // cols[i] = the commit id that column i is waiting to draw next.
  const cols: string[] = [];
  const out: string[] = [];
  const shown = new Set(commits.map((c) => c.id));
  const bars = (n: number) => Array(n).fill('|').join(' ');
  for (const c of commits) {
    const idxs = cols.map((x, i) => (x === c.id ? i : -1)).filter((i) => i >= 0);
    let col: number;
    if (!idxs.length) {
      cols.push(c.id);
      col = cols.length - 1;
    } else {
      col = idxs[0];
      // Several branches end at this commit: fold their columns in first ("|/").
      for (const d of idxs.slice(1).reverse()) {
        const after = cols.length - d - 1;
        out.push(`${bars(d)}/${after ? ' ' + Array(after).fill('/').join(' ') : ''}`);
        cols.splice(d, 1);
      }
    }
    out.push(`${cols.map((_, i) => (i === col ? '*' : '|')).join(' ')} ${text(c).split('\n')[0]}`);
    const parents = c.parents.filter((p) => shown.has(p));
    if (!parents.length) {
      cols.splice(col, 1);
      continue;
    }
    cols[col] = parents[0];
    const extra = parents.slice(1).filter((p) => !cols.includes(p));
    if (extra.length) {
      // A merge commit opens a new column for its second parent ("|\").
      const after = cols.length - col - 1;
      out.push(`${col ? bars(col) + ' ' : ''}|\\${after ? ' ' + Array(after).fill('\\').join(' ') : ''}`);
      cols.splice(col + 1, 0, ...extra);
    }
  }
  return out.join('\n');
}

function diff(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const staged = flag(args, '--staged', '--cached');
  const stat = flag(args, '--stat');
  const nameOnly = flag(args, '--name-only');
  const dd = args.indexOf('--');
  const paths = dd >= 0 ? args.splice(dd).slice(1) : [];
  let a: Tree;
  let b: Tree;
  let what: string;
  const rangeArg = args.find((x) => x.includes('..'));
  if (rangeArg) {
    const three = rangeArg.includes('...');
    const [x, y] = rangeArg.split(/\.\.\.?/);
    const xa = resolveRev(repo, x || 'HEAD');
    const yb = resolveRev(repo, y || 'HEAD');
    if (!xa || !yb) return fail(ctx, `fatal: ambiguous argument '${rangeArg}': unknown revision or path not in the working tree.`);
    a = repo.commits[three ? mergeBase(repo, xa, yb) ?? xa : xa].tree;
    b = repo.commits[yb].tree;
    what = three ? `what ${y} changed since it split from ${x}` : `${x} with ${y}`;
  } else if (args.length >= 2) {
    const xa = resolveRev(repo, args[0]);
    const yb = resolveRev(repo, args[1]);
    if (!xa || !yb) return fail(ctx, `fatal: bad revision '${!xa ? args[0] : args[1]}'`);
    a = repo.commits[xa].tree;
    b = repo.commits[yb].tree;
    what = `commit ${args[0]} with commit ${args[1]}`;
  } else if (args.length === 1) {
    const xa = resolveRev(repo, args[0]);
    if (!xa) return fail(ctx, `fatal: bad revision '${args[0]}'`);
    a = repo.commits[xa].tree;
    b = repo.files;
    what = `${args[0]} with your working files`;
  } else if (staged) {
    a = headTree(repo);
    b = repo.index;
    what = 'the last commit with the staging area (what you are about to commit)';
  } else {
    a = repo.index;
    b = Object.fromEntries(Object.keys(repo.index).filter((p) => p in repo.files).map((p) => [p, repo.files[p]]));
    for (const p of Object.keys(repo.index)) if (!(p in repo.files)) delete b[p];
    what = 'the staging area with your working files (unstaged changes)';
  }
  const changes = diffTrees(a, b).filter((c) => !paths.length || paths.includes(c.path));
  if (nameOnly) ctx.out.push(changes.map((c) => c.path).join('\n'));
  else if (stat) {
    const pick = (t: Tree) => Object.fromEntries(changes.filter((c) => c.path in t).map((c) => [c.path, t[c.path]]));
    const perFile = changes.map((c) => {
      const s = statSummary(pick({ [c.path]: a[c.path] }), pick({ [c.path]: b[c.path] }));
      const ins = Number(s.match(/(\d+) insertion/)?.[1] ?? 0);
      const del = Number(s.match(/(\d+) deletion/)?.[1] ?? 0);
      return ` ${c.path.padEnd(20)} | ${String(ins + del).padStart(2)} ${'+'.repeat(ins)}${'-'.repeat(del)}`;
    });
    ctx.out.push([...perFile, statSummary(pick(a), pick(b)).split('\n')[0]].join('\n'));
  }
  else ctx.out.push(unifiedDiff(a, b, paths));
  ctx.explain.push(`Compared ${what}. ${changes.length ? `${changes.length} file(s) differ.` : 'No differences.'}`);
  return ctx;
}

function show(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const stat = flag(args, '--stat');
  flag(args, '--no-patch');
  const rev = args[0] ?? 'HEAD';
  const colon = rev.indexOf(':');
  if (colon >= 0) {
    const id = resolveRev(repo, rev.slice(0, colon) || 'HEAD');
    const path = rev.slice(colon + 1);
    if (!id) return fail(ctx, `fatal: invalid object name '${rev.slice(0, colon)}'.`);
    const content = repo.commits[id].tree[path];
    if (content === undefined) return fail(ctx, `fatal: path '${path}' does not exist in '${rev.slice(0, colon)}'`);
    ctx.out.push(content.replace(/\n$/, ''));
    ctx.explain.push(`Read ${path} straight out of commit ${short(id)} without changing your files.`);
    return ctx;
  }
  const id = resolveRev(repo, rev);
  if (!id) return fail(ctx, `fatal: ambiguous argument '${rev}': unknown revision or path not in the working tree.`);
  const c = repo.commits[id];
  const parent = c.parents[0] ? repo.commits[c.parents[0]].tree : {};
  ctx.out.push(`commit ${c.id}${'0'.repeat(33)}${decorations(repo, id)}\n${c.parents.length > 1 ? `Merge: ${c.parents.map(short).join(' ')}\n` : ''}Author: ${c.author}\nDate:   commit #${c.time}\n\n    ${c.message}\n\n${stat ? statSummary(parent, c.tree) : unifiedDiff(parent, c.tree)}`);
  ctx.explain.push(`Displayed commit ${id} and the changes it introduced compared to its first parent.`);
  return ctx;
}

function branch(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  if (flag(args, '--show-current')) {
    ctx.out.push(currentBranch(repo) ?? '');
    return ctx;
  }
  const del = flag(args, '-d', '--delete');
  const force = flag(args, '-D');
  const move = flag(args, '-m', '--move', '-M');
  const remotes = flag(args, '-r', '--remotes');
  const allB = flag(args, '-a', '--all');
  const vv = flag(args, '-vv');
  const v = flag(args, '-v');
  const cur = currentBranch(repo);

  if (del || force) {
    if (!args.length) return fail(ctx, 'fatal: branch name required');
    for (const name of args) {
      const id = repo.branches[name];
      if (!id) return fail(ctx, `error: branch '${name}' not found`);
      if (name === cur) return fail(ctx, `error: cannot delete branch '${name}' used by worktree at '${HOME}/${repo.cwdName}'`);
      const into = headCommitId(repo);
      const up = repo.upstream[name] && repo.tracking[repo.upstream[name]];
      const merged = (into && isAncestor(repo, id, into)) || (up && isAncestor(repo, id, up));
      if (!force && !merged) return fail(ctx, `error: the branch '${name}' is not fully merged.\nIf you are sure you want to delete it, run 'git branch -D ${name}'`);
      delete repo.branches[name];
      delete repo.upstream[name];
      ctx.out.push(`Deleted branch ${name} (was ${id}).`);
      ctx.explain.push(force && !merged
        ? `Removed the label "${name}". Its unmerged commits are now unreachable; only the reflog can find ${id} for a while.`
        : `Removed the label "${name}". Its commits are safe because they are already part of the current branch.`);
    }
    return ctx;
  }
  if (move) {
    const [a, b] = args.length === 2 ? args : [cur!, args[0]];
    if (!b) return fail(ctx, 'fatal: branch name required');
    if (!repo.branches[a]) return fail(ctx, `error: refname refs/heads/${a} not found`);
    if (repo.branches[b]) return fail(ctx, `fatal: a branch named '${b}' already exists`);
    repo.branches[b] = repo.branches[a];
    delete repo.branches[a];
    if (repo.upstream[a]) {
      repo.upstream[b] = repo.upstream[a];
      delete repo.upstream[a];
    }
    if (cur === a) repo.head = { type: 'branch', name: b };
    ctx.explain.push(`Renamed the branch label "${a}" to "${b}". No commits changed.`);
    return ctx;
  }
  if (args.length && !remotes && !allB) {
    const [name, start] = args;
    if (!headCommitId(repo) && !start) return fail(ctx, `fatal: not a valid object name: '${cur ?? 'main'}'`);
    if (repo.branches[name]) return fail(ctx, `fatal: a branch named '${name}' already exists`);
    const id = start ? resolveRev(repo, start) : headCommitId(repo);
    if (!id) return fail(ctx, `fatal: not a valid object name: '${start}'`);
    repo.branches[name] = id;
    ctx.explain.push(`Created a new label "${name}" pointing at ${short(id)}. You are still on ${cur ?? 'a detached HEAD'}: git branch does not switch.`);
    return ctx;
  }
  const rows: string[] = [];
  if (!remotes) {
    const names = Object.keys(repo.branches).sort();
    if (repo.head.type === 'detached') rows.push(`* (HEAD detached at ${short(repo.head.id)})`);
    const width = Math.max(...names.map((n) => n.length), 0);
    for (const n of names) {
      const id = repo.branches[n];
      let line = `${n === cur ? '*' : ' '} ${n}`;
      if (v || vv) {
        line = `${n === cur ? '*' : ' '} ${n.padEnd(width)} ${id}`;
        if (vv && repo.upstream[n]) line += ` [${repo.upstream[n]}${aheadBehind(repo, n).replace(' [', ': ').replace(']', '')}]`;
        line += ` ${subject(repo, id)}`;
      }
      rows.push(line);
    }
  }
  if (remotes || allB) {
    const pre = allB ? 'remotes/' : '';
    for (const t of Object.keys(repo.tracking).sort()) rows.push(`  ${pre}${t}`);
  }
  ctx.out.push(rows.join('\n'));
  ctx.explain.push(remotes || allB ? 'Remote-tracking branches (origin/…) show where branches were on the remote at your last fetch.' : 'Listed local branches. The * marks the branch HEAD points to.');
  return ctx;
}

function switchTo(ctx: Ctx, args: string[], legacy = false): Ctx {
  const repo = ctx.repo;
  const create = option(args, legacy ? '-b' : '-c', legacy ? '-B' : '--create', '-C');
  const detach = flag(args, '--detach', '-d');
  if (create) {
    if (repo.branches[create]) return fail(ctx, `fatal: a branch named '${create}' already exists`);
    const start = args[0] ? resolveRev(repo, args[0]) : headCommitId(repo);
    if (args[0] && !start) return fail(ctx, `fatal: invalid reference: ${args[0]}`);
    if (!start) {
      repo.head = { type: 'branch', name: create };
      ctx.out.push(`Switched to a new branch '${create}'`);
      return ctx;
    }
    const prev = currentBranch(repo);
    if (!checkoutTree(ctx, start)) return ctx;
    repo.branches[create] = start;
    if (args[0] && repo.tracking[args[0]]) repo.upstream[create] = args[0];
    repo.prevBranch = prev;
    repo.head = { type: 'branch', name: create };
    logRef(repo, `checkout: moving from ${prev ?? 'HEAD'} to ${create}`);
    ctx.out.push(`Switched to a new branch '${create}'`);
    ctx.explain.push(`Created branch "${create}" at ${short(start)} and moved HEAD to it. New commits will now move "${create}", not ${prev ?? 'the previous position'}.`);
    return ctx;
  }
  let target = args[0];
  if (!target) return fail(ctx, 'fatal: missing branch or commit argument');
  if (target === '-') {
    if (!repo.prevBranch) return fail(ctx, 'fatal: invalid reference: @{-1}');
    target = repo.prevBranch;
  }
  const prev = currentBranch(repo);
  if (repo.branches[target] && !detach) {
    if (prev === target) {
      ctx.out.push(`Already on '${target}'`);
      return ctx;
    }
    if (!checkoutTree(ctx, repo.branches[target])) return ctx;
    repo.prevBranch = prev;
    repo.head = { type: 'branch', name: target };
    logRef(repo, `checkout: moving from ${prev ?? 'HEAD'} to ${target}`);
    const t = trackingLine(repo, target);
    ctx.out.push(`Switched to branch '${target}'${t ? '\n' + t : ''}`);
    ctx.explain.push(`HEAD now points to "${target}" (${short(repo.branches[target])}). Your files were updated to match that commit.`);
    return ctx;
  }
  const remoteName = `origin/${target}`;
  if (!detach && repo.tracking[remoteName]) {
    if (!checkoutTree(ctx, repo.tracking[remoteName])) return ctx;
    repo.branches[target] = repo.tracking[remoteName];
    repo.upstream[target] = remoteName;
    repo.prevBranch = prev;
    repo.head = { type: 'branch', name: target };
    logRef(repo, `checkout: moving from ${prev ?? 'HEAD'} to ${target}`);
    ctx.out.push(`branch '${target}' set up to track '${remoteName}'.\nSwitched to a new branch '${target}'`);
    ctx.explain.push(`No local "${target}" existed, but ${remoteName} did, so Git created a local branch from it with tracking set up.`);
    return ctx;
  }
  const id = resolveRev(repo, target);
  if (!id) return fail(ctx, legacy ? `error: pathspec '${target}' did not match any file(s) known to git` : `fatal: invalid reference: ${target}`);
  if (!detach && !legacy) return fail(ctx, `fatal: a branch is expected, got '${target}'\nhint: If you want to detach HEAD at the commit, try again with the --detach option.`);
  if (!checkoutTree(ctx, id)) return ctx;
  repo.prevBranch = prev;
  repo.head = { type: 'detached', id };
  logRef(repo, `checkout: moving from ${prev ?? 'HEAD'} to ${target}`);
  ctx.out.push(`HEAD is now at ${id} ${subject(repo, id)}`);
  ctx.explain.push(`Detached HEAD: HEAD points directly at commit ${id}, not at a branch. Look around freely, but create a branch before committing.`);
  return ctx;
}

function doMerge(ctx: Ctx, theirsId: string, theirsName: string, opts: { noFF?: boolean; ffOnly?: boolean; message?: string }): Ctx {
  const repo = ctx.repo;
  const oursId = headCommitId(repo);
  if (!oursId) return fail(ctx, 'fatal: cannot merge into an empty branch in this simulation');
  if (dirtyPaths(repo).length) return fail(ctx, `error: Your local changes to the following files would be overwritten by merge:\n${dirtyPaths(repo).map((p) => `\t${p}`).join('\n')}\nPlease commit your changes or stash them before you merge.\nAborting`);
  if (isAncestor(repo, theirsId, oursId)) {
    ctx.out.push('Already up to date.');
    ctx.explain.push(`${theirsName} has nothing new: all its commits are already in your branch.`);
    return ctx;
  }
  const base = mergeBase(repo, oursId, theirsId);
  const ourTree = repo.commits[oursId].tree;
  if (base === oursId && !opts.noFF) {
    if (!checkoutTree(ctx, theirsId)) return ctx;
    if (repo.head.type === 'branch') repo.branches[repo.head.name] = theirsId;
    else repo.head = { type: 'detached', id: theirsId };
    logRef(repo, `merge ${theirsName}: Fast-forward`);
    ctx.out.push(`Updating ${oursId}..${theirsId}\nFast-forward\n${statSummary(ourTree, repo.commits[theirsId].tree)}`);
    ctx.explain.push(`Fast-forward: your branch had no commits of its own since ${theirsName} split off, so Git simply moved the label forward to ${theirsId}. No merge commit was created.`);
    return ctx;
  }
  if (opts.ffOnly) return fail(ctx, 'fatal: Not possible to fast-forward, aborting.');
  const message = opts.message ?? `Merge branch '${theirsName}'${currentBranch(repo) && currentBranch(repo) !== 'main' ? ` into ${currentBranch(repo)}` : ''}`;
  const result = threeWay(base ? repo.commits[base].tree : {}, ourTree, repo.commits[theirsId].tree, theirsName);
  repo.files = { ...Object.fromEntries(Object.entries(repo.files).filter(([p]) => !(p in ourTree))), ...result.tree };
  repo.index = { ...result.tree };
  if (result.conflicts.length) {
    for (const p of result.conflicts) repo.index[p] = ourTree[p] ?? '';
    repo.merge = { kind: 'merge', theirs: theirsId, theirsName, conflicts: result.conflicts, message };
    ctx.out.push(`${result.conflicts.map((p) => `Auto-merging ${p}\nCONFLICT (content): Merge conflict in ${p}`).join('\n')}\nAutomatic merge failed; fix conflicts and then commit the result.`);
    ctx.ok = false;
    ctx.explain.push(`Both branches changed the same lines in ${result.conflicts.join(', ')} since their common ancestor ${base ? short(base) : ''}. Git merged everything else, wrote conflict markers into the file(s) and paused. Edit the file (or use "resolve <file> ours|theirs|both"), then git add and git commit. Or git merge --abort.`);
    return ctx;
  }
  const id = writeCommit(repo, result.tree, [oursId, theirsId], message);
  logRef(repo, `merge ${theirsName}: Merge made by the 'ort' strategy.`);
  ctx.out.push(`Merge made by the 'ort' strategy.\n${statSummary(ourTree, result.tree)}`);
  ctx.explain.push(`Three-way merge: Git compared both branches with their common ancestor ${base ? short(base) : ''} and combined the changes into merge commit ${id}, which has two parents.`);
  return ctx;
}

function merge(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  if (flag(args, '--abort')) {
    if (!repo.merge) return fail(ctx, 'fatal: There is no merge to abort (MERGE_HEAD missing).');
    const tree = headTree(repo);
    repo.files = { ...Object.fromEntries(Object.entries(repo.files).filter(([p]) => !(p in repo.index) && !(p in tree))), ...tree };
    repo.index = { ...tree };
    delete repo.merge;
    ctx.explain.push('Cancelled the merge: your files and staging area are back exactly as they were before git merge.');
    return ctx;
  }
  if (flag(args, '--continue')) return commit(ctx, []);
  const noFF = flag(args, '--no-ff');
  const ffOnly = flag(args, '--ff-only');
  flag(args, '--no-edit');
  const message = option(args, '-m');
  if (repo.merge) return fail(ctx, 'error: Merging is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use \'git add/rm <file>\'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.');
  const name = args[0];
  if (!name) return fail(ctx, 'fatal: No remote for the current branch.');
  const id = resolveRev(repo, name);
  if (!id) return fail(ctx, `merge: ${name} - not something we can merge`);
  return doMerge(ctx, id, name, { noFF, ffOnly, message });
}

function restore(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const staged = flag(args, '--staged', '-S');
  const worktree = flag(args, '--worktree', '-W');
  const source = option(args, '--source', '-s');
  const all = flag(args, '.');
  const paths = all ? [...new Set([...Object.keys(repo.index), ...Object.keys(staged ? headTree(repo) : {})])] : args;
  if (!paths.length) return fail(ctx, 'fatal: you must specify path(s) to restore');
  const sourceTree = source ? (() => {
    const id = resolveRev(repo, source);
    return id ? repo.commits[id].tree : undefined;
  })() : undefined;
  if (source && !sourceTree) return fail(ctx, `fatal: could not resolve ${source}`);
  for (const p of paths) {
    const known = p in repo.index || p in headTree(repo) || (sourceTree && p in sourceTree);
    if (!known) return fail(ctx, `error: pathspec '${p}' did not match any file(s) known to git`);
    if (staged) {
      const from = sourceTree ?? headTree(repo);
      if (p in from) repo.index[p] = from[p];
      else delete repo.index[p];
    }
    if (!staged || worktree) {
      const from = sourceTree ?? repo.index;
      if (p in from) repo.files[p] = from[p];
      else delete repo.files[p];
    }
  }
  ctx.explain.push(staged && !worktree
    ? `Unstaged ${paths.join(', ')}: the staging area now matches ${source ?? 'HEAD'} for these files. Your edits are still in the working directory.`
    : `Overwrote ${paths.join(', ')} in your working directory with the ${source ? `version from ${source}` : 'staged version'}. Uncommitted edits to them are gone.`);
  return ctx;
}

function rm(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const cached = flag(args, '--cached');
  const recursive = flag(args, '-r');
  flag(args, '-f', '--force');
  for (const a of args) {
    const matches = Object.keys(repo.index).filter((p) => p === a || (recursive && p.startsWith(a.replace(/\/?$/, '/'))));
    if (!matches.length) {
      if (!recursive && Object.keys(repo.index).some((p) => p.startsWith(a.replace(/\/?$/, '/')))) return fail(ctx, `fatal: not removing '${a}' recursively without -r`);
      return fail(ctx, `fatal: pathspec '${a}' did not match any files`);
    }
    for (const p of matches) {
      delete repo.index[p];
      if (!cached) delete repo.files[p];
      ctx.out.push(`rm '${p}'`);
    }
  }
  ctx.explain.push(cached ? 'Removed the file(s) from the staging area only: Git will stop tracking them, but they stay on disk.' : 'Deleted the file(s) from disk and staged the deletion for the next commit.');
  return ctx;
}

function mv(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const [a, b] = args;
  if (!a || !b) return fail(ctx, 'usage: git mv <source> <destination>');
  if (!(a in repo.index)) return fail(ctx, `fatal: not under version control, source=${a}, destination=${b}`);
  repo.files[b] = repo.files[a];
  repo.index[b] = repo.index[a];
  delete repo.files[a];
  delete repo.index[a];
  ctx.explain.push(`Renamed ${a} to ${b} on disk and in the staging area. git status will show "renamed".`);
  return ctx;
}

function reset(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const hard = flag(args, '--hard');
  const soft = flag(args, '--soft');
  flag(args, '--mixed');
  if (flag(args, '--merge') && repo.merge) return merge(ctx, ['--abort']);
  const target = args[0] && !(args[0] in repo.index) ? args[0] : 'HEAD';
  const paths = args[0] && args[0] in repo.index ? args : [];
  if (paths.length) return restore(ctx, ['--staged', ...paths]);
  const id = resolveRev(repo, target);
  if (!id) return fail(ctx, `fatal: ambiguous argument '${target}': unknown revision or path not in the working tree.`);
  const before = headCommitId(repo);
  const tree = repo.commits[id].tree;
  if (repo.head.type === 'branch') repo.branches[repo.head.name] = id;
  else repo.head = { type: 'detached', id };
  delete repo.merge;
  logRef(repo, `reset: moving to ${target}`);
  if (soft) {
    ctx.explain.push(`--soft: moved the branch from ${before ? short(before) : '-'} to ${short(id)}. The staging area and your files were not touched, so the undone commit's changes are now staged.`);
    return ctx;
  }
  const oldIndex = repo.index;
  repo.index = { ...tree };
  if (hard) {
    const keepUntracked = Object.fromEntries(Object.entries(repo.files).filter(([p]) => !(p in oldIndex) && !(p in tree)));
    repo.files = { ...keepUntracked, ...tree };
    ctx.out.push(`HEAD is now at ${id} ${subject(repo, id)}`);
    ctx.explain.push(`--hard: moved the branch to ${short(id)} and overwrote both the staging area and your tracked files to match it. Uncommitted changes to tracked files were discarded.`);
    return ctx;
  }
  const unstaged = Object.keys({ ...repo.index, ...oldIndex }).filter((p) => repo.files[p] !== repo.index[p] && (p in repo.index || p in repo.files));
  if (unstaged.length) ctx.out.push(`Unstaged changes after reset:\n${unstaged.map((p) => `${p in repo.files ? 'M' : 'D'}\t${p}`).join('\n')}`);
  ctx.explain.push(`--mixed (default): moved the branch to ${short(id)} and reset the staging area. Your file edits are kept as unstaged changes.`);
  return ctx;
}

function applyCommit(ctx: Ctx, id: string, reverse: boolean): Ctx {
  const repo = ctx.repo;
  const c = repo.commits[id];
  if (c.parents.length > 1 && reverse) return fail(ctx, `error: commit ${id} is a merge but no -m option was given.\nfatal: revert failed`);
  const parentTree = c.parents[0] ? repo.commits[c.parents[0]].tree : {};
  const head = headTree(repo);
  const [base, theirs] = reverse ? [c.tree, parentTree] : [parentTree, c.tree];
  const result = threeWay(base, head, theirs, short(id));
  if (result.conflicts.length) {
    return fail(ctx, `error: could not ${reverse ? 'revert' : 'apply'} ${id}... ${subject(repo, id)}\nThis simulation stops here when a ${reverse ? 'revert' : 'cherry-pick'} conflicts in ${result.conflicts.join(', ')}. Nothing was changed.`);
  }
  repo.files = { ...repo.files, ...result.tree };
  for (const p of Object.keys(head)) if (!(p in result.tree)) delete repo.files[p];
  repo.index = { ...result.tree };
  const message = reverse ? `Revert "${subject(repo, id)}"\n\nThis reverts commit ${id}.` : c.message;
  const newCommit = writeCommit(repo, result.tree, [headCommitId(repo)!], message);
  logRef(repo, `${reverse ? 'revert' : 'cherry-pick'}: ${subject(repo, newCommit)}`);
  ctx.out.push(`[${currentBranch(repo) ?? 'detached HEAD'} ${newCommit}] ${message.split('\n')[0]}\n${statSummary(head, result.tree)}`);
  ctx.explain.push(reverse
    ? `Created a new commit ${newCommit} that applies the opposite of ${id}. History was not rewritten, so this is safe on shared branches.`
    : `Copied the changes of ${id} onto your branch as a new commit ${newCommit} (same changes, different hash).`);
  return ctx;
}

function revert(ctx: Ctx, args: string[]): Ctx {
  flag(args, '--no-edit');
  const id = resolveRev(ctx.repo, args[0] ?? '');
  if (!id) return fail(ctx, `fatal: bad revision '${args[0] ?? ''}'`);
  return applyCommit(ctx, id, true);
}

function cherryPick(ctx: Ctx, args: string[]): Ctx {
  flag(args, '-x');
  const id = resolveRev(ctx.repo, args[0] ?? '');
  if (!id) return fail(ctx, `fatal: bad revision '${args[0] ?? ''}'`);
  return applyCommit(ctx, id, false);
}

function stash(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const sub = ['push', 'list', 'pop', 'apply', 'drop', 'clear', 'show'].includes(args[0]) ? args.shift()! : 'push';
  const ref = args.find((a) => /^stash@\{\d+\}$/.test(a));
  const n = ref ? Number(ref.match(/\d+/)![0]) : 0;
  if (sub === 'list') {
    ctx.out.push(repo.stash.map((s, i) => `stash@{${i}}: On ${s.branch}: ${s.message}`).join('\n'));
    ctx.explain.push(`${repo.stash.length} stash entr${repo.stash.length === 1 ? 'y' : 'ies'}, newest first.`);
    return ctx;
  }
  if (sub === 'clear') {
    repo.stash = [];
    ctx.explain.push('Deleted every stash entry.');
    return ctx;
  }
  if (sub === 'push') {
    const message = option(args, '-m', '--message');
    const withUntracked = flag(args, '-u', '--include-untracked');
    const dirty = dirtyPaths(repo);
    const untr = withUntracked ? untracked(repo) : [];
    if (!dirty.length && !untr.length) return fail(ctx, 'No local changes to save');
    const head = headTree(repo);
    const headId = headCommitId(repo)!;
    const branchName = currentBranch(repo) ?? '(no branch)';
    const files: Tree = {};
    for (const p of [...dirty, ...untr]) if (p in repo.files) files[p] = repo.files[p];
    const removed = dirty.filter((p) => !(p in repo.files));
    repo.stash.unshift({
      message: message ?? `WIP on ${branchName}: ${headId} ${subject(repo, headId)}`,
      branch: branchName, base: headId,
      files: { ...files, ...Object.fromEntries(removed.map((p) => [p, '\u0000deleted'])) },
      index: clone(repo.index),
    });
    for (const p of dirty) {
      if (p in head) repo.files[p] = head[p];
      else delete repo.files[p];
    }
    for (const p of untr) delete repo.files[p];
    repo.index = { ...head };
    ctx.out.push(`Saved working directory and index state ${message ? `On ${branchName}: ${message}` : repo.stash[0].message}`);
    ctx.explain.push(`Put your uncommitted changes (${[...dirty, ...untr].join(', ')}) on the stash shelf and reset the files to the last commit. Your working tree is clean now.`);
    return ctx;
  }
  const entry = repo.stash[n];
  if (!entry) return fail(ctx, sub === 'drop' ? `error: refs/stash@{${n}} is not a valid reference` : 'error: No stash entries found.');
  if (sub === 'show') {
    ctx.out.push(Object.keys(entry.files).map((p) => ` ${p}`).join('\n'));
    return ctx;
  }
  if (sub === 'drop') {
    repo.stash.splice(n, 1);
    ctx.out.push(`Dropped refs/stash@{${n}} (${entry.base}${'0'.repeat(33)})`);
    ctx.explain.push('Deleted that stash entry.');
    return ctx;
  }
  const clashes = Object.keys(entry.files).filter((p) => dirtyPaths(repo).includes(p));
  if (clashes.length) return fail(ctx, `error: Your local changes to the following files would be overwritten by merge:\n${clashes.map((p) => `\t${p}`).join('\n')}\nPlease commit your changes or stash them before you merge.\nAborting`);
  for (const [p, c] of Object.entries(entry.files)) {
    if (c === '\u0000deleted') delete repo.files[p];
    else repo.files[p] = c;
  }
  if (sub === 'pop') repo.stash.splice(n, 1);
  const st = status({ repo, out: [], explain: [], ok: true }, []);
  ctx.out.push(st.out.join('\n') + (sub === 'pop' ? `\nDropped refs/stash@{${n}} (${entry.base}${'0'.repeat(33)})` : ''));
  ctx.explain.push(sub === 'pop'
    ? 'Re-applied the stashed changes to your working directory and removed them from the stash list.'
    : 'Re-applied the stashed changes; the entry stays in the stash list until you drop it.');
  return ctx;
}

function tag(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  if (flag(args, '-d', '--delete')) {
    const name = args[0];
    if (!repo.tags[name]) return fail(ctx, `error: tag '${name}' not found.`);
    const id = repo.tags[name].id;
    delete repo.tags[name];
    ctx.out.push(`Deleted tag '${name}' (was ${id})`);
    return ctx;
  }
  const annotated = flag(args, '-a');
  const message = option(args, '-m');
  flag(args, '-l', '--list');
  if (!args.length || args[0].includes('*')) {
    const pattern = args[0] ? new RegExp('^' + args[0].replace(/[.]/g, '\\.').replace(/\*/g, '.*') + '$') : undefined;
    ctx.out.push(Object.keys(repo.tags).filter((t) => !pattern || pattern.test(t)).sort().join('\n'));
    ctx.explain.push('Listed tags.');
    return ctx;
  }
  const [name, rev] = args;
  if (repo.tags[name]) return fail(ctx, `fatal: tag '${name}' already exists`);
  const id = rev ? resolveRev(repo, rev) : headCommitId(repo);
  if (!id) return fail(ctx, `fatal: Failed to resolve '${rev ?? 'HEAD'}' as a valid ref.`);
  repo.tags[name] = { id, message: annotated || message ? message ?? name : undefined };
  ctx.explain.push(`Created ${annotated || message ? 'an annotated' : 'a lightweight'} tag "${name}" on ${short(id)}. Unlike a branch, it will never move. Push it with git push origin ${name}.`);
  return ctx;
}

function remote(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const sub = args[0];
  if (!sub || sub === '-v' || sub === '--verbose') {
    ctx.out.push(Object.entries(repo.remotes).map(([n, u]) => (sub ? `${n}\t${u} (fetch)\n${n}\t${u} (push)` : n)).join('\n'));
    ctx.explain.push(Object.keys(repo.remotes).length ? 'Listed the remotes this repository knows about.' : 'No remotes configured yet.');
    return ctx;
  }
  if (sub === 'add') {
    const [, name, url] = args;
    if (!name || !url) return fail(ctx, 'usage: git remote add <name> <url>');
    if (repo.remotes[name]) return fail(ctx, `error: remote ${name} already exists.`);
    repo.remotes[name] = url;
    if (!repo.server) repo.server = { url, branches: {}, tags: {} };
    ctx.explain.push(`Saved the URL ${url} under the short name "${name}". Nothing was uploaded yet: use git push -u ${name} <branch>.`);
    return ctx;
  }
  if (sub === 'remove' || sub === 'rm') {
    const name = args[1];
    if (!repo.remotes[name]) return fail(ctx, `error: No such remote: '${name}'`);
    delete repo.remotes[name];
    for (const t of Object.keys(repo.tracking)) if (t.startsWith(`${name}/`)) delete repo.tracking[t];
    ctx.explain.push(`Forgot the remote "${name}" and its remote-tracking branches. Nothing on the server was deleted.`);
    return ctx;
  }
  if (sub === 'set-url') {
    const [, name, url] = args;
    if (!repo.remotes[name]) return fail(ctx, `error: No such remote '${name}'`);
    repo.remotes[name] = url;
    ctx.explain.push(`Changed the URL of "${name}".`);
    return ctx;
  }
  return fail(ctx, `error: Unknown subcommand: ${sub}`);
}

function requireRemote(ctx: Ctx, name = 'origin'): boolean {
  if (!ctx.repo.remotes[name] || !ctx.repo.server) {
    fail(ctx, `fatal: '${name}' does not appear to be a git repository\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.`);
    return false;
  }
  return true;
}

function push(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const setUp = flag(args, '-u', '--set-upstream');
  const force = flag(args, '--force', '-f');
  const lease = flag(args, '--force-with-lease');
  const del = flag(args, '--delete', '-d');
  const tags = flag(args, '--tags');
  const remoteName = args[0] && repo.remotes[args[0]] ? args.shift()! : 'origin';
  if (!requireRemote(ctx, remoteName)) return ctx;
  const server = repo.server!;
  const url = repo.remotes[remoteName];
  const lines = [`To ${url}`];
  if (tags) {
    for (const [t, v] of Object.entries(repo.tags)) if (!server.tags[t]) {
      server.tags[t] = v.id;
      lines.push(` * [new tag]         ${t} -> ${t}`);
    }
    ctx.out.push(lines.length > 1 ? lines.join('\n') : 'Everything up-to-date');
    return ctx;
  }
  const cur = currentBranch(repo);
  let name = args[0];
  if (name === 'HEAD') name = cur ?? '';
  if (!name) {
    if (!cur) return fail(ctx, 'fatal: You are not currently on a branch.');
    if (!repo.upstream[cur]) return fail(ctx, `fatal: The current branch ${cur} has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream ${remoteName} ${cur}\n`);
    name = repo.upstream[cur].split('/').slice(1).join('/');
  }
  if (del) {
    if (!server.branches[name]) return fail(ctx, `error: unable to delete '${name}': remote ref does not exist`);
    delete server.branches[name];
    delete repo.tracking[`${remoteName}/${name}`];
    ctx.out.push(`${lines[0]}\n - [deleted]         ${name}`);
    ctx.explain.push(`Deleted the branch "${name}" on the remote. Your local branch (if any) is untouched.`);
    return ctx;
  }
  if (repo.tags[name] && !repo.branches[name]) {
    server.tags[name] = repo.tags[name].id;
    ctx.out.push(`${lines[0]}\n * [new tag]         ${name} -> ${name}`);
    ctx.explain.push(`Uploaded the tag "${name}".`);
    return ctx;
  }
  const local = repo.branches[name];
  if (!local) return fail(ctx, `error: src refspec ${name} does not match any\nerror: failed to push some refs to '${url}'`);
  const remoteId = server.branches[name];
  const known = repo.tracking[`${remoteName}/${name}`];
  if (remoteId && !isAncestor(repo, remoteId, local)) {
    const allowed = force || (lease && known === remoteId);
    if (!allowed) {
      const unknown = !ancestors(repo, known).has(remoteId) || known !== remoteId;
      return fail(ctx, `${lines[0]}\n ! [rejected]        ${name} -> ${name} (${lease ? 'stale info' : unknown ? 'fetch first' : 'non-fast-forward'})\nerror: failed to push some refs to '${url}'\nhint: Updates were rejected because the remote contains work that you do not\nhint: have locally. This is usually caused by another repository pushing to\nhint: the same ref. If you want to integrate the remote changes, use\nhint: 'git pull' before pushing again.`);
    }
  }
  if (remoteId === local) {
    ctx.out.push('Everything up-to-date');
    ctx.explain.push('The remote branch already points at your commit.');
    return ctx;
  }
  server.branches[name] = local;
  repo.tracking[`${remoteName}/${name}`] = local;
  if (!remoteId) lines.push(` * [new branch]      ${name} -> ${name}`);
  else if (isAncestor(repo, remoteId, local)) lines.push(`   ${remoteId}..${local}  ${name} -> ${name}`);
  else lines.push(` + ${remoteId}...${local} ${name} -> ${name} (forced update)`);
  if (setUp) {
    repo.upstream[name] = `${remoteName}/${name}`;
    lines.push(`branch '${name}' set up to track '${remoteName}/${name}'.`);
  }
  ctx.out.push(lines.join('\n'));
  ctx.explain.push(`Uploaded your commits so ${remoteName}/${name} on the server now points at ${short(local)}.${setUp ? ` Your local "${name}" now tracks it, so plain git push / git pull work from now on.` : ''}${force || lease ? ' This was a forced update: the remote history was replaced.' : ''}`);
  return ctx;
}

function fetch(ctx: Ctx, args: string[], quietExplain = false): Ctx {
  const repo = ctx.repo;
  flag(args, '--prune', '-p', '--all');
  const remoteName = args[0] && repo.remotes[args[0]] ? args[0] : 'origin';
  if (!requireRemote(ctx, remoteName)) return ctx;
  const server = repo.server!;
  const lines: string[] = [];
  for (const [b, id] of Object.entries(server.branches)) {
    const key = `${remoteName}/${b}`;
    const old = repo.tracking[key];
    if (old === id) continue;
    if (!old) lines.push(` * [new branch]      ${b.padEnd(10)} -> ${key}`);
    else if (isAncestor(repo, old, id)) lines.push(`   ${old}..${id}  ${b.padEnd(10)} -> ${key}`);
    else lines.push(` + ${old}...${id} ${b.padEnd(10)} -> ${key}  (forced update)`);
    repo.tracking[key] = id;
  }
  for (const key of Object.keys(repo.tracking)) {
    const b = key.slice(remoteName.length + 1);
    if (key.startsWith(`${remoteName}/`) && !(b in server.branches)) {
      delete repo.tracking[key];
      lines.push(` - [deleted]         (none)     -> ${key}`);
    }
  }
  for (const [t, id] of Object.entries(server.tags)) {
    if (!repo.tags[t]) {
      repo.tags[t] = { id };
      lines.push(` * [new tag]         ${t.padEnd(10)} -> ${t}`);
    }
  }
  if (lines.length) ctx.out.push(`From ${repo.remotes[remoteName]}\n${lines.join('\n')}`);
  if (!quietExplain) ctx.explain.push(lines.length
    ? `Downloaded new commits and updated the remote-tracking branches (${remoteName}/…). Your own branches and files were NOT changed.`
    : 'Nothing new on the remote.');
  return ctx;
}

function pull(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  const rebaseMode = flag(args, '--rebase', '-r');
  const ffOnly = flag(args, '--ff-only');
  const cur = currentBranch(repo);
  if (!cur) return fail(ctx, 'You are not currently on a branch.');
  const remoteName = args[0] && repo.remotes[args[0]] ? args[0] : 'origin';
  const up = args[1] ? `${remoteName}/${args[1]}` : repo.upstream[cur];
  if (!up) return fail(ctx, `There is no tracking information for the current branch.\nPlease specify which branch you want to merge with.\n\n    git branch --set-upstream-to=origin/<branch> ${cur}\n`);
  fetch(ctx, [remoteName], true);
  if (!ctx.ok) return ctx;
  const theirs = repo.tracking[up];
  if (!theirs) return fail(ctx, `fatal: couldn't find remote ref ${up.split('/').slice(1).join('/')}`);
  ctx.explain.push(`git pull = git fetch + integrate. Fetched ${up}, then ${rebaseMode ? 'rebased your commits on top of it' : 'merged it into your branch'}.`);
  if (rebaseMode) return rebase(ctx, [up]);
  return doMerge(ctx, theirs, up, { ffOnly, message: `Merge branch '${up.split('/').slice(1).join('/')}' of ${repo.remotes[remoteName]}` });
}

function rebase(ctx: Ctx, args: string[]): Ctx {
  const repo = ctx.repo;
  if (flag(args, '--abort', '--continue', '--skip')) return fail(ctx, 'fatal: No rebase in progress?');
  const cur = currentBranch(repo);
  if (!cur) return fail(ctx, 'fatal: rebasing a detached HEAD is not supported in this simulation');
  const ontoName = args[0];
  const onto = ontoName ? resolveRev(repo, ontoName) : undefined;
  if (!onto) return fail(ctx, `fatal: invalid upstream '${ontoName ?? ''}'`);
  if (dirtyPaths(repo).length) return fail(ctx, 'error: cannot rebase: You have unstaged changes.\nerror: Please commit or stash them.');
  const head = headCommitId(repo)!;
  if (isAncestor(repo, head, onto) && head !== onto) {
    checkoutTree(ctx, onto);
    repo.branches[cur] = onto;
    ctx.out.push(`Successfully rebased and updated refs/heads/${cur}.`);
    ctx.explain.push(`Your branch had no commits of its own, so Git just moved it to ${short(onto)} (a fast-forward).`);
    return ctx;
  }
  const toReplay = range(repo, onto, head).reverse().filter((c) => c.parents.length === 1);
  if (!toReplay.length) {
    ctx.out.push(`Current branch ${cur} is up to date.`);
    return ctx;
  }
  let tip = onto;
  const mapping: string[] = [];
  for (const c of toReplay) {
    const parentTree = repo.commits[c.parents[0]].tree;
    const result = threeWay(parentTree, repo.commits[tip].tree, c.tree, short(c.id));
    if (result.conflicts.length) {
      return fail(ctx, `CONFLICT (content): Merge conflict in ${result.conflicts.join(', ')}\nerror: could not apply ${c.id}... ${subject(repo, c.id)}\nThis simulation does not support resolving conflicts during a rebase, so the rebase was aborted and nothing changed. Try git merge instead.`);
    }
    repo.clock++;
    const id = newId(repo, c.message);
    repo.commits[id] = { ...c, id, parents: [tip], tree: result.tree, time: repo.clock };
    mapping.push(`${c.id} → ${id}`);
    tip = id;
  }
  repo.head = { type: 'detached', id: head };
  checkoutTree(ctx, tip);
  repo.branches[cur] = tip;
  repo.head = { type: 'branch', name: cur };
  logRef(repo, `rebase (finish): refs/heads/${cur} onto ${onto}`);
  ctx.out.push(`Successfully rebased and updated refs/heads/${cur}.`);
  ctx.explain.push(`Replayed ${toReplay.length} commit(s) on top of ${ontoName} as NEW commits (${mapping.join(', ')}). The old commits are abandoned, which is why rebasing shared commits causes trouble.`);
  return ctx;
}

function cloneRepo(ctx: Ctx, args: string[]): Ctx {
  const url = args.find((a) => !a.startsWith('-')) ?? '';
  if (!/^(https:\/\/|git@)/.test(url)) return fail(ctx, `fatal: repository '${url}' does not exist`);
  const name = args[args.indexOf(url) + 1] ?? url.replace(/\.git$/, '').split(/[/:]/).pop()!;
  const repo = emptyRepo();
  repo.initialized = true;
  repo.cwdName = name;
  repo.remotes.origin = url;
  repo.server = { url, branches: {}, tags: {} };
  // A small demo history that the "server" already has.
  const seed: [string, Tree][] = [
    ['Initial commit', { 'README.md': '# Shop\n' }],
    ['Add home page', { 'README.md': '# Shop\n', 'index.html': '<h1>Shop</h1>\n' }],
    ['Add checkout page', { 'README.md': '# Shop\n', 'index.html': '<h1>Shop</h1>\n', 'checkout.txt': 'Checkout: card payments\n' }],
  ];
  let parent: string | undefined;
  for (const [msg, tree] of seed) {
    repo.clock++;
    const id = newId(repo, msg);
    repo.commits[id] = { id, parents: parent ? [parent] : [], message: msg, tree, author: TEAMMATE, time: repo.clock };
    parent = id;
  }
  repo.server.branches.main = parent!;
  repo.branches.main = parent!;
  repo.tracking['origin/main'] = parent!;
  repo.upstream.main = 'origin/main';
  repo.head = { type: 'branch', name: 'main' };
  repo.files = { ...repo.commits[parent!].tree };
  repo.index = { ...repo.files };
  repo.reflog.push({ id: parent!, action: `clone: from ${url}` });
  ctx.repo = repo;
  ctx.out.push(`Cloning into '${name}'...\nremote: Enumerating objects: 9, done.\nremote: Counting objects: 100% (9/9), done.\nremote: Total 9 (delta 0), reused 0 (delta 0), pack-reused 9\nReceiving objects: 100% (9/9), done.`);
  ctx.explain.push(`Downloaded the whole repository (3 commits) from ${url}, named the remote "origin", created origin/main and a local main that tracks it, and checked out main. (The simulator then puts you inside the "${name}" folder.)`);
  return ctx;
}

function reflog(ctx: Ctx): Ctx {
  const r = ctx.repo.reflog;
  ctx.out.push(r.map((e, i) => `${e.id}${i === r.length - 1 ? decorations(ctx.repo, e.id) : ''} HEAD@{${r.length - 1 - i}}: ${e.action}`).reverse().join('\n'));
  ctx.explain.push('The reflog lists every position HEAD has had on this machine, newest first. Use it to find "lost" commits after a reset or branch deletion.');
  return ctx;
}

const HELP = `These are the Git commands this simulation supports:

  setup     init, clone <url>, config, remote [-v|add|remove|set-url]
  changes   status [-s|-sb], add, commit [-m|-am|--amend], rm [--cached], mv, restore [--staged]
  history   log [--oneline --graph --all -N A..B], diff [--staged|A B|--stat|--name-only], show, reflog
  branches  branch [-d|-D|-m|-r|-a|-vv], switch [-c|--detach|-], checkout [-b], merge [--abort|--no-ff|--ff-only]
  remote    push [-u|--force-with-lease|--delete|--tags], fetch [--prune], pull [--rebase|--ff-only]
  undo      reset [--soft|--mixed|--hard], revert, stash [push|pop|apply|list|drop], cherry-pick
  other     tag [-a -m|-d], rebase <base>, rev-parse --short HEAD, merge-base --is-ancestor A B

Shell helpers: ls, cat <file>, echo "text" > file, echo "text" >> file, touch, rm <file>,
               edit <file>, resolve <file> ours|theirs|both, clear, help`;

export const SUPPORTED = ['init', 'clone', 'config', 'status', 'add', 'commit', 'log', 'diff', 'show', 'branch', 'switch', 'checkout', 'merge', 'restore', 'rm', 'mv', 'reset', 'revert', 'stash', 'tag', 'remote', 'push', 'fetch', 'pull', 'rebase', 'cherry-pick', 'reflog', 'help', 'rev-parse', 'merge-base', 'version', '--version'];

export function git(repoIn: Repo, args: string[]): RunResult {
  const ctx: Ctx = { repo: clone(repoIn), out: [], explain: [], ok: true };
  const sub = args.shift();
  const needsRepo = !['init', 'clone', 'help', '--version', 'version', 'config', undefined].includes(sub);
  if (needsRepo && !requireRepo(ctx)) return finish(ctx);
  switch (sub) {
    case undefined:
    case 'help':
      ctx.out.push(HELP);
      break;
    case '--version':
    case 'version':
      ctx.out.push('git version 2.47.1 (GitMaster Academy simulator)');
      break;
    case 'init': init(ctx); break;
    case 'clone': cloneRepo(ctx, args); break;
    case 'config':
      if (args.includes('--list') || args.includes('-l')) ctx.out.push('user.name=You\nuser.email=you@example.com\ninit.defaultbranch=main');
      else if (args.length === 2 || args.length === 1 || (args[0] === '--global' && args.length <= 2)) ctx.out.push(args.at(-1) === 'user.name' ? 'You' : args.at(-1) === 'user.email' ? 'you@example.com' : '');
      ctx.explain.push('In this simulation your identity is fixed as "You <you@example.com>". In a real terminal git config writes to ~/.gitconfig or .git/config.');
      break;
    case 'status': status(ctx, args); break;
    case 'add': add(ctx, args); break;
    case 'commit': commit(ctx, args); break;
    case 'log': log(ctx, args); break;
    case 'diff': diff(ctx, args); break;
    case 'show': show(ctx, args); break;
    case 'branch': branch(ctx, args); break;
    case 'switch': switchTo(ctx, args); break;
    case 'checkout':
      if (args[0] === '--') restore(ctx, args.slice(1));
      else switchTo(ctx, args, true);
      break;
    case 'merge': merge(ctx, args); break;
    case 'restore': restore(ctx, args); break;
    case 'rm': rm(ctx, args); break;
    case 'mv': mv(ctx, args); break;
    case 'reset': reset(ctx, args); break;
    case 'revert': revert(ctx, args); break;
    case 'cherry-pick': cherryPick(ctx, args); break;
    case 'stash': stash(ctx, args); break;
    case 'tag': tag(ctx, args); break;
    case 'remote': remote(ctx, args); break;
    case 'push': push(ctx, args); break;
    case 'fetch': fetch(ctx, args); break;
    case 'pull': pull(ctx, args); break;
    case 'rebase': rebase(ctx, args); break;
    case 'reflog': reflog(ctx); break;
    case 'rev-parse': {
      const rev = args.filter((a) => !a.startsWith('-'))[0] ?? 'HEAD';
      const id = resolveRev(ctx.repo, rev);
      if (!id) fail(ctx, `fatal: ambiguous argument '${rev}'`);
      else ctx.out.push(args.includes('--short') ? id : id + '0'.repeat(33));
      break;
    }
    case 'merge-base': {
      const isAnc = flag(args, '--is-ancestor');
      const a = resolveRev(ctx.repo, args[0] ?? '');
      const b = resolveRev(ctx.repo, args[1] ?? '');
      if (!a || !b) fail(ctx, 'fatal: Not a valid object name');
      else if (isAnc) {
        ctx.ok = isAncestor(ctx.repo, a, b);
        ctx.explain.push(ctx.ok ? `${args[0]} IS contained in ${args[1]} (exit code 0).` : `${args[0]} is NOT contained in ${args[1]} (exit code 1).`);
      } else ctx.out.push(mergeBase(ctx.repo, a, b) ?? '');
      break;
    }
    default:
      fail(ctx, `git: '${sub}' is not a git command in this simulation. Type "git help" to see the supported commands.`);
  }
  return finish(ctx);
}

function finish(ctx: Ctx): RunResult {
  return { repo: ctx.repo, output: ctx.out.filter((s) => s !== '').join('\n'), ok: ctx.ok, explain: ctx.explain };
}

/** Simulate a teammate pushing a commit to the server. Used by scenarios and the "Teammate pushes" button. */
export function teammatePush(repoIn: Repo, branchName: string, path: string, content: string, message: string): Repo {
  const repo = clone(repoIn);
  if (!repo.server) return repo;
  const parent = repo.server.branches[branchName] ?? repo.server.branches.main;
  const base = parent ? repo.commits[parent].tree : {};
  repo.clock++;
  const id = newId(repo, message + TEAMMATE);
  repo.commits[id] = { id, parents: parent ? [parent] : [], message, tree: { ...base, [path]: content }, author: TEAMMATE, time: repo.clock };
  repo.server.branches[branchName] = id;
  return repo;
}
