import { Cloud, FileText, GitBranch, HardDrive, Layers } from 'lucide-react';
import type { ReactNode } from 'react';
import { GraphDiagram } from '@/components/diagrams/GraphDiagram';
import { layoutRepo } from '@/engine/graph/layout';
import { diffTrees, headCommitId, headTree, short } from '@/engine/git/repo';
import type { Repo } from '@/engine/git/types';

export function RepoGraph({ repo, includeRemote = false, maxCommits = 30 }: { repo: Repo; includeRemote?: boolean; maxCommits?: number }) {
  const spec = layoutRepo(repo, { includeRemote, maxCommits });
  if (!spec) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted">
        {repo.initialized ? 'No commits yet. Create a file, git add it and git commit to see your first commit appear here.' : 'No repository yet. Run git init (or git clone https://github.com/acme/shop.git) to begin.'}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto" tabIndex={0} aria-label="Commit graph, scrollable">
      <GraphDiagram spec={spec} natural />
    </div>
  );
}

function Column({ title, icon, sub, children }: { title: string; icon: ReactNode; sub: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-canvas p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-fg">{icon}{title}</p>
      <p className="mb-2 text-[11px] text-muted">{sub}</p>
      <div className="space-y-1 font-mono text-[12px]">{children}</div>
    </div>
  );
}

const pill = (tone: string, text: string) => <span className={`rounded px-1 text-[10px] font-semibold ${tone}`}>{text}</span>;

/** The four places your work can live: working directory, staging area, local repository, remote. */
export function AreasPanel({ repo }: { repo: Repo }) {
  const head = headTree(repo);
  const conflicts = repo.merge?.conflicts ?? [];
  const files = Object.keys(repo.files).sort();
  const staged = diffTrees(head, repo.index);
  const headId = headCommitId(repo);
  const none = <p className="text-muted">(empty)</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      <Column title="Working directory" sub="Files on disk" icon={<FileText className="h-4 w-4 text-warn" aria-hidden="true" />}>
        {files.length ? files.map((f) => {
          const tracked = f in repo.index;
          const status = conflicts.includes(f) ? pill('bg-bad-soft text-bad', 'conflict')
            : !tracked ? pill('bg-bad-soft text-bad', 'untracked')
            : repo.files[f] !== repo.index[f] ? pill('bg-warn-soft text-warn', 'modified')
            : null;
          return <p key={f} className="flex items-center justify-between gap-2 truncate"><span className="truncate">{f}</span>{status}</p>;
        }) : none}
      </Column>
      <Column title="Staging area" sub="Next commit will contain" icon={<Layers className="h-4 w-4 text-ok" aria-hidden="true" />}>
        {staged.length ? staged.map((c) => (
          <p key={c.path} className="flex items-center justify-between gap-2"><span className="truncate">{c.path}</span>{pill('bg-ok-soft text-ok', c.kind === 'new file' ? 'new' : c.kind)}</p>
        )) : <p className="text-muted">nothing staged</p>}
      </Column>
      <Column title="Local repository" sub=".git on your computer" icon={<HardDrive className="h-4 w-4 text-accent" aria-hidden="true" />}>
        <p>HEAD → <span className="font-semibold text-accent">{repo.head.type === 'branch' ? repo.head.name : `detached ${short(repo.head.id)}`}</span></p>
        {Object.entries(repo.branches).sort().map(([b, id]) => (
          <p key={b} className="flex items-center gap-1 truncate"><GitBranch className="h-3 w-3 shrink-0 text-muted" aria-hidden="true" />{b} <span className="text-muted">{short(id)}</span></p>
        ))}
        {!headId && <p className="text-muted">no commits yet</p>}
        {repo.stash.length > 0 && <p className="text-done">stash: {repo.stash.length} entr{repo.stash.length === 1 ? 'y' : 'ies'}</p>}
        {repo.merge && <p className="text-bad">merging {repo.merge.theirsName}</p>}
      </Column>
      <Column title="Remote (GitHub)" sub={repo.server ? repo.server.url.replace('https://', '') : 'no remote configured'} icon={<Cloud className="h-4 w-4 text-done" aria-hidden="true" />}>
        {repo.server && Object.keys(repo.server.branches).length ? Object.entries(repo.server.branches).sort().map(([b, id]) => {
          const known = repo.tracking[`origin/${b}`];
          return (
            <p key={b} className="flex items-center justify-between gap-2"><span className="truncate">{b} <span className="text-muted">{short(id)}</span></span>{known !== id && pill('bg-done-soft text-done', known ? 'new commits' : 'not fetched')}</p>
          );
        }) : none}
      </Column>
    </div>
  );
}
