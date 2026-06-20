// Preview skala read-only (PRD §8.4). Pill chips untuk skala, baris 0–10 untuk NPS.
import type { Scale } from '@/types';

export function ScalePreview({ scale }: { scale: Scale }) {
  if (scale.tipe === 'NPS') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body-sm text-text-secondary">{scale.endpointKiri}</span>
        <div className="flex flex-wrap gap-1">
          {scale.labels.map((l) => (
            <span
              key={l}
              className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background font-mono text-body-sm"
            >
              {l}
            </span>
          ))}
        </div>
        <span className="text-body-sm text-text-secondary">{scale.endpointKanan}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {scale.labels.map((l) => (
        <span key={l} className="rounded-full bg-primary-tint px-3 py-1 text-body-sm text-primary">
          {l}
        </span>
      ))}
    </div>
  );
}
