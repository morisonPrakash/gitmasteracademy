import { CHEATSHEET, CHEAT_COUNT } from '@/content/cheatsheet';
import { GLOSSARY } from '@/content/glossary';
import { PROJECTS } from '@/content/projects';
import { RESOURCES } from '@/content/resources';

describe('cheat sheet', () => {
  it('has the 12 categories from the brief and plenty of commands', () => {
    expect(CHEATSHEET.map((c) => c.title)).toEqual([
      'Configuration', 'Initialization', 'Repository management', 'Staging', 'Commits', 'Branches',
      'Merging', 'Remote repositories', 'History', 'Undoing changes', 'Advanced operations', 'Troubleshooting',
    ]);
    expect(CHEAT_COUNT).toBeGreaterThanOrEqual(100);
    for (const c of CHEATSHEET) for (const e of c.entries) {
      expect(e.command.length).toBeGreaterThan(3);
      expect(e.description.length).toBeGreaterThan(10);
    }
  });
});

describe('glossary', () => {
  it('has unique terms and every "see also" points at a real term', () => {
    const terms = GLOSSARY.map((t) => t.term);
    expect(new Set(terms).size).toBe(terms.length);
    expect(terms.length).toBeGreaterThanOrEqual(80);
    for (const t of GLOSSARY) for (const r of t.related ?? []) expect(terms, `${t.term} → ${r}`).toContain(r);
  });
});

describe('projects and resources', () => {
  it('has four complete projects', () => {
    expect(PROJECTS).toHaveLength(4);
    for (const p of PROJECTS) {
      expect(p.steps.length, p.slug).toBeGreaterThanOrEqual(8);
      expect(p.steps.filter((s) => s.terminal?.length).length, `${p.slug} has commands`).toBeGreaterThanOrEqual(4);
    }
  });
  it('external resources use https', () => {
    for (const g of RESOURCES) for (const l of g.links) expect(l.url).toMatch(/^(https:\/\/|\/)/);
  });
});
