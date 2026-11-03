import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

// Renders the small inline markdown subset used in content: `code`, **bold**, [label](url).
const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

export function Inline({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="prose-code">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-fg">
              {part.slice(2, -2)}
            </strong>
          );
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) return <SmartLink key={i} href={link[2]}>{link[1]}</SmartLink>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export function SmartLink({ href, children }: { href: string; children: ReactNode }) {
  const cls = 'text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent';
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
    </a>
  );
}
