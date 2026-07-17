import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'start' | 'end';
}

export function Tooltip({ content, children, position = 'bottom' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    start: 'end-full me-2 top-1/2 -translate-y-1/2',
    end: 'start-full ms-2 top-1/2 -translate-y-1/2'
  };

  return (
    <div data-ev-id="ev_d22d84540e"
    className="relative inline-flex"
    onMouseEnter={() => setIsVisible(true)}
    onMouseLeave={() => setIsVisible(false)}
    onFocus={() => setIsVisible(true)}
    onBlur={() => setIsVisible(false)}>

			{children}
			{isVisible &&
      <div data-ev-id="ev_6af351133f"
      role="tooltip"
      className={
      `absolute z-50 px-2.5 py-1.5 text-xs font-medium rounded-md ` +
      `bg-foreground text-background whitespace-nowrap ` +
      `pointer-events-none ${positionClasses[position]}`
      }>

					{content}
				</div>
      }
		</div>);

}