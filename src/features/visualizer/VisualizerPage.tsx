import { ChevronRight, GitBranch, GitCommitHorizontal, GitMerge, Play, RotateCcw, SquareTerminal, Upload, Users } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Inline } from '@/components/Inline';
import { Button, PageHeader } from '@/components/ui';
import { currentBranch } from '@/engine/git/repo';
import { findScenario } from '@/engine/git/scenarios';
import { session, useSession } from '@/engine/git/session';
import { run } from '@/engine/git/shell';
import { AreasPanel, RepoGraph } from '../terminal/RepoViews';
import { TOURS, type Tour } from './tours';

function exec(cmd: string) {
  const r = run(session.get().repo, cmd);
  session.record(cmd, r.repo, { output: r.output, ok: r.ok, explain: r.explain });
  return r;
}

function ActionForm({ label, icon, onSubmit, children, disabled }: {
  label: string; icon: ReactNode; onSubmit: () => void; children?: ReactNode; disabled?: boolean;
}) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      {children}
      <Button type="submit" variant="secondary" disabled={disabled} className="min-w-[8.5rem] justify-start">
        {icon} {label}
      </Button>
    </form>
  );
}

const inputCls = 'h-9 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 text-sm text-fg';

export default function VisualizerPage() {
  const s = useSession();
  const repo = s.repo;
  const [tour, setTour] = useState<Tour | null>(null);
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState('Update README');
  const [newBranch, setNewBranch] = useState('feature/demo');
  const branches = Object.keys(repo.branches).sort();
  const cur = currentBranch(repo);
  const others = branches.filter((b) => b !== cur);
  const [target, setTarget] = useState('');
  const last = s.history[s.history.length - 1];

  useEffect(() => {
    document.title = 'Git Visualizer · GitMaster Academy';
  }, []);
  useEffect(() => {
    if (!others.includes(target)) setTarget(others[0] ?? '');
  }, [others, target]);

  const startTour = (t: Tour) => {
    session.start(t.scenario);
    setTour(t);
    setStep(0);
  };
  const nextStep = () => {
    if (!tour || step >= tour.steps.length) return;
    exec(tour.steps[step].cmd);
    setStep(step + 1);
  };

  const ready = repo.initialized;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader
        eyebrow="Practice"
        title="Git Visualizer"
        description="See your repository as a graph. Use the buttons, follow a guided scene, or type in the terminal: everything updates live. Each button shows the exact Git command it runs."
      >
        <Link to="/terminal" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          <SquareTerminal className="h-4 w-4" aria-hidden="true" /> Open the same repository in the terminal
        </Link>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="vis-graph" className="min-w-0 rounded-xl border border-line p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 id="vis-graph" className="text-sm font-semibold text-fg">Commit graph · {findScenario(s.scenario)?.title}</h2>
            <span className="flex flex-wrap gap-2 text-[11px] text-muted">
              <span className="rounded-full border border-accent px-2 text-accent">branch</span>
              <span className="rounded-full border border-bad px-2 text-bad">HEAD</span>
              <span className="rounded-full border border-done px-2 text-done">origin/…</span>
              <span className="rounded-full border border-warn px-2 text-warn">tag</span>
            </span>
          </div>
          <RepoGraph repo={repo} includeRemote={false} maxCommits={40} />
          {last && (
            <div className="mt-3 rounded-lg bg-subtle px-3 py-2 text-sm">
              <p className="font-mono text-xs text-muted">$ {last.input}</p>
              {last.output && <pre className={`mt-1 max-h-32 overflow-auto font-mono text-[12px] whitespace-pre-wrap ${last.ok ? 'text-fg/80' : 'text-bad'}`}>{last.output}</pre>}
              {last.explain[0] && <p className="mt-1 text-fg"><Inline text={last.explain.join(' ')} /></p>}
            </div>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="vis-tours" className="rounded-xl border border-line p-4">
            <h2 id="vis-tours" className="text-sm font-semibold text-fg">Guided scenes</h2>
            {!tour ? (
              <ul className="mt-2 space-y-2">
                {TOURS.map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => startTour(t)} className="group w-full rounded-lg border border-line px-3 py-2 text-left hover:border-accent">
                      <span className="flex items-center gap-1.5 font-medium text-fg group-hover:text-accent"><Play className="h-3.5 w-3.5" aria-hidden="true" />{t.title}</span>
                      <span className="block text-xs text-muted">{t.summary}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2">
                <p className="font-medium text-fg">{tour.title}</p>
                <p className="text-xs text-muted">Step {Math.min(step + 1, tour.steps.length)} of {tour.steps.length}</p>
                <ol className="mt-2 space-y-1.5">
                  {tour.steps.map((st, i) => (
                    <li key={i} className={`rounded-md px-2 py-1.5 text-sm ${i === step ? 'bg-accent-soft' : i < step ? 'opacity-60' : 'opacity-40'}`}>
                      <code className="block font-mono text-[12px] break-all text-fg">$ {st.cmd}</code>
                      {i < step && <span className="text-xs text-fg">{st.note}</span>}
                    </li>
                  ))}
                </ol>
                <div className="mt-3 flex gap-2">
                  {step < tour.steps.length ? (
                    <Button variant="primary" onClick={nextStep}>Run step {step + 1} <ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
                  ) : (
                    <p className="text-sm font-medium text-ok">Scene complete!</p>
                  )}
                  <Button variant="ghost" onClick={() => setTour(null)}>All scenes</Button>
                </div>
              </div>
            )}
          </section>

          <section aria-labelledby="vis-actions" className="rounded-xl border border-line p-4">
            <h2 id="vis-actions" className="text-sm font-semibold text-fg">Do it yourself</h2>
            {!ready ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => exec('git init')}>git init</Button>
                <Button onClick={() => { session.start('one-commit'); }}>Load a repo with one commit</Button>
                <Button onClick={() => { session.start('remote-ahead'); }}>Load a clone with a remote</Button>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                <ActionForm label="Commit" icon={<GitCommitHorizontal className="h-4 w-4" aria-hidden="true" />} onSubmit={() => exec(`echo "${msg.replace(/"/g, "'")}" >> README.md && git add README.md && git commit -m "${msg.replace(/"/g, "'")}"`)}>
                  <input aria-label="Commit message" value={msg} onChange={(e) => setMsg(e.target.value)} className={inputCls} />
                </ActionForm>
                <ActionForm label="New branch" icon={<GitBranch className="h-4 w-4" aria-hidden="true" />} disabled={!newBranch.trim()} onSubmit={() => exec(`git switch -c ${newBranch.trim().replace(/\s+/g, '-')}`)}>
                  <input aria-label="New branch name" value={newBranch} onChange={(e) => setNewBranch(e.target.value)} className={inputCls} />
                </ActionForm>
                <div className="flex flex-wrap items-center gap-2">
                  <select aria-label="Other branch" value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls} disabled={!others.length}>
                    {others.length ? others.map((b) => <option key={b}>{b}</option>) : <option>no other branches</option>}
                  </select>
                  <Button disabled={!target} onClick={() => exec(`git switch ${target}`)}>Switch</Button>
                  <Button disabled={!target} onClick={() => exec(`git merge ${target}`)}><GitMerge className="h-4 w-4" aria-hidden="true" /> Merge into {cur ?? 'HEAD'}</Button>
                  <Button disabled={!target} onClick={() => exec(`git rebase ${target}`)}>Rebase onto</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={!repo.server} onClick={() => exec(cur && repo.upstream[cur] ? 'git push' : `git push -u origin ${cur ?? 'main'}`)}><Upload className="h-4 w-4" aria-hidden="true" /> Push</Button>
                  <Button disabled={!repo.server} onClick={() => exec('git fetch')}>Fetch</Button>
                  <Button disabled={!repo.server} onClick={() => exec('git pull')}>Pull</Button>
                  <Button disabled={!repo.server} onClick={() => exec(`teammate push ${cur ?? 'main'}`)}><Users className="h-4 w-4" aria-hidden="true" /> Teammate pushes</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => exec('git reset --soft HEAD~1')}>Undo last commit (soft)</Button>
                  <Button onClick={() => exec('git revert --no-edit HEAD')}>Revert last commit</Button>
                  {repo.merge && <Button variant="danger" onClick={() => exec('git merge --abort')}>Abort merge</Button>}
                </div>
                <Button variant="ghost" onClick={() => { session.reset(); setTour(null); }}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset</Button>
              </div>
            )}
          </section>
        </div>
      </div>

      <section aria-label="Repository areas" className="mt-4">
        <AreasPanel repo={repo} />
      </section>
    </div>
  );
}
