import type { ReactNode } from 'react';
import type { CodeLang } from '@/content/types';

// A deliberately tiny highlighter: enough colour to make commands and YAML readable
// without shipping a full syntax-highlighting library.

type Rule = [RegExp, string];

const SHELL: Rule[] = [
  [/^#.*$/, 'tok-comment'],
  [/^"(?:[^"\\]|\\.)*"|^'[^']*'/, 'tok-string'],
  [/^(?:git|gh|npm|npx|cd|mkdir|echo|cat|ls|code|brew|sudo|apt|winget|dnf|node)\b/, 'tok-keyword'],
  [/^--?[A-Za-z][\w-]*/, 'tok-flag'],
];

const YAML: Rule[] = [
  [/^#.*$/, 'tok-comment'],
  [/^"(?:[^"\\]|\\.)*"|^'[^']*'/, 'tok-string'],
  [/^\$\{\{[^}]*\}\}/, 'tok-flag'],
  [/^\b\d+(?:\.\d+)?\b/, 'tok-number'],
  [/^\b(?:true|false|null)\b/, 'tok-keyword'],
];

const CODE: Rule[] = [
  [/^\/\/.*$/, 'tok-comment'],
  [/^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'|^`[^`]*`/, 'tok-string'],
  [/^\b(?:import|from|export|const|let|await|async|function|return|test|expect|describe|it|if|else|new|default)\b/, 'tok-keyword'],
  [/^\b\d+\b/, 'tok-number'],
];

function tokenize(line: string, rules: Rule[], keyRule?: RegExp): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = line;
  let plain = '';
  let k = 0;
  if (keyRule) {
    const m = rest.match(keyRule);
    if (m) {
      out.push(<span key={k++} className="tok-key">{m[0]}</span>);
      rest = rest.slice(m[0].length);
    }
  }
  let atWordStart = true;
  while (rest.length) {
    let matched = false;
    for (const [re, cls] of rules) {
      if (cls === 'tok-flag' && !atWordStart && !re.source.startsWith('^\\$')) continue;
      const m = rest.match(re);
      if (m && m[0].length) {
        if (plain) {
          out.push(plain);
          plain = '';
        }
        out.push(<span key={k++} className={cls}>{m[0]}</span>);
        rest = rest.slice(m[0].length);
        matched = true;
        atWordStart = false;
        break;
      }
    }
    if (!matched) {
      atWordStart = /\s/.test(rest[0]);
      plain += rest[0];
      rest = rest.slice(1);
    }
  }
  if (plain) out.push(plain);
  return out;
}

export function highlightLine(line: string, lang: CodeLang = 'text'): ReactNode[] {
  switch (lang) {
    case 'bash':
    case 'powershell':
      return tokenize(line, SHELL);
    case 'yaml':
      return tokenize(line, YAML, /^\s*(?:-\s+)?[\w.-]+(?=:(?:\s|$))/);
    case 'ts':
    case 'js':
    case 'json':
      return tokenize(line, CODE);
    case 'ini':
      return tokenize(line, [[/^[#;].*$/, 'tok-comment'], [/^\[[^\]]+\]/, 'tok-keyword']], /^\s*[\w.-]+(?=\s*=)/);
    case 'diff':
      if (line.startsWith('+')) return [<span key="d" className="text-ok">{line}</span>];
      if (line.startsWith('-')) return [<span key="d" className="text-bad">{line}</span>];
      if (line.startsWith('@@')) return [<span key="d" className="tok-flag">{line}</span>];
      return [line];
    default:
      return [line];
  }
}
