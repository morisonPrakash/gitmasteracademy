import type { Lesson, ModuleContent } from './types';

// Each module's lessons and quiz are split into their own chunk so the first page
// load only downloads the app shell. Vite turns every matched file into a lazy chunk.
const globbed = import.meta.glob<{ default: ModuleContent }>('./modules/*/index.ts');

const loaders: Record<string, () => Promise<{ default: ModuleContent }>> = Object.fromEntries(
  Object.entries(globbed).map(([path, load]) => [path.split('/')[2], load]),
);

const cache = new Map<string, ModuleContent>();

export function hasModuleContent(id: string): boolean {
  return id in loaders;
}

export async function loadModule(id: string): Promise<ModuleContent> {
  const hit = cache.get(id);
  if (hit) return hit;
  const load = loaders[id];
  if (!load) throw new Error(`Unknown module: ${id}`);
  const mod = (await load()).default;
  cache.set(id, mod);
  return mod;
}

export function getCachedModule(id: string): ModuleContent | undefined {
  return cache.get(id);
}

export async function loadLesson(moduleId: string, slug: string): Promise<Lesson | undefined> {
  const mod = await loadModule(moduleId);
  return mod.lessons.find((l) => l.slug === slug);
}

export async function loadAllModules(): Promise<ModuleContent[]> {
  return Promise.all(Object.keys(loaders).map((id) => loadModule(id)));
}
