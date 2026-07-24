import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            danger ? 'bg-red-50 text-brand-red' : 'bg-amber-50 text-brand-orange'
          }`}
        >
          <AlertTriangle size={18} />
        </div>
        <p className="text-sm text-ink-soft">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${
            danger ? 'bg-brand-red hover:bg-red-600' : 'bg-zaz-purple hover:bg-zaz-purple-dark'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
