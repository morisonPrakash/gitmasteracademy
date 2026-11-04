import { MODULES } from '@/content/catalog';
import { CHEATSHEET } from '@/content/cheatsheet';
import { GLOSSARY } from '@/content/glossary';
import { PROJECTS } from '@/content/projects';
import { loadAllModules } from '@/content/registry';
import type { Block } from '@/content/types';
import { plain } from '@/lib/text';

export interface SearchDoc {
  id: string;
  kind: 'lesson' | 'module' | 'page';
  title: string;
  context: string; // module name or section
  to: string;
  body: string; // lowercased searchable text
  rawBody: string;
}

function blockToText(b: Block): string {
  switch (b.type) {
    case 'heading':
    case 'p':
      return b.text;
    case 'list':
      return b.items.join(' ');
    case 'analogy':
      return `${b.title ?? ''} ${b.text}`;
    case 'definition':
      return `${b.term} ${b.text}`;
    case 'code':
    case 'annotated':
      return b.code;
    case 'terminal':
      return b.lines.map((l) => l.cmd ?? '').join(' ');
    case 'callout':
      return `${b.title ?? ''} ${b.text}`;
    case 'table':
      return [...b.headers, ...b.rows.flat()].join(' ');
    case 'steps':
      return b.items.map((s) => `${s.title} ${s.text ?? ''}`).join(' ');
    case 'command':
      return `${b.ref.name} ${b.ref.what} ${b.ref.why} ${b.ref.syntax.join(' ')}`;
    case 'roles':
      return b.items.map((r) => `${r.role} ${r.text}`).join(' ');
    case 'timeline':
      return b.items.map((t) => `${t.role} ${t.title} ${t.text}`).join(' ');
    default:
      return '';
  }
}

const STATIC_PAGES: Omit<SearchDoc, 'body' | 'rawBody'>[] = [
  { id: 'p-dash', kind: 'page', title: 'Dashboard', context: 'Page', to: '/' },
  { id: 'p-road', kind: 'page', title: 'Learning Roadmap', context: 'Page', to: '/roadmap' },
  { id: 'p-term', kind: 'page', title: 'Interactive Git Terminal', context: 'Practice', to: '/terminal' },
  { id: 'p-vis', kind: 'page', title: 'Git Visualizer', context: 'Practice', to: '/visualizer' },
  { id: 'p-proj', kind: 'page', title: 'Practical Projects', context: 'Practice', to: '/projects' },
  { id: 'p-quiz', kind: 'page', title: 'Quizzes and Final Assessment', context: 'Practice', to: '/quizzes' },
  { id: 'p-cheat', kind: 'page', title: 'Git Cheat Sheet', context: 'Reference', to: '/cheatsheet' },
  { id: 'p-gloss', kind: 'page', title: 'Glossary', context: 'Reference', to: '/glossary' },
  { id: 'p-res', kind: 'page', title: 'Resources', context: 'Reference', to: '/resources' },
  { id: 'p-book', kind: 'page', title: 'Bookmarks', context: 'Page', to: '/bookmarks' },
];

/** Titles only: available instantly, before any lesson content has loaded. */
export function shallowIndex(): SearchDoc[] {
  const docs: SearchDoc[] = STATIC_PAGES.map((p) => ({ ...p, body: p.title.toLowerCase(), rawBody: '' }));
  for (const p of PROJECTS) {
    docs.push({ id: `project-${p.slug}`, kind: 'page', title: `Project ${p.number}: ${p.title}`, context: 'Practical project', to: `/projects/${p.slug}`, body: `${p.title} ${p.summary} ${p.skills.join(' ')}`.toLowerCase(), rawBody: p.summary });
  }
  for (const g of GLOSSARY) {
    docs.push({ id: `term-${g.term}`, kind: 'page', title: g.term, context: 'Glossary', to: '/glossary', body: `${g.term} ${g.definition}`.toLowerCase(), rawBody: plain(g.definition) });
  }
  for (const c of CHEATSHEET) {
    docs.push({ id: `cheat-${c.id}`, kind: 'page', title: `Cheat sheet: ${c.title}`, context: 'Git Cheat Sheet', to: '/cheatsheet', body: `${c.title} ${c.entries.map((e) => `${e.command} ${e.description}`).join(' ')}`.toLowerCase(), rawBody: c.entries.map((e) => e.command).join(' · ') });
  }
  for (const m of MODULES) {
    docs.push({
      id: m.id, kind: 'module', title: m.title, context: `Module ${m.number}`, to: `/learn/${m.id}`,
      body: `${m.title} ${m.navTitle} ${m.description}`.toLowerCase(), rawBody: m.description,
    });
    for (const l of m.lessons) {
      docs.push({
        id: `${m.id}/${l.slug}`, kind: 'lesson', title: l.title, context: m.navTitle,
        to: `/learn/${m.id}/${l.slug}`, body: l.title.toLowerCase(), rawBody: '',
      });
    }
  }
  return docs;
}

let full: Promise<SearchDoc[]> | undefined;

/** Full-text index including every lesson body. Loaded once, the first time search opens. */
export function fullIndex(): Promise<SearchDoc[]> {
  full ??= loadAllModules().then((mods) => {
    const docs = shallowIndex();
    for (const mod of mods) {
      for (const lesson of mod.lessons) {
        const doc = docs.find((d) => d.id === `${mod.id}/${lesson.slug}`);
        if (!doc) continue;
        const text = plain([lesson.summary, ...lesson.blocks.map(blockToText)].join(' ')).replace(/\s+/g, ' ');
        doc.rawBody = text;
        doc.body = `${lesson.title} ${text}`.toLowerCase();
      }
    }
    return docs;
  });
  return full;
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
  snippet: string;
}

export function search(docs: SearchDoc[], query: string, limit = 20): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const title = doc.title.toLowerCase();
    if (!terms.every((t) => doc.body.includes(t) || title.includes(t))) continue;
    // Lessons should outrank short reference entries (glossary, cheat sheet) with the same name.
    const w = doc.context === 'Glossary' || doc.context === 'Git Cheat Sheet' ? 0.2 : 1;
    let score = 0;
    if (title === q) score += 100 * w;
    if (title.startsWith(q)) score += 40 * w;
    if (title.includes(q)) score += 30 * w;
    for (const t of terms) {
      if (title.includes(t)) score += 10 * w;
      score += Math.min(doc.body.split(t).length - 1, 10);
    }
    if (doc.kind === 'lesson') score += 10;
    hits.push({ doc, score, snippet: snippetFor(doc.rawBody, terms[0]) });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

function snippetFor(text: string, term: string): string {
  if (!text) return '';
  const i = text.toLowerCase().indexOf(term);
  if (i < 0) return text.slice(0, 120) + (text.length > 120 ? '…' : '');
  const start = Math.max(0, i - 50);
  return (start > 0 ? '…' : '') + text.slice(start, i + 90) + (i + 90 < text.length ? '…' : '');
}
