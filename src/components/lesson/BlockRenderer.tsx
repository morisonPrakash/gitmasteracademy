import {
  AlertTriangle, BadgeCheck, CheckCircle2, FlaskConical, Info, Lightbulb, OctagonAlert, Sparkles, XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Block, CalloutKind, CommandRef, TimelineItem } from '@/content/types';
import { slugify } from '@/lib/text';
import { Inline } from '../Inline';
import { Diagram } from '../diagrams/Diagram';
import { CodeBlock, TerminalBlock } from './CodeBlocks';

const CALLOUT: Record<CalloutKind, { label: string; icon: typeof Info; cls: string }> = {
  note: { label: 'Note', icon: Info, cls: 'border-accent/40 bg-accent-soft text-accent' },
  tip: { label: 'Tip', icon: Lightbulb, cls: 'border-ok/40 bg-ok-soft text-ok' },
  warning: { label: 'Warning', icon: AlertTriangle, cls: 'border-warn/50 bg-warn-soft text-warn' },
  danger: { label: 'Destructive command', icon: OctagonAlert, cls: 'border-bad/50 bg-bad-soft text-bad' },
  example: { label: 'Example', icon: FlaskConical, cls: 'border-done/40 bg-done-soft text-done' },
  best: { label: 'Best practice', icon: BadgeCheck, cls: 'border-ok/40 bg-ok-soft text-ok' },
};

export function Callout({ kind, title, children }: { kind: CalloutKind; title?: string; children: ReactNode }) {
  const c = CALLOUT[kind];
  const Icon = c.icon;
  return (
    <aside className={`my-5 rounded-lg border-l-4 px-4 py-3 ${c.cls}`} role={kind === 'danger' ? 'alert' : 'note'}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {title ?? c.label}
      </p>
      <div className="mt-1 text-[15px] leading-relaxed text-fg">{children}</div>
    </aside>
  );
}

export function headingId(text: string) {
  return slugify(text);
}

