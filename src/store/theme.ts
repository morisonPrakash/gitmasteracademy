import { useSyncExternalStore } from 'react';
import { readString, writeString } from './storage';

export type Theme = 'light' | 'dark';
const KEY = 'gma:theme';
const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  writeString(KEY, theme);
  listeners.forEach((l) => l());
}

export function toggleTheme() {
  setTheme(current() === 'dark' ? 'light' : 'dark');
}

export function savedTheme(): Theme | undefined {
  const t = readString(KEY);
  return t === 'dark' || t === 'light' ? t : undefined;
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    current,
    () => 'light',
  );
}
