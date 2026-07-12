import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
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
    onClick={(e) => {
      if (e.target === dialogRef.current) onClose();
    }}>

			<div data-ev-id="ev_428a998929" className={`bg-card border border-border rounded-lg shadow-xl w-full ${sizeClasses[size]}`}>
				{/* Header */}
				<div data-ev-id="ev_c2ec80b4a5" className="flex items-center justify-between p-4 border-b border-border">
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

				{/* Footer */}
				{footer &&
        <div data-ev-id="ev_31ae6da352" className="flex items-center justify-end gap-3 p-4 border-t border-border">
						{footer}
					</div>
        }
			</div>
		</dialog>);

}