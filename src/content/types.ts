// Content model for GitMaster Academy.
// Every lesson is plain typed data: a list of blocks rendered by BlockRenderer.
// Inline text in any string field supports `code`, **bold** and [label](url).

export type Level = 1 | 2 | 3 | 4 | 5;

export interface Source {
  title: string;
  url: string;
}

export type CalloutKind = 'note' | 'tip' | 'warning' | 'danger' | 'example' | 'best';

export type CodeLang =
  | 'bash'
  | 'powershell'
  | 'yaml'
  | 'ts'
  | 'js'
  | 'json'
  | 'text'
  | 'diff'
  | 'ini'
  | 'markdown'
  | 'xml';

/** One line typed at a prompt plus what the terminal printed back. */
export interface TerminalLine {
  cmd?: string;
  out?: string;
  /** Optional prompt override, e.g. "PS C:\\project>" */
  prompt?: string;
}

/** The 8-part command reference the curriculum uses for every essential command. */
export interface CommandRef {
  name: string;
  what: string;
  why: string;
  when: string;
  syntax: string[];
  example: TerminalLine[];
  mistakes: string[];
  best: string[];
}

export type DiagramName =
  | 'three-areas'
  | 'lifecycle'
  | 'centralized-vs-distributed'
  | 'snapshots'
  | 'head-pointer'
  | 'branch-basic'
  | 'fast-forward'
  | 'three-way'
  | 'local-remote'
  | 'fetch-vs-pull'
  | 'pr-flow'
  | 'rebase'
  | 'reset-modes'
  | 'git-flow'
  | 'github-flow'
  | 'trunk-based'
  | 'ci-pipeline'
  | 'company-lifecycle'
  | 'qa-workflow'
  | 'fork-flow'
  | 'conflict';

export interface TimelineItem {
  step: number;
  role: string;
  title: string;
  text: string;
  terminal?: TerminalLine[];
}

export type Block =
  | { type: 'heading'; text: string; level?: 2 | 3 }
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'analogy'; title?: string; text: string }
  | { type: 'definition'; term: string; text: string }
  | { type: 'code'; code: string; lang?: CodeLang; title?: string }
  | { type: 'terminal'; title?: string; lines: TerminalLine[] }
  | { type: 'callout'; kind: CalloutKind; title?: string; text: string }
  | { type: 'table'; headers: string[]; rows: string[][]; caption?: string }
  | { type: 'steps'; items: { title: string; text?: string; terminal?: TerminalLine[] }[] }
  | { type: 'diagram'; name: DiagramName; caption?: string }
  | { type: 'command'; ref: CommandRef }
  | { type: 'annotated'; title?: string; lang: CodeLang; code: string; notes: { line: number; text: string }[] }
  | { type: 'roles'; items: { role: string; text: string }[] }
  | { type: 'timeline'; items: TimelineItem[] };

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type ExerciseCheck =
  /** Learner types a command; compared after normalising whitespace and quotes. */
  | { type: 'command'; answers: string[] }
  /** Learner picks one option. */
  | { type: 'choice'; options: string[]; correct: number }
  /** Learner puts items in order; `items` is the correct order and is shuffled for display. */
  | { type: 'order'; items: string[] }
  /** Learner works in the Git simulator; `goal` is checked against simulator state. */
  | { type: 'sim'; scenario: string; goal: string };

export interface Exercise {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: 'command' | 'scenario' | 'troubleshooting' | 'concept';
  problem: string;
  start: string;
  expected: string;
  hints: string[];
  check: ExerciseCheck;
  answer: string;
  explanation: string;
}

export interface Lesson {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  blocks: Block[];
  exercises: Exercise[];
  sources: Source[];
}

export type QuestionKind = 'mcq' | 'command' | 'scenario' | 'troubleshooting';

export interface Question {
  id: string;
  kind: QuestionKind;
  prompt: string;
  code?: string;
  /** For mcq/scenario/troubleshooting */
  options?: string[];
  correct?: number;
  /** For command questions: accepted typed answers */
  answers?: string[];
  explanation: string;
}

/** Full content for one module, loaded lazily. */
export interface ModuleContent {
  id: string;
  lessons: Lesson[];
  quiz: Question[];
}

/** Lightweight metadata used by the sidebar, dashboard and roadmap without loading content. */
export interface LessonMeta {
  slug: string;
  title: string;
}

export interface ModuleMeta {
  id: string; // m01..m14
  number: number;
  level: Level;
  title: string;
  navTitle: string;
  description: string;
  icon: string; // lucide icon name, resolved in the UI
  lessons: LessonMeta[];
}

export interface CheatEntry {
  command: string;
  description: string;
  danger?: boolean;
}

export interface CheatCategory {
  id: string;
  title: string;
  entries: CheatEntry[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  related?: string[];
}

export interface ProjectStep {
  title: string;
  role?: string;
  text?: string;
  terminal?: TerminalLine[];
  callout?: { kind: CalloutKind; text: string };
}

export interface Project {
  slug: string;
  number: number;
  title: string;
  summary: string;
  skills: string[];
  roles: string[];
  steps: ProjectStep[];
}
