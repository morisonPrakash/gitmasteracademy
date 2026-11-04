import type { Tree } from './types';
import { lines } from './repo';

export interface MergeResult {
  tree: Tree;
  conflicts: string[];
}

/** Wrap the differing middle of two versions in conflict markers, keeping common lines. */
export function conflictText(ours: string | undefined, theirs: string | undefined, theirsName: string): string {
  const a = lines(ours);
  const b = lines(theirs);
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  return [
    ...a.slice(0, pre),
    '<<<<<<< HEAD',
    ...a.slice(pre, a.length - suf),
    '=======',
    ...b.slice(pre, b.length - suf),
    `>>>>>>> ${theirsName}`,
    ...a.slice(a.length - suf),
  ].join('\n') + '\n';
}

/**
 * File-level three-way merge. A file changed on only one side takes that side;
 * a file changed differently on both sides becomes a conflict with markers.
 */
export function threeWay(base: Tree, ours: Tree, theirs: Tree, theirsName: string): MergeResult {
  const tree: Tree = {};
  const conflicts: string[] = [];
  const paths = new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)]);
  for (const p of [...paths].sort()) {
    const b = base[p];
    const o = ours[p];
    const t = theirs[p];
    let result: string | undefined;
    if (o === t) result = o;
    else if (o === b) result = t;
    else if (t === b) result = o;
    else {
      conflicts.push(p);
      result = conflictText(o, t, theirsName);
    }
    if (result !== undefined) tree[p] = result;
  }
  return { tree, conflicts };
}
