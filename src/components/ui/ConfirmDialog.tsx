import { useLocale } from '@/hooks/useLocale';
import { Modal } from '@/components/ui/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
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
    onClick={onConfirm}
    className={
    destructive ?
    'px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors focus-ring' :
    'px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-ring'
    }>

        {confirmLabel ?? t.common.confirm}
      </button>
    </div>;


  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} footer={footer}>
      <p data-ev-id="ev_347bc46565" className="text-foreground">{message}</p>
    </Modal>);

}