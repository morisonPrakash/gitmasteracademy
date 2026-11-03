import { Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center">
      <Compass className="h-12 w-12 text-muted" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold text-fg">Page not found</h1>
      <p className="mt-2 text-muted">
        This page does not exist. It may have been moved, or the link is mistyped. Like a branch that was deleted, it is no
        longer here, but everything else is.
      </p>
      <div className="mt-6 flex gap-3">
        <ButtonLink to="/" variant="primary">Go to dashboard</ButtonLink>
        <ButtonLink to="/roadmap">Open roadmap</ButtonLink>
      </div>
    </div>
  );
}
