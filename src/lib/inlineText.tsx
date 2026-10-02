import type { ReactNode } from 'react';

/**
 * The course-content contract's formatting subset — **bold** and newlines — as React nodes.
 * For strings from an imported package, which are untrusted: no HTML is ever parsed, so nothing
 * here can inject markup. Newlines are kept by the caller's `whitespace-pre-wrap`.
 */
export function inlineBold(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
  part.startsWith('**') && part.endsWith('**') && part.length > 4 ?
  <strong data-ev-id="ev_5bf76636d3" key={i} className="text-foreground">{part.slice(2, -2)}</strong> :
  part
  );
}