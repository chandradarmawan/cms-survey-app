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

// ---- Transaksi: distribusi, responden & jawaban (docs/DATABASE.md §6) ----
export type InvitationChannel = 'QR' | 'EMAIL';
export type InvitationStatus = 'dibuat' | 'terkirim' | 'dibuka' | 'selesai' | 'kedaluwarsa';

/** Cermin "list transaksi" Pelindo — anchor identitas OTOMATIS & kunci anti-duplikat. */
export interface Transaction {
  id: string;
  noBilling: string;
  jenisNota: JenisNota;
  namaCabang?: string;
  namaEntitas?: string;
  namaPerusahaan?: string; // / nama kapal
  email?: string;
  attrs?: Record<string, string>; // field OTOMATIS lain yang fleksibel
  tanggalTransaksi?: string; // ISO date
}

/** Link ber-token per (survei × transaksi). Kanal diturunkan dari jenis nota. */
export interface SurveyInvitation {
  id: string;
  surveyId: string;
  transactionId: string;
  token: string; // dipakai di URL /isi/:token
  channel: InvitationChannel;
  status: InvitationStatus;
  sentAt?: string;
  openedAt?: string;
  createdAt: string;
}

/** Satu jawaban — SNAPSHOT pertanyaan saat submit + nilai + skor (lepas dari master). */
export interface ResponseAnswer {
  questionKode: string; // "C1.1" (stabil walau master berubah)
  sourceQuestionId?: string; // provenance
  teks: string;
  tipe: QuestionType;
  scale?: ScaleSnapshot; // snapshot skala (SKALA_*, NPS)
  options?: QuestionOption[]; // snapshot opsi (PILIHAN_*)
  valueText?: string; // TEKS / YA_TIDAK / PILIHAN_TUNGGAL (label)
  valueNumber?: number; // SKALA (poin) / NPS (0..10)
  valueOptions?: string[]; // PILIHAN_GANDA (label terpilih)
  skor?: number; // skor mentah (poin skala / option.skor)
  skorNormal?: number; // 0..1 untuk CSI
  bobot?: number; // bobot pertanyaan saat submit (default 1)
}

/** Snapshot nilai field identitas per response (untuk filter dashboard). */
export interface ResponseIdentity {
  nama: string;
  sumber: IdentitySource;
  nilai: string;
  urutan: number;
}

/** Satu submission responden (sekali submit). answers & identity di-embed. */
export interface SurveyResponse {
  id: string;
  invitationId: string;
  surveyId: string;
  transactionId: string;
  submittedAt: string;
  channel: InvitationChannel;
  npsValue?: number; // nilai NPS 0..10 response ini, bila ada
  csi?: number; // indeks kepuasan response ini (0..100)
  answers: ResponseAnswer[];
  identity: ResponseIdentity[];
}

/** Payload submit dari form responden (kompatibel dgn SerializedResponse modul preview). */
export interface ResponseSubmission {
  submittedAt?: string;
  identitas: Array<Pick<ResponseIdentity, 'nama' | 'sumber' | 'nilai'>>;
  jawaban: Array<{
    kode: string;
    teks: string;
    valueText?: string;
    valueNumber?: number;
    valueJson?: string[];
  }>;
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
  response?: SurveyResponse;
}

// ---- Turunan / view-model ----
export interface SurveySummary {
  total: number;
  aktif: number;
  draft: number;
  totalResponden: number;
}
