// Tipe lokal modul simulasi/preview form responden.
import type { IdentitySource } from '@/types';

/**
 * Nilai jawaban satu pertanyaan — sengaja dibentuk meniru baris tabel `answers`
 * (docs/DATABASE.md §6) agar "Submit (simulasi)" = persis payload yang nanti di-POST.
 */
export interface AnswerValue {
  text?: string; // TEKS / YA_TIDAK / PILIHAN_TUNGGAL (label opsi)
  number?: number; // SKALA_* (1..poin) / NPS (nilai)
  json?: string[]; // PILIHAN_GANDA (label opsi terpilih)
}

export type AnswerMap = Record<string, AnswerValue>; // key: question.id
export type IdentityValues = Record<string, string>; // key: identityField.id

/** Payload terstruktur hasil submit simulasi — padanan responses + answers (§6). */
export interface SerializedResponse {
  surveyId: string;
  submittedAt: string;
  identitas: Array<{ nama: string; sumber: IdentitySource; nilai: string }>;
  jawaban: Array<{
    kode: string;
    teks: string;
    valueText?: string;
    valueNumber?: number;
    valueJson?: string[];
  }>;
}

export type DeviceMode = 'desktop' | 'mobile';
