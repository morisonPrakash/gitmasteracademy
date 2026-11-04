import { Award, CheckCircle2, FileQuestion, GraduationCap } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ModuleIcon } from '@/components/Icon';
import { Badge, PageHeader } from '@/components/ui';
import { MODULES } from '@/content/catalog';
import { PASS_MARK, useProgress } from '@/store/progress';
import { attemptsFor, bestAttempt, overallStats, quizPassed } from '@/store/selectors';
import { QuizHistory } from './QuizRunner';
import { FINAL_ID, FINAL_SIZE } from './quizzes';

export default function QuizList() {
  const p = useProgress();
  const stats = overallStats(p);
  const final = bestAttempt(p, FINAL_ID);
  useEffect(() => {
    document.title = 'Quizzes · GitMaster Academy';
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader
        eyebrow="Practice"
        title="Quizzes and Final Assessment"
        description={`Every module has a quiz of 12 questions: multiple choice, command writing, real-world scenarios and troubleshooting. Questions appear in random order with an explanation after each answer. The pass mark is ${PASS_MARK}%, and you can retake as often as you like.`}
      >
        <Badge tone="accent">{stats.passedQuizzes} passed</Badge>
        <Badge>{stats.attempts} attempts</Badge>
        {stats.quizzesTaken > 0 && <Badge tone="done">Average best score {stats.avgBest}%</Badge>}
      </PageHeader>

      <Link to={`/quizzes/${FINAL_ID}`} className="group mb-8 flex flex-col gap-3 rounded-2xl border border-done/40 bg-done-soft p-5 sm:flex-row sm:items-center">
        <GraduationCap className="h-10 w-10 shrink-0 text-done" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-lg font-bold text-fg group-hover:text-done">Final Assessment</p>
          <p className="text-sm text-fg/80">{FINAL_SIZE} questions drawn from all 14 modules, different every time. Pass it to prove you can work confidently in a real team&apos;s GitHub workflow.</p>
        </div>
        <div className="text-right">
          {final ? (
            <>
              <p className="text-2xl font-bold text-fg">{final.percent}%</p>
              <p className="text-xs text-muted">best score</p>
            </>
          ) : (
            <Badge tone="done">Not attempted</Badge>
          )}
        </div>
      </Link>

      <h2 className="mb-3 text-lg font-semibold text-fg">Module quizzes</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {MODULES.map((m) => {
          const best = bestAttempt(p, m.id);
          const passed = quizPassed(p, m.id);
          const tries = attemptsFor(p, m.id).length;
          return (
            <Link key={m.id} to={`/quizzes/${m.id}`} className="group flex items-center gap-3 rounded-xl border border-line p-4 hover:border-accent">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <ModuleIcon name={m.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted">Module {m.number}</span>
                <span className="block truncate font-medium text-fg group-hover:text-accent">{m.navTitle}</span>
                <span className="block text-xs text-muted">{tries ? `${tries} attempt${tries > 1 ? 's' : ''} · best ${best!.percent}%` : '12 questions'}</span>
              </span>
              {passed ? <CheckCircle2 className="h-6 w-6 shrink-0 text-ok" aria-label="Passed" /> : best ? <Award className="h-6 w-6 shrink-0 text-warn" aria-label="Attempted, not passed" /> : <FileQuestion className="h-6 w-6 shrink-0 text-muted" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>

      <QuizHistory history={p.quizzes.slice().reverse().slice(0, 20)} showQuiz />
    </div>
  );
}
