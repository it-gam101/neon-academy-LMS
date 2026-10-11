import { useState, useRef, useLayoutEffect, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'start' | 'end';
}

export function Tooltip({ content, children, position = 'bottom' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  // Dispatch 7: the tooltip is drawn in the browser's TOP LAYER (a manual popover) at a fixed position measured from its
  // trigger, so no dialog, scroll area or overflow can clip or cover it (QA 2026-10-11: "Move up" and "Correct answer"
  // were cut off inside Quiz Settings). It takes the requested side, flips to the opposite one when there is no room, and
  // is kept inside the window. "start" / "end" follow the reading direction.
  useLayoutEffect(() => {
    const tip = tipRef.current;
    const wrap = wrapRef.current;
    if (!isVisible || !tip || !wrap) return;
    tip.setAttribute('popover', 'manual');
    try {
      tip.showPopover();
    } catch {
      // Already open, or no popover support: it stays a fixed element, placed the same way.
    }
    const r = wrap.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const rtl = getComputedStyle(wrap).direction === 'rtl';
    const gap = 8;
    const margin = 4;
    const clamp = (v: number, max: number) => Math.max(margin, Math.min(v, max - margin));
    let top: number;
    let left: number;
    if (position === 'top' || position === 'bottom') {
      const below = r.bottom + gap;
      const above = r.top - gap - t.height;
      const fitsBelow = below + t.height <= vh - margin;
      const fitsAbove = above >= margin;
      top = position === 'bottom' ?
      fitsBelow || !fitsAbove ? below : above :
      fitsAbove || !fitsBelow ? above : below;
      left = clamp(r.left + r.width / 2 - t.width / 2, vw - t.width);
    } else {
      const atLeft = r.left - gap - t.width;
      const atRight = r.right + gap;
      const wantLeft = position === 'start' !== rtl;
      const fitsLeft = atLeft >= margin;
      const fitsRight = atRight + t.width <= vw - margin;
      left = wantLeft ?
      fitsLeft || !fitsRight ? atLeft : atRight :
      fitsRight || !fitsLeft ? atRight : atLeft;
      top = clamp(r.top + r.height / 2 - t.height / 2, vh - t.height);
    }
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
  }, [isVisible, position, content]);

  return (
    <div data-ev-id="ev_d22d84540e"
    ref={wrapRef}
    className="relative inline-flex"
    onMouseEnter={() => setIsVisible(true)}
    onMouseLeave={() => setIsVisible(false)}
    onFocus={() => setIsVisible(true)}
    onBlur={() => setIsVisible(false)}>

			{children}
			{isVisible &&
      <div data-ev-id="ev_6af351133f"
      ref={tipRef}
      role="tooltip"
      className={
      `fixed m-0 inset-auto border-0 overflow-visible px-2.5 py-1.5 text-xs font-medium rounded-md ` +
      `bg-foreground text-background whitespace-nowrap ` +
      `pointer-events-none`
      }>

					{content}
				</div>
      }
		</div>);

}