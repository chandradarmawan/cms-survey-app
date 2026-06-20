// Kartu radio untuk pilihan tunggal besar (mis. metode pembuatan survei, PRD §8.2).
import { Icon } from './Icon';

interface RadioCardProps {
  selected: boolean;
  onSelect: () => void;
  icon: string;
  title: string;
  desc: string;
}

export function RadioCard({ selected, onSelect, icon, title, desc }: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-start gap-3 rounded border p-4 text-left transition-colors ${
        selected
          ? 'border-2 border-primary bg-primary-tint'
          : 'border border-border hover:border-border-strong'
      }`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded ${
          selected ? 'bg-primary text-white' : 'bg-background text-text-secondary'
        }`}
      >
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-body-md font-medium text-text-primary">{title}</span>
        <span className="block text-body-sm text-text-secondary">{desc}</span>
      </span>
    </button>
  );
}
