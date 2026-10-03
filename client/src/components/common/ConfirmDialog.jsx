import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * Confirmation modal. `onConfirm` may be async; the dialog shows a busy state
 * and surfaces any thrown error inline instead of closing.
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm?.();
    } catch (err) {
      setError(err.message || 'Action failed');
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  const handleCancel = () => {
    if (busy) return;
    setError('');
    onCancel?.();
  };

  return (
    <Modal open={open} onClose={handleCancel} title={title}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              danger ? 'bg-[#fff1f2] text-[#be123c]' : 'bg-info-bg text-primary'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="text-body text-slate-600">{message}</div>
        </div>
        {error && <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={danger ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Small helper hook: `const { confirm, dialog } = useConfirm();`
 * `confirm({ title, message, onConfirm })` opens the dialog; render `{dialog}`.
 */
export function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = (options) => setState(options);
  const close = () => setState(null);

  const dialog = (
    <ConfirmDialog
      open={!!state}
      title={state?.title}
      message={state?.message}
      confirmLabel={state?.confirmLabel}
      danger={state?.danger ?? true}
      onCancel={close}
      onConfirm={async () => {
        await state?.onConfirm?.();
        close();
      }}
    />
  );

  return { confirm, dialog, close };
}
