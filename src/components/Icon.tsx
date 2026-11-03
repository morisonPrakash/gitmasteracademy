import {
  BookOpen, Building2, Cloud, Download, FolderGit2, GitBranch, GitMerge, GitPullRequest,
  Network, Rocket, ShieldCheck, Terminal, Workflow, Wrench, type LucideIcon,
} from 'lucide-react';

// Module icons are stored as names in the catalog; this maps them to components
// and keeps the bundle limited to icons we actually use.
const ICONS: Record<string, LucideIcon> = {
  BookOpen, Building2, Cloud, Download, FolderGit2, GitBranch, GitMerge, GitPullRequest,
  Network, Rocket, ShieldCheck, Terminal, Workflow, Wrench,
};

export function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? BookOpen;
  return <Cmp className={className} aria-hidden="true" />;
}
