import type { GNode, GRef, GraphSpec, Tone } from '@/components/diagrams/GraphDiagram';
import { ancestors, headCommitId } from '../git/repo';
import type { Repo } from '../git/types';

const LANE_TONES: Tone[] = ['main', 'feature', 'release', 'fix', 'new'];

/**
 * Turn a simulated repository into a commit-graph spec: one column per commit in
 * time order, one lane per branch (main first), following each branch's first parents.
 */
export function layoutRepo(repo: Repo, opts: { includeRemote?: boolean; maxCommits?: number } = {}): GraphSpec | undefined {
  const heads: string[] = [
    ...Object.values(repo.branches),
    ...Object.values(repo.tracking),
    ...Object.values(repo.tags).map((t) => t.id),
    ...(opts.includeRemote && repo.server ? Object.values(repo.server.branches) : []),
  ];
  const h = headCommitId(repo);
  if (h) heads.push(h);
  if (repo.merge) heads.push(repo.merge.theirs);
  const reachable = new Set<string>();
  for (const id of heads) for (const a of ancestors(repo, id)) reachable.add(a);
  if (!reachable.size) return undefined;

  let commits = [...reachable].map((id) => repo.commits[id]).sort((a, b) => a.time - b.time);
  if (opts.maxCommits && commits.length > opts.maxCommits) commits = commits.slice(-opts.maxCommits);
  const visible = new Set(commits.map((c) => c.id));

  // Lanes: main, then other local branches, then remote-only branches, tags and detached HEAD.
  const branchOrder = Object.keys(repo.branches).sort((a, b) => (a === 'main' ? -1 : b === 'main' ? 1 : a.localeCompare(b)));
  const lanes: { name: string; tip: string }[] = [
    ...branchOrder.map((b) => ({ name: b, tip: repo.branches[b] })),
    ...Object.entries(repo.tracking).map(([n, tip]) => ({ name: n, tip })),
    ...(opts.includeRemote && repo.server ? Object.entries(repo.server.branches).map(([n, tip]) => ({ name: `GitHub: ${n}`, tip })) : []),
    ...Object.entries(repo.tags).map(([n, t]) => ({ name: n, tip: t.id })),
    ...(h ? [{ name: 'HEAD', tip: h }] : []),
    ...(repo.merge ? [{ name: repo.merge.theirsName, tip: repo.merge.theirs }] : []),
  ];
  const laneOf = new Map<string, number>();
  const laneNames: string[] = [];
  for (const lane of lanes) {
    let id: string | undefined = lane.tip;
    let used = false;
    while (id && visible.has(id) && !laneOf.has(id)) {
      if (!used) {
        laneNames.push(lane.name);
        used = true;
      }
      laneOf.set(id, laneNames.length - 1);
      id = repo.commits[id].parents[0];
    }
  }
  for (const c of commits) if (!laneOf.has(c.id)) laneOf.set(c.id, 0);

  const nodes: GNode[] = commits.map((c, i) => ({
    id: c.id,
    col: i,
    lane: laneOf.get(c.id)!,
    label: c.id.slice(0, 3),
    tone: c.parents.length > 1 ? 'merge' : LANE_TONES[laneOf.get(c.id)! % LANE_TONES.length],
  }));
  const edges: [string, string][] = [];
  for (const c of commits) for (const p of c.parents) if (visible.has(p)) edges.push([p, c.id]);

  const refs: GRef[] = [];
  const add = (at: string, name: string, kind: GRef['kind']) => {
    if (visible.has(at)) refs.push({ at, name, kind });
  };
  if (repo.head.type === 'detached') add(repo.head.id, 'HEAD', 'head');
  for (const [b, id] of Object.entries(repo.branches)) {
    add(id, b, 'branch');
    if (repo.head.type === 'branch' && repo.head.name === b) add(id, 'HEAD', 'head');
  }
  for (const [t, id] of Object.entries(repo.tracking)) add(id, t, 'remote');
  for (const [t, v] of Object.entries(repo.tags)) add(v.id, t, 'tag');
  // Alternate labels above/below so stacked refs stay readable.
  const perCommit = new Map<string, number>();
  for (const r of refs) {
    const n = perCommit.get(r.at) ?? 0;
    perCommit.set(r.at, n + 1);
    r.below = n % 2 === 1;
  }
  return { nodes, edges, refs, laneNames: laneNames.length > 1 ? laneNames : undefined, title: 'Live commit graph' };
}
