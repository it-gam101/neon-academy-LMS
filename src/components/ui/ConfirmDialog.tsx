import { useState, type ReactNode } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { Modal } from '@/components/ui/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  /** May return a promise: the confirm button stays disabled until it settles (dispatch 4b). */
  onConfirm: () => unknown;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = false
}: ConfirmDialogProps) {
  const { t } = useLocale();

  // Dispatch 4b: one confirmation per click. A double-click on Delete ran the deletion twice — the second found nothing
  // left and reported "change refused" right after the success. The button stays disabled until the action settles
  // (the Supabase client bounds every request, so it always does).
  const [confirming, setConfirming] = useState(false);
  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  const footer =
  <div data-ev-id="ev_9c293e1611" className="flex gap-3 justify-end">
      <button data-ev-id="ev_042dffac5c"
    type="button"
    onClick={onCancel}
    className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors focus-ring">

        {t.common.cancel}
      </button>
      <button data-ev-id="ev_bdbb2b912a"
    type="button"
    onClick={handleConfirm}
    disabled={confirming}
    className={
    destructive ?
    'px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed' :
    'px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed'
    }>

        {confirmLabel ?? t.common.confirm}
      </button>
    </div>;


  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} footer={footer}>
      <div data-ev-id="ev_347bc46565" className="text-foreground">{message}</div>
    </Modal>);

}