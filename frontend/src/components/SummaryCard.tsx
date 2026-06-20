// Kartu ringkasan (PRD §8.1). label + nilai + ikon + aksen.
import { Icon } from './Icon';

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: string;
  /** warna aksen ikon, mis. 'text-primary' */
  accent?: string;
  /** titik berdenyut (mis. survei aktif) */
  pulse?: 'success' | 'accent';
}

export function SummaryCard({ label, value, icon, accent = 'text-primary', pulse }: SummaryCardProps) {
  return (
    <div className="card flex items-center justify-between p-6">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-label-md uppercase text-text-secondary">{label}</p>
          {pulse && (
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  pulse === 'success' ? 'bg-success' : 'bg-accent'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  pulse === 'success' ? 'bg-success' : 'bg-accent'
                }`}
              />
            </span>
          )}
        </div>
        <p className="mt-2 text-headline-md text-text-primary">{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded bg-primary-tint ${accent}`}>
        <Icon name={icon} size={24} />
      </div>
    </div>
  );
}
