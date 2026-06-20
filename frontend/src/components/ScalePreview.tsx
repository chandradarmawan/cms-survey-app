// Preview skala read-only — SETIA ke tampilan form responden:
// KEPUASAN/PERSETUJUAN = deretan bintang + label; NPS = baris angka 0–10 + ujung.
// Menerima ScaleSnapshot (Scale tanpa id) — dipakai katalog master, editor, & question.
import type { ScaleSnapshot } from '@/types';
import { StarRating } from './StarRating';

export function ScalePreview({ scale }: { scale: ScaleSnapshot }) {
  if (scale.tipe === 'NPS') {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {scale.endpointKiri && (
          <span className="text-body-sm text-text-secondary">{scale.endpointKiri}</span>
        )}
        <div className="flex flex-wrap gap-1">
          {scale.labels.map((l) => (
            <span
              key={l}
              className="flex h-8 w-8 items-center justify-center rounded border border-border bg-surface font-mono text-body-sm"
            >
              {l}
            </span>
          ))}
        </div>
        {scale.endpointKanan && (
          <span className="text-body-sm text-text-secondary">{scale.endpointKanan}</span>
        )}
      </div>
    );
  }

  // KEPUASAN / PERSETUJUAN → bintang progresif (sama seperti yang dilihat responden).
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {scale.labels.map((label, i) => (
        <div key={i} className="flex flex-col items-start gap-0.5">
          <StarRating filled={i + 1} total={scale.poin} size={16} />
          <span className="text-body-sm text-text-secondary">{label}</span>
        </div>
      ))}
    </div>
  );
}
