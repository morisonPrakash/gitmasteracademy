import { useSyncExternalStore } from 'react';
import { readJSON, writeJSON } from '@/store/storage';
import { emptyRepo } from './repo';
import { findScenario } from './scenarios';
import type { Repo } from './types';

// The terminal and visualizer share one simulated repository, saved per browser.

export const SESSION_KEY = 'gma:sim';

export interface HistoryEntry {
  input: string;
  output: string;
  ok: boolean;
  explain: string[];
}

export interface Session {
  version: 1;
  scenario: string;
  repo: Repo;
  history: HistoryEntry[];
}

const MAX_HISTORY = 200;

function fresh(scenarioId = 'playground'): Session {
  const s = findScenario(scenarioId);
  return { version: 1, scenario: s ? s.id : 'playground', repo: s ? s.build() : emptyRepo(), history: [] };
}

function load(): Session {
  const saved = readJSON<Session>(SESSION_KEY);
  return saved && saved.version === 1 && saved.repo ? saved : fresh();
}

let state: Session = load();
const listeners = new Set<() => void>();

function set(next: Session) {
  state = next;
  writeJSON(SESSION_KEY, state);
  listeners.forEach((l) => l());
}

export const session = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  record(input: string, repo: Repo, entry: Omit<HistoryEntry, 'input'>, clear = false) {
    const history = clear ? [] : [...state.history, { input, ...entry }].slice(-MAX_HISTORY);
    set({ ...state, repo, history });
  },
  setRepo(repo: Repo, note?: HistoryEntry) {
    set({ ...state, repo, history: note ? [...state.history, note].slice(-MAX_HISTORY) : state.history });
  },
  start(scenarioId: string) {
    set(fresh(scenarioId));
  },
  reset() {
    set(fresh(state.scenario));
  },
  reload() {
    state = load();
    listeners.forEach((l) => l());
  },
};

export function useSession(): Session {
  return useSyncExternalStore(session.subscribe, session.get, session.get);
}
