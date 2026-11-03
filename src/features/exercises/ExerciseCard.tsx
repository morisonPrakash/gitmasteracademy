import { ArrowDown, ArrowUp, CheckCircle2, Eye, Lightbulb, RotateCcw, SquareTerminal, XCircle } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Inline } from '@/components/Inline';
import { Badge, Button } from '@/components/ui';
import type { Exercise } from '@/content/types';
import { commandMatches, shuffle } from '@/lib/text';
import { progress, useProgress } from '@/store/progress';
import { checkSimGoal } from './simGoals';

type Result = 'idle' | 'correct' | 'wrong';

const DIFFICULTY_TONE = { beginner: 'ok', intermediate: 'warn', advanced: 'bad' } as const;
const CATEGORY_LABEL = {
  command: 'Command writing', scenario: 'Real-world scenario', troubleshooting: 'Troubleshooting', concept: 'Concept check',
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</p>
      <div className="mt-1 text-[15px] leading-relaxed text-fg/90">{children}</div>
    </div>
  );
}

export function ExerciseCard({ exercise, index }: { exercise: Exercise; index: number }) {
  const ex = exercise;
  const status = useProgress().exercises[ex.id];
  const [hintsShown, setHintsShown] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<Result>('idle');
  const [typed, setTyped] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  const initialOrder = useMemo(() => {
    if (ex.check.type !== 'order') return [];
    const items = ex.check.items;
    let s = shuffle(items);
    // Make sure the shuffled order is not already correct.
    for (let i = 0; i < 5 && s.every((v, j) => v === items[j]); i++) s = shuffle(items);
    return s;
  }, [ex]);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [simMsg, setSimMsg] = useState('');

  const finish = (ok: boolean) => {
    setResult(ok ? 'correct' : 'wrong');
    if (ok) progress.markExercise(ex.id, 'solved');
  };

  const verify = () => {
    const c = ex.check;
    if (c.type === 'command') finish(commandMatches(typed, c.answers));
    else if (c.type === 'choice') finish(choice === c.correct);
    else if (c.type === 'order') finish(order.every((v, i) => v === c.items[i]));
    else {
      const r = checkSimGoal(c.goal);
      setSimMsg(r.message);
      finish(r.ok);
    }
  };

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setResult('idle');
  };

  const reset = () => {
    setResult('idle');
    setTyped('');
    setChoice(null);
    setOrder(initialOrder);
    setHintsShown(0);
    setRevealed(false);
    setSimMsg('');
  };

  const id = `ex-${ex.id}`;
  const canCheck =
    (ex.check.type === 'command' && typed.trim()) ||
    (ex.check.type === 'choice' && choice !== null) ||
    ex.check.type === 'order' ||
    ex.check.type === 'sim';

  return (
    <section aria-labelledby={`${id}-title`} className="my-6 overflow-hidden rounded-xl border border-line">
      <header className="flex flex-wrap items-center gap-2 border-b border-line bg-subtle px-5 py-3">
        <span className="text-xs font-semibold tracking-wider text-accent uppercase">Exercise {index + 1}</span>
        <h3 id={`${id}-title`} className="mr-auto font-semibold text-fg">{ex.title}</h3>
        <Badge tone={DIFFICULTY_TONE[ex.difficulty]}>{ex.difficulty}</Badge>
        <Badge>{CATEGORY_LABEL[ex.category]}</Badge>
        {status === 'solved' && (
          <Badge tone="ok"><CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Solved</Badge>
        )}
      </header>

      <div className="space-y-4 px-5 py-4">
        <Field label="Problem"><Inline text={ex.problem} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starting situation"><Inline text={ex.start} /></Field>
          <Field label="Expected result"><Inline text={ex.expected} /></Field>
        </div>

        {/* Answer input */}
        {ex.check.type === 'command' && (
          <div>
            <label htmlFor={`${id}-input`} className="text-xs font-semibold tracking-wider text-muted uppercase">Your command</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-line bg-term px-3 font-mono text-sm text-term-fg focus-within:border-accent">
              <span className="text-ok select-none" aria-hidden="true">$</span>
              <input
                id={`${id}-input`}
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value);
                  setResult('idle');
                }}
                onKeyDown={(e) => e.key === 'Enter' && canCheck && verify()}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                className="h-10 flex-1 bg-transparent outline-none placeholder:text-white/30"
                placeholder="type the git command"
              />
            </div>
          </div>
        )}

        {ex.check.type === 'choice' && (
          <fieldset>
            <legend className="text-xs font-semibold tracking-wider text-muted uppercase">Choose one</legend>
            <div className="mt-2 space-y-2">
              {ex.check.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-[15px] ${
                    choice === i ? 'border-accent bg-accent-soft' : 'border-line hover:bg-subtle'
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-choice`}
                    className="mt-1 accent-[var(--accent)]"
                    checked={choice === i}
                    onChange={() => {
                      setChoice(i);
                      setResult('idle');
                    }}
                  />
                  <span><Inline text={opt} /></span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {ex.check.type === 'order' && (
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted uppercase">Put these steps in the right order</p>
            <ol className="mt-2 space-y-2">
              {order.map((item, i) => (
                <li key={item} className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
                  <span className="w-5 text-sm font-semibold text-muted">{i + 1}.</span>
                  <span className="flex-1 text-[15px]"><Inline text={item} /></span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-muted hover:bg-subtle hover:text-fg disabled:opacity-30" aria-label={`Move "${item}" up`}>
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} className="rounded p-1 text-muted hover:bg-subtle hover:text-fg disabled:opacity-30" aria-label={`Move "${item}" down`}>
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}

        {ex.check.type === 'sim' && (
          <div className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-fg">
            Do this in the simulator, then come back and press <strong>Check my answer</strong>.
            <div className="mt-2">
              <Link
                to={`/terminal?scenario=${encodeURIComponent(ex.check.scenario)}`}
                className="inline-flex items-center gap-2 font-medium text-accent underline underline-offset-2"
              >
                <SquareTerminal className="h-4 w-4" aria-hidden="true" /> Open the exercise in the Git terminal
              </Link>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={verify} disabled={!canCheck}>Check my answer</Button>
          <Button
            onClick={() => setHintsShown((h) => Math.min(h + 1, ex.hints.length))}
            disabled={hintsShown >= ex.hints.length}
          >
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            {hintsShown === 0 ? 'Show a hint' : hintsShown < ex.hints.length ? 'Next hint' : 'No more hints'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setRevealed(true);
              progress.markExercise(ex.id, 'revealed');
            }}
            disabled={revealed}
          >
            <Eye className="h-4 w-4" aria-hidden="true" /> Show answer
          </Button>
          {(result !== 'idle' || revealed || hintsShown > 0) && (
            <Button variant="ghost" onClick={reset}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
            </Button>
          )}
        </div>

        <div aria-live="polite">
          {result === 'correct' && (
            <div className="flex gap-2 rounded-lg border border-ok/40 bg-ok-soft px-4 py-3 text-sm text-fg">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ok">Correct!</p>
                {simMsg && <p className="mt-1">{simMsg}</p>}
                <p className="mt-1"><Inline text={ex.explanation} /></p>
              </div>
            </div>
          )}
          {result === 'wrong' && (
            <div className="flex gap-2 rounded-lg border border-bad/40 bg-bad-soft px-4 py-3 text-sm text-fg">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-bad" aria-hidden="true" />
              <div>
                <p className="font-semibold text-bad">Not quite.</p>
                <p className="mt-1">{simMsg || 'Check the hints, adjust your answer and try again.'}</p>
              </div>
            </div>
          )}
        </div>

        {hintsShown > 0 && (
          <ul className="space-y-2">
            {ex.hints.slice(0, hintsShown).map((h, i) => (
              <li key={i} className="flex gap-2 rounded-lg border border-warn/40 bg-warn-soft px-4 py-2 text-sm text-fg">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
                <span><strong className="text-warn">Hint {i + 1}:</strong> <Inline text={h} /></span>
              </li>
            ))}
          </ul>
        )}

        {revealed && (
          <div className="rounded-lg border border-done/40 bg-done-soft px-4 py-3 text-sm text-fg">
            <p className="font-semibold text-done">Answer</p>
            <p className="mt-1 font-mono text-[13px] whitespace-pre-wrap"><Inline text={ex.answer} /></p>
            <p className="mt-2 font-semibold text-done">Why</p>
            <p className="mt-1"><Inline text={ex.explanation} /></p>
          </div>
        )}
      </div>
    </section>
  );
}
