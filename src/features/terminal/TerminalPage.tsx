import { CornerDownLeft, Info, Lightbulb, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, PageHeader } from '@/components/ui';
import { colourOutput } from '@/components/lesson/CodeBlocks';
import { Inline } from '@/components/Inline';
import { headCommitId } from '@/engine/git/repo';
import { SCENARIOS, findScenario } from '@/engine/git/scenarios';
import { session, useSession } from '@/engine/git/session';
import { run } from '@/engine/git/shell';
import type { Repo } from '@/engine/git/types';
import { AreasPanel, RepoGraph } from './RepoViews';

export function promptLabel(repo: Repo) {
  const where = !repo.initialized ? '' : repo.head.type === 'branch' ? repo.head.name : (headCommitId(repo) ?? '').slice(0, 7);
  return `you@gitmaster ~/${repo.cwdName}${where ? ` (${where}${repo.merge ? '|MERGING' : ''})` : ''}`;
}

const QUICK = ['git status', 'git log --oneline --graph --all', 'git branch -a', 'git diff', 'ls'];

export default function TerminalPage() {
  const s = useSession();
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [recall, setRecall] = useState<number | null>(null);
  const [pick, setPick] = useState(s.scenario);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scenario = findScenario(s.scenario) ?? SCENARIOS[0];
  const last = s.history[s.history.length - 1];

  useEffect(() => {
    document.title = 'Interactive Git Terminal · GitMaster Academy';
  }, []);

  // Opening /terminal?scenario=x from an exercise starts that exercise once.
  useEffect(() => {
    const wanted = params.get('scenario');
    if (wanted && findScenario(wanted) && session.get().scenario !== wanted) {
      session.start(wanted);
      setPick(wanted);
    }
  }, [params]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [s.history.length]);

  const execute = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const r = run(session.get().repo, trimmed);
    session.record(trimmed, r.repo, { output: r.output, ok: r.ok, explain: r.explain }, r.clear);
    setInput('');
    setRecall(null);
  };

  const commands = s.history.map((h) => h.input);
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') execute(input);
    else if (e.key === 'ArrowUp' && commands.length) {
      e.preventDefault();
      const i = recall === null ? commands.length - 1 : Math.max(0, recall - 1);
      setRecall(i);
      setInput(commands[i]);
    } else if (e.key === 'ArrowDown' && recall !== null) {
      e.preventDefault();
      const i = recall + 1;
      if (i >= commands.length) {
        setRecall(null);
        setInput('');
      } else {
        setRecall(i);
        setInput(commands[i]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      execute('clear');
    }
  };

  const startScenario = (id: string) => {
    session.start(id);
    setParams(id === 'playground' ? {} : { scenario: id }, { replace: true });
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader
        eyebrow="Practice"
        title="Interactive Git Terminal"
        description={<>Type real Git commands and watch what happens inside the repository. <strong className="text-fg">This is a safe simulation</strong> running in your browser: it never touches the files on your computer. Type <code className="prose-code">help</code> to see every supported command.</>}
      />

      <section aria-label="Exercise" className="mb-4 flex flex-col gap-3 rounded-xl border border-line bg-subtle p-4 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wider text-accent uppercase">Current exercise</p>
          <p className="font-semibold text-fg">{scenario.title}</p>
          <p className="text-sm text-muted">{scenario.summary}</p>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-fg"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" /> {scenario.task}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted">
            <span className="mb-1 block font-medium">Start new exercise</span>
            <select value={pick} onChange={(e) => setPick(e.target.value)} className="h-9 rounded-md border border-line bg-canvas px-2 text-sm text-fg">
              {SCENARIOS.map((sc) => <option key={sc.id} value={sc.id}>{sc.title}</option>)}
            </select>
          </label>
          <Button variant="primary" onClick={() => startScenario(pick)}>Start</Button>
          <Button onClick={() => session.reset()} title="Rebuild the current exercise from the beginning">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset playground
          </Button>
          <Button onClick={() => execute(`teammate push ${s.repo.head.type === 'branch' ? s.repo.head.name : 'main'}`)} disabled={!s.repo.server} title="Simulate a colleague pushing to GitHub">
            <Users className="h-4 w-4" aria-hidden="true" /> Teammate pushes
          </Button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Terminal */}
        <section aria-label="Terminal" className="term flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-line bg-term text-term-fg">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/60">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Simulated terminal</span>
            <span>↑ ↓ history · Ctrl+L clear</span>
          </div>
          <div ref={logRef} role="log" aria-live="polite" aria-label="Terminal output" className="max-h-[60vh] min-h-[300px] flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed" onClick={() => inputRef.current?.focus()}>
            {s.history.length === 0 && (
              <p className="text-white/50">Welcome! {s.scenario === 'playground' ? 'Start with git init.' : 'The exercise repository is ready. Try git status.'}</p>
            )}
            {s.history.map((h, i) => (
              <div key={i} className="mb-2">
                <p className="break-all"><span className="t-prompt">$ </span><span className="t-cmd">{h.input}</span></p>
                {h.output && <pre className={`whitespace-pre-wrap break-words ${h.ok ? 'text-white/85' : 'text-[#ffa198]'}`}>{colourOutput(h.output)}</pre>}
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 px-4 py-2">
            <p className="truncate font-mono text-[11px] text-[#3fb950]">{promptLabel(s.repo)}</p>
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="t-prompt" aria-hidden="true">$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                aria-label="Command input"
                placeholder="type a command and press Enter"
                className="h-9 flex-1 bg-transparent text-term-fg outline-none placeholder:text-white/30"
                autoFocus
              />
              <button type="button" onClick={() => execute(input)} className="rounded p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Run command">
                <CornerDownLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5 pb-1">
              {QUICK.map((q) => (
                <button key={q} type="button" onClick={() => execute(q)} className="rounded border border-white/15 px-2 py-0.5 font-mono text-[11px] text-white/70 hover:bg-white/10 hover:text-white">{q}</button>
              ))}
            </div>
          </div>
        </section>

        {/* Explanation + graph */}
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="explain-title" className="rounded-xl border border-accent/30 bg-accent-soft p-4">
            <h2 id="explain-title" className="flex items-center gap-2 text-sm font-semibold text-accent"><Info className="h-4 w-4" aria-hidden="true" /> What happened inside Git</h2>
            {last ? (
              <>
                <p className="mt-1 font-mono text-xs text-muted">$ {last.input}</p>
                {last.explain.length ? (
                  <ul className="mt-2 space-y-1.5 text-sm text-fg">{last.explain.map((e, i) => <li key={i}><Inline text={e} /></li>)}</ul>
                ) : (
                  <p className="mt-2 text-sm text-fg">{last.ok ? 'This command only displayed information; nothing changed.' : 'The command failed, so nothing changed. Read the error message: it usually says exactly what to do.'}</p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-fg">Run a command and an explanation of its effect on your files, staging area, commits and branches appears here.</p>
            )}
          </section>
          <section aria-labelledby="graph-title" className="rounded-xl border border-line p-4">
            <h2 id="graph-title" className="mb-2 text-sm font-semibold text-fg">Commit graph</h2>
            <RepoGraph repo={s.repo} />
          </section>
        </div>
      </div>

      <section aria-label="Repository areas" className="mt-4">
        <AreasPanel repo={s.repo} />
      </section>
    </div>
  );
}
