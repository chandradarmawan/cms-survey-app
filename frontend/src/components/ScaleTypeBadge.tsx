// Badge tipe skala — warna + ikon per tipe (kepuasan/persetujuan/NPS).
import { Icon } from './Icon';
import type { Scale } from '@/types';
import { labelScaleType } from '@/i18n/id';

const meta: Record<Scale['tipe'], { cls: string; icon: string }> = {
  KEPUASAN: { cls: 'bg-[#FFF7ED] text-[#C2410C]', icon: 'star' },
  PERSETUJUAN: { cls: 'bg-primary-tint text-primary', icon: 'thumb_up' },
  NPS: { cls: 'bg-[#F3E8FF] text-[#6B21A8]', icon: 'tag' },
};

export function ScaleTypeBadge({ tipe }: { tipe: Scale['tipe'] }) {
  const m = meta[tipe];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-body-sm font-medium ${m.cls}`}
    >
      <Icon name={m.icon} size={14} fill />
      {labelScaleType[tipe]}
    </span>
  );
}
