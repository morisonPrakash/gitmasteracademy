import { TerminalSquare } from 'lucide-react';
import type { CodeLang, TerminalLine } from '@/content/types';
import { CopyButton } from './CopyButton';
import { highlightLine } from './highlight';

const LANG_LABEL: Partial<Record<CodeLang, string>> = {
  bash: 'Terminal', powershell: 'PowerShell', yaml: 'YAML', ts: 'TypeScript', js: 'JavaScript',
  json: 'JSON', diff: 'Diff', ini: 'Config', markdown: 'Markdown', xml: 'XML', text: 'Text',
};

export function CodeBlock({ code, lang = 'text', title }: { code: string; lang?: CodeLang; title?: string }) {
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <figure className="my-5 overflow-hidden rounded-lg border border-line bg-code">
      <figcaption className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="font-mono text-xs text-muted">{title ?? LANG_LABEL[lang] ?? lang}</span>
        <CopyButton text={code} className="text-muted hover:bg-inset hover:text-fg" />
      </figcaption>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono">
          {lines.map((line, i) => (
            <span key={i} className="block min-h-[1.25em]">
              {highlightLine(line, lang)}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}

/** Colour common Git output the way a real terminal does. */
function colourOutput(out: string) {
  // git status prints staged paths in green and unstaged/untracked/conflicted paths in red.
  let section: 'staged' | 'unstaged' | '' = '';
  return out.split('\n').map((line, i) => {
    if (/^Changes to be committed/.test(line)) section = 'staged';
    else if (/^(Changes not staged|Untracked files|Unmerged paths)/.test(line)) section = 'unstaged';
    let cls = '';
    if (section && /^\t\S/.test(line)) cls = section === 'staged' ? 't-green' : 't-red';
    else if (/^\+(?!\+\+)/.test(line)) cls = 't-green';
    else if (/^-(?!--)/.test(line)) cls = 't-red';
    else if (/^@@/.test(line)) cls = 't-cyan';
    else if (/^(error|fatal|CONFLICT)/.test(line)) cls = 't-red';
    else if (/^(warning|hint):/.test(line)) cls = 't-yellow';
    else if (/^commit [0-9a-f]{7,40}/.test(line)) cls = 't-yellow';
    return (
      <span key={i} className={`block min-h-[1.25em] ${cls}`}>
        {line}
      </span>
    );
  });
}

export function TerminalBlock({ lines, title }: { lines: TerminalLine[]; title?: string }) {
  const commands = lines.filter((l) => l.cmd).map((l) => l.cmd!).join('\n');
  return (
    <figure className="term my-5 overflow-hidden rounded-lg border border-line bg-term text-term-fg">
      <figcaption className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="flex items-center gap-2 font-mono text-xs text-white/60">
          <TerminalSquare className="h-3.5 w-3.5" aria-hidden="true" />
          {title ?? 'Terminal'}
        </span>
        {commands && <CopyButton text={commands} label="Copy commands" className="text-white/60 hover:bg-white/10 hover:text-white" />}
      </figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        {lines.map((l, i) => (
          <span key={i} className="block">
            {l.cmd !== undefined && (
              <span className="block">
                <span className="t-prompt">{l.prompt ?? '$'} </span>
                <span className="t-cmd">{l.cmd}</span>
              </span>
            )}
            {l.out && <span className="block text-white/85">{colourOutput(l.out)}</span>}
          </span>
        ))}
      </pre>
    </figure>
  );
}
