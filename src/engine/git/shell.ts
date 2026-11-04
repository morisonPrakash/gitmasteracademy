import { SUPPORTED, git, teammatePush } from './commands';
import { conflictText } from './merge';
import { clone, emptyRepo } from './repo';
import type { Repo, RunResult } from './types';

// The terminal accepts Git commands plus a handful of safe shell helpers that only
// touch the simulated working directory. Nothing here can reach the real computer.

/** Split a command line into words, honouring single and double quotes and > / >> redirection. */
export function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  let hasToken = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"' && line[i + 1] === 'n') {
        cur += '\n';
        i++;
      } else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      hasToken = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (hasToken || cur) out.push(cur);
      cur = '';
      hasToken = false;
      continue;
    }
    if (ch === '>') {
      if (hasToken || cur) out.push(cur);
      cur = '';
      hasToken = false;
      if (line[i + 1] === '>') {
        out.push('>>');
        i++;
      } else out.push('>');
      continue;
    }
    cur += ch;
  }
  if (hasToken || cur) out.push(cur);
  return out;
}

function result(repo: Repo, output: string, explain: string[] = [], ok = true): RunResult {
  return { repo, output, ok, explain };
}

const SHELL_HELP = 'Shell helpers: ls, cat <file>, echo "text" > file, echo "text" >> file, touch <file>, rm <file>, edit <file>, resolve <file> ours|theirs|both, teammate push [branch], pwd, clear, help';

function shell(repoIn: Repo, words: string[]): RunResult {
  const [cmd, ...args] = words;
  const repo = clone(repoIn);
  switch (cmd) {
    case 'help':
      return git(repo, ['help']);
    case 'clear':
      return { ...result(repo, ''), clear: true };
    case 'pwd':
      return result(repo, `/home/you/${repo.cwdName}`);
    case 'ls': {
      const names = Object.keys(repo.files).sort();
      const all = args.includes('-a') || args.includes('-la');
      return result(repo, [...(all && repo.initialized ? ['.git'] : []), ...names].join('  '), ['Listed the files in the working directory.']);
    }
    case 'cat': {
      const f = args[0];
      if (!f) return result(repo, 'cat: missing file operand', [], false);
      if (!(f in repo.files)) return result(repo, `cat: ${f}: No such file or directory`, [], false);
      return result(repo, repo.files[f].replace(/\n$/, ''));
    }
    case 'touch': {
      for (const f of args) if (!(f in repo.files)) repo.files[f] = '';
      return result(repo, '', [`Created ${args.join(', ')} in the working directory. Git sees new files as untracked until you git add them.`]);
    }
    case 'echo': {
      const op = args.findIndex((a) => a === '>' || a === '>>');
      if (op < 0) return result(repo, args.join(' '));
      const text = args.slice(0, op).join(' ');
      const file = args[op + 1];
      if (!file) return result(repo, 'bash: syntax error near unexpected token `newline\'', [], false);
      const existed = file in repo.files;
      repo.files[file] = args[op] === '>>' ? (repo.files[file] ?? '') + text + '\n' : text + '\n';
      return result(repo, '', [`${args[op] === '>>' ? 'Appended a line to' : existed ? 'Overwrote' : 'Created'} ${file} in the working directory. Only your file changed; Git has not recorded anything yet.`]);
    }
    case 'edit': {
      const f = args[0];
      if (!f) return result(repo, 'edit: missing file name', [], false);
      repo.files[f] = (repo.files[f] ?? '') + `edited line ${Object.keys(repo.commits).length + 1}\n`;
      return result(repo, '', [`Simulated editing ${f}: a line was added. Check it with cat ${f} or git diff.`]);
    }
    case 'rm': {
      const files = args.filter((a) => !a.startsWith('-'));
      for (const f of files) {
        if (!(f in repo.files)) return result(repo, `rm: cannot remove '${f}': No such file or directory`, [], false);
        delete repo.files[f];
      }
      return result(repo, '', [`Deleted ${files.join(', ')} from the working directory. If tracked, git status now shows it as deleted.`]);
    }
    case 'teammate': {
      // Simulation-only helper: a colleague pushes a commit to the remote.
      if (args[0] !== 'push') return result(repo, 'usage: teammate push [branch]', [], false);
      if (!repo.server) return result(repo, 'teammate: there is no remote yet. Try git clone https://github.com/acme/shop.git first.', [], false);
      const branchName = args[1] ?? 'main';
      const n = Object.keys(repo.commits).length + 1;
      const next = teammatePush(repo, branchName, `notes-${n}.txt`, `Teammate change ${n}\n`, `Teammate: add notes ${n}`);
      return result(next, `(simulation) Rahul pushed a commit to origin/${branchName}.`, [`A teammate pushed a new commit to ${branchName} on GitHub. You will not see it until you git fetch or git pull.`]);
    }
    case 'resolve': {
      const [f, side = 'both'] = args;
      const m = repo.merge;
      if (!m || !m.conflicts.includes(f)) return result(repo, `resolve: ${f ?? '(no file)'} is not in conflict`, [], false);
      const content = repo.files[f] ?? '';
      const match = content.match(/<<<<<<< [^\n]*\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> [^\n]*\n?/);
      if (!match) return result(repo, `resolve: no conflict markers found in ${f}`, [], false);
      const pick = side === 'ours' ? match[1] : side === 'theirs' ? match[2] : match[1] + match[2];
      repo.files[f] = content.replace(match[0], pick);
      return result(repo, '', [`Edited ${f}: kept ${side === 'both' ? 'both sides (ours first)' : `the ${side} side`} and removed the conflict markers. Now run git add ${f} to mark it resolved, then git commit.`]);
    }
    default:
      return result(repo, `${cmd}: command not found\nThis is a safe Git simulation, not a real shell. Type "help" to see supported commands.\n${SHELL_HELP}`, [], false);
  }
}

/** Run one line of input. Supports chaining with && (stops at the first failure). */
export function run(repo: Repo, line: string): RunResult {
  const segments = line.split('&&').map((s) => s.trim()).filter(Boolean);
  let state = repo;
  const outputs: string[] = [];
  const explain: string[] = [];
  let ok = true;
  let clear = false;
  for (const seg of segments) {
    const words = tokenize(seg);
    if (!words.length) continue;
    let r: RunResult;
    if (words[0] === 'git') r = git(state, words.slice(1));
    else if (words[0] === 'cd') {
      r = result(state, words[1] && words[1] !== state.cwdName && words[1] !== '.' ? `cd: this simulation has a single project folder (${state.cwdName}).` : '');
    } else r = shell(state, words);
    state = r.repo;
    if (r.output) outputs.push(r.output);
    explain.push(...r.explain);
    if (r.clear) clear = true;
    if (!r.ok) {
      ok = false;
      break;
    }
  }
  return { repo: state, output: outputs.join('\n'), ok, explain, clear };
}

/** Run several commands silently (used to build exercise scenarios). */
export function runAll(repo: Repo, lines: string[]): Repo {
  let state = repo;
  for (const l of lines) {
    const r = run(state, l);
    state = r.repo;
  }
  return state;
}

export function freshRepo(): Repo {
  return emptyRepo();
}

export { SUPPORTED, conflictText };
