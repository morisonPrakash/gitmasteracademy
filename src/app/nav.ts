import {
  BookMarked, FileQuestion, GitGraph, Hammer, LayoutDashboard, Library, Map, ScrollText, SquareTerminal, type LucideIcon,
} from 'lucide-react';

export type NavItem =
  | { kind: 'link'; label: string; to: string; icon: LucideIcon }
  | { kind: 'module'; moduleId: string; label?: string }
  | { kind: 'section'; label: string };

// Order follows section 11 of the brief. "Existing Projects" (module 13) sits with the
// professional workflow so every module is reachable from the sidebar.
export const NAV: NavItem[] = [
  { kind: 'link', label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { kind: 'link', label: 'Learning Roadmap', to: '/roadmap', icon: Map },
  { kind: 'section', label: 'Learn' },
  { kind: 'module', moduleId: 'm01' },
  { kind: 'module', moduleId: 'm02' },
  { kind: 'module', moduleId: 'm03' },
  { kind: 'module', moduleId: 'm04' },
  { kind: 'module', moduleId: 'm05' },
  { kind: 'module', moduleId: 'm06' },
  { kind: 'module', moduleId: 'm07' },
  { kind: 'module', moduleId: 'm08' },
  { kind: 'module', moduleId: 'm09' },
  { kind: 'module', moduleId: 'm10' },
  { kind: 'module', moduleId: 'm11' },
  { kind: 'module', moduleId: 'm12' },
  { kind: 'module', moduleId: 'm13' },
  { kind: 'module', moduleId: 'm14' },
  { kind: 'section', label: 'Practice' },
  { kind: 'link', label: 'Interactive Git Terminal', to: '/terminal', icon: SquareTerminal },
  { kind: 'link', label: 'Git Visualizer', to: '/visualizer', icon: GitGraph },
  { kind: 'link', label: 'Practical Projects', to: '/projects', icon: Hammer },
  { kind: 'link', label: 'Quizzes', to: '/quizzes', icon: FileQuestion },
  { kind: 'section', label: 'Reference' },
  { kind: 'link', label: 'Git Cheat Sheet', to: '/cheatsheet', icon: ScrollText },
  { kind: 'link', label: 'Glossary', to: '/glossary', icon: Library },
  { kind: 'link', label: 'Resources', to: '/resources', icon: BookMarked },
];
