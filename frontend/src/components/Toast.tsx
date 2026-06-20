// Toast sukses sederhana, auto-dismiss (PRD §9).
import { useEffect } from 'react';
import { Icon } from './Icon';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, onDismiss, duration = 2800 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [message, duration, onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded border border-border-strong bg-surface px-4 py-3 shadow-modal">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success/10 text-success">
        <Icon name="check" size={18} />
      </span>
      <p className="text-body-md">{message}</p>
    </div>
  );
}
