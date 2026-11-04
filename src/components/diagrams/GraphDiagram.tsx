// Static commit-graph renderer used by lesson diagrams. Commits sit on a grid:
// `col` is the position in time (left → right), `lane` is the branch row.

export type Tone = 'main' | 'feature' | 'fix' | 'release' | 'muted' | 'merge' | 'new' | 'bad';

export interface GNode {
  id: string;
  col: number;
  lane: number;
  label?: string;
  tone?: Tone;
  dashed?: boolean;
}

export interface GRef {
  at: string;
  name: string;
  kind?: 'branch' | 'head' | 'remote' | 'tag';
  /** place label below the node instead of above */
  below?: boolean;
}

export interface GraphSpec {
  nodes: GNode[];
  edges: [string, string][]; // [parent, child]
  refs?: GRef[];
  laneNames?: string[];
  title?: string;
}

const TONE: Record<Tone, string> = {
  main: 'fill-accent',
  feature: 'fill-ok',
  fix: 'fill-warn',
  release: 'fill-done',
  muted: 'fill-muted/50',
  merge: 'fill-done',
  new: 'fill-ok',
  bad: 'fill-bad',
};

const REF: Record<NonNullable<GRef['kind']>, string> = {
  branch: 'fill-accent-soft stroke-accent text-accent',
  head: 'fill-bad-soft stroke-bad text-bad',
  remote: 'fill-done-soft stroke-done text-done',
  tag: 'fill-warn-soft stroke-warn text-warn',
};

const COL = 78;
const LANE = 64;
const PAD_X = 40;
const PAD_Y = 68; // room for up to two stacked ref labels above the top lane

export function GraphDiagram({ spec, className = '', natural = false }: { spec: GraphSpec; className?: string; natural?: boolean }) {
  const labelPad = spec.laneNames ? Math.min(190, Math.max(92, ...spec.laneNames.map((n) => n.length * 7 + 16))) : 0;
  const maxCol = Math.max(...spec.nodes.map((n) => n.col));
  const maxLane = Math.max(...spec.nodes.map((n) => n.lane));
  const width = labelPad + PAD_X * 2 + maxCol * COL;
  const height = PAD_Y * 2 + maxLane * LANE + 10;
  const pos = (n: GNode) => ({ x: labelPad + PAD_X + n.col * COL, y: PAD_Y + n.lane * LANE });
  const byId = new Map(spec.nodes.map((n) => [n.id, n]));

  // Stack several refs on the same commit.
  const refStack = new Map<string, number>();

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={natural ? className : `h-auto w-full max-w-full ${className}`}
      role="img"
      aria-label={spec.title ?? 'Commit graph'}
      // natural: draw at real pixel size (the parent scrolls) so long histories stay legible
      style={natural ? { width: `${width}px`, height: `${height}px`, maxWidth: 'none' } : { maxHeight: `${height * 1.4}px` }}
    >
      {spec.laneNames?.map((name, i) => (
        <g key={name}>
          <line x1={labelPad} x2={width - 8} y1={PAD_Y + i * LANE} y2={PAD_Y + i * LANE} className="stroke-line-soft" strokeDasharray="3 5" />
          <text x={8} y={PAD_Y + i * LANE + 4} className="fill-muted font-mono" fontSize="12">
            {name}
          </text>
        </g>
      ))}
      {spec.edges.map(([a, b]) => {
        const na = byId.get(a);
        const nb = byId.get(b);
        if (!na || !nb) return null;
        const p = pos(na);
        const q = pos(nb);
        const d =
          p.y === q.y
            ? `M${p.x},${p.y} L${q.x},${q.y}`
            : `M${p.x},${p.y} C${p.x + COL * 0.55},${p.y} ${q.x - COL * 0.55},${q.y} ${q.x},${q.y}`;
        return (
          <path
            key={`${a}-${b}`}
            d={d}
            fill="none"
            strokeWidth="2.5"
            className={nb.dashed ? 'stroke-muted' : 'stroke-line'}
            strokeDasharray={nb.dashed ? '5 4' : undefined}
          />
        );
      })}
      {spec.nodes.map((n) => {
        const { x, y } = pos(n);
        return (
          <g key={n.id}>
            <circle
              cx={x}
              cy={y}
              r="15"
              className={`${TONE[n.tone ?? 'main']} stroke-canvas`}
              strokeWidth="3"
              opacity={n.dashed ? 0.45 : 1}
              strokeDasharray={n.dashed ? '4 3' : undefined}
            />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-white font-mono">
              {n.label ?? n.id}
            </text>
          </g>
        );
      })}
      {spec.refs?.map((r, i) => {
        const n = byId.get(r.at);
        if (!n) return null;
        const { x, y } = pos(n);
        const key = `${r.at}:${r.below ? 'b' : 'a'}`;
        const k = refStack.get(key) ?? 0;
        refStack.set(key, k + 1);
        const w = Math.max(44, r.name.length * 7 + 14);
        const yy = r.below ? y + 24 + k * 22 : y - 40 - k * 22;
        return (
          <g key={i} className={REF[r.kind ?? 'branch']}>
            <rect x={x - w / 2} y={yy} width={w} height="18" rx="9" strokeWidth="1.2" />
            <text x={x} y={yy + 13} textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor" className="font-mono">
              {r.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
