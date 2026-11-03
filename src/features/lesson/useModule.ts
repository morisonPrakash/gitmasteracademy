import { useEffect, useState } from 'react';
import { getCachedModule, hasModuleContent, loadModule } from '@/content/registry';
import type { ModuleContent } from '@/content/types';

export type ModuleLoad =
  | { status: 'loading' }
  | { status: 'ready'; module: ModuleContent }
  | { status: 'missing' }
  | { status: 'error'; error: string };

/** Load a module's lazy content chunk, using the in-memory cache when possible. */
export function useModule(id: string | undefined): ModuleLoad {
  const initial = (): ModuleLoad => {
    if (!id || !hasModuleContent(id)) return { status: 'missing' };
    const cached = getCachedModule(id);
    return cached ? { status: 'ready', module: cached } : { status: 'loading' };
  };
  const [state, setState] = useState<ModuleLoad>(initial);

  useEffect(() => {
    if (!id || !hasModuleContent(id)) {
      setState({ status: 'missing' });
      return;
    }
    const cached = getCachedModule(id);
    if (cached) {
      setState({ status: 'ready', module: cached });
      return;
    }
    let alive = true;
    setState({ status: 'loading' });
    loadModule(id)
      .then((module) => alive && setState({ status: 'ready', module }))
      .catch((e: unknown) => alive && setState({ status: 'error', error: String(e) }));
    return () => {
      alive = false;
    };
  }, [id]);

  return state;
}
