import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers or contexts without the async clipboard API.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({ text, label = 'Copy', className = '' }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const t = setTimeout(() => setState('idle'), 1600);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <button
      type="button"
      onClick={async () => setState((await copyText(text)) ? 'ok' : 'fail')}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${className}`}
      aria-label={state === 'ok' ? 'Copied' : label}
      title={label}
    >
      {state === 'ok' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      <span>{state === 'ok' ? 'Copied' : state === 'fail' ? 'Copy failed' : 'Copy'}</span>
      <span className="sr-only" aria-live="polite">{state === 'ok' ? 'Copied to clipboard' : ''}</span>
    </button>
  );
}
