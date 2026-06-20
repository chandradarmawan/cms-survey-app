// Status pill — varian draft/aktif/selesai/arsip (PRD §4.4 / §8.1).
import type { SurveyStatus } from '@/types';
import { labelStatus } from '@/i18n/id';

const styles: Record<SurveyStatus, string> = {
  draft: 'bg-[#FFF7ED] text-[#C2410C]',
  aktif: 'bg-[#DCFCE7] text-success',
  selesai: 'bg-primary-tint text-primary',
  arsip: 'bg-[#F1F5F9] text-text-secondary',
};

export function StatusBadge({ status }: { status: SurveyStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-body-sm font-medium ${styles[status]}`}
    >
      {status === 'aktif' && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
      )}
      {labelStatus[status]}
    </span>
  );
}
