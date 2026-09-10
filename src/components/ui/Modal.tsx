import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  error?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, error, size = 'md' }: ModalProps) {
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  // Drag-to-move. A confirmation dialog covers the very rows an author wants to re-read
  // before committing, and closing it to look loses whatever was typed. This is an
  // ENHANCEMENT ONLY: every dialog stays fully usable without dragging, so keyboard and
  // screen-reader paths are untouched.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    baseLeft: number;
    baseTop: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // Always reopen centred. A dialog that reappears wherever it was last dragged is
      // harder to find than one that is always in the same place.
      setOffset({ x: 0, y: 0 });
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      dialog.close();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const handleDragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Touch is excluded deliberately: on a phone the dialog nearly fills the screen, so
    // there is nothing to uncover, and a drag handler there competes with scrolling.
    if (e.pointerType === 'touch') return;
    // Never begin a drag from a control in the header — the close button stays a button.
    if ((e.target as HTMLElement).closest('button')) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
      baseLeft: rect.left - offset.x,
      baseTop: rect.top - offset.y,
      width: rect.width
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    // Clamp so the header can never be dragged out of reach.
    const VISIBLE = 80;
    const HEADER = 56;
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

    setOffset({
      x: clamp(
        drag.originX + (e.clientX - drag.startX),
        VISIBLE - drag.width - drag.baseLeft,
        window.innerWidth - VISIBLE - drag.baseLeft
      ),
      y: clamp(
        drag.originY + (e.clientY - drag.startY),
        -drag.baseTop,
        window.innerHeight - HEADER - drag.baseTop
      )
    });
  };

  const handleDragEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <dialog data-ev-id="ev_30d40a296c"
    ref={dialogRef}
    className="backdrop:bg-black/50 bg-transparent p-0 m-auto"
    style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    onMouseDown={(e) => { mouseDownTargetRef.current = e.target; }}
    onClick={(e) => {
      if (e.target === dialogRef.current && mouseDownTargetRef.current === dialogRef.current) onClose();
    }}>

			<div data-ev-id="ev_428a998929" className={`bg-card border border-border rounded-lg shadow-xl w-full ${sizeClasses[size]}`}>
				{/* Header */}
				<div data-ev-id="ev_c2ec80b4a5"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        style={{ userSelect: isDragging ? 'none' : undefined }}
        className={`flex items-center justify-between p-4 border-b border-border ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
					<h2 data-ev-id="ev_586943c81e" className="text-lg font-semibold text-foreground">{title}</h2>
					<button data-ev-id="ev_130f8d46f7"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={dict.common.close}>

						<X className="w-5 h-5 text-muted-foreground" />
					</button>
				</div>

				{/* Content */}
				<div data-ev-id="ev_961fad03c7" className="p-4">{children}</div>

				{/* Inline error — toasts are invisible above a modal <dialog>, so failures render here */}
				{error &&
					<div data-ev-id="ev_modal_error"
						role="alert"
						className="mx-4 mb-4 px-3 py-2 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive">
						{error}
					</div>
				}

				{/* Footer */}
				{footer &&
        <div data-ev-id="ev_31ae6da352" className="flex items-center justify-end gap-3 p-4 border-t border-border">
						{footer}
					</div>
        }
			</div>
		</dialog>);

}