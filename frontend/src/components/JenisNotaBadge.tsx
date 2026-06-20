// Badge jenis nota (PRD §8.1).
import type { JenisNota } from '@/types';
import { labelJenisNota } from '@/i18n/id';

const styles: Record<JenisNota, string> = {
  Domestik: 'bg-primary-tint text-primary',
  Internasional: 'bg-[#FEF3C7] text-[#92400E]',
  'SPSL Group': 'bg-[#F3E8FF] text-[#6B21A8]',
};

export function JenisNotaBadge({ jenis }: { jenis: JenisNota }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-body-sm font-medium ${styles[jenis]}`}
    >
      {labelJenisNota[jenis]}
    </span>
  );
}
