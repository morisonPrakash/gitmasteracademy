import { ArrowDown, ArrowRight, RotateCcw } from 'lucide-react';
import { Fragment } from 'react';

export interface FlowStep {
  title: string;
  sub?: string;
  role?: string;
  tone?: 'accent' | 'ok' | 'warn' | 'bad' | 'done' | 'neutral';
}

const TONE = {
  accent: 'border-accent/40 bg-accent-soft',
  ok: 'border-ok/40 bg-ok-soft',
  warn: 'border-warn/40 bg-warn-soft',
  bad: 'border-bad/40 bg-bad-soft',
  done: 'border-done/40 bg-done-soft',
  neutral: 'border-line bg-subtle',
};

/** A responsive left-to-right process diagram that stacks vertically on small screens. */
export function FlowDiagram({ steps, arrows, loop }: { steps: FlowStep[]; arrows?: string[]; loop?: string }) {
  return (
    <div>
      <ol className="flex flex-col items-stretch gap-1 md:flex-row md:flex-wrap md:items-center md:gap-y-3">
        {steps.map((s, i) => (
          <Fragment key={i}>
            <li className={`rounded-lg border px-3 py-2 text-center md:min-w-[110px] md:flex-1 ${TONE[s.tone ?? 'neutral']}`}>
              {s.role && <p className="text-[10px] font-semibold tracking-wider text-muted uppercase">{s.role}</p>}
              <p className="text-sm font-semibold text-fg">{s.title}</p>
              {s.sub && <p className="mt-0.5 font-mono text-[11px] text-muted">{s.sub}</p>}
            </li>
            {i < steps.length - 1 && (
              <li aria-hidden="true" className="flex items-center justify-center gap-1 text-muted">
                <ArrowDown className="h-4 w-4 md:hidden" />
                <ArrowRight className="hidden h-4 w-4 md:block" />
                {arrows?.[i] && <span className="font-mono text-[11px]">{arrows[i]}</span>}
              </li>
            )}
          </Fragment>
        ))}
      </ol>
      {loop && (
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {loop}
        </p>
      )}
    </div>
  );
}
