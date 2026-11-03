import { CheckCircle2, FileQuestion, Flag, GitGraph, Hammer, SquareTerminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LEVELS, MODULES } from '@/content/catalog';
import { ModuleIcon } from '@/components/Icon';
import { PageHeader, ProgressBar } from '@/components/ui';
import { useProgress } from '@/store/progress';
import { bestAttempt, currentLevel, moduleComplete, moduleLessonProgress } from '@/store/selectors';

export default function Roadmap() {
  const p = useProgress();
  const level = currentLevel(p);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader
        eyebrow="Learning roadmap"
        title="Your path from first commit to professional team workflow"
        description="Five levels, fourteen modules. Each module ends with a quiz (80% to pass). Practise in the terminal and visualizer, then prove it in the practical projects and the final assessment."
      />

      <ol className="relative space-y-10 border-l-2 border-line pl-6 sm:pl-8">
        {Object.entries(LEVELS).map(([lvl, info]) => {
          const n = Number(lvl);
          const mods = MODULES.filter((m) => m.level === n);
          return (
            <li key={lvl} className="relative">
              <span
                className={`absolute top-0 -left-[39px] flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold sm:-left-[47px] ${
                  n === level ? 'border-accent bg-accent text-accent-fg' : n < level ? 'border-ok bg-ok text-white' : 'border-line bg-canvas text-muted'
                }`}
                aria-hidden="true"
              >
                {n}
              </span>
              <h2 className="text-xl font-bold text-fg">Level {n}: {info.title}</h2>
              <p className="text-sm text-muted">{info.tagline}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {mods.map((m) => {
                  const mp = moduleLessonProgress(p, m);
                  const best = bestAttempt(p, m.id);
                  const done = moduleComplete(p, m);
                  return (
                    <div key={m.id} className="rounded-xl border border-line p-4">
                      <Link to={`/learn/${m.id}`} className="group flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                          <ModuleIcon name={m.icon} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs text-muted">Module {m.number}</span>
                          <span className="block font-semibold text-fg group-hover:text-accent">{m.title}</span>
                        </span>
                        {done && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-ok" aria-label="Module complete" />}
                      </Link>
                      <p className="mt-2 text-sm text-muted">{m.description}</p>
                      <ProgressBar value={mp.percent} label={`${m.title} progress`} className="mt-3" />
                      <div className="mt-2 flex justify-between text-xs text-muted">
                        <span>{mp.done}/{mp.total} lessons</span>
                        <Link to={`/quizzes/${m.id}`} className="text-accent hover:underline">
                          {best ? `Quiz best: ${best.percent}%` : 'Take the quiz'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
        <li className="relative">
          <span className="absolute top-0 -left-[39px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-done bg-done text-white sm:-left-[47px]" aria-hidden="true">
            <Flag className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-xl font-bold text-fg">Prove it</h2>
          <p className="text-sm text-muted">Practise freely, build the projects and pass the final assessment.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/terminal', icon: SquareTerminal, t: 'Git terminal' },
              { to: '/visualizer', icon: GitGraph, t: 'Visualizer' },
              { to: '/projects', icon: Hammer, t: '4 practical projects' },
              { to: '/quizzes/final', icon: FileQuestion, t: 'Final assessment' },
            ].map((x) => (
              <Link key={x.to} to={x.to} className="flex items-center gap-2 rounded-xl border border-line p-3 text-sm font-medium text-fg hover:border-accent hover:text-accent">
                <x.icon className="h-4 w-4 text-accent" aria-hidden="true" /> {x.t}
              </Link>
            ))}
          </div>
        </li>
      </ol>
    </div>
  );
}
