import { ArrowRight, Award, CheckCircle2, RotateCcw, Trophy, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Inline } from '@/components/Inline';
import { Badge, Button, ButtonLink, EmptyState, Spinner } from '@/components/ui';
import { findModule } from '@/content/catalog';
import { commandMatches, formatDate } from '@/lib/text';
import { PASS_MARK, progress, useProgress, type QuizAttempt } from '@/store/progress';
import { attemptsFor } from '@/store/selectors';
import NotFound from '../NotFound';
import { FINAL_ID, QUIZ_IDS, buildAttempt, quizTitle, type PreparedQuestion } from './quizzes';

const KIND_LABEL = { mcq: 'Multiple choice', command: 'Command', scenario: 'Scenario', troubleshooting: 'Troubleshooting' };

interface Answer {
  correct: boolean;
  given: string;
}

export default function QuizRunner() {
  const { quizId = '' } = useParams();
  const p = useProgress();
  const [questions, setQuestions] = useState<PreparedQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const valid = QUIZ_IDS.includes(quizId);

  const start = useCallback(() => {
    setQuestions(null);
    setIndex(0);
    setChoice(null);
    setTyped('');
    setAnswers([]);
    setResult(null);
    buildAttempt(quizId).then(setQuestions).catch(() => setQuestions([]));
  }, [quizId]);

  useEffect(() => {
    if (!valid) return;
    document.title = `${quizTitle(quizId)} quiz · GitMaster Academy`;
    start();
  }, [quizId, valid, start]);

  if (!valid) return <NotFound />;
  if (!questions) return <div className="px-6"><Spinner label="Preparing questions" /></div>;
  if (!questions.length) return <div className="p-8"><EmptyState title="This quiz could not be loaded." /></div>;

  const meta = findModule(quizId);
  const current = questions[index];
  const answered = answers[index];
  const history = attemptsFor(p, quizId).slice().reverse();

  const submit = () => {
    if (answered) return;
    const q = current.q;
    let correct = false;
    let given = '';
    if (q.kind === 'command') {
      correct = commandMatches(typed, q.answers ?? []);
      given = typed;
    } else {
      correct = choice === current.correct;
      given = choice !== null ? current.options![choice] : '';
    }
    setAnswers((a) => {
      const next = [...a];
      next[index] = { correct, given };
      return next;
    });
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setChoice(null);
      setTyped('');
    } else {
      const score = answers.filter((a) => a?.correct).length;
      setResult(progress.recordQuiz({ quizId, score, total: questions.length }));
      window.scrollTo({ top: 0 });
    }
  };

  const header = (
    <header className="mb-6">
      <p className="text-sm font-medium text-accent">{quizId === FINAL_ID ? 'Final assessment' : `Module ${meta?.number} quiz`}</p>
      <h1 className="text-2xl font-bold text-fg sm:text-3xl">{quizTitle(quizId)}</h1>
      <p className="mt-1 text-sm text-muted">{questions.length} questions in random order · pass mark {PASS_MARK}% · explanations after every answer</p>
    </header>
  );

  if (result) {
    const wrong = questions.map((q, i) => ({ q, a: answers[i] })).filter((x) => !x.a?.correct);
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {header}
        <section aria-live="polite" className={`rounded-2xl border p-6 text-center ${result.passed ? 'border-ok/40 bg-ok-soft' : 'border-warn/40 bg-warn-soft'}`}>
          {result.passed ? <Trophy className="mx-auto h-10 w-10 text-ok" aria-hidden="true" /> : <Award className="mx-auto h-10 w-10 text-warn" aria-hidden="true" />}
          <p className="mt-2 text-4xl font-bold text-fg">{result.percent}%</p>
          <p className="text-fg">{result.score} of {result.total} correct</p>
          <p className={`mt-2 font-semibold ${result.passed ? 'text-ok' : 'text-warn'}`}>
            {result.passed ? 'Passed! Well done.' : `Not passed yet. You need ${PASS_MARK}%. Review the explanations below and try again.`}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={start}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Retake quiz</Button>
            {meta && <ButtonLink to={`/learn/${meta.id}`}>Review module</ButtonLink>}
            <ButtonLink to="/quizzes">All quizzes</ButtonLink>
          </div>
        </section>

        {wrong.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-fg">Review your mistakes</h2>
            <ul className="mt-3 space-y-3">
              {wrong.map(({ q, a }) => (
                <li key={q.q.id} className="rounded-xl border border-line p-4">
                  <p className="font-medium text-fg"><Inline text={q.q.prompt} /></p>
                  <p className="mt-2 text-sm text-bad">Your answer: {a?.given ? <Inline text={a.given} /> : '(none)'}</p>
                  <p className="text-sm text-ok">Correct: <Inline text={q.q.kind === 'command' ? `\`${q.q.answers![0]}\`` : q.q.options![q.q.correct!]} /></p>
                  <p className="mt-1 text-sm text-fg/85"><Inline text={q.q.explanation} /></p>
                  {findModule(q.moduleId) && quizId === FINAL_ID && (
                    <Link to={`/learn/${q.moduleId}`} className="mt-1 inline-block text-xs text-accent hover:underline">Revise Module {findModule(q.moduleId)!.number}</Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        <QuizHistory history={history} />
      </div>
    );
  }

  const q = current.q;
  const canSubmit = q.kind === 'command' ? typed.trim().length > 0 : choice !== null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {header}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-inset" role="progressbar" aria-label="Quiz progress" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={questions.length}>
          <div className="h-full bg-accent transition-[width]" style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm text-muted tabular-nums">{index + 1} / {questions.length}</span>
      </div>

      <section aria-labelledby="question" className="rounded-2xl border border-line p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge tone="accent">{KIND_LABEL[q.kind]}</Badge>
          {quizId === FINAL_ID && findModule(current.moduleId) && <Badge>Module {findModule(current.moduleId)!.number}</Badge>}
        </div>
        <h2 id="question" className="text-lg font-semibold text-fg"><Inline text={q.prompt} /></h2>
        {q.code && <pre className="mt-3 overflow-x-auto rounded-lg bg-code p-3 font-mono text-[13px]">{q.code}</pre>}

        {q.kind === 'command' ? (
          <div className="mt-4">
            <label htmlFor="quiz-cmd" className="text-xs font-semibold tracking-wider text-muted uppercase">Type the command</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-line bg-term px-3 font-mono text-sm text-term-fg focus-within:border-accent">
              <span className="text-ok" aria-hidden="true">$</span>
              <input id="quiz-cmd" value={typed} disabled={!!answered} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (answered ? next() : canSubmit && submit())} spellCheck={false} autoComplete="off" autoCapitalize="off" className="h-10 flex-1 bg-transparent outline-none" autoFocus />
            </div>
          </div>
        ) : (
          <fieldset className="mt-4">
            <legend className="sr-only">Choose one answer</legend>
            <div className="space-y-2">
              {current.options!.map((opt, i) => {
                const state = answered ? (i === current.correct ? 'right' : i === choice ? 'wrong' : 'idle') : choice === i ? 'chosen' : 'idle';
                const cls = {
                  right: 'border-ok bg-ok-soft',
                  wrong: 'border-bad bg-bad-soft',
                  chosen: 'border-accent bg-accent-soft',
                  idle: 'border-line hover:bg-subtle',
                }[state];
                return (
                  <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-[15px] ${cls} ${answered ? 'cursor-default' : ''}`}>
                    <input type="radio" name="quiz-option" className="mt-1 accent-[var(--accent)]" checked={choice === i} disabled={!!answered} onChange={() => setChoice(i)} />
                    <span className="flex-1"><Inline text={opt} /></span>
                    {state === 'right' && <CheckCircle2 className="mt-0.5 h-5 w-5 text-ok" aria-label="Correct answer" />}
                    {state === 'wrong' && <XCircle className="mt-0.5 h-5 w-5 text-bad" aria-label="Your answer, incorrect" />}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <div aria-live="polite">
          {answered && (
            <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${answered.correct ? 'border-ok/40 bg-ok-soft' : 'border-bad/40 bg-bad-soft'}`}>
              <p className={`font-semibold ${answered.correct ? 'text-ok' : 'text-bad'}`}>{answered.correct ? 'Correct!' : 'Not quite.'}</p>
              {!answered.correct && q.kind === 'command' && <p className="mt-1 text-fg">Expected: <code className="prose-code">{q.answers![0]}</code></p>}
              <p className="mt-1 text-fg"><Inline text={q.explanation} /></p>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {!answered ? (
            <Button variant="primary" onClick={submit} disabled={!canSubmit}>Check answer</Button>
          ) : (
            <Button variant="primary" onClick={next} autoFocus>
              {index + 1 < questions.length ? 'Next question' : 'See results'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </section>
      <p className="mt-3 text-center text-xs text-muted">Score so far: {answers.filter((a) => a?.correct).length} correct</p>
    </div>
  );
}

export function QuizHistory({ history, showQuiz = false }: { history: QuizAttempt[]; showQuiz?: boolean }) {
  if (!history.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-fg">{showQuiz ? 'Recent attempts' : 'Attempt history'}</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-subtle text-muted">
            <tr>
              {showQuiz && <th scope="col" className="px-3 py-2 font-medium">Quiz</th>}
              <th scope="col" className="px-3 py-2 font-medium">Date</th><th scope="col" className="px-3 py-2 font-medium">Score</th><th scope="col" className="px-3 py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.date} className="border-t border-line-soft">
                {showQuiz && <td className="px-3 py-2"><Link to={`/quizzes/${h.quizId}`} className="text-accent hover:underline">{quizTitle(h.quizId)}</Link></td>}
                <td className="px-3 py-2 text-fg">{formatDate(h.date)}</td>
                <td className="px-3 py-2 text-fg tabular-nums">{h.score}/{h.total} ({h.percent}%)</td>
                <td className="px-3 py-2">{h.passed ? <Badge tone="ok">Passed</Badge> : <Badge tone="warn">Below 80%</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
