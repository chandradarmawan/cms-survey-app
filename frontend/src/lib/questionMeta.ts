// Metadata tipe pertanyaan (label, ikon, badge tree). PRD §8.3 / §8.4.
import type { Question, QuestionType, Scale, ScaleSnapshot } from '@/types';

export const QUESTION_TYPE_META: Record<QuestionType, { label: string; icon: string }> = {
  GRUP: { label: 'Grup / Bagian', icon: 'folder' },
  SKALA_KEPUASAN: { label: 'Skala kepuasan', icon: 'star' },
  SKALA_PERSETUJUAN: { label: 'Skala persetujuan', icon: 'thumb_up' },
  NPS: { label: 'NPS 0–10', icon: 'tag' },
  YA_TIDAK: { label: 'Ya / Tidak', icon: 'toggle_off' },
  PILIHAN_TUNGGAL: { label: 'Pilihan tunggal', icon: 'radio_button_checked' },
  PILIHAN_GANDA: { label: 'Pilihan ganda', icon: 'check_box' },
  TEKS: { label: 'Teks isian', icon: 'input' },
};

/** Urutan tile pada TypePicker (PRD §8.4). */
export const QUESTION_TYPE_ORDER: QuestionType[] = [
  'GRUP',
  'SKALA_KEPUASAN',
  'SKALA_PERSETUJUAN',
  'NPS',
  'YA_TIDAK',
  'PILIHAN_TUNGGAL',
  'PILIHAN_GANDA',
  'TEKS',
];

/** Badge ringkas di tree (PRD §8.3). */
export function treeBadge(q: Question): string {
  switch (q.tipe) {
    case 'GRUP':
      return `Grup · ${q.childCount ?? 0}`;
    case 'SKALA_KEPUASAN':
      return 'Skala puas';
    case 'SKALA_PERSETUJUAN':
      return 'Skala setuju';
    case 'NPS':
      return 'NPS 0–10';
    case 'YA_TIDAK':
      return 'Ya/Tidak';
    case 'PILIHAN_TUNGGAL':
      return 'Pilih satu';
    case 'PILIHAN_GANDA':
      return 'Checkbox';
    case 'TEKS':
      return 'Teks';
  }
}

export const isPilihan = (t: QuestionType) => t === 'PILIHAN_TUNGGAL' || t === 'PILIHAN_GANDA';
export const isSkala = (t: QuestionType) =>
  t === 'SKALA_KEPUASAN' || t === 'SKALA_PERSETUJUAN' || t === 'NPS';

/** Kode otomatis (PRD §6.1). Top-level → "C{n}"; anak grup → "{kodeInduk}.{m}". */
export function nextKode(
  questions: Question[],
  surveyId: string,
  parentId: string | null,
  parentKode?: string,
): string {
  if (!parentId) {
    const tops = questions.filter((q) => q.surveyId === surveyId && q.parentId === null);
    const nums = tops.map((q) => {
      const m = q.kode.match(/^C(\d+)/);
      return m ? Number(m[1]) : 0;
    });
    return `C${(nums.length ? Math.max(...nums) : 0) + 1}`;
  }
  const sibs = questions.filter((q) => q.surveyId === surveyId && q.parentId === parentId);
  return `${parentKode ?? 'C'}.${sibs.length + 1}`;
}

/** Tipe Scale yang cocok untuk tipe pertanyaan skala. */
export function scaleTypeFor(t: QuestionType): 'KEPUASAN' | 'PERSETUJUAN' | 'NPS' | null {
  if (t === 'SKALA_KEPUASAN') return 'KEPUASAN';
  if (t === 'SKALA_PERSETUJUAN') return 'PERSETUJUAN';
  if (t === 'NPS') return 'NPS';
  return null;
}

/**
 * Salin definisi master Scale jadi snapshot yang ditanam di Question (buang `id`,
 * klon array `labels`). Dipakai seed, editor (pilih/re-sync), dan duplikasi survei.
 */
export function scaleSnapshot(s: Scale): ScaleSnapshot {
  return {
    nama: s.nama,
    tipe: s.tipe,
    poin: s.poin,
    labels: [...s.labels],
    endpointKiri: s.endpointKiri,
    endpointKanan: s.endpointKanan,
  };
}
