// Data model for the in-browser Git simulation. Everything is plain JSON so a whole
// repository can be cloned with structuredClone and saved to localStorage.

export type Tree = Record<string, string>; // path -> file content

export interface Commit {
  id: string; // 7-char hex
  parents: string[];
  message: string;
  tree: Tree;
  author: string;
  time: number; // logical clock, increases with every commit
}

export type Head = { type: 'branch'; name: string } | { type: 'detached'; id: string };

export interface StashEntry {
  message: string;
  branch: string;
  base: string;
  files: Tree;
  index: Tree;
}

export interface MergeState {
  kind: 'merge';
  theirs: string;
  theirsName: string;
  conflicts: string[];
  message: string;
}

/** The shared "GitHub" copy. Commits live in the same object store as the local repo. */
export interface Server {
  url: string;
  branches: Record<string, string>;
  tags: Record<string, string>;
}

export interface Repo {
  initialized: boolean;
  cwdName: string;
  files: Tree; // working directory
  index: Tree; // staging area (full snapshot, like .git/index)
  commits: Record<string, Commit>;
  branches: Record<string, string>;
  head: Head;
  tags: Record<string, { id: string; message?: string }>;
  stash: StashEntry[];
  reflog: { id: string; action: string }[];
  remotes: Record<string, string>; // name -> url
  server?: Server; // the remote side, if any
  tracking: Record<string, string>; // 'origin/main' -> commit id (local knowledge)
  upstream: Record<string, string>; // local branch -> 'origin/main'
  merge?: MergeState;
  clock: number;
  prevBranch?: string;
}

export interface RunResult {
  repo: Repo;
  output: string;
  ok: boolean;
  /** Plain-English description of what changed inside Git. */
  explain: string[];
  clear?: boolean;
}
