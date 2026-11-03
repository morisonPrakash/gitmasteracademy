import {
  ArrowRight, Award, Bookmark, BookOpenCheck, Clock, FileQuestion, GitGraph, Layers, Play, SquareTerminal, Trophy,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LEVELS, MODULES } from '@/content/catalog';
import { ModuleIcon } from '@/components/Icon';
import { ButtonLink, Card, ProgressBar } from '@/components/ui';
import { useProgress } from '@/store/progress';
import {
  bestAttempt, currentLevel, lessonByKey, lessonPath, levelProgress, moduleComplete, moduleLessonProgress,
  overallStats, recommendedNext,
} from '@/store/selectors';

function Stat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: ReactNode; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-fg tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </Card>
  );
}

export default function Dashboard() {
  const p = useProgress();
  const stats = overallStats(p);
  const level = currentLevel(p);
  const levels = levelProgress(p);
  const next = recommendedNext(p);
  const resume = p.current ? lessonByKey(p.current) : undefined;
  const recent = p.recent.map(lessonByKey).filter(Boolean).slice(0, 5);
  const bookmarks = p.bookmarks.map(lessonByKey).filter(Boolean).slice(0, 5);
  const fresh = stats.lessonsDone === 0 && !resume;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-subtle px-6 py-8 sm:px-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-medium text-accent">GitMaster Academy</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            {fresh ? 'From Git beginner to professional developer' : 'Welcome back. Keep going!'}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            {fresh
              ? 'Learn Git and GitHub the way real teams use them: commands, branches, pull requests, conflicts, CI/CD and the full developer–QA workflow. Practise in a safe Git simulator as you go.'
              : `You have completed ${stats.lessonsDone} of ${stats.lessonsTotal} lessons. You are on Level ${level}: ${LEVELS[level].title}.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {resume ? (
              <ButtonLink to={lessonPath(resume.moduleId, resume.slug)} variant="primary" className="px-4 py-2">
                <Play className="h-4 w-4" aria-hidden="true" /> Resume learning
              </ButtonLink>
            ) : (
              next && (
                <ButtonLink to={lessonPath(next.moduleId, next.slug)} variant="primary" className="px-4 py-2">
                  <Play className="h-4 w-4" aria-hidden="true" /> Start lesson 1
                </ButtonLink>
              )
            )}
            <ButtonLink to="/roadmap" className="px-4 py-2">View roadmap</ButtonLink>
          </div>
          {resume && <p className="mt-3 text-sm text-muted">Last lesson: <span className="text-fg">{resume.title}</span></p>}
        </div>
        <GitGraph className="pointer-events-none absolute -right-6 -bottom-8 h-56 w-56 text-accent opacity-[0.07]" aria-hidden="true" />
      </section>

      {/* Stats */}
      <section aria-label="Progress summary" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Layers className="h-4 w-4" aria-hidden="true" />} label="Learning modules" value={stats.modulesTotal} sub={`${stats.lessonsTotal} lessons in 5 levels`} />
        <Stat icon={<Award className="h-4 w-4" aria-hidden="true" />} label="Completed modules" value={`${stats.modulesDone}/${stats.modulesTotal}`} sub="All lessons + quiz passed" />
        <Stat icon={<BookOpenCheck className="h-4 w-4" aria-hidden="true" />} label="Completed lessons" value={`${stats.lessonsDone}/${stats.lessonsTotal}`} sub={`${stats.percent}% of the course`} />
        <Stat
          icon={<Trophy className="h-4 w-4" aria-hidden="true" />}
          label="Quiz performance"
          value={stats.quizzesTaken ? `${stats.avgBest}%` : '—'}
          sub={stats.quizzesTaken ? `${stats.passedQuizzes} passed · ${stats.attempts} attempts` : 'No quizzes taken yet'}
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Learning path */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-fg">Current learning path</h2>
          <p className="text-sm text-muted">Level {level} of 5: {LEVELS[level].title}</p>
          <ol className="mt-4 space-y-3">
            {levels.map((l) => (
              <li key={l.level} className={`rounded-lg border px-4 py-3 ${l.level === level ? 'border-accent/50 bg-accent-soft' : 'border-line-soft'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-fg">
                    Level {l.level}: {l.title}
                    {l.level === level && <span className="ml-2 text-xs font-medium text-accent">You are here</span>}
                  </p>
                  <span className="text-xs text-muted tabular-nums">{l.done}/{l.total}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{l.tagline}</p>
                <ProgressBar value={l.percent} label={`Level ${l.level} progress`} className="mt-2" />
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-6">
          {/* Recommended */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-fg">Recommended next</h2>
            {next ? (
              <Link to={lessonPath(next.moduleId, next.slug)} className="group mt-3 block rounded-lg border border-line p-3 hover:border-accent">
                <p className="text-xs text-muted">{MODULES.find((m) => m.id === next.moduleId)?.navTitle}</p>
                <p className="mt-0.5 font-medium text-fg group-hover:text-accent">{next.title}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm text-accent">Open lesson <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              </Link>
            ) : (
              <p className="mt-2 text-sm text-muted">Every lesson is complete. Take the final assessment!</p>
            )}
          </Card>

          {/* Recent */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-fg"><Clock className="h-4 w-4" aria-hidden="true" /> Recently visited</h2>
            {recent.length ? (
              <ul className="mt-2 divide-y divide-line-soft">
                {recent.map((l) => (
                  <li key={`${l!.moduleId}/${l!.slug}`}>
                    <Link to={lessonPath(l!.moduleId, l!.slug)} className="block py-2 text-sm hover:text-accent">
                      <span className="text-fg">{l!.title}</span>
                      <span className="block text-xs text-muted">{l!.module.navTitle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Lessons you open will appear here.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-fg"><Bookmark className="h-4 w-4" aria-hidden="true" /> Bookmarks</h2>
            {bookmarks.length ? (
              <ul className="mt-2 space-y-1">
                {bookmarks.map((l) => (
                  <li key={`${l!.moduleId}/${l!.slug}`}>
                    <Link to={lessonPath(l!.moduleId, l!.slug)} className="text-sm text-fg hover:text-accent">{l!.title}</Link>
                  </li>
                ))}
                <li><Link to="/bookmarks" className="text-sm text-accent">All bookmarks →</Link></li>
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Use the bookmark button on any lesson to save it here.</p>
            )}
          </Card>
        </div>
      </div>

      {/* Practice shortcuts */}
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { to: '/terminal', icon: SquareTerminal, title: 'Git terminal', text: 'Type real Git commands in a safe simulator.' },
          { to: '/visualizer', icon: GitGraph, title: 'Git visualizer', text: 'Watch branches, merges and rebases as a graph.' },
          { to: '/quizzes', icon: FileQuestion, title: 'Quizzes', text: '14 module quizzes and a final assessment.' },
        ].map((x) => (
          <Link key={x.to} to={x.to} className="group rounded-xl border border-line p-4 hover:border-accent">
            <x.icon className="h-5 w-5 text-accent" aria-hidden="true" />
            <p className="mt-2 font-semibold text-fg group-hover:text-accent">{x.title}</p>
            <p className="text-sm text-muted">{x.text}</p>
          </Link>
        ))}
      </section>

      {/* Modules */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-fg">All modules</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((m) => {
            const mp = moduleLessonProgress(p, m);
            const best = bestAttempt(p, m.id);
            const done = moduleComplete(p, m);
            return (
              <Link key={m.id} to={`/learn/${m.id}`} className="group flex flex-col rounded-xl border border-line p-4 hover:border-accent">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <ModuleIcon name={m.icon} className="h-4 w-4" />
                  </span>
                  <span className="text-xs text-muted">Module {m.number} · Level {m.level}</span>
                  {done && <Award className="ml-auto h-4 w-4 text-ok" aria-label="Module complete" />}
                </div>
                <p className="mt-2 font-semibold text-fg group-hover:text-accent">{m.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{m.description}</p>
                <div className="mt-auto pt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>{mp.done}/{mp.total} lessons</span>
                    <span>{best ? `Quiz best ${best.percent}%` : 'Quiz not taken'}</span>
                  </div>
                  <ProgressBar value={mp.percent} label={`${m.title} progress`} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