function CommandCard({ cmd }: { cmd: CommandRef }) {
  const section = (title: string, body: ReactNode) => (
    <div className="border-t border-line-soft px-5 py-4">
      <h4 className="mb-1.5 text-xs font-semibold tracking-wider text-muted uppercase">{title}</h4>
      <div className="text-[15px] leading-relaxed text-fg">{body}</div>
    </div>
  );
  return (
    <section className="my-6 overflow-hidden rounded-xl border border-line" aria-label={`${cmd.name} reference`}>
      <div className="bg-subtle px-5 py-3">
        <p className="font-mono text-base font-semibold text-fg">{cmd.name}</p>
      </div>
      {section('1. What it does', <Inline text={cmd.what} />)}
      {section('2. Why developers use it', <Inline text={cmd.why} />)}
      {section('3. When to use it', <Inline text={cmd.when} />)}
      {section(
        '4. Syntax',
        <div className="-my-3">
          <CodeBlock code={cmd.syntax.join('\n')} lang="bash" title="Syntax" />
        </div>,
      )}
      {section(
        '5–6. Example and expected output',
        <div className="-my-3">
          <TerminalBlock lines={cmd.example} title="Example" />
        </div>,
      )}
      {section(
        '7. Common mistakes',
        <ul className="space-y-1.5">
          {cmd.mistakes.map((m, i) => (
            <li key={i} className="flex gap-2">
              <XCircle className="mt-1 h-4 w-4 shrink-0 text-bad" aria-hidden="true" />
              <span><Inline text={m} /></span>
            </li>
          ))}
        </ul>,
      )}
      {section(
        '8. Best practices',
        <ul className="space-y-1.5">
          {cmd.best.map((m, i) => (
            <li key={i} className="flex gap-2">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
              <span><Inline text={m} /></span>
            </li>
          ))}
        </ul>,
      )}
    </section>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative my-6 ml-3 border-l-2 border-line">
      {items.map((t) => (
        <li key={t.step} className="mb-6 ml-6 last:mb-0">
          <span className="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-canvas bg-accent text-[11px] font-bold text-accent-fg">
            {t.step}
          </span>
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">{t.role}</p>
          <p className="font-semibold text-fg">{t.title}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-fg/90"><Inline text={t.text} /></p>
          {t.terminal && <TerminalBlock lines={t.terminal} />}
        </li>
      ))}
    </ol>
  );
}

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading': {
      const id = headingId(block.text);
      return block.level === 3 ? (
        <h3 id={id} className="mt-8 mb-3 scroll-mt-20 text-lg font-semibold text-fg">
          <Inline text={block.text} />
        </h3>
      ) : (
        <h2 id={id} className="mt-10 mb-4 scroll-mt-20 border-b border-line-soft pb-2 text-2xl font-bold tracking-tight text-fg">
          <Inline text={block.text} />
        </h2>
      );
    }
    case 'p':
      return <p className="my-4 text-[16px] leading-7 text-fg/90"><Inline text={block.text} /></p>;
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag className={`my-4 space-y-2 pl-6 text-[16px] leading-7 text-fg/90 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-muted`}>
          {block.items.map((it, i) => (
            <li key={i} className="pl-1"><Inline text={it} /></li>
          ))}
        </Tag>
      );
    }
    case 'analogy':
      return (
        <aside className="my-6 rounded-xl border border-done/30 bg-done-soft px-5 py-4" role="note">
          <p className="flex items-center gap-2 text-sm font-semibold text-done">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {block.title ?? 'Real-life analogy'}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-fg"><Inline text={block.text} /></p>
        </aside>
      );
    case 'definition':
      return (
        <dl className="my-4 rounded-lg border border-line bg-subtle px-4 py-3">
          <dt className="text-sm font-semibold text-fg">
            <span className="mr-2 rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent uppercase">Term</span>
            <Inline text={block.term} />
          </dt>
          <dd className="mt-1.5 text-[15px] leading-relaxed text-fg/90"><Inline text={block.text} /></dd>
        </dl>
      );
    case 'code':
      return <CodeBlock code={block.code} lang={block.lang} title={block.title} />;
    case 'terminal':
      return <TerminalBlock lines={block.lines} title={block.title} />;
    case 'callout':
      return (
        <Callout kind={block.kind} title={block.title}>
          <Inline text={block.text} />
        </Callout>
      );
    case 'table':
      return (
        <div className="my-6 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            {block.caption && <caption className="px-3 py-2 text-left text-xs text-muted">{block.caption}</caption>}
            <thead className="bg-subtle">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} scope="col" className="border-b border-line px-3 py-2 font-semibold text-fg">
                    <Inline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0 even:bg-subtle/50">
                  {r.map((c, j) => (
                    <td key={j} className={`px-3 py-2 align-top text-fg/90 ${j === 0 ? 'font-medium text-fg' : ''}`}>
                      <Inline text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'steps':
      return (
        <ol className="my-6 space-y-5">
          {block.items.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-fg"><Inline text={s.title} /></p>
                {s.text && <p className="mt-1 text-[15px] leading-relaxed text-fg/90"><Inline text={s.text} /></p>}
                {s.terminal && <TerminalBlock lines={s.terminal} />}
              </div>
            </li>
          ))}
        </ol>
      );
    case 'diagram':
      return <Diagram name={block.name} caption={block.caption} />;
    case 'command':
      return <CommandCard cmd={block.ref} />;
    case 'annotated':
      return <Annotated block={block} />;
    case 'roles':
      return (
        <div className="my-6 grid gap-3 sm:grid-cols-2">
          {block.items.map((r) => (
            <div key={r.role} className="rounded-lg border border-line bg-subtle px-4 py-3">
              <p className="font-semibold text-fg">{r.role}</p>
              <p className="mt-1 text-sm leading-relaxed text-fg/85"><Inline text={r.text} /></p>
            </div>
          ))}
        </div>
      );
    case 'timeline':
      return <Timeline items={block.items} />;
  }
}

function Annotated({ block }: { block: Extract<Block, { type: 'annotated' }> }) {
  const lines = block.code.replace(/\n$/, '').split('\n');
  const notes = new Map(block.notes.map((n) => [n.line, n.text]));
  return (
    <div className="my-6">
      <CodeBlock code={block.code} lang={block.lang} title={block.title} />
      <div className="overflow-hidden rounded-lg border border-line">
        <p className="bg-subtle px-4 py-2 text-xs font-semibold tracking-wider text-muted uppercase">Line-by-line explanation</p>
        <ol className="divide-y divide-line-soft">
          {lines.map((code, i) =>
            notes.has(i + 1) ? (
              <li key={i} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
                <code className="font-mono text-[12.5px] break-all whitespace-pre-wrap text-fg">
                  <span className="mr-2 text-muted select-none">{i + 1}</span>
                  {code.trim()}
                </code>
                <span className="text-sm leading-relaxed text-fg/90"><Inline text={notes.get(i + 1)!} /></span>
              </li>
            ) : null,
          )}
        </ol>
      </div>
    </div>
  );
}
