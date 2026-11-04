import { copyFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { MODULES } from '../src/content/catalog';
import { PROJECTS } from '../src/content/projects';

/** Every client-side route the app knows about (relative to the base path). */
export function knownRoutes(): string[] {
  return [
    'roadmap', 'terminal', 'visualizer', 'projects', 'quizzes', 'quizzes/final', 'cheatsheet', 'glossary', 'resources', 'bookmarks',
    ...PROJECTS.map((p) => `projects/${p.slug}`),
    ...MODULES.flatMap((m) => [`learn/${m.id}`, `quizzes/${m.id}`, ...m.lessons.map((l) => `learn/${m.id}/${l.slug}`)]),
  ];
}

/**
 * GitHub Pages only serves files that exist. Writing a copy of index.html at each
 * route's path makes deep links answer with 200 instead of falling back to 404.html.
 */
export function routePages(): Plugin {
  let outDir = 'dist';
  return {
    name: 'gma-route-pages',
    apply: 'build',
    configResolved(c) {
      outDir = resolve(c.root, c.build.outDir);
    },
    closeBundle() {
      const index = join(outDir, 'index.html');
      for (const route of knownRoutes()) {
        const dir = join(outDir, route);
        mkdirSync(dir, { recursive: true });
        copyFileSync(index, join(dir, 'index.html'));
      }
    },
  };
}
