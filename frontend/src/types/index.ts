// Model data inti — kontrak antara dummy API (store) dan UI. Lihat docs/PRD.md §5.

// ---- Enum ----
export type SurveyStatus = 'draft' | 'aktif' | 'selesai' | 'arsip';
export type JenisNota = 'Domestik' | 'Internasional' | 'SPSL Group';

export type QuestionType =
  | 'GRUP' // Grup / Bagian (folder, bukan pertanyaan)
  | 'SKALA_KEPUASAN' // Skala kepuasan (mis. 4 poin)
  | 'SKALA_PERSETUJUAN' // Skala persetujuan / Likert (4 poin)
  | 'NPS' // NPS 0–10
  | 'YA_TIDAK' // Ya / Tidak (opsi tetap)
  | 'PILIHAN_TUNGGAL' // Single choice (radio) + skor per opsi
  | 'PILIHAN_GANDA' // Multiple choice (checkbox), min 2 opsi
  | 'TEKS'; // Teks isian bebas

export type IdentitySource = 'OTOMATIS' | 'ISIAN' | 'PILIHAN' | 'SISTEM';
export type LogicOperator = 'sama_dengan' | 'tidak_sama_dengan';

// ---- Entity ----
export interface Survey {
  id: string;
  kode: string; // "SKP-2026" (auto dari tahun, editable)
  nama: string;
  jenisNota: JenisNota;
  periode: number; // tahun
  status: SurveyStatus;
  tanggalMulai: string; // ISO date
  tanggalSelesai: string; // ISO date
  deskripsi?: string;
  jumlahPertanyaan: number; // disimpan; dijaga sinkron oleh action (PRD §14.9)
  jumlahResponden: number; // nilai tersimpan
  terakhirDiubah: string; // ISO datetime
  createdAt: string; // ISO datetime
  duplicatedFrom?: string; // kode survei sumber bila hasil duplikat
}

export interface QuestionOption {
  id: string;
  label: string;
  skor?: number; // dipakai pada PILIHAN_TUNGGAL
  urutan: number;
}

export interface Condition {
  sourceQuestionKode: string; // "C3"
  operator: LogicOperator; // "sama_dengan"
  value: string; // "Ya"
}

export interface ConditionGroup {
  conditions: Condition[]; // default semua harus terpenuhi (AND)
}

export interface Question {
  id: string;
  surveyId: string;
  kode: string; // "C1", "C3.1" (auto-generated, editable)
  parentId: string | null; // hirarki; null = pertanyaan tingkat atas
  teks: string;
  tipe: QuestionType;
  urutan: number;
  wajibDiisi: boolean;
  acakOpsi?: boolean; // hanya tipe pilihan
  // Skala: snapshot terpisah dari master (lihat docs/DATABASE.md §2.4).
  sourceScaleId?: string; // asal template master (untuk re-sync), BUKAN untuk render
  scale?: ScaleSnapshot; // snapshot yang dipakai render/preview/logika (SKALA_*, NPS)
  options?: QuestionOption[]; // PILIHAN_TUNGGAL / PILIHAN_GANDA
  logic?: ConditionGroup; // logika tampil
  isGroup: boolean; // true bila tipe GRUP
  childCount?: number; // badge "Grup · N"
}

export interface Scale {
  id: string;
  nama: string; // "Skala puas (4 poin)", "NPS (0-10)"
  tipe: 'KEPUASAN' | 'PERSETUJUAN' | 'NPS';
  poin: number; // 4, 11
  labels: string[];
  endpointKiri?: string; // NPS
  endpointKanan?: string; // NPS
}

// Snapshot skala yang ditanam di Question (lepas dari master = id dibuang).
// Edit master tidak mengubah snapshot lama → menjaga integritas historis.
export type ScaleSnapshot = Omit<Scale, 'id'>;

export interface IdentityField {
  id: string;
  surveyId: string;
  nama: string;
  sumber: IdentitySource;
  deskripsi: string;
  urutan: number;
}

// ---- Turunan / view-model ----
export interface SurveySummary {
  total: number;
  aktif: number;
  draft: number;
  totalResponden: number;
}
