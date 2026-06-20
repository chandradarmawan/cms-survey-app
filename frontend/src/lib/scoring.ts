// Skoring jawaban & agregat (docs/DATABASE.md §6.8). Murni, dipakai store submit & dashboard.
import type {
  InvitationChannel,
  JenisNota,
  QuestionOption,
  QuestionType,
  ResponseAnswer,
  ScaleSnapshot,
} from '@/types';

/** Kanal kirim diturunkan dari jenis nota (konfigurabel). */
export function channelForJenisNota(jenis: JenisNota): InvitationChannel {
  return jenis === 'Domestik' ? 'QR' : 'EMAIL';
}

interface ScorableValue {
  valueText?: string;
  valueNumber?: number;
  valueOptions?: string[];
}

interface Scorable {
  tipe: QuestionType;
  scale?: ScaleSnapshot;
  options?: QuestionOption[];
}

/**
 * Skor satu jawaban. SKALA → poin + normal (0..1); PILIHAN_TUNGGAL → skor opsi (normal vs maks);
 * NPS/YA_TIDAK/TEKS/PILIHAN_GANDA → tanpa skor CSI (NPS dihitung terpisah).
 */
export function answerScore(
  q: Scorable,
  value: ScorableValue,
): { skor?: number; skorNormal?: number } {
  if (q.tipe === 'SKALA_KEPUASAN' || q.tipe === 'SKALA_PERSETUJUAN') {
    const poin = q.scale?.poin ?? 0;
    const n = value.valueNumber;
    if (n == null || poin < 2) return {};
    return { skor: n, skorNormal: (n - 1) / (poin - 1) };
  }
  if (q.tipe === 'PILIHAN_TUNGGAL') {
    const opt = (q.options ?? []).find((o) => o.label === value.valueText);
    if (!opt || opt.skor == null) return {};
    const maxSkor = Math.max(0, ...(q.options ?? []).map((o) => o.skor ?? 0));
    return { skor: opt.skor, skorNormal: maxSkor > 0 ? opt.skor / maxSkor : undefined };
  }
  return {};
}

/** CSI response/agregat = Σ(skorNormal×bobot) / Σ(bobot) × 100. */
export function computeCsi(answers: ResponseAnswer[]): number | undefined {
  let num = 0;
  let den = 0;
  for (const a of answers) {
    if (a.skorNormal == null) continue;
    const bobot = a.bobot ?? 1;
    num += a.skorNormal * bobot;
    den += bobot;
  }
  return den > 0 ? Math.round((num / den) * 1000) / 10 : undefined; // 1 desimal
}

export type NpsCategory = 'promotor' | 'pasif' | 'detraktor';

export function npsCategory(v: number): NpsCategory {
  if (v >= 9) return 'promotor';
  if (v >= 7) return 'pasif';
  return 'detraktor';
}

/** NPS = %promotor (9–10) − %detraktor (0–6). Skala −100..100. */
export function computeNps(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  let prom = 0;
  let det = 0;
  for (const v of values) {
    const c = npsCategory(v);
    if (c === 'promotor') prom++;
    else if (c === 'detraktor') det++;
  }
  return Math.round(((prom - det) / values.length) * 100);
}
