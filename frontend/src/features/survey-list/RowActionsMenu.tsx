// Menu aksi baris (more_vert) pada Daftar Survei (PRD §8.1).
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';

export interface RowAction {
  label: string;
  icon: string;
  onSelect: () => void;
  danger?: boolean;
}

export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Aksi"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-8 w-8 items-center justify-center rounded text-text-secondary hover:bg-primary-tint"
      >
        <Icon name="more_vert" size={20} />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded border border-border-strong bg-surface py-1">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                a.onSelect();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-body-md hover:bg-primary-tint ${
                a.danger ? 'text-error' : 'text-text-primary'
              }`}
            >
              <Icon name={a.icon} size={18} />
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
